// Treatment Planner Lambda Handler
// Handles treatment plan creation with EventBridge reminder scheduling

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { EventBridgeClient, PutRuleCommand, PutTargetsCommand } from '@aws-sdk/client-eventbridge';
import { successResponse, errorResponse } from '../shared/response';
import { createTreatmentPlan } from '../shared/treatment-db';
import { callBedrockJson } from '../shared/bedrock-client';
import { SCHEDULE_GENERATION_SYSTEM_PROMPT, generateSchedulePrompt } from '../shared/bedrock-prompts';
import { parseFrequencyToTimes, calculateStopDate } from '../shared/frequency-parser';
import { Prescription } from '../shared/types';
import { v4 as uuidv4 } from 'uuid';

// Initialize EventBridge client
const eventBridgeClient = new EventBridgeClient({
  region: process.env.AWS_REGION || 'ap-south-1'
});

// Get Lambda function name from environment
const REMINDER_LAMBDA_NAME = process.env.REMINDER_LAMBDA_NAME || 'ReminderProcessorFunction';

interface CreateTreatmentRequest {
  patientId: string;
  doctorId: string;
  prescriptions: Array<{
    medicineName: string;
    dosage: string;
    frequency: string;
    duration: string;
    specialInstructions?: string;
  }>;
}

interface ScheduleResponse {
  medicineName: string;
  dosage: string;
  times: string[];
  frequency: string;
  specialInstructions?: string;
  foodTiming?: 'before food' | 'after food' | 'with food' | 'anytime';
}

export async function handler(event: APIGatewayProxyEvent, context: any): Promise<APIGatewayProxyResult> {
  try {
    const path = event.path;

    // POST /api/treatment/plan/create - Create empty treatment plan
    if (path === '/api/treatment/plan/create' && event.httpMethod === 'POST') {
      return await handleCreateEmptyPlan(event);
    }

    // PUT /api/treatment/plan/:planId - Update treatment plan metadata
    if (path.match(/^\/api\/treatment\/plan\/[^/]+$/) && event.httpMethod === 'PUT') {
      return await handleUpdatePlan(event);
    }

    // GET /api/treatment/plan/:planId - Get single treatment plan
    if (path.match(/^\/api\/treatment\/plan\/[^/]+$/) && event.httpMethod === 'GET') {
      return await handleGetSinglePlan(event);
    }

    // POST /api/treatment/plan/:planId/medicine - Add medicine to plan
    if (path.match(/^\/api\/treatment\/plan\/[^/]+\/medicine$/) && event.httpMethod === 'POST') {
      return await handleAddMedicine(event, context);
    }

    // DELETE /api/treatment/plan/:planId/medicine/:medicineId - Remove medicine
    if (path.match(/^\/api\/treatment\/plan\/[^/]+\/medicine\/[^/]+$/) && event.httpMethod === 'DELETE') {
      return await handleRemoveMedicine(event);
    }

    // PUT /api/treatment/plan/:planId/medicine/:medicineId - Update medicine
    if (path.match(/^\/api\/treatment\/plan\/[^/]+\/medicine\/[^/]+$/) && event.httpMethod === 'PUT') {
      return await handleUpdateMedicine(event);
    }

    // POST /api/treatment/create - Create treatment plan (legacy endpoint)
    if (path === '/api/treatment/create' && event.httpMethod === 'POST') {
      return await handleCreateTreatment(event, context);
    }

    // GET /api/treatment/plans/:patientId - Get all treatment plans for patient
    if (path.startsWith('/api/treatment/plans/') && event.httpMethod === 'GET') {
      return await handleGetTreatmentPlans(event);
    }

    // POST /api/treatment/mark-taken - Mark dose as taken
    if (path === '/api/treatment/mark-taken' && event.httpMethod === 'POST') {
      return await handleMarkDoseTaken(event);
    }

    // GET /api/treatment/schedule/:patientId - Get patient schedule
    if (path.startsWith('/api/treatment/schedule/') && event.httpMethod === 'GET') {
      return await handleGetSchedule(event);
    }

    // GET /api/adherence/:patientId - Get adherence dashboard (doctor only)
    if (path.startsWith('/api/adherence/') && event.httpMethod === 'GET') {
      return await handleGetAdherence(event);
    }

    // POST /api/treatment/complete/:treatmentPlanId - Generate completion summary
    if (path.startsWith('/api/treatment/complete/') && event.httpMethod === 'POST') {
      return await handleCompleteTreatment(event);
    }

    // GET /api/treatment/completion/:patientId/:treatmentPlanId - Get completion summary
    if (path.startsWith('/api/treatment/completion/') && event.httpMethod === 'GET') {
      return await handleGetCompletionSummary(event);
    }

    // GET /api/treatment/completions/:patientId - Get all completion summaries for patient
    if (path.startsWith('/api/treatment/completions/') && event.httpMethod === 'GET') {
      return await handleGetAllCompletionSummaries(event);
    }

    return errorResponse('Endpoint not found', 404);
  } catch (error: any) {
    console.error('Error in treatment planner:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

/**
 * Handle creating an empty treatment plan
 */
async function handleCreateEmptyPlan(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (!event.body) {
    return errorResponse('Request body is required', 400);
  }

  const { patientId, doctorId, planName, disease, duration } = JSON.parse(event.body);

  if (!patientId || !doctorId || !planName || !disease || !duration) {
    return errorResponse('patientId, doctorId, planName, disease, and duration are required', 400);
  }

  // Create empty treatment plan
  const treatmentPlan = await createTreatmentPlan({
    patientId,
    doctorId,
    planName,
    disease,
    duration,
    prescriptions: []
  });

  return successResponse({
    treatmentPlanId: treatmentPlan.treatmentPlanId,
    message: 'Treatment plan created successfully'
  });
}

/**
 * Handle updating treatment plan metadata
 */
async function handleUpdatePlan(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (!event.body) {
    return errorResponse('Request body is required', 400);
  }

  const pathParts = event.path.split('/');
  const treatmentPlanId = pathParts[pathParts.length - 1];
  const { patientId, doctorId, planName, disease, duration } = JSON.parse(event.body);

  if (!patientId || !doctorId) {
    return errorResponse('patientId and doctorId are required', 400);
  }

  const { getTreatmentPlan, updateTreatmentPlanMetadata } = await import('../shared/treatment-db');

  // Verify plan exists and doctor owns it
  const existingPlan = await getTreatmentPlan(patientId, treatmentPlanId);
  if (!existingPlan) {
    return errorResponse('Treatment plan not found', 404);
  }

  if (existingPlan.doctorId !== doctorId) {
    return errorResponse('Access denied. You can only edit your own treatment plans.', 403);
  }

  // Update plan metadata
  const updatedPlan = await updateTreatmentPlanMetadata(patientId, treatmentPlanId, {
    planName,
    disease,
    duration
  });

  return successResponse({
    message: 'Treatment plan updated successfully',
    treatmentPlan: updatedPlan
  });
}

/**
 * Handle getting a single treatment plan
 */
async function handleGetSinglePlan(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const pathParts = event.path.split('/');
  const treatmentPlanId = pathParts[pathParts.length - 1];
  const patientId = event.queryStringParameters?.patientId;

  if (!patientId) {
    return errorResponse('patientId query parameter is required', 400);
  }

  const { getTreatmentPlan } = await import('../shared/treatment-db');

  try {
    const plan = await getTreatmentPlan(patientId, treatmentPlanId);
    
    if (!plan) {
      return errorResponse('Treatment plan not found', 404);
    }

    return successResponse(plan);
  } catch (err: any) {
    console.error('Failed to get treatment plan:', err);
    return errorResponse(err.message || 'Failed to get treatment plan', 500);
  }
}

/**
 * Handle adding medicine to treatment plan
 */
async function handleAddMedicine(event: APIGatewayProxyEvent, context: any): Promise<APIGatewayProxyResult> {
  if (!event.body) {
    return errorResponse('Request body is required', 400);
  }

  const pathParts = event.path.split('/');
  console.log('Path parts:', pathParts);
  console.log('Full path:', event.path);
  
  const treatmentPlanId = pathParts[4]; // /api/treatment/plan/{planId}/medicine
  console.log('Extracted treatmentPlanId:', treatmentPlanId);
  
  if (!treatmentPlanId) {
    return errorResponse('Treatment plan ID not found in URL path', 400);
  }

  const body = JSON.parse(event.body);
  console.log('Request body:', JSON.stringify(body, null, 2));
  
  const { patientId, doctorId, medicine } = body;

  if (!patientId) {
    return errorResponse('patientId is required in request body', 400);
  }
  
  if (!doctorId) {
    return errorResponse('doctorId is required in request body', 400);
  }
  
  if (!medicine) {
    return errorResponse('medicine object is required in request body', 400);
  }

  if (!medicine.medicineName || !medicine.dosage || !medicine.frequency || !medicine.duration) {
    return errorResponse('Medicine name, dosage, frequency, and duration are required', 400);
  }

  const { getTreatmentPlan, addMedicineToPlan } = await import('../shared/treatment-db');

  // Verify plan exists and doctor owns it
  const existingPlan = await getTreatmentPlan(patientId, treatmentPlanId);
  if (!existingPlan) {
    return errorResponse('Treatment plan not found', 404);
  }

  if (existingPlan.doctorId !== doctorId) {
    return errorResponse('Access denied. You can only edit your own treatment plans.', 403);
  }

  // Extract account ID from Lambda context ARN
  const accountId = context.invokedFunctionArn.split(':')[4];
  const region = process.env.AWS_REGION || 'ap-south-1';
  const reminderLambdaArn = `arn:aws:lambda:${region}:${accountId}:function:${REMINDER_LAMBDA_NAME}`;

  // Generate schedule for the medicine
  let times: string[];
  let foodTiming: 'before food' | 'after food' | 'with food' | 'anytime' = 'anytime';

  try {
    const userPrompt = generateSchedulePrompt(
      medicine.medicineName,
      medicine.dosage,
      medicine.frequency,
      medicine.specialInstructions
    );

    const scheduleResponse = await callBedrockJson<ScheduleResponse>(
      SCHEDULE_GENERATION_SYSTEM_PROMPT,
      userPrompt,
      ['medicineName', 'dosage', 'times', 'frequency'],
      { timeout: 10000 }
    );

    times = scheduleResponse.times;
    foodTiming = scheduleResponse.foodTiming || 'anytime';
  } catch (bedrockError) {
    console.warn('Bedrock schedule generation failed, using frequency parser:', bedrockError);
    times = parseFrequencyToTimes(medicine.frequency);
  }

  const startDate = new Date();
  const stopDate = calculateStopDate(startDate, medicine.duration);
  const medicineId = uuidv4();

  const prescription: Prescription = {
    medicineId,
    medicineName: medicine.medicineName,
    dosage: medicine.dosage,
    frequency: medicine.frequency,
    times,
    startDate: startDate.toISOString(),
    stopDate,
    specialInstructions: medicine.specialInstructions,
    foodTiming
  };

  // Add medicine to plan
  const updatedPlan = await addMedicineToPlan(patientId, treatmentPlanId, prescription);

  // Create EventBridge rules for reminders
  await createEventBridgeRules(patientId, prescription, reminderLambdaArn);

  return successResponse({
    message: 'Medicine added successfully',
    medicine: prescription,
    treatmentPlan: updatedPlan
  });
}

/**
 * Handle removing medicine from treatment plan
 */
async function handleRemoveMedicine(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const pathParts = event.path.split('/');
  const treatmentPlanId = pathParts[4]; // /api/treatment/plan/{planId}/medicine/{medicineId}
  const medicineId = pathParts[6];

  const patientId = event.queryStringParameters?.patientId;
  const doctorId = event.queryStringParameters?.doctorId;

  if (!patientId || !doctorId) {
    return errorResponse('patientId and doctorId are required', 400);
  }

  const { getTreatmentPlan, removeMedicineFromPlan } = await import('../shared/treatment-db');

  // Verify plan exists and doctor owns it
  const existingPlan = await getTreatmentPlan(patientId, treatmentPlanId);
  if (!existingPlan) {
    return errorResponse('Treatment plan not found', 404);
  }

  if (existingPlan.doctorId !== doctorId) {
    return errorResponse('Access denied. You can only edit your own treatment plans.', 403);
  }

  // Remove medicine from plan
  const updatedPlan = await removeMedicineFromPlan(patientId, treatmentPlanId, medicineId);

  return successResponse({
    message: 'Medicine removed successfully',
    treatmentPlan: updatedPlan
  });
}

/**
 * Handle updating medicine in treatment plan
 */
async function handleUpdateMedicine(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (!event.body) {
    return errorResponse('Request body is required', 400);
  }

  const pathParts = event.path.split('/');
  const treatmentPlanId = pathParts[4]; // /api/treatment/plan/{planId}/medicine/{medicineId}
  const medicineId = pathParts[6];
  const { patientId, doctorId, updates } = JSON.parse(event.body);

  if (!patientId || !doctorId || !updates) {
    return errorResponse('patientId, doctorId, and updates are required', 400);
  }

  const { getTreatmentPlan, updateMedicineInPlan } = await import('../shared/treatment-db');

  // Verify plan exists and doctor owns it
  const existingPlan = await getTreatmentPlan(patientId, treatmentPlanId);
  if (!existingPlan) {
    return errorResponse('Treatment plan not found', 404);
  }

  if (existingPlan.doctorId !== doctorId) {
    return errorResponse('Access denied. You can only edit your own treatment plans.', 403);
  }

  // Update medicine in plan
  const updatedPlan = await updateMedicineInPlan(patientId, treatmentPlanId, medicineId, updates);

  return successResponse({
    message: 'Medicine updated successfully',
    treatmentPlan: updatedPlan
  });
}

/**
 * Handle treatment plan creation (legacy endpoint)
 */
async function handleCreateTreatment(event: APIGatewayProxyEvent, context: any): Promise<APIGatewayProxyResult> {
  if (!event.body) {
    return errorResponse('Request body is required', 400);
  }

  // Extract account ID from Lambda context ARN
  // Context ARN format: arn:aws:lambda:region:account-id:function:function-name
  const accountId = context.invokedFunctionArn.split(':')[4];
  const region = process.env.AWS_REGION || 'ap-south-1';
  const reminderLambdaArn = `arn:aws:lambda:${region}:${accountId}:function:${REMINDER_LAMBDA_NAME}`;

  const requestData: CreateTreatmentRequest = JSON.parse(event.body);

  // Validate required fields
  if (!requestData.patientId || !requestData.doctorId) {
    return errorResponse('patientId and doctorId are required', 400);
  }

  if (!requestData.prescriptions || requestData.prescriptions.length === 0) {
    return errorResponse('At least one prescription is required', 400);
  }

  // Validate each prescription
  for (const prescription of requestData.prescriptions) {
    if (!prescription.medicineName || !prescription.dosage) {
      return errorResponse('Medicine name and dosage are required for all prescriptions', 400);
    }
    if (!prescription.frequency || !prescription.duration) {
      return errorResponse('Frequency and duration are required for all prescriptions', 400);
    }
  }

  const scheduledMedicines: Prescription[] = [];
  const startDate = new Date();

  // Process each prescription
  for (const prescription of requestData.prescriptions) {
    try {
      // Generate schedule using Bedrock (optional - can use frequency parser directly)
      let times: string[];
      let foodTiming: 'before food' | 'after food' | 'with food' | 'anytime' = 'anytime';

      // Try to use Bedrock for schedule generation
      try {
        const userPrompt = generateSchedulePrompt(
          prescription.medicineName,
          prescription.dosage,
          prescription.frequency,
          prescription.specialInstructions
        );

        const scheduleResponse = await callBedrockJson<ScheduleResponse>(
          SCHEDULE_GENERATION_SYSTEM_PROMPT,
          userPrompt,
          ['medicineName', 'dosage', 'times', 'frequency'],
          { timeout: 10000 }
        );

        times = scheduleResponse.times;
        foodTiming = scheduleResponse.foodTiming || 'anytime';
      } catch (bedrockError) {
        console.warn('Bedrock schedule generation failed, using frequency parser:', bedrockError);
        // Fallback to frequency parser
        times = parseFrequencyToTimes(prescription.frequency);
      }

      // Calculate stop date
      const stopDate = calculateStopDate(startDate, prescription.duration);

      // Generate medicine ID
      const medicineId = uuidv4();

      // Create prescription object
      const scheduledPrescription: Prescription = {
        medicineId,
        medicineName: prescription.medicineName,
        dosage: prescription.dosage,
        frequency: prescription.frequency,
        times,
        startDate: startDate.toISOString(),
        stopDate,
        specialInstructions: prescription.specialInstructions,
        foodTiming
      };

      scheduledMedicines.push(scheduledPrescription);

      // Create EventBridge rules for each dose time
      await createEventBridgeRules(
        requestData.patientId,
        scheduledPrescription,
        reminderLambdaArn
      );

    } catch (error: any) {
      console.error(`Error processing prescription for ${prescription.medicineName}:`, error);
      return errorResponse(
        `Failed to process prescription for ${prescription.medicineName}: ${error.message}`,
        500
      );
    }
  }

  // Store treatment plan in DynamoDB
  const treatmentPlan = await createTreatmentPlan({
    patientId: requestData.patientId,
    doctorId: requestData.doctorId,
    planName: 'Legacy Treatment Plan', // Default name for legacy endpoint
    disease: 'Not specified', // Default disease for legacy endpoint
    duration: requestData.prescriptions[0]?.duration || '7 days', // Use first prescription duration
    prescriptions: scheduledMedicines
  });

  return successResponse({
    treatmentPlanId: treatmentPlan.treatmentPlanId,
    schedules: scheduledMedicines,
    message: 'Treatment plan created successfully'
  });
}

/**
 * Create EventBridge scheduled rules for medication reminders
 */
async function createEventBridgeRules(
  patientId: string,
  prescription: Prescription,
  reminderLambdaArn: string
): Promise<void> {
  const { medicineId, medicineName, dosage, times, stopDate } = prescription;

  for (const time of times) {
    const [hour, minute] = time.split(':');
    const ruleName = `carenav-reminder-${medicineId}-${hour}${minute}`;

    try {
      // Create EventBridge rule with cron expression
      await eventBridgeClient.send(
        new PutRuleCommand({
          Name: ruleName,
          ScheduleExpression: `cron(${minute} ${hour} * * ? *)`,
          State: 'ENABLED',
          Description: `Reminder for ${medicineName} at ${time}`
        })
      );

      // Set Lambda target for the rule
      await eventBridgeClient.send(
        new PutTargetsCommand({
          Rule: ruleName,
          Targets: [
            {
              Id: '1',
              Arn: reminderLambdaArn,
              Input: JSON.stringify({
                patientId,
                medicineId,
                medicineName,
                dosage,
                time,
                stopDate,
                ruleName
              })
            }
          ]
        })
      );

      console.log(`Created EventBridge rule: ${ruleName}`);
    } catch (error: any) {
      console.error(`Failed to create EventBridge rule ${ruleName}:`, error);
      throw new Error(`Failed to schedule reminder for ${medicineName} at ${time}`);
    }
  }
}

/**
 * Handle getting all treatment plans for a patient
 */
async function handleGetTreatmentPlans(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const pathParts = event.path.split('/');
  const patientId = pathParts[pathParts.length - 1];

  if (!patientId) {
    return errorResponse('patientId is required', 400);
  }

  try {
    const { getPatientTreatmentPlans } = await import('../shared/treatment-db');
    const plans = await getPatientTreatmentPlans(patientId);

    return successResponse({
      plans,
      count: plans.length
    });
  } catch (error: any) {
    console.error('Error retrieving treatment plans:', error);
    return errorResponse(
      `Failed to retrieve treatment plans: ${error.message}`,
      500
    );
  }
}

/**
 * Handle marking a dose as taken
 */
async function handleMarkDoseTaken(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (!event.body) {
    return errorResponse('Request body is required', 400);
  }

  const { patientId, medicineId, scheduledDate, scheduledTime } = JSON.parse(event.body);

  if (!patientId || !medicineId || !scheduledDate || !scheduledTime) {
    return errorResponse('patientId, medicineId, scheduledDate, and scheduledTime are required', 400);
  }

  const { markDoseTaken } = await import('../shared/treatment-db');
  const dose = await markDoseTaken(patientId, medicineId, scheduledDate, scheduledTime);

  return successResponse({
    message: 'Dose marked as taken',
    dose
  });
}

/**
 * Handle getting patient treatment schedule
 */
async function handleGetSchedule(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const patientId = event.pathParameters?.patientId;

  if (!patientId) {
    return errorResponse('patientId is required', 400);
  }

  const { getActiveTreatmentPlans, getDosesForDate } = await import('../shared/treatment-db');
  const { getTimeOfDay } = await import('../shared/frequency-parser');

  // Get active treatment plans
  const activePlans = await getActiveTreatmentPlans(patientId);

  // Get today's date
  const today = new Date().toISOString().split('T')[0];

  // Get today's doses
  const todayDoses = await getDosesForDate(patientId, today);

  // Build response with medicines grouped by time of day
  const activeMedicines = activePlans.flatMap(plan =>
    plan.prescriptions.filter(prescription =>
      new Date(prescription.stopDate) > new Date()
    ).map(prescription => {
      // Get dose status for today
      const todayDosesForMedicine = todayDoses.filter(
        dose => dose.medicineId === prescription.medicineId
      );

      const dosesWithStatus = prescription.times.map(time => {
        const dose = todayDosesForMedicine.find(d => d.scheduledTime === time);
        return {
          time,
          timeOfDay: getTimeOfDay(time),
          status: dose?.status || 'pending',
          takenAt: dose?.takenAt || null
        };
      });

      return {
        medicineId: prescription.medicineId,
        medicineName: prescription.medicineName,
        dosage: prescription.dosage,
        todayDoses: dosesWithStatus,
        stopDate: prescription.stopDate,
        specialInstructions: prescription.specialInstructions,
        foodTiming: prescription.foodTiming,
        planName: plan.planName,
        treatmentPlanId: plan.treatmentPlanId
      };
    })
  );

  // Group by time of day
  const groupedByTimeOfDay = {
    morning: activeMedicines.filter(m =>
      m.todayDoses.some(d => d.timeOfDay === 'morning')
    ),
    afternoon: activeMedicines.filter(m =>
      m.todayDoses.some(d => d.timeOfDay === 'afternoon')
    ),
    evening: activeMedicines.filter(m =>
      m.todayDoses.some(d => d.timeOfDay === 'evening')
    ),
    night: activeMedicines.filter(m =>
      m.todayDoses.some(d => d.timeOfDay === 'night')
    )
  };

  return successResponse({
    activeMedicines,
    groupedByTimeOfDay,
    date: today
  });
}

/**
 * Handle getting adherence dashboard for a patient (doctor only)
 */
async function handleGetAdherence(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const patientId = event.pathParameters?.patientId;

  if (!patientId) {
    return errorResponse('patientId is required', 400);
  }

  // Check if user is a doctor (role-based access control)
  const userRole = event.requestContext?.authorizer?.role;
  if (userRole !== 'doctor') {
    return errorResponse('Access denied. Doctor role required.', 403);
  }

  try {
    // Import adherence calculator functions
    const {
      calculatePatientAdherence,
      generateAdherenceTrends,
      getMissedDoses
    } = await import('../shared/adherence-calculator');

    const { getPatient } = await import('../shared/patient-db');

    // Get patient information
    const patient = await getPatient(patientId);
    if (!patient) {
      return errorResponse('Patient not found', 404);
    }

    // Calculate overall adherence metrics
    const adherenceMetrics = await calculatePatientAdherence(patientId);

    // Generate adherence trends (last 30 days, daily)
    const dailyTrends = await generateAdherenceTrends(patientId, 'daily');

    // Generate weekly trends (last 12 weeks)
    const weeklyTrends = await generateAdherenceTrends(patientId, 'weekly');

    // Get missed doses (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const missedDoses = await getMissedDoses(
      patientId,
      thirtyDaysAgo.toISOString().split('T')[0]
    );

    // Build response with warning indicators
    const response = {
      patient: {
        patientId: patient.patientId,
        name: patient.name,
        age: patient.age,
        gender: patient.gender
      },
      adherence: {
        overall: adherenceMetrics.overallAdherence,
        isLowAdherence: adherenceMetrics.isLowAdherence,
        warningLevel: getWarningLevel(adherenceMetrics.overallAdherence),
        totalScheduled: adherenceMetrics.totalScheduled,
        totalTaken: adherenceMetrics.totalTaken,
        totalMissed: adherenceMetrics.totalMissed,
        lastCalculated: adherenceMetrics.lastCalculated
      },
      medicines: adherenceMetrics.medicineAdherence.map(medicine => ({
        medicineId: medicine.medicineId,
        medicineName: medicine.medicineName,
        dosage: medicine.dosage,
        adherencePercentage: medicine.adherencePercentage,
        scheduled: medicine.scheduled,
        taken: medicine.taken,
        missed: medicine.missed,
        isActive: medicine.isActive,
        startDate: medicine.startDate,
        stopDate: medicine.stopDate,
        warningLevel: getWarningLevel(medicine.adherencePercentage)
      })),
      trends: {
        daily: dailyTrends.slice(-30), // Last 30 days
        weekly: weeklyTrends.slice(-12) // Last 12 weeks
      },
      missedDoses: missedDoses.map(dose => ({
        medicineId: dose.medicineId,
        medicineName: dose.medicineName,
        dosage: dose.dosage,
        scheduledDate: dose.scheduledDate,
        scheduledTime: dose.scheduledTime,
        status: dose.status
      })),
      summary: {
        hasLowAdherence: adherenceMetrics.isLowAdherence,
        lowAdherenceMedicines: adherenceMetrics.medicineAdherence
          .filter(m => m.adherencePercentage < 80)
          .map(m => m.medicineName),
        recentMissedCount: missedDoses.length,
        recommendations: generateRecommendations(adherenceMetrics)
      }
    };

    return successResponse(response);
  } catch (error: any) {
    console.error('Error calculating adherence:', error);
    return errorResponse(
      `Failed to calculate adherence: ${error.message}`,
      500
    );
  }
}

/**
 * Get warning level based on adherence percentage
 */
function getWarningLevel(adherencePercentage: number): 'good' | 'warning' | 'critical' {
  if (adherencePercentage >= 80) {
    return 'good';
  } else if (adherencePercentage >= 60) {
    return 'warning';
  } else {
    return 'critical';
  }
}

/**
 * Generate recommendations based on adherence metrics
 */
function generateRecommendations(adherenceMetrics: any): string[] {
  const recommendations: string[] = [];

  if (adherenceMetrics.isLowAdherence) {
    recommendations.push('Patient has low overall adherence (<80%). Consider follow-up consultation.');
  }

  const criticalMedicines = adherenceMetrics.medicineAdherence.filter(
    (m: any) => m.adherencePercentage < 60 && m.isActive
  );

  if (criticalMedicines.length > 0) {
    recommendations.push(
      `Critical adherence issues with: ${criticalMedicines.map((m: any) => m.medicineName).join(', ')}`
    );
  }

  const recentlyMissed = adherenceMetrics.medicineAdherence.filter(
    (m: any) => m.missed > 0 && m.isActive
  );

  if (recentlyMissed.length > 0) {
    recommendations.push('Patient has missed doses recently. Consider reminder system review.');
  }

  if (recommendations.length === 0) {
    recommendations.push('Patient adherence is good. Continue current treatment plan.');
  }

  return recommendations;
}

/**
 * Handle completing a treatment and generating summary
 */
async function handleCompleteTreatment(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const pathParts = event.path.split('/');
  const treatmentPlanId = pathParts[pathParts.length - 1];

  if (!treatmentPlanId) {
    return errorResponse('treatmentPlanId is required', 400);
  }

  // Get patientId from request body or query parameters
  const patientId = event.body 
    ? JSON.parse(event.body).patientId 
    : event.queryStringParameters?.patientId;

  if (!patientId) {
    return errorResponse('patientId is required', 400);
  }

  try {
    const { completeAndSummarizeTreatment } = await import('../shared/adherence-calculator');

    // Generate and store completion summary
    const completionSummary = await completeAndSummarizeTreatment(patientId, treatmentPlanId);

    return successResponse({
      message: 'Treatment completed and summary generated',
      completionSummary
    });
  } catch (error: any) {
    console.error('Error completing treatment:', error);
    return errorResponse(
      `Failed to complete treatment: ${error.message}`,
      500
    );
  }
}

/**
 * Handle getting a specific completion summary
 */
async function handleGetCompletionSummary(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const pathParts = event.path.split('/');
  const patientId = pathParts[pathParts.length - 2];
  const treatmentPlanId = pathParts[pathParts.length - 1];

  if (!patientId || !treatmentPlanId) {
    return errorResponse('patientId and treatmentPlanId are required', 400);
  }

  try {
    const { getTreatmentCompletionSummary } = await import('../shared/adherence-calculator');

    const completionSummary = await getTreatmentCompletionSummary(patientId, treatmentPlanId);

    if (!completionSummary) {
      return errorResponse('Completion summary not found', 404);
    }

    return successResponse({
      completionSummary
    });
  } catch (error: any) {
    console.error('Error retrieving completion summary:', error);
    return errorResponse(
      `Failed to retrieve completion summary: ${error.message}`,
      500
    );
  }
}

/**
 * Handle getting all completion summaries for a patient
 */
async function handleGetAllCompletionSummaries(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const pathParts = event.path.split('/');
  const patientId = pathParts[pathParts.length - 1];

  if (!patientId) {
    return errorResponse('patientId is required', 400);
  }

  try {
    const { getPatientCompletionSummaries } = await import('../shared/adherence-calculator');

    const completionSummaries = await getPatientCompletionSummaries(patientId);

    return successResponse({
      patientId,
      completionSummaries,
      count: completionSummaries.length
    });
  } catch (error: any) {
    console.error('Error retrieving completion summaries:', error);
    return errorResponse(
      `Failed to retrieve completion summaries: ${error.message}`,
      500
    );
  }
}

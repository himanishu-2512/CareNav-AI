// Prescription Handler Lambda - Medication prescription and synchronization
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { successResponse, errorResponse, validateRequiredFields } from '../shared/response';
import { parseFrequencyToTimes, calculateStopDate } from '../shared/frequency-parser';
import { addMessage } from '../shared/chat-message-db';
import { logAccess } from '../shared/audit-log';
import { v4 as uuidv4 } from 'uuid';

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const TABLE_NAME = process.env.TABLE_NAME || 'CareNavAI';

/**
 * Medication entry interface
 */
interface MedicationEntry {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: number; // days
  specialInstructions?: string;
  foodTiming?: 'before food' | 'after food' | 'with food' | 'anytime';
}

/**
 * Prescription data interface
 */
interface PrescriptionData {
  prescriptionId: string;
  episodeId: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  medications: MedicationEntry[];
  syncStatus: 'pending' | 'synced' | 'failed';
  syncAttempts: number;
  lastSyncAttempt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Lambda handler for prescription operations
 * POST /api/prescription/create - Create prescription
 * GET /api/prescription/{prescriptionId} - Get prescription details
 * POST /api/prescription/sync - Sync prescription to patient app
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('Prescription handler request:', event.httpMethod, event.path);

  try {
    // Extract userId from JWT token in authorizer context
    const userId = event.requestContext?.authorizer?.userId;
    const userRole = event.requestContext?.authorizer?.role;
    
    if (!userId) {
      return errorResponse('Unauthorized: User ID not found in token', 401);
    }

    const path = event.path;
    const method = event.httpMethod;

    // Route to appropriate handler
    if (method === 'POST' && path === '/api/prescription/create') {
      return await handleCreatePrescription(event, userId, userRole);
    }

    if (method === 'GET' && path.match(/\/api\/prescription\/[^/]+$/)) {
      const prescriptionId = path.split('/').pop()!;
      return await handleGetPrescription(event, prescriptionId, userId);
    }

    if (method === 'POST' && path === '/api/prescription/sync') {
      return await handleSyncPrescription(event, userId);
    }

    return errorResponse('Invalid endpoint', 404);
  } catch (error) {
    console.error('Error in prescription handler:', error);
    return errorResponse(
      'Internal server error',
      500,
      { error: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}

/**
 * Handle POST /api/prescription/create
 * Create a new prescription
 */
async function handleCreatePrescription(
  event: APIGatewayProxyEvent,
  userId: string,
  userRole: string
): Promise<APIGatewayProxyResult> {
  try {
    // Parse request body
    if (!event.body) {
      return errorResponse('Request body is required', 400);
    }

    const body = JSON.parse(event.body);

    // Validate required fields
    const validation = validateRequiredFields(body, [
      'episodeId',
      'patientId',
      'doctorId',
      'doctorName',
      'medications'
    ]);
    
    if (!validation.valid) {
      return errorResponse(
        `Missing required fields: ${validation.missing?.join(', ')}`,
        400
      );
    }

    // Validate that the requesting user is authorized (must be the doctor)
    if (userRole === 'doctor' && userId !== body.doctorId) {
      return errorResponse('Unauthorized: Cannot create prescription for another doctor', 403);
    }

    // Validate medications array
    if (!Array.isArray(body.medications) || body.medications.length === 0) {
      return errorResponse('At least one medication is required', 400);
    }

    // Validate each medication
    for (const med of body.medications) {
      const medValidation = validateRequiredFields(med, [
        'medicineName',
        'dosage',
        'frequency',
        'duration'
      ]);
      
      if (!medValidation.valid) {
        return errorResponse(
          `Invalid medication entry: missing ${medValidation.missing?.join(', ')}`,
          400
        );
      }

      // Validate duration is a positive number
      if (typeof med.duration !== 'number' || med.duration <= 0) {
        return errorResponse(
          `Invalid duration for ${med.medicineName}: must be a positive number`,
          400
        );
      }
    }

    // Generate prescription ID
    const prescriptionId = uuidv4();
    const now = new Date().toISOString();

    // Create prescription object
    const prescription: PrescriptionData = {
      prescriptionId,
      episodeId: body.episodeId,
      patientId: body.patientId,
      doctorId: body.doctorId,
      doctorName: body.doctorName,
      medications: body.medications,
      syncStatus: 'pending',
      syncAttempts: 0,
      createdAt: now,
      updatedAt: now
    };

    // Save prescription to DynamoDB
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `PATIENT#${body.patientId}`,
        SK: `PRESCRIPTION#${prescriptionId}`,
        ...prescription
      }
    }));

    console.log(`Created prescription ${prescriptionId} for patient ${body.patientId}`);

    // Add prescription message to chat thread
    const medicationList = body.medications
      .map((med: MedicationEntry) => 
        `${med.medicineName} - ${med.dosage}, ${med.frequency} for ${med.duration} days`
      )
      .join('\n');

    await addMessage(
      body.episodeId,
      'system',
      'System',
      `Prescription created by Dr. ${body.doctorName}:\n\n${medicationList}`,
      'prescription',
      { prescriptionId }
    );

    // Log access for audit trail
    const ipAddress = event.requestContext?.identity?.sourceIp;
    const userAgent = event.headers?.['User-Agent'] || event.headers?.['user-agent'];
    
    await logAccess(
      body.doctorId,
      body.patientId,
      'view_episode',
      `prescription_create:${prescriptionId}`,
      ipAddress,
      userAgent
    );

    // Attempt to sync prescription to patient app
    const syncResult = await syncPrescriptionToPatientApp(prescription);

    return successResponse({
      prescriptionId,
      episodeId: body.episodeId,
      patientId: body.patientId,
      doctorId: body.doctorId,
      medications: body.medications,
      syncStatus: syncResult.success ? 'synced' : 'pending',
      scheduleGenerated: syncResult.scheduleGenerated,
      createdAt: now
    }, 201);
  } catch (error: any) {
    console.error('Error creating prescription:', error);
    return errorResponse(
      error.message || 'Failed to create prescription',
      500
    );
  }
}

/**
 * Handle GET /api/prescription/{prescriptionId}
 * Get prescription details
 */
async function handleGetPrescription(
  event: APIGatewayProxyEvent,
  prescriptionId: string,
  userId: string
): Promise<APIGatewayProxyResult> {
  try {
    // Validate prescriptionId format
    if (!prescriptionId || prescriptionId.trim().length === 0) {
      return errorResponse('Invalid prescription ID', 400);
    }

    // Get patientId from query parameter (required for DynamoDB query)
    const patientId = event.queryStringParameters?.patientId;
    
    if (!patientId) {
      return errorResponse('patientId query parameter is required', 400);
    }

    // Get the prescription
    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `PATIENT#${patientId}`,
        SK: `PRESCRIPTION#${prescriptionId}`
      }
    }));

    if (!result.Item) {
      return errorResponse('Prescription not found', 404);
    }

    const prescription = result.Item as PrescriptionData;

    console.log(`Retrieved prescription ${prescriptionId} for patient ${patientId}`);

    return successResponse({
      prescriptionId: prescription.prescriptionId,
      episodeId: prescription.episodeId,
      patientId: prescription.patientId,
      doctorId: prescription.doctorId,
      doctorName: prescription.doctorName,
      medications: prescription.medications,
      syncStatus: prescription.syncStatus,
      syncAttempts: prescription.syncAttempts,
      lastSyncAttempt: prescription.lastSyncAttempt,
      createdAt: prescription.createdAt,
      updatedAt: prescription.updatedAt
    });
  } catch (error: any) {
    console.error('Error getting prescription:', error);
    return errorResponse(
      error.message || 'Failed to get prescription',
      500
    );
  }
}

/**
 * Handle POST /api/prescription/sync
 * Manually trigger prescription synchronization
 */
async function handleSyncPrescription(
  event: APIGatewayProxyEvent,
  userId: string
): Promise<APIGatewayProxyResult> {
  try {
    // Parse request body
    if (!event.body) {
      return errorResponse('Request body is required', 400);
    }

    const body = JSON.parse(event.body);

    // Validate required fields
    const validation = validateRequiredFields(body, ['prescriptionId', 'patientId']);
    
    if (!validation.valid) {
      return errorResponse(
        `Missing required fields: ${validation.missing?.join(', ')}`,
        400
      );
    }

    // Get the prescription
    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `PATIENT#${body.patientId}`,
        SK: `PRESCRIPTION#${body.prescriptionId}`
      }
    }));

    if (!result.Item) {
      return errorResponse('Prescription not found', 404);
    }

    const prescription = result.Item as PrescriptionData;

    // Attempt to sync with retry logic
    const syncResult = await syncPrescriptionWithRetry(prescription);

    return successResponse({
      prescriptionId: prescription.prescriptionId,
      syncStatus: syncResult.success ? 'synced' : 'failed',
      syncAttempts: syncResult.attempts,
      scheduleGenerated: syncResult.scheduleGenerated,
      error: syncResult.error
    });
  } catch (error: any) {
    console.error('Error syncing prescription:', error);
    return errorResponse(
      error.message || 'Failed to sync prescription',
      500
    );
  }
}

/**
 * Sync prescription to patient app with retry logic
 * Retries up to 3 times with 5-second intervals
 */
async function syncPrescriptionWithRetry(
  prescription: PrescriptionData
): Promise<{ success: boolean; attempts: number; scheduleGenerated: boolean; error?: string }> {
  const maxAttempts = 3;
  const retryDelay = 5000; // 5 seconds

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`Sync attempt ${attempt}/${maxAttempts} for prescription ${prescription.prescriptionId}`);

    const result = await syncPrescriptionToPatientApp(prescription);

    if (result.success) {
      // Update prescription sync status
      await updatePrescriptionSyncStatus(
        prescription.patientId,
        prescription.prescriptionId,
        'synced',
        attempt
      );

      return {
        success: true,
        attempts: attempt,
        scheduleGenerated: result.scheduleGenerated
      };
    }

    // If not the last attempt, wait before retrying
    if (attempt < maxAttempts) {
      console.log(`Sync failed, retrying in ${retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  // All attempts failed
  console.error(`All ${maxAttempts} sync attempts failed for prescription ${prescription.prescriptionId}`);

  // Update prescription sync status to failed
  await updatePrescriptionSyncStatus(
    prescription.patientId,
    prescription.prescriptionId,
    'failed',
    maxAttempts
  );

  return {
    success: false,
    attempts: maxAttempts,
    scheduleGenerated: false,
    error: 'Failed to sync after maximum retry attempts'
  };
}

/**
 * Sync prescription to patient app (creates treatment plan)
 * This integrates with the existing treatment-planner system
 */
async function syncPrescriptionToPatientApp(
  prescription: PrescriptionData
): Promise<{ success: boolean; scheduleGenerated: boolean; error?: string }> {
  try {
    const startDate = new Date();
    const prescriptions = [];

    // Convert medications to treatment plan format
    for (const med of prescription.medications) {
      // Parse frequency to get dose times
      const times = parseFrequencyToTimes(med.frequency);

      // Calculate stop date based on duration
      const stopDate = calculateStopDate(startDate, `${med.duration} days`);

      prescriptions.push({
        medicineId: uuidv4(),
        medicineName: med.medicineName,
        dosage: med.dosage,
        frequency: med.frequency,
        times,
        startDate: startDate.toISOString(),
        stopDate,
        specialInstructions: med.specialInstructions,
        foodTiming: med.foodTiming || 'anytime'
      });
    }

    // Create treatment plan in DynamoDB
    const treatmentPlanId = uuidv4();
    const now = new Date().toISOString();

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `PATIENT#${prescription.patientId}`,
        SK: `TREATMENT#${treatmentPlanId}`,
        treatmentPlanId,
        patientId: prescription.patientId,
        doctorId: prescription.doctorId,
        prescriptionId: prescription.prescriptionId,
        episodeId: prescription.episodeId,
        prescriptions,
        createdAt: now
      }
    }));

    console.log(`Created treatment plan ${treatmentPlanId} for prescription ${prescription.prescriptionId}`);

    return {
      success: true,
      scheduleGenerated: true
    };
  } catch (error: any) {
    console.error('Error syncing prescription to patient app:', error);
    return {
      success: false,
      scheduleGenerated: false,
      error: error.message || 'Unknown sync error'
    };
  }
}

/**
 * Update prescription sync status in DynamoDB
 */
async function updatePrescriptionSyncStatus(
  patientId: string,
  prescriptionId: string,
  syncStatus: 'pending' | 'synced' | 'failed',
  syncAttempts: number
): Promise<void> {
  const now = new Date().toISOString();

  await docClient.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: `PATIENT#${patientId}`,
      SK: `PRESCRIPTION#${prescriptionId}`
    },
    UpdateExpression: 'SET syncStatus = :status, syncAttempts = :attempts, lastSyncAttempt = :timestamp, updatedAt = :updated',
    ExpressionAttributeValues: {
      ':status': syncStatus,
      ':attempts': syncAttempts,
      ':timestamp': now,
      ':updated': now
    }
  }));

  console.log(`Updated prescription ${prescriptionId} sync status to ${syncStatus} (${syncAttempts} attempts)`);
}

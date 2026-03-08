// Adherence Calculation Module
// Calculates medication adherence metrics for patients

import { QueryCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDbClient, TABLE_NAME } from './dynamodb-client';
import { Dose, TreatmentPlan, TreatmentCompletionSummary, MedicineCompletionDetail, DynamoDBKeys } from './types';
import { getActiveTreatmentPlans, getPatientTreatmentPlans, getTreatmentPlan } from './treatment-db';

/**
 * Adherence metrics for a patient
 */
export interface PatientAdherence {
  patientId: string;
  overallAdherence: number;
  medicineAdherence: MedicineAdherence[];
  totalScheduled: number;
  totalTaken: number;
  totalMissed: number;
  isLowAdherence: boolean; // < 80%
  lastCalculated: string;
}

/**
 * Adherence metrics for a specific medicine
 */
export interface MedicineAdherence {
  medicineId: string;
  medicineName: string;
  dosage: string;
  adherencePercentage: number;
  scheduled: number;
  taken: number;
  missed: number;
  startDate: string;
  stopDate: string;
  isActive: boolean;
}

/**
 * Adherence trend data point
 */
export interface AdherenceTrend {
  date: string;
  adherencePercentage: number;
  scheduled: number;
  taken: number;
  missed: number;
}

/**
 * Time period for trend calculation
 */
export type TrendPeriod = 'daily' | 'weekly';

/**
 * Calculate overall adherence for a patient
 * @param patientId - Patient ID
 * @returns Patient adherence metrics
 */
export async function calculatePatientAdherence(patientId: string): Promise<PatientAdherence> {
  // Get all treatment plans for the patient
  const treatmentPlans = await getPatientTreatmentPlans(patientId);

  if (treatmentPlans.length === 0) {
    return {
      patientId,
      overallAdherence: 0,
      medicineAdherence: [],
      totalScheduled: 0,
      totalTaken: 0,
      totalMissed: 0,
      isLowAdherence: false,
      lastCalculated: new Date().toISOString()
    };
  }

  // Get all dose records for the patient
  const allDoses = await getAllPatientDoses(patientId);

  // Calculate adherence for each medicine
  const medicineAdherence: MedicineAdherence[] = [];
  let totalScheduled = 0;
  let totalTaken = 0;

  for (const plan of treatmentPlans) {
    for (const prescription of plan.prescriptions) {
      const medicineDoses = allDoses.filter(
        dose => dose.medicineId === prescription.medicineId
      );

      const scheduled = medicineDoses.length;
      const taken = medicineDoses.filter(dose => dose.status === 'taken').length;
      const missed = scheduled - taken;
      const adherencePercentage = scheduled > 0 ? Math.round((taken / scheduled) * 100) : 0;

      medicineAdherence.push({
        medicineId: prescription.medicineId,
        medicineName: prescription.medicineName,
        dosage: prescription.dosage,
        adherencePercentage,
        scheduled,
        taken,
        missed,
        startDate: prescription.startDate,
        stopDate: prescription.stopDate,
        isActive: new Date(prescription.stopDate) > new Date()
      });

      totalScheduled += scheduled;
      totalTaken += taken;
    }
  }

  const overallAdherence = totalScheduled > 0 
    ? Math.round((totalTaken / totalScheduled) * 100) 
    : 0;

  return {
    patientId,
    overallAdherence,
    medicineAdherence,
    totalScheduled,
    totalTaken,
    totalMissed: totalScheduled - totalTaken,
    isLowAdherence: overallAdherence < 80,
    lastCalculated: new Date().toISOString()
  };
}

/**
 * Calculate adherence for a specific medicine
 * @param patientId - Patient ID
 * @param medicineId - Medicine ID
 * @returns Medicine adherence metrics
 */
export async function calculateMedicineAdherence(
  patientId: string,
  medicineId: string
): Promise<MedicineAdherence | null> {
  // Get treatment plans to find medicine details
  const treatmentPlans = await getPatientTreatmentPlans(patientId);
  let prescription = null;

  for (const plan of treatmentPlans) {
    const found = plan.prescriptions.find(p => p.medicineId === medicineId);
    if (found) {
      prescription = found;
      break;
    }
  }

  if (!prescription) {
    return null;
  }

  // Get all doses for this medicine
  const doses = await getMedicineDoses(patientId, medicineId);

  const scheduled = doses.length;
  const taken = doses.filter(dose => dose.status === 'taken').length;
  const missed = scheduled - taken;
  const adherencePercentage = scheduled > 0 ? Math.round((taken / scheduled) * 100) : 0;

  return {
    medicineId: prescription.medicineId,
    medicineName: prescription.medicineName,
    dosage: prescription.dosage,
    adherencePercentage,
    scheduled,
    taken,
    missed,
    startDate: prescription.startDate,
    stopDate: prescription.stopDate,
    isActive: new Date(prescription.stopDate) > new Date()
  };
}

/**
 * Generate adherence trends over time
 * @param patientId - Patient ID
 * @param period - Time period (daily or weekly)
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @returns Array of adherence trend data points
 */
export async function generateAdherenceTrends(
  patientId: string,
  period: TrendPeriod,
  startDate?: string,
  endDate?: string
): Promise<AdherenceTrend[]> {
  // Default to last 30 days if not specified
  const end = endDate ? new Date(endDate) : new Date();
  const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get all doses for the patient
  const allDoses = await getAllPatientDoses(patientId);

  // Filter doses within date range
  const dosesInRange = allDoses.filter(dose => {
    const doseDate = new Date(dose.scheduledDate);
    return doseDate >= start && doseDate <= end;
  });

  if (period === 'daily') {
    return generateDailyTrends(dosesInRange, start, end);
  } else {
    return generateWeeklyTrends(dosesInRange, start, end);
  }
}

/**
 * Generate daily adherence trends
 */
function generateDailyTrends(doses: Dose[], startDate: Date, endDate: Date): AdherenceTrend[] {
  const trends: AdherenceTrend[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayDoses = doses.filter(dose => dose.scheduledDate === dateStr);

    const scheduled = dayDoses.length;
    const taken = dayDoses.filter(dose => dose.status === 'taken').length;
    const missed = scheduled - taken;
    const adherencePercentage = scheduled > 0 ? Math.round((taken / scheduled) * 100) : 0;

    trends.push({
      date: dateStr,
      adherencePercentage,
      scheduled,
      taken,
      missed
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return trends;
}

/**
 * Generate weekly adherence trends
 */
function generateWeeklyTrends(doses: Dose[], startDate: Date, endDate: Date): AdherenceTrend[] {
  const trends: AdherenceTrend[] = [];
  const currentDate = new Date(startDate);

  // Align to start of week (Monday)
  const dayOfWeek = currentDate.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  currentDate.setDate(currentDate.getDate() - daysToMonday);

  while (currentDate <= endDate) {
    const weekStart = new Date(currentDate);
    const weekEnd = new Date(currentDate);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const weekDoses = doses.filter(dose => {
      const doseDate = new Date(dose.scheduledDate);
      return doseDate >= weekStart && doseDate <= weekEnd;
    });

    const scheduled = weekDoses.length;
    const taken = weekDoses.filter(dose => dose.status === 'taken').length;
    const missed = scheduled - taken;
    const adherencePercentage = scheduled > 0 ? Math.round((taken / scheduled) * 100) : 0;

    trends.push({
      date: weekStart.toISOString().split('T')[0],
      adherencePercentage,
      scheduled,
      taken,
      missed
    });

    currentDate.setDate(currentDate.getDate() + 7);
  }

  return trends;
}

/**
 * Identify patients with low adherence (< 80%)
 * @param patientIds - Array of patient IDs to check
 * @returns Array of patient IDs with low adherence
 */
export async function identifyLowAdherencePatients(patientIds: string[]): Promise<string[]> {
  const lowAdherencePatients: string[] = [];

  for (const patientId of patientIds) {
    const adherence = await calculatePatientAdherence(patientId);
    if (adherence.isLowAdherence) {
      lowAdherencePatients.push(patientId);
    }
  }

  return lowAdherencePatients;
}

/**
 * Get all dose records for a patient
 * @param patientId - Patient ID
 * @returns Array of all dose records
 */
async function getAllPatientDoses(patientId: string): Promise<Dose[]> {
  const result = await dynamoDbClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `PATIENT#${patientId}`,
        ':sk': 'DOSE#'
      }
    })
  );

  if (!result.Items || result.Items.length === 0) {
    return [];
  }

  return result.Items.map(item => {
    const { PK, SK, ...dose } = item;
    return dose as Dose;
  });
}

/**
 * Get dose records for a specific medicine
 * @param patientId - Patient ID
 * @param medicineId - Medicine ID
 * @returns Array of dose records
 */
async function getMedicineDoses(patientId: string, medicineId: string): Promise<Dose[]> {
  const result = await dynamoDbClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `PATIENT#${patientId}`,
        ':sk': `DOSE#${medicineId}#`
      }
    })
  );

  if (!result.Items || result.Items.length === 0) {
    return [];
  }

  return result.Items.map(item => {
    const { PK, SK, ...dose } = item;
    return dose as Dose;
  });
}

/**
 * Get missed doses for a patient
 * @param patientId - Patient ID
 * @param startDate - Optional start date filter
 * @param endDate - Optional end date filter
 * @returns Array of missed dose records
 */
export async function getMissedDoses(
  patientId: string,
  startDate?: string,
  endDate?: string
): Promise<Dose[]> {
  const allDoses = await getAllPatientDoses(patientId);

  let missedDoses = allDoses.filter(dose => dose.status === 'missed' || dose.status === 'due');

  // Apply date filters if provided
  if (startDate || endDate) {
    missedDoses = missedDoses.filter(dose => {
      const doseDate = new Date(dose.scheduledDate);
      if (startDate && doseDate < new Date(startDate)) return false;
      if (endDate && doseDate > new Date(endDate)) return false;
      return true;
    });
  }

  return missedDoses;
}

/**
 * Generate treatment completion summary for a completed treatment plan
 * @param patientId - Patient ID
 * @param treatmentPlanId - Treatment plan ID
 * @returns Treatment completion summary
 */
export async function generateTreatmentCompletionSummary(
  patientId: string,
  treatmentPlanId: string
): Promise<TreatmentCompletionSummary> {
  // Get the treatment plan
  const treatmentPlan = await getTreatmentPlan(patientId, treatmentPlanId);
  
  if (!treatmentPlan) {
    throw new Error(`Treatment plan ${treatmentPlanId} not found for patient ${patientId}`);
  }

  // Get all doses for this treatment plan
  const allDoses = await getAllPatientDoses(patientId);

  // Calculate completion details for each medicine
  const medicineCompletionDetails: MedicineCompletionDetail[] = [];
  let totalScheduledDoses = 0;
  let totalTakenDoses = 0;

  for (const prescription of treatmentPlan.prescriptions) {
    const medicineDoses = allDoses.filter(
      dose => dose.medicineId === prescription.medicineId
    );

    const scheduledDoses = medicineDoses.length;
    const takenDoses = medicineDoses.filter(dose => dose.status === 'taken').length;
    const missedDoses = scheduledDoses - takenDoses;
    const adherenceRate = scheduledDoses > 0 
      ? Math.round((takenDoses / scheduledDoses) * 100) 
      : 0;

    medicineCompletionDetails.push({
      medicineId: prescription.medicineId,
      medicineName: prescription.medicineName,
      dosage: prescription.dosage,
      adherenceRate,
      scheduledDoses,
      takenDoses,
      missedDoses,
      startDate: prescription.startDate,
      stopDate: prescription.stopDate
    });

    totalScheduledDoses += scheduledDoses;
    totalTakenDoses += takenDoses;
  }

  // Calculate overall adherence rate
  const totalAdherenceRate = totalScheduledDoses > 0 
    ? Math.round((totalTakenDoses / totalScheduledDoses) * 100) 
    : 0;

  // Calculate treatment duration
  const startDate = treatmentPlan.prescriptions[0]?.startDate || treatmentPlan.createdAt;
  const endDate = treatmentPlan.prescriptions.reduce((latest, prescription) => {
    return new Date(prescription.stopDate) > new Date(latest) 
      ? prescription.stopDate 
      : latest;
  }, treatmentPlan.prescriptions[0]?.stopDate || startDate);

  const durationDays = Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  const treatmentDuration = `${durationDays} day${durationDays !== 1 ? 's' : ''}`;

  const completionSummary: TreatmentCompletionSummary = {
    treatmentPlanId,
    patientId,
    completedAt: new Date().toISOString(),
    totalAdherenceRate,
    medicineCompletionDetails,
    totalScheduledDoses,
    totalTakenDoses,
    totalMissedDoses: totalScheduledDoses - totalTakenDoses,
    treatmentDuration,
    startDate,
    endDate
  };

  return completionSummary;
}

/**
 * Store treatment completion summary in DynamoDB
 * @param completionSummary - Treatment completion summary
 */
export async function storeTreatmentCompletionSummary(
  completionSummary: TreatmentCompletionSummary
): Promise<void> {
  const keys = {
    PK: `PATIENT#${completionSummary.patientId}`,
    SK: `COMPLETION#${completionSummary.treatmentPlanId}`
  };

  await dynamoDbClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        ...keys,
        ...completionSummary
      }
    })
  );
}

/**
 * Get treatment completion summary from DynamoDB
 * @param patientId - Patient ID
 * @param treatmentPlanId - Treatment plan ID
 * @returns Treatment completion summary or null if not found
 */
export async function getTreatmentCompletionSummary(
  patientId: string,
  treatmentPlanId: string
): Promise<TreatmentCompletionSummary | null> {
  const result = await dynamoDbClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND SK = :sk',
      ExpressionAttributeValues: {
        ':pk': `PATIENT#${patientId}`,
        ':sk': `COMPLETION#${treatmentPlanId}`
      }
    })
  );

  if (!result.Items || result.Items.length === 0) {
    return null;
  }

  const { PK, SK, ...summary } = result.Items[0];
  return summary as TreatmentCompletionSummary;
}

/**
 * Get all treatment completion summaries for a patient
 * @param patientId - Patient ID
 * @returns Array of treatment completion summaries
 */
export async function getPatientCompletionSummaries(
  patientId: string
): Promise<TreatmentCompletionSummary[]> {
  const result = await dynamoDbClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `PATIENT#${patientId}`,
        ':sk': 'COMPLETION#'
      }
    })
  );

  if (!result.Items || result.Items.length === 0) {
    return [];
  }

  return result.Items.map(item => {
    const { PK, SK, ...summary } = item;
    return summary as TreatmentCompletionSummary;
  });
}

/**
 * Generate and store completion summary for a completed treatment plan
 * This is a convenience function that combines generation and storage
 * @param patientId - Patient ID
 * @param treatmentPlanId - Treatment plan ID
 * @returns Generated and stored completion summary
 */
export async function completeAndSummarizeTreatment(
  patientId: string,
  treatmentPlanId: string
): Promise<TreatmentCompletionSummary> {
  // Generate the completion summary
  const completionSummary = await generateTreatmentCompletionSummary(
    patientId,
    treatmentPlanId
  );

  // Store it in DynamoDB
  await storeTreatmentCompletionSummary(completionSummary);

  return completionSummary;
}

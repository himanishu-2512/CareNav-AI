// Treatment Plan DynamoDB operations
import { PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDbClient, TABLE_NAME } from './dynamodb-client';
import { TreatmentPlan, Prescription, Dose, DynamoDBKeys } from './types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a new treatment plan in DynamoDB
 * @param treatmentPlanData - Treatment plan information
 * @returns Created treatment plan with generated ID
 */
export async function createTreatmentPlan(
  treatmentPlanData: Omit<TreatmentPlan, 'treatmentPlanId' | 'createdAt'>
): Promise<TreatmentPlan> {
  const treatmentPlanId = uuidv4();
  const now = new Date().toISOString();

  const treatmentPlan: TreatmentPlan = {
    treatmentPlanId,
    ...treatmentPlanData,
    createdAt: now
  };

  const keys = DynamoDBKeys.treatment(treatmentPlanData.patientId, treatmentPlanId);

  await dynamoDbClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        ...keys,
        ...treatmentPlan
      }
    })
  );

  return treatmentPlan;
}

/**
 * Get a treatment plan by ID from DynamoDB
 * @param patientId - Patient ID
 * @param treatmentPlanId - Treatment plan ID
 * @returns Treatment plan data or null if not found
 */
export async function getTreatmentPlan(
  patientId: string,
  treatmentPlanId: string
): Promise<TreatmentPlan | null> {
  const keys = DynamoDBKeys.treatment(patientId, treatmentPlanId);

  const result = await dynamoDbClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: keys
    })
  );

  if (!result.Item) {
    return null;
  }

  // Remove DynamoDB keys from response
  const { PK, SK, ...treatmentPlan } = result.Item;
  return treatmentPlan as TreatmentPlan;
}

/**
 * Get all treatment plans for a patient
 * @param patientId - Patient ID
 * @returns Array of treatment plans
 */
export async function getPatientTreatmentPlans(patientId: string): Promise<TreatmentPlan[]> {
  const result = await dynamoDbClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `PATIENT#${patientId}`,
        ':sk': 'TREATMENT#'
      }
    })
  );

  if (!result.Items || result.Items.length === 0) {
    return [];
  }

  // Remove DynamoDB keys from each item
  return result.Items.map(item => {
    const { PK, SK, ...treatmentPlan } = item;
    return treatmentPlan as TreatmentPlan;
  });
}

/**
 * Get active treatment plans for a patient (not past stop date)
 * @param patientId - Patient ID
 * @returns Array of active treatment plans
 */
export async function getActiveTreatmentPlans(patientId: string): Promise<TreatmentPlan[]> {
  const allPlans = await getPatientTreatmentPlans(patientId);
  const now = new Date();

  return allPlans.filter(plan => {
    // Check if any prescription is still active
    return plan.prescriptions.some(prescription => 
      new Date(prescription.stopDate) > now
    );
  });
}

/**
 * Create a dose record in DynamoDB
 * @param doseData - Dose information
 * @returns Created dose record
 */
export async function createDose(
  doseData: Omit<Dose, 'createdAt'>
): Promise<Dose> {
  const now = new Date().toISOString();
  const doseId = `${doseData.medicineId}#${doseData.scheduledDate}#${doseData.scheduledTime}`;

  const dose: Dose = {
    ...doseData,
    createdAt: now
  };

  const keys = DynamoDBKeys.dose(doseData.patientId, doseId);

  await dynamoDbClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        ...keys,
        ...dose
      }
    })
  );

  return dose;
}

/**
 * Mark a dose as taken
 * @param patientId - Patient ID
 * @param medicineId - Medicine ID
 * @param scheduledDate - Scheduled date (YYYY-MM-DD)
 * @param scheduledTime - Scheduled time (HH:MM)
 * @returns Updated dose record
 */
export async function markDoseTaken(
  patientId: string,
  medicineId: string,
  scheduledDate: string,
  scheduledTime: string
): Promise<Dose> {
  const doseId = `${medicineId}#${scheduledDate}#${scheduledTime}`;
  const keys = DynamoDBKeys.dose(patientId, doseId);
  const takenAt = new Date().toISOString();

  // First, try to get the existing dose record
  const existingDose = await dynamoDbClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: keys
    })
  );

  // If dose record doesn't exist, we need to get medicine details from treatment plan
  if (!existingDose.Item) {
    // Get active treatment plans to find medicine details
    const activePlans = await getActiveTreatmentPlans(patientId);
    let medicineDetails: Prescription | null = null;

    for (const plan of activePlans) {
      const prescription = plan.prescriptions.find(p => p.medicineId === medicineId);
      if (prescription) {
        medicineDetails = prescription;
        break;
      }
    }

    if (!medicineDetails) {
      throw new Error('Medicine not found in active treatment plans');
    }

    // Create the dose record first
    const newDose: Omit<Dose, 'createdAt'> = {
      patientId,
      medicineId,
      medicineName: medicineDetails.medicineName,
      dosage: medicineDetails.dosage,
      scheduledTime,
      scheduledDate,
      status: 'taken',
      takenAt
    };

    return await createDose(newDose);
  }

  // Update existing dose record
  const result = await dynamoDbClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: keys,
      UpdateExpression: 'SET #status = :status, takenAt = :takenAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'taken',
        ':takenAt': takenAt
      },
      ReturnValues: 'ALL_NEW'
    })
  );

  if (!result.Attributes) {
    throw new Error('Failed to update dose record');
  }

  const { PK, SK, ...dose } = result.Attributes;
  return dose as Dose;
}

/**
 * Get dose records for a patient on a specific date
 * @param patientId - Patient ID
 * @param date - Date in YYYY-MM-DD format
 * @returns Array of dose records
 */
export async function getDosesForDate(
  patientId: string,
  date: string
): Promise<Dose[]> {
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

  // Filter by date and remove DynamoDB keys
  return result.Items
    .filter(item => item.scheduledDate === date)
    .map(item => {
      const { PK, SK, ...dose } = item;
      return dose as Dose;
    });
}

/**
 * Get all dose records for a medicine
 * @param patientId - Patient ID
 * @param medicineId - Medicine ID
 * @returns Array of dose records
 */
export async function getDosesForMedicine(
  patientId: string,
  medicineId: string
): Promise<Dose[]> {
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

  // Remove DynamoDB keys
  return result.Items.map(item => {
    const { PK, SK, ...dose } = item;
    return dose as Dose;
  });
}

/**
 * Calculate adherence rate for a medicine
 * @param patientId - Patient ID
 * @param medicineId - Medicine ID
 * @returns Adherence percentage (0-100)
 */
export async function calculateAdherence(
  patientId: string,
  medicineId: string
): Promise<number> {
  const doses = await getDosesForMedicine(patientId, medicineId);
  
  if (doses.length === 0) {
    return 0;
  }

  const takenDoses = doses.filter(dose => dose.status === 'taken').length;
  return Math.round((takenDoses / doses.length) * 100);
}

/**
 * Update treatment plan metadata (planName, disease, duration)
 * @param patientId - Patient ID
 * @param treatmentPlanId - Treatment plan ID
 * @param updates - Fields to update
 * @returns Updated treatment plan
 */
export async function updateTreatmentPlanMetadata(
  patientId: string,
  treatmentPlanId: string,
  updates: { planName?: string; disease?: string; duration?: string }
): Promise<TreatmentPlan> {
  const keys = DynamoDBKeys.treatment(patientId, treatmentPlanId);
  const now = new Date().toISOString();

  const updateExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = { ':updatedAt': now };

  if (updates.planName !== undefined) {
    updateExpressions.push('#planName = :planName');
    expressionAttributeNames['#planName'] = 'planName';
    expressionAttributeValues[':planName'] = updates.planName;
  }

  if (updates.disease !== undefined) {
    updateExpressions.push('#disease = :disease');
    expressionAttributeNames['#disease'] = 'disease';
    expressionAttributeValues[':disease'] = updates.disease;
  }

  if (updates.duration !== undefined) {
    updateExpressions.push('#duration = :duration');
    expressionAttributeNames['#duration'] = 'duration';
    expressionAttributeValues[':duration'] = updates.duration;
  }

  updateExpressions.push('updatedAt = :updatedAt');

  const result = await dynamoDbClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: keys,
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    })
  );

  if (!result.Attributes) {
    throw new Error('Failed to update treatment plan');
  }

  const { PK, SK, ...treatmentPlan } = result.Attributes;
  return treatmentPlan as TreatmentPlan;
}

/**
 * Add a medicine to an existing treatment plan
 * @param patientId - Patient ID
 * @param treatmentPlanId - Treatment plan ID
 * @param prescription - Prescription to add
 * @returns Updated treatment plan
 */
export async function addMedicineToPlan(
  patientId: string,
  treatmentPlanId: string,
  prescription: Prescription
): Promise<TreatmentPlan> {
  const keys = DynamoDBKeys.treatment(patientId, treatmentPlanId);
  const now = new Date().toISOString();

  // Get current plan
  const currentPlan = await getTreatmentPlan(patientId, treatmentPlanId);
  if (!currentPlan) {
    throw new Error('Treatment plan not found');
  }

  // Add new prescription
  const updatedPrescriptions = [...currentPlan.prescriptions, prescription];

  const result = await dynamoDbClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: keys,
      UpdateExpression: 'SET prescriptions = :prescriptions, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':prescriptions': updatedPrescriptions,
        ':updatedAt': now
      },
      ReturnValues: 'ALL_NEW'
    })
  );

  if (!result.Attributes) {
    throw new Error('Failed to add medicine to treatment plan');
  }

  const { PK, SK, ...treatmentPlan } = result.Attributes;
  return treatmentPlan as TreatmentPlan;
}

/**
 * Remove a medicine from a treatment plan
 * @param patientId - Patient ID
 * @param treatmentPlanId - Treatment plan ID
 * @param medicineId - Medicine ID to remove
 * @returns Updated treatment plan
 */
export async function removeMedicineFromPlan(
  patientId: string,
  treatmentPlanId: string,
  medicineId: string
): Promise<TreatmentPlan> {
  const keys = DynamoDBKeys.treatment(patientId, treatmentPlanId);
  const now = new Date().toISOString();

  // Get current plan
  const currentPlan = await getTreatmentPlan(patientId, treatmentPlanId);
  if (!currentPlan) {
    throw new Error('Treatment plan not found');
  }

  // Remove prescription
  const updatedPrescriptions = currentPlan.prescriptions.filter(
    p => p.medicineId !== medicineId
  );

  const result = await dynamoDbClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: keys,
      UpdateExpression: 'SET prescriptions = :prescriptions, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':prescriptions': updatedPrescriptions,
        ':updatedAt': now
      },
      ReturnValues: 'ALL_NEW'
    })
  );

  if (!result.Attributes) {
    throw new Error('Failed to remove medicine from treatment plan');
  }

  const { PK, SK, ...treatmentPlan } = result.Attributes;
  return treatmentPlan as TreatmentPlan;
}

/**
 * Update a medicine in a treatment plan
 * @param patientId - Patient ID
 * @param treatmentPlanId - Treatment plan ID
 * @param medicineId - Medicine ID to update
 * @param updates - Fields to update
 * @returns Updated treatment plan
 */
export async function updateMedicineInPlan(
  patientId: string,
  treatmentPlanId: string,
  medicineId: string,
  updates: Partial<Prescription>
): Promise<TreatmentPlan> {
  const keys = DynamoDBKeys.treatment(patientId, treatmentPlanId);
  const now = new Date().toISOString();

  // Get current plan
  const currentPlan = await getTreatmentPlan(patientId, treatmentPlanId);
  if (!currentPlan) {
    throw new Error('Treatment plan not found');
  }

  // Update prescription
  const updatedPrescriptions = currentPlan.prescriptions.map(p => {
    if (p.medicineId === medicineId) {
      return { ...p, ...updates };
    }
    return p;
  });

  const result = await dynamoDbClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: keys,
      UpdateExpression: 'SET prescriptions = :prescriptions, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':prescriptions': updatedPrescriptions,
        ':updatedAt': now
      },
      ReturnValues: 'ALL_NEW'
    })
  );

  if (!result.Attributes) {
    throw new Error('Failed to update medicine in treatment plan');
  }

  const { PK, SK, ...treatmentPlan } = result.Attributes;
  return treatmentPlan as TreatmentPlan;
}

// Patient-specific DynamoDB operations
import { PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDbClient, TABLE_NAME } from './dynamodb-client';
import { 
  Patient, 
  DynamoDBKeys, 
  DoctorPatientRelationship, 
  DoctorPatientsResponse, 
  PatientListItem 
} from './types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a new patient in DynamoDB
 * @param patientData - Patient information (name, age, gender, contact)
 * @returns Created patient with generated ID
 */
export async function createPatient(
  patientData: Omit<Patient, 'patientId' | 'createdAt' | 'updatedAt'>
): Promise<Patient> {
  const patientId = uuidv4();
  const now = new Date().toISOString();

  const patient: Patient = {
    patientId,
    ...patientData,
    createdAt: now,
    updatedAt: now
  };

  const keys = DynamoDBKeys.patient(patientId);

  await dynamoDbClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        ...keys,
        ...patient
      }
    })
  );

  return patient;
}

/**
 * Get a patient by ID from DynamoDB
 * @param patientId - Patient ID
 * @returns Patient data or null if not found
 */
export async function getPatient(patientId: string): Promise<Patient | null> {
  const keys = DynamoDBKeys.patient(patientId);

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
  const { PK, SK, ...patient } = result.Item;
  return patient as Patient;
}

/**
 * Get comprehensive patient summary with red flags for doctor view
 * Includes patient profile, symptoms, reports, and highlighted red flags
 */
export async function getPatientSummaryWithRedFlags(patientId: string): Promise<{
  patient: Patient | null;
  redFlags: string[];
  criticalInformation: {
    source: string;
    information: string;
    detectedAt: string;
  }[];
}> {
  const patient = await getPatient(patientId);
  
  if (!patient) {
    return {
      patient: null,
      redFlags: [],
      criticalInformation: []
    };
  }

  // Import red flag detector
  const { detectRedFlags, scanMultipleSources } = await import('./red-flag-detector');
  
  // Collect text sources to scan
  const textSources: string[] = [];
  const criticalInfo: {
    source: string;
    information: string;
    detectedAt: string;
  }[] = [];

  // Scan patient profile
  const patientText = `${patient.name} ${patient.age} ${patient.gender} ${patient.contact}`;
  const patientFlags = detectRedFlags(patientText);
  if (patientFlags.length > 0) {
    patientFlags.forEach(flag => {
      criticalInfo.push({
        source: 'Patient Profile',
        information: flag,
        detectedAt: patient.createdAt
      });
    });
  }
  textSources.push(patientText);

  // Get and scan symptoms
  const symptomsResult = await dynamoDbClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `PATIENT#${patientId}`,
        ':sk': 'SYMPTOM#'
      }
    })
  );

  if (symptomsResult.Items && symptomsResult.Items.length > 0) {
    for (const symptom of symptomsResult.Items) {
      const symptomText = symptom.rawText || '';
      const symptomFlags = detectRedFlags(symptomText);
      if (symptomFlags.length > 0) {
        symptomFlags.forEach(flag => {
          criticalInfo.push({
            source: 'Symptom Report',
            information: flag,
            detectedAt: symptom.createdAt
          });
        });
      }
      textSources.push(symptomText);
    }
  }

  // Get and scan reports
  const reportsResult = await dynamoDbClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `PATIENT#${patientId}`,
        ':sk': 'REPORT#'
      }
    })
  );

  if (reportsResult.Items && reportsResult.Items.length > 0) {
    for (const report of reportsResult.Items) {
      // Add red flags from report summary
      if (report.summary && report.summary.redFlags) {
        report.summary.redFlags.forEach((flag: string) => {
          criticalInfo.push({
            source: 'Medical Report',
            information: flag,
            detectedAt: report.uploadedAt
          });
        });
      }
      
      // Also scan extracted text
      if (report.extractedText) {
        textSources.push(report.extractedText);
      }
    }
  }

  // Get all unique red flags
  const allRedFlags = scanMultipleSources(textSources);

  // Sort critical information by date (most recent first)
  criticalInfo.sort((a, b) => 
    new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()
  );

  return {
    patient,
    redFlags: allRedFlags,
    criticalInformation: criticalInfo
  };
}

// ============================================
// Doctor-Patient Relationship Functions
// ============================================

/**
 * Add a patient to a doctor's patient list
 * Creates a doctor-patient relationship record
 * @param doctorId - Doctor's user ID
 * @param patientId - Patient's ID
 * @param addedVia - How the patient was added ('qr_scan' | 'manual_code')
 * @param accessGrantedBy - QR token ID or unique code used for access
 * @returns Created doctor-patient relationship
 */
export async function addPatientToDoctor(
  doctorId: string,
  patientId: string,
  addedVia: 'qr_scan' | 'manual_code',
  accessGrantedBy: string,
  trackedSymptomId?: string | null
): Promise<DoctorPatientRelationship> {
  // Get patient details to populate the relationship
  const patient = await getPatient(patientId);
  
  if (!patient) {
    throw new Error(`Patient with ID ${patientId} not found`);
  }

  const now = new Date().toISOString();
  const keys = DynamoDBKeys.doctorPatient(doctorId, patientId);

  const relationship: DoctorPatientRelationship = {
    doctorId,
    patientId,
    uhid: patientId, // Using patientId as UHID for now
    patientName: patient.name,
    addedAt: now,
    addedVia,
    lastConsultation: now,
    treatmentStatus: 'ongoing',
    accessGrantedBy,
    ...(trackedSymptomId && { trackedSymptomId })
  };

  await dynamoDbClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        ...keys,
        ...relationship
      }
    })
  );

  return relationship;
}

/**
 * Get all patients for a doctor with optional filtering and pagination
 * @param doctorId - Doctor's user ID
 * @param options - Optional filtering and pagination options
 * @returns Paginated list of patients with metadata
 */
export async function getDoctorPatients(
  doctorId: string,
  options?: {
    statusFilter?: ('ongoing' | 'past')[];
    page?: number;
    limit?: number;
  }
): Promise<DoctorPatientsResponse> {
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const statusFilter = options?.statusFilter;

  // Query all patients for this doctor
  const result = await dynamoDbClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `DOCTOR#${doctorId}`,
        ':sk': 'PATIENT#'
      }
    })
  );

  if (!result.Items || result.Items.length === 0) {
    return {
      patients: [],
      totalCount: 0,
      page,
      totalPages: 0,
      hasMore: false
    };
  }

  // Convert to DoctorPatientRelationship objects
  let relationships = result.Items.map(item => {
    const { PK, SK, ...relationship } = item;
    return relationship as DoctorPatientRelationship;
  });

  // Apply status filter if provided
  if (statusFilter && statusFilter.length > 0) {
    relationships = relationships.filter(rel => 
      statusFilter.includes(rel.treatmentStatus)
    );
  }

  // Sort by last consultation date (most recent first)
  relationships.sort((a, b) => 
    new Date(b.lastConsultation).getTime() - new Date(a.lastConsultation).getTime()
  );

  // Calculate pagination
  const totalCount = relationships.length;
  const totalPages = Math.ceil(totalCount / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedRelationships = relationships.slice(startIndex, endIndex);

  // Convert to PatientListItem format and fetch tracked disease names
  const patients: PatientListItem[] = await Promise.all(
    paginatedRelationships.map(async (rel) => {
      const patientItem: PatientListItem = {
        patientId: rel.patientId,
        uhid: rel.uhid,
        name: rel.patientName,
        lastConsultation: rel.lastConsultation,
        treatmentStatus: rel.treatmentStatus,
        unreadMessages: 0
      };

      // If there's a tracked symptom, fetch its disease name
      if (rel.trackedSymptomId) {
        try {
          const symptomResult = await dynamoDbClient.send(
            new GetCommand({
              TableName: TABLE_NAME,
              Key: {
                PK: `PATIENT#${rel.patientId}`,
                SK: `SYMPTOM#${rel.trackedSymptomId}`
              }
            })
          );

          if (symptomResult.Item && symptomResult.Item.diseaseAnalysis) {
            const topDisease = symptomResult.Item.diseaseAnalysis[0];
            if (topDisease) {
              patientItem.trackedSymptomId = rel.trackedSymptomId;
              patientItem.trackedDiseaseName = topDisease.diseaseName;
            }
          }
        } catch (error) {
          console.error(`Failed to fetch tracked symptom ${rel.trackedSymptomId}:`, error);
          // Continue without tracked disease info
        }
      }

      return patientItem;
    })
  );

  return {
    patients,
    totalCount,
    page,
    totalPages,
    hasMore: page < totalPages
  };
}

/**
 * Update the last consultation timestamp for a doctor-patient relationship
 * @param doctorId - Doctor's user ID
 * @param patientId - Patient's ID
 * @param timestamp - ISO timestamp of the consultation (defaults to now)
 */
export async function updateLastConsultation(
  doctorId: string,
  patientId: string,
  timestamp?: string
): Promise<void> {
  const consultationTime = timestamp || new Date().toISOString();
  const keys = DynamoDBKeys.doctorPatient(doctorId, patientId);

  await dynamoDbClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: keys,
      UpdateExpression: 'SET lastConsultation = :timestamp',
      ExpressionAttributeValues: {
        ':timestamp': consultationTime
      }
    })
  );
}

/**
 * Update patient information
 * @param patientId - Patient ID
 * @param updates - Fields to update
 * @returns Updated patient
 */
export async function updatePatient(
  patientId: string,
  updates: Partial<Omit<Patient, 'patientId' | 'createdAt'>>
): Promise<Patient> {
  const keys = DynamoDBKeys.patient(patientId);
  const now = new Date().toISOString();

  // Build update expression dynamically
  const updateExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = {};

  // Always update updatedAt
  updateExpressions.push('#updatedAt = :updatedAt');
  expressionAttributeNames['#updatedAt'] = 'updatedAt';
  expressionAttributeValues[':updatedAt'] = now;

  // Add other fields
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined && key !== 'patientId' && key !== 'createdAt') {
      updateExpressions.push(`#${key} = :${key}`);
      expressionAttributeNames[`#${key}`] = key;
      expressionAttributeValues[`:${key}`] = value;
    }
  });

  const result = await dynamoDbClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: keys,
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    })
  );

  if (!result.Attributes) {
    throw new Error('Failed to update patient');
  }

  const { PK, SK, ...patient } = result.Attributes;
  return patient as Patient;
}

/**
 * Remove a patient from a doctor's patient list
 * Deletes the doctor-patient relationship record
 * @param doctorId - Doctor's user ID
 * @param patientId - Patient's ID
 */
export async function removePatientFromDoctor(
  doctorId: string,
  patientId: string
): Promise<void> {
  const keys = DynamoDBKeys.doctorPatient(doctorId, patientId);

  await dynamoDbClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: keys
    })
  );
}

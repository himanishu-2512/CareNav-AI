// Symptom-specific DynamoDB operations
import { PutCommand, GetCommand, UpdateCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDbClient, TABLE_NAME } from './dynamodb-client';
import { Symptom, StructuredSymptoms, FollowUpAnswer, DynamoDBKeys, DiseaseCandidate } from './types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a new symptom record in DynamoDB
 * @param patientId - Patient ID
 * @param rawText - Raw symptom text from patient
 * @param structuredSymptoms - Structured symptom data extracted by AI
 * @param inputMethod - Input method (text or voice)
 * @param diseaseAnalysis - Optional disease analysis (hidden from patient)
 * @param confidenceScore - Optional confidence score for disease analysis
 * @returns Created symptom with generated ID
 */
export async function createSymptom(
  patientId: string,
  rawText: string,
  structuredSymptoms: StructuredSymptoms,
  inputMethod: 'text' | 'voice',
  diseaseAnalysis?: DiseaseCandidate[],
  confidenceScore?: number
): Promise<Symptom> {
  const symptomId = uuidv4();
  const now = new Date().toISOString();

  const symptom: Symptom = {
    symptomId,
    patientId,
    rawText,
    structuredSymptoms,
    inputMethod,
    createdAt: now,
    // Store disease analysis if provided (hidden from patient)
    ...(diseaseAnalysis && { diseaseAnalysis }),
    ...(confidenceScore !== undefined && { confidenceScore })
  };

  const keys = DynamoDBKeys.symptom(patientId, symptomId);

  await dynamoDbClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        ...keys,
        ...symptom
      }
    })
  );

  return symptom;
}

/**
 * Get a symptom by ID from DynamoDB
 * @param patientId - Patient ID
 * @param symptomId - Symptom ID
 * @returns Symptom data or null if not found
 */
export async function getSymptom(
  patientId: string,
  symptomId: string
): Promise<Symptom | null> {
  const keys = DynamoDBKeys.symptom(patientId, symptomId);

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
  const { PK, SK, ...symptom } = result.Item;
  return symptom as Symptom;
}

/**
 * Update symptom with follow-up answers
 * @param patientId - Patient ID
 * @param symptomId - Symptom ID
 * @param followUpAnswers - Array of follow-up answers
 * @returns Updated symptom
 */
export async function updateSymptomWithAnswers(
  patientId: string,
  symptomId: string,
  followUpAnswers: FollowUpAnswer[]
): Promise<Symptom> {
  const keys = DynamoDBKeys.symptom(patientId, symptomId);

  // First, get the existing symptom to retrieve current answers
  const existingSymptom = await getSymptom(patientId, symptomId);
  if (!existingSymptom) {
    throw new Error('Symptom not found');
  }

  // Append new answers to existing answers
  const allAnswers = [...(existingSymptom.followUpAnswers || []), ...followUpAnswers];

  const result = await dynamoDbClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: keys,
      UpdateExpression: 'SET followUpAnswers = :answers',
      ExpressionAttributeValues: {
        ':answers': allAnswers
      },
      ReturnValues: 'ALL_NEW'
    })
  );

  if (!result.Attributes) {
    throw new Error('Failed to update symptom');
  }

  const { PK, SK, ...symptom } = result.Attributes;
  return symptom as Symptom;
}

/**
 * Get all symptoms for a patient
 * @param patientId - Patient ID
 * @returns Array of symptoms
 */
export async function getPatientSymptoms(
  patientId: string
): Promise<Symptom[]> {
  const result = await dynamoDbClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `PATIENT#${patientId}`,
        ':sk': 'SYMPTOM#'
      },
      ScanIndexForward: false // Sort by most recent first
    })
  );

  if (!result.Items || result.Items.length === 0) {
    return [];
  }

  // Remove DynamoDB keys from response
  return result.Items.map(item => {
    const { PK, SK, ...symptom } = item;
    return symptom as Symptom;
  });
}

/**
 * Delete a symptom by ID from DynamoDB
 * @param patientId - Patient ID
 * @param symptomId - Symptom ID
 * @returns True if deleted successfully
 */
export async function deleteSymptom(
  patientId: string,
  symptomId: string
): Promise<boolean> {
  const keys = DynamoDBKeys.symptom(patientId, symptomId);

  await dynamoDbClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: keys
    })
  );

  return true;
}

/**
 * Update symptom text and re-analyze
 * @param patientId - Patient ID
 * @param symptomId - Symptom ID
 * @param rawText - Updated raw text
 * @param structuredSymptoms - Updated structured symptoms
 * @param diseaseAnalysis - Updated disease analysis
 * @param confidenceScore - Updated confidence score
 * @returns Updated symptom
 */
export async function updateSymptomText(
  patientId: string,
  symptomId: string,
  rawText: string,
  structuredSymptoms: StructuredSymptoms,
  diseaseAnalysis?: DiseaseCandidate[],
  confidenceScore?: number
): Promise<Symptom> {
  const keys = DynamoDBKeys.symptom(patientId, symptomId);

  const updateExpression = 'SET rawText = :rawText, structuredSymptoms = :structuredSymptoms, diseaseAnalysis = :diseaseAnalysis, confidenceScore = :confidenceScore';
  const expressionAttributeValues: any = {
    ':rawText': rawText,
    ':structuredSymptoms': structuredSymptoms,
    ':diseaseAnalysis': diseaseAnalysis || [],
    ':confidenceScore': confidenceScore || 0
  };

  const result = await dynamoDbClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: keys,
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    })
  );

  if (!result.Attributes) {
    throw new Error('Failed to update symptom');
  }

  const { PK, SK, ...symptom } = result.Attributes;
  return symptom as Symptom;
}

/**
 * Update symptom with AI-generated summaries
 * @param patientId Patient ID
 * @param symptomId Symptom ID
 * @param aiSummary Comprehensive AI summary
 * @param briefSummary Brief one-line summary
 * @returns Updated symptom
 */
export async function updateSymptomSummaries(
  patientId: string,
  symptomId: string,
  aiSummary: string,
  briefSummary: string
): Promise<Symptom> {
  const keys = DynamoDBKeys.symptom(patientId, symptomId);

  const result = await dynamoDbClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: keys,
      UpdateExpression: 'SET aiSummary = :aiSummary, briefSummary = :briefSummary',
      ExpressionAttributeValues: {
        ':aiSummary': aiSummary,
        ':briefSummary': briefSummary
      },
      ReturnValues: 'ALL_NEW'
    })
  );

  if (!result.Attributes) {
    throw new Error('Failed to update symptom summaries');
  }

  const { PK, SK, ...symptom } = result.Attributes;
  return symptom as Symptom;
}

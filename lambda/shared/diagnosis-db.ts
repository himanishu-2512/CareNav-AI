// DynamoDB helper functions for diagnosis session operations

import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDbClient } from './dynamodb-client';
import { DiagnosisSession, DynamoDBKeys } from './types';

const docClient = DynamoDBDocumentClient.from(dynamoDbClient);
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'carenav-patients';

/**
 * Create a new diagnosis session in DynamoDB
 */
export async function createDiagnosisSession(session: DiagnosisSession): Promise<void> {
  const keys = DynamoDBKeys.diagnosisSession(session.patientId, session.sessionId);
  
  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      ...keys,
      ...session,
      GSI1PK: 'DIAGNOSIS_SESSION',
      GSI1SK: session.createdAt
    }
  });

  await docClient.send(command);
}

/**
 * Get a diagnosis session by sessionId and patientId
 */
export async function getDiagnosisSession(
  patientId: string,
  sessionId: string
): Promise<DiagnosisSession | null> {
  const keys = DynamoDBKeys.diagnosisSession(patientId, sessionId);
  
  const command = new GetCommand({
    TableName: TABLE_NAME,
    Key: keys
  });

  const result = await docClient.send(command);
  
  if (!result.Item) {
    return null;
  }

  return result.Item as DiagnosisSession;
}

/**
 * Update an existing diagnosis session
 */
export async function updateDiagnosisSession(session: DiagnosisSession): Promise<void> {
  const keys = DynamoDBKeys.diagnosisSession(session.patientId, session.sessionId);
  
  const command = new UpdateCommand({
    TableName: TABLE_NAME,
    Key: keys,
    UpdateExpression: `
      SET currentRound = :currentRound,
          possibleDiseases = :possibleDiseases,
          questionHistory = :questionHistory,
          confidenceScore = :confidenceScore,
          #status = :status,
          updatedAt = :updatedAt
    `,
    ExpressionAttributeNames: {
      '#status': 'status'
    },
    ExpressionAttributeValues: {
      ':currentRound': session.currentRound,
      ':possibleDiseases': session.possibleDiseases,
      ':questionHistory': session.questionHistory,
      ':confidenceScore': session.confidenceScore,
      ':status': session.status,
      ':updatedAt': session.updatedAt
    }
  });

  await docClient.send(command);
}

/**
 * Get all diagnosis sessions for a patient
 */
export async function getPatientDiagnosisSessions(
  patientId: string
): Promise<DiagnosisSession[]> {
  const command = new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
    ExpressionAttributeValues: {
      ':pk': `PATIENT#${patientId}`,
      ':skPrefix': 'DIAGNOSIS_SESSION#'
    }
  });

  const result = await docClient.send(command);
  
  if (!result.Items || result.Items.length === 0) {
    return [];
  }

  return result.Items as DiagnosisSession[];
}

/**
 * Get active diagnosis sessions for a patient
 */
export async function getActiveDiagnosisSessions(
  patientId: string
): Promise<DiagnosisSession[]> {
  const allSessions = await getPatientDiagnosisSessions(patientId);
  return allSessions.filter(session => session.status === 'active');
}

/**
 * Mark a diagnosis session as completed
 */
export async function completeDiagnosisSession(
  patientId: string,
  sessionId: string
): Promise<void> {
  const keys = DynamoDBKeys.diagnosisSession(patientId, sessionId);
  
  const command = new UpdateCommand({
    TableName: TABLE_NAME,
    Key: keys,
    UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
    ExpressionAttributeNames: {
      '#status': 'status'
    },
    ExpressionAttributeValues: {
      ':status': 'completed',
      ':updatedAt': new Date().toISOString()
    }
  });

  await docClient.send(command);
}

/**
 * Update patient history summary with diagnosis session count
 */
export async function updatePatientHistorySummary(
  patientId: string,
  updates: {
    totalDiagnosisSessions?: number;
    lastDiagnosisDate?: string;
    lastQRGenerated?: string;
    lastQRScanned?: string;
  }
): Promise<void> {
  const keys = DynamoDBKeys.patientHistory(patientId);
  
  // Build update expression dynamically
  const updateExpressions: string[] = [];
  const expressionAttributeValues: Record<string, any> = {
    ':updatedAt': new Date().toISOString()
  };

  if (updates.totalDiagnosisSessions !== undefined) {
    updateExpressions.push('totalDiagnosisSessions = :totalDiagnosisSessions');
    expressionAttributeValues[':totalDiagnosisSessions'] = updates.totalDiagnosisSessions;
  }

  if (updates.lastDiagnosisDate) {
    updateExpressions.push('lastDiagnosisDate = :lastDiagnosisDate');
    expressionAttributeValues[':lastDiagnosisDate'] = updates.lastDiagnosisDate;
  }

  if (updates.lastQRGenerated) {
    updateExpressions.push('lastQRGenerated = :lastQRGenerated');
    expressionAttributeValues[':lastQRGenerated'] = updates.lastQRGenerated;
  }

  if (updates.lastQRScanned) {
    updateExpressions.push('lastQRScanned = :lastQRScanned');
    expressionAttributeValues[':lastQRScanned'] = updates.lastQRScanned;
  }

  updateExpressions.push('updatedAt = :updatedAt');

  const command = new UpdateCommand({
    TableName: TABLE_NAME,
    Key: keys,
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeValues: expressionAttributeValues
  });

  await docClient.send(command);
}

/**
 * Get patient history summary
 */
export async function getPatientHistorySummary(
  patientId: string
): Promise<any | null> {
  const keys = DynamoDBKeys.patientHistory(patientId);
  
  const command = new GetCommand({
    TableName: TABLE_NAME,
    Key: keys
  });

  const result = await docClient.send(command);
  
  return result.Item || null;
}

/**
 * Mark expired diagnosis sessions (inactive for more than 7 days)
 */
export async function markExpiredSessions(patientId: string): Promise<void> {
  const sessions = await getActiveDiagnosisSessions(patientId);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  for (const session of sessions) {
    if (session.updatedAt < sevenDaysAgo) {
      const keys = DynamoDBKeys.diagnosisSession(patientId, session.sessionId);
      
      const command = new UpdateCommand({
        TableName: TABLE_NAME,
        Key: keys,
        UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': 'expired',
          ':updatedAt': new Date().toISOString()
        }
      });

      await docClient.send(command);
    }
  }
}

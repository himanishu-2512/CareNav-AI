// Access audit logging module for doctor-patient access tracking
import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDbClient, TABLE_NAME } from './dynamodb-client';
import { v4 as uuidv4 } from 'uuid';

/**
 * Audit log entry for tracking doctor access to patient data
 */
export interface AuditLog {
  auditId: string;
  doctorId: string;
  patientId: string;
  accessType: 'qr_scan' | 'manual_code' | 'view_profile' | 'view_episode';
  accessMethod: string; // QR token or code
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  TTL: number; // Unix timestamp for automatic cleanup (30 days)
}

/**
 * Log an access event when a doctor accesses patient data
 * Creates an audit log entry with TTL for automatic cleanup after 30 days
 * 
 * @param doctorId - Doctor's user ID
 * @param patientId - Patient's ID
 * @param accessType - Type of access event
 * @param accessMethod - QR token ID or unique code used for access
 * @param ipAddress - Optional IP address of the request
 * @param userAgent - Optional user agent string
 * @returns Created audit log entry
 */
export async function logAccess(
  doctorId: string,
  patientId: string,
  accessType: 'qr_scan' | 'manual_code' | 'view_profile' | 'view_episode',
  accessMethod: string,
  ipAddress?: string,
  userAgent?: string
): Promise<AuditLog> {
  const auditId = uuidv4();
  const timestamp = new Date().toISOString();
  
  // Calculate TTL: 30 days from now in Unix timestamp (seconds)
  const ttlDate = new Date();
  ttlDate.setDate(ttlDate.getDate() + 30);
  const TTL = Math.floor(ttlDate.getTime() / 1000);

  const auditLog: AuditLog = {
    auditId,
    doctorId,
    patientId,
    accessType,
    accessMethod,
    ipAddress,
    userAgent,
    timestamp,
    TTL
  };

  // DynamoDB keys: PK: AUDIT#{doctorId}, SK: ACCESS#{timestamp}#{patientId}
  await dynamoDbClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `AUDIT#${doctorId}`,
        SK: `ACCESS#${timestamp}#${patientId}`,
        ...auditLog
      }
    })
  );

  return auditLog;
}

/**
 * Get audit logs for a doctor with optional date filtering
 * Returns logs sorted by timestamp (most recent first)
 * 
 * @param doctorId - Doctor's user ID
 * @param startDate - Optional start date for filtering (ISO string)
 * @param endDate - Optional end date for filtering (ISO string)
 * @returns Array of audit log entries
 */
export async function getAuditLogs(
  doctorId: string,
  startDate?: string,
  endDate?: string
): Promise<AuditLog[]> {
  // Build query parameters
  let keyConditionExpression = 'PK = :pk AND begins_with(SK, :sk)';
  const expressionAttributeValues: Record<string, any> = {
    ':pk': `AUDIT#${doctorId}`,
    ':sk': 'ACCESS#'
  };

  // If date range is specified, add range condition
  if (startDate && endDate) {
    keyConditionExpression = 'PK = :pk AND SK BETWEEN :startSk AND :endSk';
    expressionAttributeValues[':startSk'] = `ACCESS#${startDate}`;
    expressionAttributeValues[':endSk'] = `ACCESS#${endDate}#ZZZZZZZZ`; // High value to include all patients
  } else if (startDate) {
    keyConditionExpression = 'PK = :pk AND SK >= :startSk';
    expressionAttributeValues[':startSk'] = `ACCESS#${startDate}`;
  } else if (endDate) {
    keyConditionExpression = 'PK = :pk AND SK <= :endSk';
    expressionAttributeValues[':endSk'] = `ACCESS#${endDate}#ZZZZZZZZ`;
  }

  const result = await dynamoDbClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ScanIndexForward: false // Sort descending (most recent first)
    })
  );

  if (!result.Items || result.Items.length === 0) {
    return [];
  }

  // Convert to AuditLog objects and remove DynamoDB keys
  const auditLogs = result.Items.map(item => {
    const { PK, SK, ...log } = item;
    return log as AuditLog;
  });

  return auditLogs;
}

/**
 * Get audit logs for a specific patient accessed by a doctor
 * 
 * @param doctorId - Doctor's user ID
 * @param patientId - Patient's ID
 * @returns Array of audit log entries for this patient
 */
export async function getPatientAccessLogs(
  doctorId: string,
  patientId: string
): Promise<AuditLog[]> {
  const result = await dynamoDbClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `AUDIT#${doctorId}`,
        ':sk': 'ACCESS#'
      },
      ScanIndexForward: false // Sort descending (most recent first)
    })
  );

  if (!result.Items || result.Items.length === 0) {
    return [];
  }

  // Filter for specific patient and convert to AuditLog objects
  const auditLogs = result.Items
    .filter(item => item.patientId === patientId)
    .map(item => {
      const { PK, SK, ...log } = item;
      return log as AuditLog;
    });

  return auditLogs;
}

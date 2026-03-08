// DynamoDB helper functions for QR token operations

import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDbClient } from './dynamodb-client';
import { QRCodeToken, DynamoDBKeys } from './types';

const docClient = DynamoDBDocumentClient.from(dynamoDbClient);
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'carenav-patients';

/**
 * Create a new QR token in DynamoDB
 * Since QR codes are now permanent (based on patientId), no TTL is set
 */
export async function createQRToken(token: QRCodeToken): Promise<void> {
  const keys = DynamoDBKeys.qrToken(token.tokenId);
  
  // No TTL - QR codes are permanent for each patient
  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      ...keys,
      ...token
    }
  });

  await docClient.send(command);
}

/**
 * Get a QR token by tokenId
 */
export async function getQRToken(tokenId: string): Promise<QRCodeToken | null> {
  const keys = DynamoDBKeys.qrToken(tokenId);
  
  const command = new GetCommand({
    TableName: TABLE_NAME,
    Key: keys
  });

  const result = await docClient.send(command);
  
  if (!result.Item) {
    return null;
  }

  return result.Item as QRCodeToken;
}

/**
 * Update QR token with scan information
 */
export async function updateQRTokenScanInfo(
  tokenId: string,
  doctorId: string,
  scannedAt: string
): Promise<void> {
  const keys = DynamoDBKeys.qrToken(tokenId);
  
  const command = new UpdateCommand({
    TableName: TABLE_NAME,
    Key: keys,
    UpdateExpression: 'SET scannedBy = :scannedBy, scannedAt = :scannedAt',
    ExpressionAttributeValues: {
      ':scannedBy': doctorId,
      ':scannedAt': scannedAt
    }
  });

  await docClient.send(command);
}

/**
 * Check if a QR token is expired
 * Since QR codes are now permanent, this always returns false
 */
export function isQRTokenExpired(token: QRCodeToken): boolean {
  // QR codes are permanent - never expire
  return false;
}

/**
 * Validate QR token (check existence and expiration)
 * Since QR codes are permanent, only checks existence
 */
export async function validateQRToken(tokenId: string): Promise<{
  valid: boolean;
  token?: QRCodeToken;
  error?: string;
}> {
  const token = await getQRToken(tokenId);
  
  if (!token) {
    return {
      valid: false,
      error: 'Invalid QR code'
    };
  }

  // QR codes are permanent - no expiration check needed
  return {
    valid: true,
    token
  };
}

/**
 * Delete a QR token (manual cleanup)
 */
export async function deleteQRToken(tokenId: string): Promise<void> {
  const keys = DynamoDBKeys.qrToken(tokenId);
  
  const command = new DeleteCommand({
    TableName: TABLE_NAME,
    Key: keys
  });

  await docClient.send(command);
}

/**
 * Get the most recent QR token for a patient
 */
export async function getLatestQRTokenForPatient(patientId: string): Promise<QRCodeToken | null> {
  // Note: This requires scanning or using a GSI. For now, we'll return null
  // In production, you might want to add a GSI on patientId for efficient queries
  // or store the latest token reference in the patient profile
  
  // This is a placeholder - in production, implement with GSI or store reference in patient profile
  return null;
}

/**
 * Check if a doctor has scanned a patient's QR code (authorization check)
 */
export async function hasDoctorScannedPatientQR(
  patientId: string,
  doctorId: string
): Promise<boolean> {
  // This would require a GSI or scanning to find all tokens for a patient
  // For now, this is a placeholder that returns true
  // In production, implement proper authorization tracking
  
  // Placeholder implementation - always returns true for now
  // In production, query tokens by patientId (requires GSI) and check if any were scanned by doctorId
  return true;
}

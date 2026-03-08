// QR code generation utility for patient authentication
// Implements QR token generation with unique codes for doctor-patient access

import { v4 as uuidv4 } from 'uuid';
import { createQRToken } from './qr-db';
import { QRCodeToken } from './types';

/**
 * Generate a unique 8-character alphanumeric code
 * Excludes ambiguous characters (0, O, 1, I, l) for readability
 * 
 * Validates: Requirements 5.2
 */
export function generateUniqueCode(): string {
  // Use only unambiguous alphanumeric characters
  // Excludes: 0 (zero), O (capital o), 1 (one), I (capital i), l (lowercase L)
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  
  for (let i = 0; i < 8; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    code += chars[randomIndex];
  }
  
  return code;
}

/**
 * Format QR data string for QR code encoding
 * Format: CARENAV:TOKEN:{tokenId}
 * 
 * Validates: Requirements 4.4
 */
export function formatQRData(tokenId: string): string {
  return `CARENAV:TOKEN:${tokenId}`;
}

/**
 * Generate a QR token for a patient
 * Uses the patient's permanent patientId as the stable unique identifier
 * This ensures each patient always has the same QR code
 * 
 * Validates: Requirements 4.4, 5.2
 */
export async function generateQRToken(patientId: string): Promise<{
  tokenId: string;
  qrData: string;
  uniqueCode: string;
  expiresAt: string;
}> {
  // Use patientId as the stable tokenId - this ensures same patient = same QR code
  const tokenId = patientId;
  
  // Use the full patientId as the unique code for manual entry
  // This ensures doctors can enter the full patient ID to add them
  const uniqueCode = patientId;
  
  const qrData = formatQRData(tokenId);
  
  // No expiration - QR codes are permanent for each patient
  const now = new Date();
  const expiresAt = new Date('2099-12-31T23:59:59Z'); // Far future date (never expires)
  
  // Create token object
  const token: QRCodeToken = {
    tokenId,
    patientId,
    qrData,
    expiresAt: expiresAt.toISOString(),
    createdAt: now.toISOString()
  };
  
  // Save to database (will overwrite if already exists)
  await createQRToken(token);
  
  return {
    tokenId,
    qrData,
    uniqueCode,
    expiresAt: expiresAt.toISOString()
  };
}

/**
 * Parse QR data string to extract token ID
 * Expected format: CARENAV:TOKEN:{tokenId}
 * Returns null if format is invalid
 */
export function parseQRData(qrData: string): string | null {
  const prefix = 'CARENAV:TOKEN:';
  
  if (!qrData.startsWith(prefix)) {
    return null;
  }
  
  const tokenId = qrData.substring(prefix.length);
  
  // Basic UUID validation (36 characters with hyphens)
  if (tokenId.length !== 36 || !tokenId.includes('-')) {
    return null;
  }
  
  return tokenId;
}

/**
 * Validate unique code format
 * Must be a valid UUID (36 characters with hyphens) since uniqueCode = patientId
 * 
 * Validates: Requirements 5.2
 */
export function validateUniqueCodeFormat(code: string): {
  valid: boolean;
  error?: string;
} {
  if (!code) {
    return {
      valid: false,
      error: 'Unique code is required'
    };
  }
  
  // Check if it's a valid UUID format (36 characters with hyphens)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(code)) {
    return {
      valid: false,
      error: 'Invalid unique code format. Please enter the full patient ID.'
    };
  }
  
  return { valid: true };
}

// QR Authentication Lambda Handler
// Validates QR codes and manual unique codes for doctor-patient access

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { validateQRToken, updateQRTokenScanInfo } from '../shared/qr-db';
import { addPatientToDoctor } from '../shared/patient-db';
import { logAccess } from '../shared/audit-log';
import { getPatient } from '../shared/patient-db';
import { generateQRToken } from '../shared/qr-generator';
import QRCode from 'qrcode';

/**
 * QR validation request interface
 */
interface QRValidateRequest {
  qrData: string;
  doctorId: string;
}

/**
 * QR validation response interface
 */
interface QRValidateResponse {
  valid: boolean;
  patientId?: string;
  uhid?: string;
  error?: string;
}

/**
 * Unique code validation request interface
 */
interface UniqueCodeValidateRequest {
  uniqueCode: string;
  doctorId: string;
}

/**
 * Handle QR code generation
 * POST /api/qr/generate
 */
async function handleQRGeneration(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  // Parse request body
  if (!event.body) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: {
          code: 'MISSING_BODY',
          message: 'Request body is required'
        }
      })
    };
  }

  const request = JSON.parse(event.body);

  // Validate required fields
  if (!request.patientId) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: {
          code: 'MISSING_FIELDS',
          message: 'patientId is required'
        }
      })
    };
  }

  try {
    // Generate QR token
    const token = await generateQRToken(request.patientId);
    
    // Generate QR code image as data URL
    const qrCodeImage = await QRCode.toDataURL(token.qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        tokenId: token.tokenId,
        qrCodeImage,
        uniqueCode: token.uniqueCode,
        expiresAt: token.expiresAt
      })
    };
  } catch (error) {
    console.error('Error generating QR code:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: {
          code: 'GENERATION_FAILED',
          message: 'Failed to generate QR code',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      })
    };
  }
}

/**
 * Main Lambda handler
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('QR Auth Lambda invoked:', JSON.stringify(event, null, 2));

  const path = event.path;
  const method = event.httpMethod;

  try {
    // Route to appropriate handler
    if (path === '/api/qr/generate' && method === 'POST') {
      return await handleQRGeneration(event);
    } else if (path === '/api/qr/validate' && method === 'POST') {
      return await handleQRValidation(event);
    } else if (path === '/api/qr/validate-code' && method === 'POST') {
      return await handleUniqueCodeValidation(event);
    } else {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: {
            code: 'NOT_FOUND',
            message: 'Endpoint not found'
          }
        })
      };
    }
  } catch (error) {
    console.error('Error in QR auth handler:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An internal error occurred',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      })
    };
  }
}

/**
 * Handle QR code validation
 * POST /api/qr/validate
 */
async function handleQRValidation(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  // Parse request body
  if (!event.body) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: {
          code: 'MISSING_BODY',
          message: 'Request body is required'
        }
      })
    };
  }

  const request: QRValidateRequest = JSON.parse(event.body);

  // Validate required fields
  if (!request.qrData || !request.doctorId) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: {
          code: 'MISSING_FIELDS',
          message: 'qrData and doctorId are required',
          details: {
            qrData: !request.qrData ? 'Required field' : undefined,
            doctorId: !request.doctorId ? 'Required field' : undefined
          }
        }
      })
    };
  }

  // Extract token ID from QR data
  // QR data format: "CARENAV:TOKEN:{tokenId}"
  const tokenId = extractTokenIdFromQRData(request.qrData);
  
  if (!tokenId) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        valid: false,
        error: 'Invalid QR code format'
      } as QRValidateResponse)
    };
  }

  // Validate QR token
  const validation = await validateQRToken(tokenId);

  if (!validation.valid || !validation.token) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        valid: false,
        error: validation.error || 'Invalid QR code'
      } as QRValidateResponse)
    };
  }

  const token = validation.token;
  const patientId = token.patientId;

  // Get patient details
  const patient = await getPatient(patientId);
  
  if (!patient) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        valid: false,
        error: 'Patient not found'
      } as QRValidateResponse)
    };
  }

  // Add patient to doctor's roster
  try {
    await addPatientToDoctor(
      request.doctorId,
      patientId,
      'qr_scan',
      tokenId
    );
  } catch (error) {
    console.error('Error adding patient to doctor:', error);
    // Continue even if patient already exists in roster
  }

  // Update QR token with scan information
  const scannedAt = new Date().toISOString();
  await updateQRTokenScanInfo(tokenId, request.doctorId, scannedAt);

  // Log access for audit trail
  const ipAddress = event.requestContext?.identity?.sourceIp;
  const userAgent = event.headers?.['User-Agent'] || event.headers?.['user-agent'];
  
  await logAccess(
    request.doctorId,
    patientId,
    'qr_scan',
    tokenId,
    ipAddress,
    userAgent
  );

  // Return success response
  const response: QRValidateResponse = {
    valid: true,
    patientId: patientId,
    uhid: patientId // Using patientId as UHID for now
  };

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(response)
  };
}

/**
 * Handle manual unique code validation
 * POST /api/qr/validate-code
 */
async function handleUniqueCodeValidation(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  // Parse request body
  if (!event.body) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: {
          code: 'MISSING_BODY',
          message: 'Request body is required'
        }
      })
    };
  }

  const request: UniqueCodeValidateRequest = JSON.parse(event.body);

  // Validate required fields
  if (!request.uniqueCode || !request.doctorId) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: {
          code: 'MISSING_FIELDS',
          message: 'uniqueCode and doctorId are required',
          details: {
            uniqueCode: !request.uniqueCode ? 'Required field' : undefined,
            doctorId: !request.doctorId ? 'Required field' : undefined
          }
        }
      })
    };
  }

  // Validate unique code format (alphanumeric only)
  if (!isValidUniqueCode(request.uniqueCode)) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        valid: false,
        error: 'Invalid unique code format. Code must contain only alphanumeric characters.'
      } as QRValidateResponse)
    };
  }

  // For manual code entry, the unique code is now the full patientId (tokenId)
  const tokenId = request.uniqueCode;

  // Validate the token
  const validation = await validateQRToken(tokenId);

  if (!validation.valid || !validation.token) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        valid: false,
        error: validation.error || 'Invalid unique code'
      } as QRValidateResponse)
    };
  }

  const token = validation.token;
  const patientId = token.patientId;

  // Get patient details
  const patient = await getPatient(patientId);
  
  if (!patient) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        valid: false,
        error: 'Patient not found'
      } as QRValidateResponse)
    };
  }

  // Add patient to doctor's roster
  try {
    await addPatientToDoctor(
      request.doctorId,
      patientId,
      'manual_code',
      tokenId
    );
  } catch (error) {
    console.error('Error adding patient to doctor:', error);
    // Continue even if patient already exists in roster
  }

  // Update QR token with scan information
  const scannedAt = new Date().toISOString();
  await updateQRTokenScanInfo(tokenId, request.doctorId, scannedAt);

  // Log access for audit trail
  const ipAddress = event.requestContext?.identity?.sourceIp;
  const userAgent = event.headers?.['User-Agent'] || event.headers?.['user-agent'];
  
  await logAccess(
    request.doctorId,
    patientId,
    'manual_code',
    tokenId,
    ipAddress,
    userAgent
  );

  // Return success response
  const response: QRValidateResponse = {
    valid: true,
    patientId: patientId,
    uhid: patientId // Using patientId as UHID for now
  };

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(response)
  };
}

/**
 * Extract token ID from QR data string
 * Expected format: "CARENAV:TOKEN:{tokenId}"
 */
function extractTokenIdFromQRData(qrData: string): string | null {
  try {
    const parts = qrData.split(':');
    if (parts.length === 3 && parts[0] === 'CARENAV' && parts[1] === 'TOKEN') {
      return parts[2];
    }
    return null;
  } catch (error) {
    console.error('Error extracting token ID from QR data:', error);
    return null;
  }
}

/**
 * Validate unique code format (alphanumeric only)
 */
function isValidUniqueCode(code: string): boolean {
  // Must be a valid UUID format since uniqueCode = patientId
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(code);
}

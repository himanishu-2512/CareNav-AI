// Patient registration Lambda handler
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createPatient, getPatientSummaryWithRedFlags, getPatient, updatePatient } from '../shared/patient-db';
import { successResponse, errorResponse, validateRequiredFields } from '../shared/response';

/**
 * Lambda handler for patient operations
 * POST /api/patients/register - Register new patient
 * GET /api/patients/summary/:patientId - Get patient summary with red flags (doctor view)
 * GET /api/patients/:patientId - Get patient by ID
 * PUT /api/patients/:patientId - Update patient information
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('Patient handler request:', event.httpMethod, event.path);

  try {
    // Handle patient summary endpoint (for doctors)
    if (event.httpMethod === 'GET' && event.path.includes('/summary/')) {
      return await handleGetPatientSummary(event);
    }

    // Handle red flags endpoint
    if (event.httpMethod === 'GET' && event.path.includes('/red-flags')) {
      return await handleGetRedFlags(event);
    }

    // Handle patient registration endpoint
    if (event.httpMethod === 'POST' && event.path.includes('/register')) {
      return await handlePatientRegistration(event);
    }

    // Handle get patient by ID
    if (event.httpMethod === 'GET' && event.path.match(/\/api\/patients\/[^/]+$/) && !event.path.includes('/summary/')) {
      return await handleGetPatient(event);
    }

    // Handle update patient
    if (event.httpMethod === 'PUT' && event.path.match(/\/api\/patients\/[^/]+$/)) {
      return await handleUpdatePatient(event);
    }

    return errorResponse('Invalid endpoint', 404);
  } catch (error) {
    console.error('Error in patient handler:', error);
    return errorResponse(
      'Internal server error',
      500,
      { error: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}

/**
 * Handle patient registration
 */
async function handlePatientRegistration(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  // Parse request body
  if (!event.body) {
    return errorResponse('Request body is required', 400);
  }

  const body = JSON.parse(event.body);

  // Validate required fields
  const validation = validateRequiredFields(body, ['name', 'age', 'gender', 'contact']);
  if (!validation.valid) {
    return errorResponse(
      'Missing required fields',
      400,
      { missingFields: validation.missing }
    );
  }

  // Validate field types and values
  if (typeof body.name !== 'string' || body.name.trim().length === 0) {
    return errorResponse('Name must be a non-empty string', 400);
  }

  if (typeof body.age !== 'number' || body.age < 0 || body.age > 150) {
    return errorResponse('Age must be a number between 0 and 150', 400);
  }

  if (typeof body.gender !== 'string' || body.gender.trim().length === 0) {
    return errorResponse('Gender must be a non-empty string', 400);
  }

  if (typeof body.contact !== 'string' || body.contact.trim().length === 0) {
    return errorResponse('Contact must be a non-empty string', 400);
  }

  // Create patient in DynamoDB
  const patient = await createPatient({
    name: body.name.trim(),
    age: body.age,
    gender: body.gender.trim(),
    contact: body.contact.trim()
  });

  console.log('Patient created successfully:', patient.patientId);

  // Privacy notice as per requirements
  const privacyNotice = 'DEMO DATA ONLY - Do not enter real medical information. ' +
    'This system is for demonstration purposes only and should not be used with actual patient data.';

  // Return success response with patient ID and privacy notice
  return successResponse({
    patientId: patient.patientId,
    name: patient.name,
    age: patient.age,
    gender: patient.gender,
    contact: patient.contact,
    message: 'Patient registered successfully',
    privacyNotice,
    createdAt: patient.createdAt
  }, 201);
}

/**
 * Handle patient summary retrieval with red flags (for doctor view)
 */
async function handleGetPatientSummary(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  // Extract patientId from path
  const pathParts = event.path.split('/');
  const patientId = pathParts[pathParts.length - 1];

  if (!patientId) {
    return errorResponse('Patient ID is required', 400);
  }

  try {
    console.log(`Getting patient summary with red flags for patient ${patientId}`);
    
    const summary = await getPatientSummaryWithRedFlags(patientId);

    if (!summary.patient) {
      return errorResponse('Patient not found', 404);
    }

    // Add automated highlighting disclaimer
    const disclaimer = 'Automated highlighting only—verify all information clinically. ' +
      'Red flags are detected automatically and may require clinical validation.';

    return successResponse({
      patient: summary.patient,
      criticalInformation: summary.criticalInformation,
      redFlags: summary.redFlags,
      disclaimer,
      totalRedFlags: summary.redFlags.length
    });
  } catch (error: any) {
    console.error('Error getting patient summary:', error);
    return errorResponse(
      error.message || 'Failed to get patient summary',
      500
    );
  }
}

/**
 * Handle get red flags for a patient
 */
async function handleGetRedFlags(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  // Extract patientId from path
  const pathParts = event.path.split('/');
  const patientIdIndex = pathParts.indexOf('patients') + 1;
  const patientId = pathParts[patientIdIndex];

  if (!patientId) {
    return errorResponse('Patient ID is required', 400);
  }

  try {
    console.log(`Getting red flags for patient ${patientId}`);
    
    const summary = await getPatientSummaryWithRedFlags(patientId);

    if (!summary.patient) {
      return errorResponse('Patient not found', 404);
    }

    return successResponse({
      redFlags: summary.redFlags,
      totalRedFlags: summary.redFlags.length
    });
  } catch (error: any) {
    console.error('Error getting red flags:', error);
    return errorResponse(
      error.message || 'Failed to get red flags',
      500
    );
  }
}

/**
 * Handle get patient by ID
 */
async function handleGetPatient(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const pathParts = event.path.split('/');
  const patientId = pathParts[pathParts.length - 1];

  if (!patientId) {
    return errorResponse('Patient ID is required', 400);
  }

  try {
    const patient = await getPatient(patientId);

    if (!patient) {
      return errorResponse('Patient not found', 404);
    }

    return successResponse(patient);
  } catch (error: any) {
    console.error('Error getting patient:', error);
    return errorResponse(error.message || 'Failed to get patient', 500);
  }
}

/**
 * Handle update patient
 */
async function handleUpdatePatient(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const pathParts = event.path.split('/');
  const patientId = pathParts[pathParts.length - 1];

  if (!patientId) {
    return errorResponse('Patient ID is required', 400);
  }

  if (!event.body) {
    return errorResponse('Request body is required', 400);
  }

  const updates = JSON.parse(event.body);

  try {
    const updatedPatient = await updatePatient(patientId, updates);

    return successResponse({
      message: 'Patient updated successfully',
      patient: updatedPatient
    });
  } catch (error: any) {
    console.error('Error updating patient:', error);
    return errorResponse(error.message || 'Failed to update patient', 500);
  }
}

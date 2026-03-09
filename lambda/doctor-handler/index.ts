// Doctor handler Lambda - Patient list management
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getDoctorPatients, addPatientToDoctor, removePatientFromDoctor } from '../shared/patient-db';
import { successResponse, errorResponse } from '../shared/response';

/**
 * Lambda handler for doctor operations
 * GET /api/doctor/patients - List all patients for doctor with pagination
 * GET /api/doctor/patients/search - Search patients by name or UHID
 * POST /api/doctor/patients/add - Add patient to doctor's list via QR/code
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('Doctor handler request:', event.httpMethod, event.path);

  try {
    // Extract doctorId from JWT token in authorizer context
    const doctorId = event.requestContext?.authorizer?.userId;
    
    if (!doctorId) {
      return errorResponse('Unauthorized: Doctor ID not found in token', 401);
    }

    // Handle patient list endpoint
    if (event.httpMethod === 'GET' && event.path.includes('/patients')) {
      // Check if this is a search request
      if (event.queryStringParameters?.q) {
        return await handleSearchPatients(event, doctorId);
      }
      
      // Otherwise, handle regular patient list
      return await handleGetPatients(event, doctorId);
    }

    // Handle add patient endpoint
    if (event.httpMethod === 'POST' && event.path.includes('/patients/add')) {
      return await handleAddPatient(event, doctorId);
    }

    // Handle delete patient endpoint
    if (event.httpMethod === 'DELETE' && event.pathParameters?.patientId) {
      return await handleDeletePatient(event, doctorId);
    }

    // Handle update patient status endpoint
    if (event.httpMethod === 'PUT' && event.path.includes('/status')) {
      return await handleUpdatePatientStatus(event, doctorId);
    }

    // Handle get patient relationship endpoint
    if (event.httpMethod === 'GET' && event.path.includes('/relationship')) {
      return await handleGetPatientRelationship(event, doctorId);
    }

    return errorResponse('Invalid endpoint', 404);
  } catch (error) {
    console.error('Error in doctor handler:', error);
    return errorResponse(
      'Internal server error',
      500,
      { error: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}

/**
 * Handle GET /api/doctor/patients
 * List all patients for doctor with optional filtering and pagination
 */
async function handleGetPatients(
  event: APIGatewayProxyEvent,
  doctorId: string
): Promise<APIGatewayProxyResult> {
  try {
    // Parse query parameters
    const queryParams = event.queryStringParameters || {};
    
    // Parse pagination parameters
    const page = queryParams.page ? parseInt(queryParams.page, 10) : 1;
    const limit = queryParams.limit ? parseInt(queryParams.limit, 10) : 20;
    
    // Validate pagination parameters
    if (isNaN(page) || page < 1) {
      return errorResponse('Invalid page parameter: must be a positive integer', 400);
    }
    
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return errorResponse('Invalid limit parameter: must be between 1 and 100', 400);
    }
    
    // Parse status filter
    let statusFilter: ('ongoing' | 'past')[] | undefined;
    if (queryParams.status) {
      const statuses = queryParams.status.split(',');
      
      // Validate status values
      const validStatuses = ['ongoing', 'past'];
      const invalidStatuses = statuses.filter(s => !validStatuses.includes(s));
      
      if (invalidStatuses.length > 0) {
        return errorResponse(
          `Invalid status values: ${invalidStatuses.join(', ')}. Must be 'ongoing' or 'past'`,
          400
        );
      }
      
      statusFilter = statuses as ('ongoing' | 'past')[];
    }
    
    // Get patients from database
    const result = await getDoctorPatients(doctorId, {
      page,
      limit,
      statusFilter
    });
    
    console.log(`Retrieved ${result.patients.length} patients for doctor ${doctorId}`);
    
    return successResponse({
      patients: result.patients,
      totalCount: result.totalCount,
      page: result.page,
      totalPages: result.totalPages,
      hasMore: result.hasMore
    });
  } catch (error: any) {
    console.error('Error getting patients:', error);
    return errorResponse(
      error.message || 'Failed to get patients',
      500
    );
  }
}

/**
 * Handle GET /api/doctor/patients/search?q={query}
 * Search patients by name or UHID (case-insensitive)
 */
async function handleSearchPatients(
  event: APIGatewayProxyEvent,
  doctorId: string
): Promise<APIGatewayProxyResult> {
  try {
    const queryParams = event.queryStringParameters || {};
    const searchQuery = queryParams.q?.trim();
    
    if (!searchQuery) {
      return errorResponse('Search query parameter "q" is required', 400);
    }
    
    // Parse pagination parameters
    const page = queryParams.page ? parseInt(queryParams.page, 10) : 1;
    const limit = queryParams.limit ? parseInt(queryParams.limit, 10) : 20;
    
    // Parse status filter (optional for search)
    let statusFilter: ('ongoing' | 'past')[] | undefined;
    if (queryParams.status) {
      const statuses = queryParams.status.split(',');
      statusFilter = statuses as ('ongoing' | 'past')[];
    }
    
    // Get all patients for the doctor
    const allPatientsResult = await getDoctorPatients(doctorId, {
      statusFilter
    });
    
    // Perform case-insensitive search on name and UHID
    const searchLower = searchQuery.toLowerCase();
    const matchingPatients = allPatientsResult.patients.filter(patient => 
      patient.name.toLowerCase().includes(searchLower) ||
      patient.uhid.toLowerCase().includes(searchLower)
    );
    
    // Apply pagination to search results
    const totalCount = matchingPatients.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPatients = matchingPatients.slice(startIndex, endIndex);
    
    console.log(`Search for "${searchQuery}" found ${totalCount} patients for doctor ${doctorId}`);
    
    return successResponse({
      patients: paginatedPatients,
      totalCount,
      page,
      totalPages,
      hasMore: page < totalPages,
      searchQuery
    });
  } catch (error: any) {
    console.error('Error searching patients:', error);
    return errorResponse(
      error.message || 'Failed to search patients',
      500
    );
  }
}

/**
 * Handle POST /api/doctor/patients/add
 * Add a patient to doctor's list via QR code or manual code
 */
async function handleAddPatient(
  event: APIGatewayProxyEvent,
  doctorId: string
): Promise<APIGatewayProxyResult> {
  try {
    // Parse request body
    if (!event.body) {
      return errorResponse('Request body is required', 400);
    }
    
    const body = JSON.parse(event.body);
    
    // Validate required fields
    if (!body.patientId) {
      return errorResponse('patientId is required', 400);
    }
    
    if (!body.addedVia || !['qr_scan', 'manual_code'].includes(body.addedVia)) {
      return errorResponse('addedVia must be either "qr_scan" or "manual_code"', 400);
    }
    
    if (!body.accessGrantedBy) {
      return errorResponse('accessGrantedBy is required (QR token or unique code)', 400);
    }
    
    // Validate patientId format
    if (typeof body.patientId !== 'string' || body.patientId.trim().length === 0) {
      return errorResponse('patientId must be a non-empty string', 400);
    }
    
    // Add patient to doctor's list
    const relationship = await addPatientToDoctor(
      doctorId,
      body.patientId.trim(),
      body.addedVia,
      body.accessGrantedBy,
      body.trackedSymptomId || null
    );
    
    console.log(`Patient ${body.patientId} added to doctor ${doctorId} via ${body.addedVia}`);
    
    return successResponse({
      message: 'Patient added successfully',
      patientId: relationship.patientId,
      patientName: relationship.patientName,
      uhid: relationship.uhid,
      addedAt: relationship.addedAt,
      treatmentStatus: relationship.treatmentStatus
    }, 201);
  } catch (error: any) {
    console.error('Error adding patient:', error);
    
    // Handle specific error cases
    if (error.message.includes('not found')) {
      return errorResponse(error.message, 404);
    }
    
    return errorResponse(
      error.message || 'Failed to add patient',
      500
    );
  }
}

/**
 * Handle DELETE /api/doctor/patients/:patientId
 * Remove a patient from doctor's list
 */
async function handleDeletePatient(
  event: APIGatewayProxyEvent,
  doctorId: string
): Promise<APIGatewayProxyResult> {
  try {
    const patientId = event.pathParameters?.patientId;
    
    if (!patientId) {
      return errorResponse('Patient ID is required', 400);
    }
    
    // Remove patient from doctor's list
    await removePatientFromDoctor(doctorId, patientId);
    
    console.log(`Patient ${patientId} removed from doctor ${doctorId}`);
    
    return successResponse({
      message: 'Patient removed successfully',
      patientId
    });
  } catch (error: any) {
    console.error('Error removing patient:', error);
    
    if (error.message.includes('not found')) {
      return errorResponse(error.message, 404);
    }
    
    return errorResponse(
      error.message || 'Failed to remove patient',
      500
    );
  }
}

/**
 * Update patient treatment status
 */
async function handleUpdatePatientStatus(
  event: APIGatewayProxyEvent,
  doctorId: string
): Promise<APIGatewayProxyResult> {
  try {
    const patientId = event.pathParameters?.patientId;
    
    if (!patientId) {
      return errorResponse('Patient ID is required', 400);
    }
    
    const body = JSON.parse(event.body || '{}');
    const { status } = body;
    
    if (!status || !['ongoing', 'past'].includes(status)) {
      return errorResponse('Valid status is required (ongoing or past)', 400);
    }
    
    // Import DynamoDB client
    const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb');
    const { DynamoDBDocumentClient, UpdateCommand } = await import('@aws-sdk/lib-dynamodb');
    
    const client = new DynamoDBClient({});
    const docClient = DynamoDBDocumentClient.from(client);
    
    const tableName = process.env.DYNAMODB_TABLE;
    
    // Update the relationship status
    await docClient.send(new UpdateCommand({
      TableName: tableName,
      Key: {
        PK: `DOCTOR#${doctorId}`,
        SK: `PATIENT#${patientId}`
      },
      UpdateExpression: 'SET treatmentStatus = :status, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':status': status,
        ':updatedAt': new Date().toISOString()
      }
    }));
    
    console.log(`Patient ${patientId} status updated to ${status} for doctor ${doctorId}`);
    
    return successResponse({
      message: 'Patient status updated successfully',
      patientId,
      status
    });
  } catch (error: any) {
    console.error('Error updating patient status:', error);
    
    return errorResponse(
      error.message || 'Failed to update patient status',
      500
    );
  }
}

/**
 * Get doctor-patient relationship details
 */
async function handleGetPatientRelationship(
  event: APIGatewayProxyEvent,
  doctorId: string
): Promise<APIGatewayProxyResult> {
  try {
    const patientId = event.pathParameters?.patientId;
    
    if (!patientId) {
      return errorResponse('Patient ID is required', 400);
    }
    
    // Import DynamoDB client
    const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb');
    const { DynamoDBDocumentClient, GetCommand } = await import('@aws-sdk/lib-dynamodb');
    
    const client = new DynamoDBClient({});
    const docClient = DynamoDBDocumentClient.from(client);
    
    const tableName = process.env.DYNAMODB_TABLE;
    
    // Get the relationship
    const result = await docClient.send(new GetCommand({
      TableName: tableName,
      Key: {
        PK: `DOCTOR#${doctorId}`,
        SK: `PATIENT#${patientId}`
      }
    }));
    
    if (!result.Item) {
      return errorResponse('Patient relationship not found', 404);
    }
    
    return successResponse({
      trackedSymptomId: result.Item.trackedSymptomId || null,
      treatmentStatus: result.Item.treatmentStatus,
      addedAt: result.Item.addedAt
    });
  } catch (error: any) {
    console.error('Error getting patient relationship:', error);
    
    return errorResponse(
      error.message || 'Failed to get patient relationship',
      500
    );
  }
}

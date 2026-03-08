// Treatment Handler Lambda - Treatment episode management
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { 
  createEpisode, 
  getEpisode, 
  getPatientEpisodes, 
  completeEpisode 
} from '../shared/treatment-episode-db';
import { addMessage, getEpisodeMessages } from '../shared/chat-message-db';
import { logAccess } from '../shared/audit-log';
import { successResponse, errorResponse, validateRequiredFields } from '../shared/response';

/**
 * Lambda handler for treatment episode operations
 * POST /api/treatment/episode/create - Create new treatment episode
 * GET /api/treatment/episode/{episodeId} - Get episode details with messages
 * POST /api/treatment/episode/{episodeId}/message - Add message to chat
 * POST /api/treatment/episode/{episodeId}/complete - Mark episode complete
 * GET /api/treatment/patient/{patientId}/episodes - Get all episodes for patient
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('Treatment handler request:', event.httpMethod, event.path);

  try {
    // Extract userId from JWT token in authorizer context
    const userId = event.requestContext?.authorizer?.userId;
    const userRole = event.requestContext?.authorizer?.role;
    
    if (!userId) {
      return errorResponse('Unauthorized: User ID not found in token', 401);
    }

    const path = event.path;
    const method = event.httpMethod;

    // Route to appropriate handler
    if (method === 'POST' && path === '/api/treatment/episode/create') {
      return await handleCreateEpisode(event, userId, userRole);
    }

    if (method === 'GET' && path.match(/\/api\/treatment\/episode\/[^/]+$/)) {
      const episodeId = path.split('/').pop()!;
      return await handleGetEpisode(event, episodeId, userId);
    }

    if (method === 'POST' && path.match(/\/api\/treatment\/episode\/[^/]+\/message$/)) {
      const pathParts = path.split('/');
      const episodeId = pathParts[pathParts.length - 2];
      return await handleAddMessage(event, episodeId, userId, userRole);
    }

    if (method === 'POST' && path.match(/\/api\/treatment\/episode\/[^/]+\/complete$/)) {
      const pathParts = path.split('/');
      const episodeId = pathParts[pathParts.length - 2];
      return await handleCompleteEpisode(event, episodeId, userId);
    }

    if (method === 'GET' && path.match(/\/api\/treatment\/patient\/[^/]+\/episodes$/)) {
      const pathParts = path.split('/');
      const patientId = pathParts[pathParts.length - 2];
      return await handleGetPatientEpisodes(event, patientId, userId);
    }

    return errorResponse('Invalid endpoint', 404);
  } catch (error) {
    console.error('Error in treatment handler:', error);
    return errorResponse(
      'Internal server error',
      500,
      { error: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}

/**
 * Handle POST /api/treatment/episode/create
 * Create a new treatment episode
 */
async function handleCreateEpisode(
  event: APIGatewayProxyEvent,
  userId: string,
  userRole: string
): Promise<APIGatewayProxyResult> {
  try {
    // Parse request body
    if (!event.body) {
      return errorResponse('Request body is required', 400);
    }

    const body = JSON.parse(event.body);

    // Validate required fields
    const validation = validateRequiredFields(body, ['patientId', 'doctorId']);
    if (!validation.valid) {
      return errorResponse(
        `Missing required fields: ${validation.missing?.join(', ')}`,
        400
      );
    }

    // Validate that the requesting user is authorized
    // Doctor can create episodes for their patients
    if (userRole === 'doctor' && userId !== body.doctorId) {
      return errorResponse('Unauthorized: Cannot create episode for another doctor', 403);
    }

    // Create the episode
    const episode = await createEpisode(
      body.patientId,
      body.doctorId,
      body.initialSymptoms
    );

    // If initial symptoms provided, add as first message
    if (body.initialSymptoms) {
      await addMessage(
        episode.episodeId,
        'system',
        'System',
        `Treatment episode started. Initial symptoms: ${body.initialSymptoms}`,
        'text'
      );
    }

    // Log access for audit trail
    const ipAddress = event.requestContext?.identity?.sourceIp;
    const userAgent = event.headers?.['User-Agent'] || event.headers?.['user-agent'];
    
    await logAccess(
      body.doctorId,
      body.patientId,
      'view_episode',
      episode.episodeId,
      ipAddress,
      userAgent
    );

    console.log(`Created episode ${episode.episodeId} for patient ${body.patientId}`);

    return successResponse({
      episodeId: episode.episodeId,
      patientId: episode.patientId,
      doctorId: episode.doctorId,
      startDate: episode.startDate,
      status: episode.status,
      createdAt: episode.createdAt
    }, 201);
  } catch (error: any) {
    console.error('Error creating episode:', error);
    return errorResponse(
      error.message || 'Failed to create episode',
      500
    );
  }
}

/**
 * Handle GET /api/treatment/episode/{episodeId}
 * Get episode details with all messages
 */
async function handleGetEpisode(
  event: APIGatewayProxyEvent,
  episodeId: string,
  userId: string
): Promise<APIGatewayProxyResult> {
  try {
    // Validate episodeId format
    if (!episodeId || episodeId.trim().length === 0) {
      return errorResponse('Invalid episode ID', 400);
    }

    // Get patientId from query parameter (required for DynamoDB query)
    const patientId = event.queryStringParameters?.patientId;
    
    if (!patientId) {
      return errorResponse('patientId query parameter is required', 400);
    }

    // Get the episode
    const episode = await getEpisode(patientId, episodeId);

    if (!episode) {
      return errorResponse('Episode not found', 404);
    }

    // Get all messages for the episode
    const messages = await getEpisodeMessages(episodeId);

    console.log(`Retrieved episode ${episodeId} with ${messages.length} messages`);

    return successResponse({
      episode,
      messages
    });
  } catch (error: any) {
    console.error('Error getting episode:', error);
    return errorResponse(
      error.message || 'Failed to get episode',
      500
    );
  }
}

/**
 * Handle POST /api/treatment/episode/{episodeId}/message
 * Add a message to the chat thread
 */
async function handleAddMessage(
  event: APIGatewayProxyEvent,
  episodeId: string,
  userId: string,
  userRole: string
): Promise<APIGatewayProxyResult> {
  try {
    // Validate episodeId format
    if (!episodeId || episodeId.trim().length === 0) {
      return errorResponse('Invalid episode ID', 400);
    }

    // Parse request body
    if (!event.body) {
      return errorResponse('Request body is required', 400);
    }

    const body = JSON.parse(event.body);

    // Validate required fields
    const validation = validateRequiredFields(body, ['content', 'senderName']);
    if (!validation.valid) {
      return errorResponse(
        `Missing required fields: ${validation.missing?.join(', ')}`,
        400
      );
    }

    // Determine sender based on user role
    const sender = userRole === 'doctor' ? 'doctor' : 'patient';
    
    // Validate message type if provided
    const messageType = body.type || 'text';
    const validTypes = ['text', 'prescription', 'document', 'recommendation'];
    
    if (!validTypes.includes(messageType)) {
      return errorResponse(
        `Invalid message type. Must be one of: ${validTypes.join(', ')}`,
        400
      );
    }

    // Add the message
    const message = await addMessage(
      episodeId,
      sender,
      body.senderName,
      body.content,
      messageType,
      body.metadata
    );

    console.log(`Added ${messageType} message to episode ${episodeId}`);

    return successResponse({
      messageId: message.messageId,
      episodeId: message.episodeId,
      sender: message.sender,
      senderName: message.senderName,
      content: message.content,
      type: message.type,
      createdAt: message.createdAt,
      ...(message.metadata && { metadata: message.metadata })
    }, 201);
  } catch (error: any) {
    console.error('Error adding message:', error);
    return errorResponse(
      error.message || 'Failed to add message',
      500
    );
  }
}

/**
 * Handle POST /api/treatment/episode/{episodeId}/complete
 * Mark episode as complete with diagnosis and outcome
 */
async function handleCompleteEpisode(
  event: APIGatewayProxyEvent,
  episodeId: string,
  userId: string
): Promise<APIGatewayProxyResult> {
  try {
    // Validate episodeId format
    if (!episodeId || episodeId.trim().length === 0) {
      return errorResponse('Invalid episode ID', 400);
    }

    // Parse request body
    if (!event.body) {
      return errorResponse('Request body is required', 400);
    }

    const body = JSON.parse(event.body);

    // Validate required fields
    const validation = validateRequiredFields(body, ['patientId', 'diagnosis', 'outcome']);
    if (!validation.valid) {
      return errorResponse(
        `Missing required fields: ${validation.missing?.join(', ')}`,
        400
      );
    }

    // Complete the episode
    const updatedEpisode = await completeEpisode(
      body.patientId,
      episodeId,
      body.diagnosis,
      body.outcome
    );

    // Add completion message to chat
    await addMessage(
      episodeId,
      'system',
      'System',
      `Treatment episode completed. Diagnosis: ${body.diagnosis}. Outcome: ${body.outcome}`,
      'text'
    );

    console.log(`Completed episode ${episodeId} for patient ${body.patientId}`);

    return successResponse({
      episodeId: updatedEpisode.episodeId,
      patientId: updatedEpisode.patientId,
      doctorId: updatedEpisode.doctorId,
      startDate: updatedEpisode.startDate,
      endDate: updatedEpisode.endDate,
      status: updatedEpisode.status,
      diagnosis: updatedEpisode.diagnosis,
      outcome: updatedEpisode.outcome,
      updatedAt: updatedEpisode.updatedAt
    });
  } catch (error: any) {
    console.error('Error completing episode:', error);
    
    // Handle specific error cases
    if (error.message.includes('not found')) {
      return errorResponse(error.message, 404);
    }
    
    return errorResponse(
      error.message || 'Failed to complete episode',
      500
    );
  }
}

/**
 * Handle GET /api/treatment/patient/{patientId}/episodes
 * Get all episodes for a patient with optional status filtering
 */
async function handleGetPatientEpisodes(
  event: APIGatewayProxyEvent,
  patientId: string,
  userId: string
): Promise<APIGatewayProxyResult> {
  try {
    // Validate patientId format
    if (!patientId || patientId.trim().length === 0) {
      return errorResponse('Invalid patient ID', 400);
    }

    // Parse status filter from query parameters
    const statusParam = event.queryStringParameters?.status;
    let statusFilter: 'ongoing' | 'completed' | undefined;
    
    if (statusParam) {
      if (statusParam !== 'ongoing' && statusParam !== 'completed') {
        return errorResponse(
          'Invalid status parameter. Must be "ongoing" or "completed"',
          400
        );
      }
      statusFilter = statusParam;
    }

    // Get all episodes for the patient
    const episodes = await getPatientEpisodes(patientId, statusFilter);

    console.log(`Retrieved ${episodes.length} episodes for patient ${patientId}`);

    return successResponse({
      patientId,
      episodes,
      totalCount: episodes.length,
      ...(statusFilter && { statusFilter })
    });
  } catch (error: any) {
    console.error('Error getting patient episodes:', error);
    return errorResponse(
      error.message || 'Failed to get patient episodes',
      500
    );
  }
}

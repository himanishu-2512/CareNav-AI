// Iterative Diagnosis Lambda Handler
// Implements Requirements 1.1, 13.1, 13.2

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { successResponse, errorResponse, validateRequiredFields } from '../shared/response';

/**
 * POST /api/diagnosis/start
 * Start a new iterative diagnosis session
 */
async function handleStartDiagnosis(body: any): Promise<APIGatewayProxyResult> {
  // Validate required fields
  const validation = validateRequiredFields(body, ['patientId', 'symptoms']);
  if (!validation.valid) {
    return errorResponse(
      `Missing required fields: ${validation.missing?.join(', ')}`,
      400
    );
  }

  const { patientId, symptoms } = body;

  // Validate symptoms structure
  if (!symptoms.bodyPart || !symptoms.duration) {
    return errorResponse(
      'Symptoms must include bodyPart and duration',
      400
    );
  }

  // Validate severity
  const validSeverities = ['mild', 'moderate', 'severe'];
  if (symptoms.severity && !validSeverities.includes(symptoms.severity)) {
    return errorResponse(
      'Severity must be one of: mild, moderate, severe',
      400
    );
  }

  try {
    console.log(`Starting diagnosis session for patient ${patientId}`);

    // TODO: Implementation will be added in subsequent tasks (4.2)
    // - Generate unique sessionId
    // - Invoke Bedrock with disease analysis prompt
    // - Store diagnosis session in DynamoDB
    // - Generate first set of targeted questions
    // - Filter disease names from questions

    // Placeholder response for now
    return errorResponse(
      'Start diagnosis endpoint not yet implemented',
      501
    );
  } catch (error: any) {
    console.error('Error starting diagnosis session:', error);

    // Handle Bedrock-specific errors
    if (error.message?.includes('Bedrock') || error.message?.includes('AI')) {
      return errorResponse(
        'AI service temporarily unavailable. Please try again in a few minutes.',
        503
      );
    }

    return errorResponse(
      error.message || 'Failed to start diagnosis session',
      500
    );
  }
}

/**
 * POST /api/diagnosis/continue
 * Continue an existing diagnosis session with answers
 */
async function handleContinueDiagnosis(body: any): Promise<APIGatewayProxyResult> {
  // Validate required fields
  const validation = validateRequiredFields(body, ['sessionId', 'answers']);
  if (!validation.valid) {
    return errorResponse(
      `Missing required fields: ${validation.missing?.join(', ')}`,
      400
    );
  }

  const { sessionId, answers } = body;

  // Validate answers format
  if (!Array.isArray(answers) || answers.length === 0) {
    return errorResponse(
      'Answers must be a non-empty array',
      400
    );
  }

  // Validate each answer has required fields
  for (const answer of answers) {
    if (!answer.questionId || !answer.answer) {
      return errorResponse(
        'Each answer must include questionId and answer',
        400
      );
    }
  }

  try {
    console.log(`Continuing diagnosis session ${sessionId}`);

    // TODO: Implementation will be added in subsequent tasks (4.3)
    // - Retrieve session from DynamoDB
    // - Check session status is 'active' (return 409 if completed)
    // - Validate answers match previous questions
    // - Invoke Bedrock with disease refinement prompt
    // - Calculate new confidence score
    // - Remove diseases with probability < 0.05
    // - Increment currentRound
    // - Check termination conditions (confidence >= 0.8 OR rounds >= 5)
    // - If continuing: generate next questions and filter disease names
    // - If completed: store final analysis in patient history
    // - Update session in DynamoDB

    // Placeholder response for now
    return errorResponse(
      'Continue diagnosis endpoint not yet implemented',
      501
    );
  } catch (error: any) {
    console.error('Error continuing diagnosis session:', error);

    // Handle specific error cases
    if (error.message?.includes('not found')) {
      return errorResponse('Session not found', 404);
    }

    if (error.message?.includes('already completed')) {
      return errorResponse('Session already completed', 409);
    }

    if (error.message?.includes('Bedrock') || error.message?.includes('AI')) {
      return errorResponse(
        'AI service temporarily unavailable. Please try again in a few minutes.',
        503
      );
    }

    return errorResponse(
      error.message || 'Failed to continue diagnosis session',
      500
    );
  }
}

/**
 * Main Lambda handler
 * Routes requests based on HTTP method and path
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('Iterative Diagnosis Lambda - Event:', JSON.stringify(event, null, 2));

  try {
    // Parse request body
    if (!event.body) {
      return errorResponse('Request body is required', 400);
    }

    const body = JSON.parse(event.body);

    // Route based on path
    const path = event.path;
    const method = event.httpMethod;

    if (path === '/api/diagnosis/start' && method === 'POST') {
      return await handleStartDiagnosis(body);
    }

    if (path === '/api/diagnosis/continue' && method === 'POST') {
      return await handleContinueDiagnosis(body);
    }

    // Unknown path
    return errorResponse('Not found', 404);
  } catch (error: any) {
    console.error('Unexpected error in diagnosis handler:', error);

    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      return errorResponse('Invalid JSON in request body', 400);
    }

    return errorResponse('Internal server error', 500);
  }
}

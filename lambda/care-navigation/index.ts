// Care Navigation Lambda Handler
// Implements Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { successResponse, errorResponse } from '../shared/response';
import { getSymptom } from '../shared/symptom-db';
import { generateDepartmentRecommendation, getNearbyDoctors } from '../shared/intelligent-care-navigator';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDbClient, TABLE_NAME } from '../shared/dynamodb-client';
import { CareNavigation, DynamoDBKeys } from '../shared/types';
import { v4 as uuidv4 } from 'uuid';

// Mandatory disclaimer text (Requirement 4.3)
const DISCLAIMER_TEXT = 'This is not a medical diagnosis. Please consult a healthcare provider for professional medical advice.';

// Emergency services message for Indian context (Requirement 4.5)
const EMERGENCY_MESSAGE = 'CALL EMERGENCY SERVICES IMMEDIATELY - Dial 102 or 108';

interface DepartmentRecommendationResponse {
  department: string;
  urgency: 'routine' | 'urgent' | 'emergency';
  reasoning: string;
}

/**
 * Care Navigation Lambda Handler
 * POST /api/navigation/recommend
 * 
 * Generates department recommendation based on symptom patterns
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Parse request body
    if (!event.body) {
      return errorResponse('Request body is required', 400);
    }

    const { patientId, symptomId } = JSON.parse(event.body);

    // Validate required fields
    if (!patientId || !symptomId) {
      return errorResponse('patientId and symptomId are required', 400);
    }

    console.log(`Processing care navigation for patient ${patientId}, symptom ${symptomId}`);

    // 1. Retrieve symptom data from DynamoDB (Requirement 4.1)
    const symptomData = await getSymptom(patientId, symptomId);

    if (!symptomData) {
      return errorResponse('Symptom not found', 404);
    }

    console.log('Retrieved symptom data:', JSON.stringify(symptomData, null, 2));

    // 2. Get department recommendation using intelligent AI (Requirement 4.1, 4.2)
    console.log('Generating intelligent department recommendation...');

    const recommendation = generateDepartmentRecommendation(
      symptomData.structuredSymptoms,
      symptomData.followUpAnswers || [],
      symptomData.diseaseAnalysis || []
    );
    
    console.log('AI recommendation:', JSON.stringify(recommendation, null, 2));

    // 3. Get nearby doctors for the recommended department
    const nearbyDoctors = getNearbyDoctors(recommendation.department);

    // 4. Validate urgency level (Requirement 4.2)
    const validUrgencyLevels = ['routine', 'urgent', 'emergency'];
    if (!validUrgencyLevels.includes(recommendation.urgency)) {
      console.warn(`Invalid urgency level: ${recommendation.urgency}, defaulting to routine`);
      recommendation.urgency = 'routine';
    }

    // 5. Add emergency services message if urgency is emergency (Requirement 4.5)
    const emergencyMessage = recommendation.urgency === 'emergency' ? EMERGENCY_MESSAGE : undefined;

    // 6. Store navigation recommendation in DynamoDB (Requirement 4.6)
    const navigationId = uuidv4();
    const now = new Date().toISOString();

    const navigation: CareNavigation = {
      navigationId,
      patientId,
      symptomId,
      recommendedDepartment: recommendation.department,
      urgencyLevel: recommendation.urgency,
      reasoning: recommendation.reasoning,
      disclaimer: DISCLAIMER_TEXT,
      emergencyMessage,
      createdAt: now
    };

    const keys = DynamoDBKeys.navigation(patientId, navigationId);

    await dynamoDbClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          ...keys,
          ...navigation
        }
      })
    );

    console.log(`Care navigation stored with ID: ${navigationId}`);

    // 7. Return recommendation with disclaimer and nearby doctors (Requirement 4.3, 4.6)
    return successResponse({
      navigationId,
      recommendedDepartment: recommendation.department,
      urgencyLevel: recommendation.urgency,
      urgencyDescription: recommendation.urgencyLevel,
      reasoning: recommendation.reasoning,
      confidence: recommendation.confidence,
      nearbyDoctors,
      disclaimer: DISCLAIMER_TEXT,
      emergencyMessage
    });

  } catch (error: any) {
    console.error('Error in care navigation:', error);
    
    // User-friendly error message (Requirement 14.1, 14.3)
    if (error.message?.includes('Bedrock')) {
      return errorResponse('AI service temporarily unavailable. Please try again in a few minutes.', 503);
    }
    
    return errorResponse(error.message || 'Failed to generate care navigation recommendation', 500);
  }
}

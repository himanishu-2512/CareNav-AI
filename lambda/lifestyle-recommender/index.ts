// Lifestyle Recommender Lambda Handler
// Generates AI-powered lifestyle recommendations based on diagnosis
// Requirements: 15.1, 15.2, 15.3, 15.4, 15.5

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { callGeminiJson } from '../shared/gemini-client';
import { generateDietRecommendations, DietRecommendations } from '../shared/diet-recommender';
import { generateActivityAvoidanceRecommendations, ActivityRecommendation } from '../shared/activity-avoidance';
import { v4 as uuidv4 } from 'uuid';

interface GenerateRecommendationsRequest {
  patientId: string;
  diagnosis: string;
  patientAge: number;
  patientGender: string;
  episodeId?: string;
  allergies?: string[];
}

// ActivityRecommendation is now imported from activity-avoidance module

interface RecoveryTip {
  tip: string;
  category: 'monitoring' | 'warning_signs' | 'timeline' | 'follow_up';
  description: string;
}

interface LifestyleRecommendations {
  recommendationId: string;
  patientId: string;
  episodeId?: string;
  diagnosis: string;
  diet: DietRecommendations;
  activitiesToAvoid: ActivityRecommendation[];
  dailyLifeModifications: string[];
  recoveryTips: RecoveryTip[];
  generatedAt: string;
}

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('Lifestyle Recommender Lambda invoked:', JSON.stringify(event));

  try {
    // Parse request body
    const body: GenerateRecommendationsRequest = JSON.parse(event.body || '{}');

    // Validate required fields
    if (!body.patientId || !body.diagnosis || !body.patientAge || !body.patientGender) {
      return errorResponse('Missing required fields: patientId, diagnosis, patientAge, patientGender', 400);
    }

    // Generate recommendations using AI
    const recommendations = await generateLifestyleRecommendations(
      body.diagnosis,
      body.patientAge,
      body.patientGender,
      body.allergies || []
    );

    // Create recommendation record
    const recommendationRecord: LifestyleRecommendations = {
      recommendationId: uuidv4(),
      patientId: body.patientId,
      episodeId: body.episodeId,
      diagnosis: body.diagnosis,
      diet: recommendations.diet,
      activitiesToAvoid: recommendations.activitiesToAvoid,
      dailyLifeModifications: recommendations.dailyLifeModifications,
      recoveryTips: recommendations.recoveryTips,
      generatedAt: new Date().toISOString()
    };

    // TODO: Save to DynamoDB
    // await saveRecommendations(recommendationRecord);

    // TODO: Sync to patient app
    // await syncToPatientApp(body.patientId, recommendationRecord);

    return successResponse(recommendationRecord);
  } catch (error) {
    console.error('Error generating lifestyle recommendations:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to generate recommendations',
      500
    );
  }
}

async function generateLifestyleRecommendations(
  diagnosis: string,
  age: number,
  gender: string,
  allergies: string[]
): Promise<Omit<LifestyleRecommendations, 'recommendationId' | 'patientId' | 'episodeId' | 'generatedAt' | 'diagnosis'>> {
  // Generate diet recommendations using specialized module
  const dietRecommendations = await generateDietRecommendations({
    diagnosis,
    patientAge: age,
    patientGender: gender,
    allergies
  });

  // Generate activity avoidance recommendations using specialized module
  const activityRecommendations = await generateActivityAvoidanceRecommendations({
    diagnosis,
    patientAge: age,
    patientGender: gender
  });

  // Generate daily life modifications and recovery tips using AI
  const systemPrompt = `You are a medical lifestyle advisor. Generate personalized lifestyle recommendations for a patient based on their diagnosis.

IMPORTANT: Return ONLY valid JSON without any markdown formatting, code blocks, or additional text.

The response must include:
1. dailyLifeModifications: Array of at least 3 specific modifications (sleep, stress, physical activity)
2. recoveryTips: Array of at least 3 tips with tip, category, and description

Categories for recoveryTips: monitoring, warning_signs, timeline, follow_up`;

  const userPrompt = `Generate lifestyle recommendations (daily life modifications and recovery tips) for:
- Diagnosis: ${diagnosis}
- Patient Age: ${age}
- Patient Gender: ${gender}

Provide specific, actionable recommendations in JSON format.`;

  try {
    const response = await callGeminiJson<any>(
      systemPrompt,
      userPrompt,
      ['dailyLifeModifications', 'recoveryTips'],
      { maxTokens: 2000, temperature: 0.7 }
    );

    // Validate and ensure minimum counts
    if (!Array.isArray(response.dailyLifeModifications) || response.dailyLifeModifications.length < 3) {
      throw new Error('Daily life modifications must contain at least 3 items');
    }
    if (!Array.isArray(response.recoveryTips) || response.recoveryTips.length < 3) {
      throw new Error('Recovery tips must contain at least 3 items');
    }

    return {
      diet: dietRecommendations,
      activitiesToAvoid: activityRecommendations.activitiesToAvoid,
      dailyLifeModifications: response.dailyLifeModifications,
      recoveryTips: response.recoveryTips
    };
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw new Error('Failed to generate AI recommendations');
  }
}

function successResponse(data: any): APIGatewayProxyResult {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(data)
  };
}

function errorResponse(message: string, statusCode: number): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ error: message })
  };
}

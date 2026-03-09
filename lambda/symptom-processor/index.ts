// Symptom Processor Lambda Handler
// Handles symptom input, extraction, and follow-up question generation
// Updated: 2026-03-09 01:30 AM - Fixed 5 questions per round (FORCE REBUILD v2)

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { successResponse, errorResponse, validateRequiredFields } from '../shared/response';
import { createSymptom, getSymptom, updateSymptomWithAnswers, getPatientSymptoms, deleteSymptom, updateSymptomText } from '../shared/symptom-db';
import { transcribeVoiceToText, isVoiceInputEnabled } from '../shared/transcribe-client';
import { performCompleteAnalysis, refineAnalysisWithAnswers } from '../shared/intelligent-symptom-analyzer';
import { FollowUpAnswer, TargetedQuestion } from '../shared/types';

/**
 * POST /api/symptoms/input
 * Submit symptom text and get structured extraction
 */
async function handleSymptomInput(body: any): Promise<APIGatewayProxyResult> {
  // Validate required fields
  const validation = validateRequiredFields(body, ['patientId', 'symptomText']);
  if (!validation.valid) {
    return errorResponse(
      `Missing required fields: ${validation.missing?.join(', ')}`,
      400
    );
  }

  const { patientId, symptomText, inputMethod = 'text', audioData } = body;

  // Handle voice input if specified
  let processedText = symptomText;
  if (inputMethod === 'voice') {
    if (!isVoiceInputEnabled()) {
      return errorResponse(
        'Voice input is not currently enabled. Please use text input.',
        400
      );
    }

    if (!audioData) {
      return errorResponse('Audio data is required for voice input', 400);
    }

    try {
      console.log('Transcribing voice input for patient:', patientId);
      processedText = await transcribeVoiceToText(audioData, patientId);
    } catch (error: any) {
      console.error('Voice transcription failed:', error);
      return errorResponse(
        'Voice transcription failed. Please try again or use text input.',
        500
      );
    }
  }

  // Validate symptom text length (max 2000 characters)
  if (processedText.length > 2000) {
    return errorResponse('Symptom text exceeds maximum length of 2000 characters', 400);
  }

  try {
    // Use AWS Comprehend Medical + intelligent rule-based analysis
    console.log('Analyzing symptoms with AWS Comprehend Medical for patient:', patientId);
    
    const analysis = await performCompleteAnalysis(processedText);
    
    console.log(`Analysis complete: ${analysis.diseaseAnalysis.possibleDiseases.length} disease candidates, confidence: ${analysis.diseaseAnalysis.confidenceScore}`);
    console.log(`Generated ${analysis.targetedQuestions.length} targeted questions`);

    // Store symptom in DynamoDB with disease analysis
    const symptom = await createSymptom(
      patientId,
      processedText,
      analysis.structuredSymptoms,
      inputMethod,
      analysis.diseaseAnalysis.possibleDiseases,
      analysis.diseaseAnalysis.confidenceScore
    );

    console.log('Symptom created:', symptom.symptomId);

    // Convert targeted questions to follow-up question format for frontend compatibility
    const followUpQuestions = analysis.targetedQuestions.map((q: TargetedQuestion) => ({
      questionId: q.questionId,
      questionText: q.questionText,
      questionType: q.questionType,
      options: q.options,
      tags: q.tags || []
    }));

    return successResponse({
      symptomId: symptom.symptomId,
      structuredSymptoms: symptom.structuredSymptoms,
      followUpQuestions
    });
  } catch (error: any) {
    console.error('Error processing symptom:', error);
    return errorResponse(error.message, 500);
  }
}

/**
 * POST /api/symptoms/followup/answer
 * Submit answers to follow-up questions and get more questions or final recommendation
 */
async function handleFollowUpAnswer(body: any): Promise<APIGatewayProxyResult> {
  // Validate required fields
  const validation = validateRequiredFields(body, ['patientId', 'symptomId', 'answers']);
  if (!validation.valid) {
    return errorResponse(
      `Missing required fields: ${validation.missing?.join(', ')}`,
      400
    );
  }

  const { patientId, symptomId, answers } = body;

  try {
    // Validate answers format
    if (!Array.isArray(answers)) {
      return errorResponse('Answers must be an array', 400);
    }

    // Get existing symptom
    const symptom = await getSymptom(patientId, symptomId);
    if (!symptom) {
      return errorResponse('Symptom not found', 404);
    }

    // Update symptom with follow-up answers
    const updatedSymptom = await updateSymptomWithAnswers(
      patientId,
      symptomId,
      answers as FollowUpAnswer[]
    );

    console.log('Symptom updated with follow-up answers:', symptomId);

    // Determine which round we're on based on total answers
    const totalAnswers = updatedSymptom.followUpAnswers?.length || 0;
    
    if (totalAnswers < 10) {
      // Generate next round of questions (Round 2 only - reduced from 4 rounds to 2)
      const roundNumber = Math.floor(totalAnswers / 5) + 1;
      console.log(`Round ${roundNumber} complete, generating round ${roundNumber + 1} questions...`);
      
      try {
        const refinedAnalysis = await refineAnalysisWithAnswers(
          updatedSymptom.rawText,
          updatedSymptom.structuredSymptoms,
          updatedSymptom.diseaseAnalysis || [],
          updatedSymptom.followUpAnswers || []
        );
        
        console.log(`Generated ${refinedAnalysis.additionalQuestions.length} additional questions`);
        console.log(`Refined confidence: ${refinedAnalysis.confidenceScore}`);
        
        // Convert to frontend format
        const additionalQuestions = refinedAnalysis.additionalQuestions.map((q: TargetedQuestion) => ({
          questionId: q.questionId,
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.options,
          tags: q.tags || []
        }));
        
        return successResponse({
          symptomId: updatedSymptom.symptomId,
          updatedSymptoms: updatedSymptom.structuredSymptoms,
          followUpAnswers: updatedSymptom.followUpAnswers,
          additionalQuestions,
          refinedDiseases: refinedAnalysis.refinedDiseases,
          confidenceScore: refinedAnalysis.confidenceScore,
          round: refinedAnalysis.round,
          message: `Please answer these additional questions for better diagnosis (Round ${refinedAnalysis.round} of 2)`
        });
      } catch (analysisError: any) {
        console.error('CRITICAL ERROR generating additional questions:', analysisError);
        console.error('Error stack:', analysisError.stack);
        console.error('Error details:', JSON.stringify(analysisError, null, 2));
        
        // Return error response instead of silently failing
        return errorResponse(
          `Failed to generate additional questions: ${analysisError.message}. Please try again or contact support.`,
          500
        );
      }
    } else if (totalAnswers >= 10) {
      // All 10 questions answered - generate department prediction and final analysis
      console.log('All 10 questions answered, generating department prediction and AI summary...');
      
      let departmentRecommendation = null;
      let isEmergency = false;
      
      try {
        // Generate department prediction
        const { predictDepartment } = await import('../shared/department-predictor');
        const prediction = await predictDepartment(
          updatedSymptom.rawText,
          updatedSymptom.structuredSymptoms,
          updatedSymptom.followUpAnswers || [],
          updatedSymptom.diseaseAnalysis || []
        );
        
        departmentRecommendation = prediction.department;
        isEmergency = prediction.isEmergency;
        
        console.log(`Department predicted: ${departmentRecommendation}, Emergency: ${isEmergency}`);
      } catch (predictionError) {
        console.error('Error predicting department:', predictionError);
      }
      
      try {
        const { generateSymptomSummary, generateBriefSummary } = await import('../shared/symptom-summarizer');
        
        // Generate comprehensive summary
        const aiSummary = await generateSymptomSummary(
          updatedSymptom.rawText,
          updatedSymptom.structuredSymptoms,
          updatedSymptom.followUpAnswers || [],
          updatedSymptom.diseaseAnalysis || []
        );
        
        // Generate brief summary
        const briefSummary = await generateBriefSummary(
          updatedSymptom.rawText,
          updatedSymptom.structuredSymptoms,
          updatedSymptom.followUpAnswers || []
        );
        
        // Update symptom with summaries
        const { updateSymptomSummaries } = await import('../shared/symptom-db');
        await updateSymptomSummaries(patientId, symptomId, aiSummary, briefSummary);
        
        console.log('AI summaries generated and stored');
      } catch (summaryError) {
        console.error('Error generating summaries:', summaryError);
        // Continue even if summary generation fails
      }
      
      return successResponse({
        symptomId: updatedSymptom.symptomId,
        updatedSymptoms: updatedSymptom.structuredSymptoms,
        followUpAnswers: updatedSymptom.followUpAnswers,
        finalDiseases: updatedSymptom.diseaseAnalysis,
        confidenceScore: 0.95,
        round: 'complete',
        departmentRecommendation,
        isEmergency,
        message: isEmergency 
          ? `⚠️ EMERGENCY: Please visit ${departmentRecommendation} immediately!`
          : `Analysis complete. Recommended department: ${departmentRecommendation}`
      });
    } else {
      // Fallback case - should not reach here
      return successResponse({
        symptomId: updatedSymptom.symptomId,
        updatedSymptoms: updatedSymptom.structuredSymptoms,
        followUpAnswers: updatedSymptom.followUpAnswers,
        round: 'complete',
        message: 'Analysis complete. You can now proceed to care navigation.'
      });
    }
  } catch (error: any) {
    console.error('Error updating symptom with answers:', error);
    return errorResponse(error.message, 500);
  }
}

/**
 * GET /api/symptoms/history/:patientId
 * Get symptom history for a patient
 */
async function handleSymptomHistory(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const patientId = event.pathParameters?.patientId;

  if (!patientId) {
    return errorResponse('Patient ID is required', 400);
  }

  try {
    // Get all symptoms for the patient
    const symptoms = await getPatientSymptoms(patientId);

    return successResponse({
      symptoms: symptoms.map(s => ({
        symptomId: s.symptomId,
        rawText: s.rawText,
        structuredSymptoms: s.structuredSymptoms,
        createdAt: s.createdAt,
        status: s.followUpAnswers && s.followUpAnswers.length > 0 ? 'completed' : 'pending'
      }))
    });
  } catch (error: any) {
    console.error('Error fetching symptom history:', error);
    return errorResponse(error.message, 500);
  }
}

/**
 * GET /api/symptoms/:symptomId
 * Get a single symptom by ID
 */
async function handleGetSymptom(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const symptomId = event.pathParameters?.symptomId;

  if (!symptomId) {
    return errorResponse('Symptom ID is required', 400);
  }

  const patientId = event.queryStringParameters?.patientId;

  if (!patientId) {
    return errorResponse('Patient ID is required', 400);
  }

  try {
    const symptom = await getSymptom(patientId, symptomId);

    if (!symptom) {
      return errorResponse('Symptom not found', 404);
    }

    return successResponse(symptom);
  } catch (error: any) {
    console.error('Error fetching symptom:', error);
    return errorResponse(error.message, 500);
  }
}

/**
 * DELETE /api/symptoms/:symptomId
 * Delete a symptom by ID
 */
async function handleSymptomDelete(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const symptomId = event.pathParameters?.symptomId;

  if (!symptomId) {
    return errorResponse('Symptom ID is required', 400);
  }

  // Get patientId from query string or request context
  const patientId = event.queryStringParameters?.patientId;

  if (!patientId) {
    return errorResponse('Patient ID is required', 400);
  }

  try {
    // Delete the symptom
    await deleteSymptom(patientId, symptomId);

    return successResponse({
      message: 'Symptom deleted successfully',
      symptomId
    });
  } catch (error: any) {
    console.error('Error deleting symptom:', error);
    return errorResponse(error.message, 500);
  }
}

/**
 * POST /api/symptoms/predict-department
 * Predict department without saving to history
 */
async function handlePredictDepartment(body: any): Promise<APIGatewayProxyResult> {
  const validation = validateRequiredFields(body, ['symptomText']);
  if (!validation.valid) {
    return errorResponse('symptomText is required', 400);
  }

  const { symptomText } = body;

  try {
    // Use the department predictor to analyze symptoms
    const { predictDepartment } = await import('../shared/department-predictor');
    
    // Provide minimal structured data for department prediction
    const structuredSymptoms = {
      bodyPart: 'unknown',
      severity: 'moderate',
      duration: 'unknown'
    };
    
    const prediction = await predictDepartment(
      symptomText,
      structuredSymptoms,
      [], // No follow-up answers
      []  // No disease candidates yet
    );

    return successResponse({
      department: prediction.department,
      confidence: prediction.confidence,
      isEmergency: prediction.isEmergency,
      reasoning: prediction.reasoning || 'Based on symptom analysis'
    });
  } catch (error: any) {
    console.error('Department prediction failed:', error);
    return errorResponse('Failed to predict department', 500);
  }
}

/**
 * Main Lambda handler
 * Routes requests based on HTTP method and path
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('Symptom Processor - Event:', JSON.stringify(event, null, 2));

  try {
    // Parse request body
    const body = event.body ? JSON.parse(event.body) : {};

    // Route based on path
    const path = event.path;

    if (path === '/api/symptoms/input' && event.httpMethod === 'POST') {
      return await handleSymptomInput(body);
    }

    if (path === '/api/symptoms/predict-department' && event.httpMethod === 'POST') {
      return await handlePredictDepartment(body);
    }

    if (path === '/api/symptoms/followup/answer' && event.httpMethod === 'POST') {
      return await handleFollowUpAnswer(body);
    }

    if (path.startsWith('/api/symptoms/history/') && event.httpMethod === 'GET') {
      return await handleSymptomHistory(event);
    }

    if (path.match(/^\/api\/symptoms\/[^/]+$/) && event.httpMethod === 'GET') {
      return await handleGetSymptom(event);
    }

    if (path.match(/^\/api\/symptoms\/[^/]+$/) && event.httpMethod === 'DELETE') {
      return await handleSymptomDelete(event);
    }

    if (path.match(/^\/api\/symptoms\/[^/]+\/add-details$/) && event.httpMethod === 'PUT') {
      return await handleAddSymptomDetails(event);
    }

    // Unknown path
    return errorResponse('Not found', 404);
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return errorResponse('Internal server error', 500);
  }
}

/**
 * PUT /api/symptoms/:symptomId/add-details
 * Add more details/symptoms to an existing symptom record
 */
async function handleAddSymptomDetails(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const symptomId = event.pathParameters?.symptomId;

  if (!symptomId) {
    return errorResponse('Symptom ID is required', 400);
  }

  if (!event.body) {
    return errorResponse('Request body is required', 400);
  }

  const body = JSON.parse(event.body);
  const { patientId, additionalText } = body;

  if (!patientId || !additionalText) {
    return errorResponse('patientId and additionalText are required', 400);
  }

  try {
    // Get existing symptom
    const symptom = await getSymptom(patientId, symptomId);
    if (!symptom) {
      return errorResponse('Symptom not found', 404);
    }

    // Append additional text to raw text
    const updatedRawText = `${symptom.rawText}\n\nAdditional details: ${additionalText}`;

    // Re-analyze with the updated text
    const analysis = await performCompleteAnalysis(updatedRawText);

    // Update symptom in database
    const updatedSymptom = await updateSymptomText(
      patientId,
      symptomId,
      updatedRawText,
      analysis.structuredSymptoms,
      analysis.diseaseAnalysis.possibleDiseases,
      analysis.diseaseAnalysis.confidenceScore
    );

    console.log('Symptom updated with additional details:', symptomId);

    return successResponse({
      symptomId: updatedSymptom.symptomId,
      rawText: updatedSymptom.rawText,
      structuredSymptoms: updatedSymptom.structuredSymptoms,
      message: 'Additional details added successfully'
    });
  } catch (error: any) {
    console.error('Error adding symptom details:', error);
    return errorResponse(error.message, 500);
  }
}

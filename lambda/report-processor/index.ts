// Report Processor Lambda Handler
// Handles medical report upload, OCR extraction, and summarization

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { successResponse, errorResponse, validateRequiredFields } from '../shared/response';
import { uploadReport, validateFile, REPORTS_BUCKET } from '../shared/s3-client';
import { extractTextFromDocument, extractTextFromBuffer } from '../shared/textract-client';
import { createReport, generateMedicalTimeline } from '../shared/report-db';
import { callBedrockJson } from '../shared/bedrock-client';
import {
  REPORT_SUMMARIZATION_SYSTEM_PROMPT,
  generateReportSummarizationPrompt
} from '../shared/bedrock-prompts';
import { ReportSummary } from '../shared/types';

/**
 * Report Processor Lambda Handler
 * POST /api/reports/upload - Upload and process medical report
 * GET /api/reports/timeline/:patientId - Get medical timeline
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('Report processor invoked:', event.path);

  try {
    // Handle timeline generation endpoint
    if (event.httpMethod === 'GET' && event.path.includes('/timeline/')) {
      return await handleGetTimeline(event);
    }

    // Handle report upload endpoint
    if (event.httpMethod === 'POST' && event.path.includes('/upload')) {
      return await handleUploadReport(event);
    }

    return errorResponse('Invalid endpoint', 404);
  } catch (error: any) {
    console.error('Error in report processor:', error);
    return errorResponse(error.message || 'Internal server error');
  }
}

/**
 * Handle report upload and processing
 */
async function handleUploadReport(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (!event.body) {
    return errorResponse('Request body is required', 400);
  }

  const body = JSON.parse(event.body);

  // Validate required fields
  const validation = validateRequiredFields(body, ['patientId', 'fileName', 'fileData']);
  if (!validation.valid) {
    return errorResponse(`Missing required fields: ${validation.missing?.join(', ')}`, 400);
  }

  const { patientId, fileName, fileData } = body;

  try {
    // Decode base64 file data
    const fileBuffer = Buffer.from(fileData, 'base64');

    // Validate file
    const fileValidation = validateFile(fileName, fileBuffer.length);
    if (!fileValidation.valid) {
      return errorResponse(fileValidation.error || 'Invalid file', 400);
    }

    console.log(`Processing report for patient ${patientId}: ${fileName}`);

    // Upload to S3 with encryption
    const s3Key = await uploadReport(patientId, fileName, fileBuffer);
    console.log(`Uploaded to S3: ${s3Key}`);

    // Extract text using Textract
    let extractedText: string;
    let ocrError = false;

    try {
      // Try extracting from S3 (preferred method)
      extractedText = await extractTextFromDocument(REPORTS_BUCKET, s3Key);
      console.log(`Extracted ${extractedText.length} characters from document`);
    } catch (textractError: any) {
      console.error('Textract extraction failed:', textractError);
      ocrError = true;
      
      // Return early with manual review message
      return successResponse({
        reportId: null,
        s3Key,
        status: 'manual_review_needed',
        message: 'Manual review needed - OCR processing failed. The file has been stored securely.',
        error: 'OCR extraction failed'
      });
    }

    // Summarize using Bedrock
    let summary: ReportSummary;
    
    try {
      const userPrompt = generateReportSummarizationPrompt(extractedText);
      summary = await callBedrockJson<ReportSummary>(
        REPORT_SUMMARIZATION_SYSTEM_PROMPT,
        userPrompt,
        ['keyFindings', 'diagnoses', 'medications']
      );
      console.log('Generated summary with Bedrock');
    } catch (bedrockError: any) {
      console.error('Bedrock summarization failed:', bedrockError);
      
      // Return with manual review message
      return successResponse({
        reportId: null,
        s3Key,
        extractedText: extractedText.substring(0, 500), // Return first 500 chars
        status: 'manual_review_needed',
        message: 'Manual review needed - AI summarization failed. Text was extracted successfully.',
        error: 'AI summarization failed'
      });
    }

    // Store report in DynamoDB
    const report = await createReport(patientId, s3Key, extractedText, summary);
    console.log(`Stored report ${report.reportId} in DynamoDB`);

    // Generate updated medical timeline
    const timeline = await generateMedicalTimeline(patientId);
    console.log(`Generated timeline with ${timeline.timeline.length} entries`);

    return successResponse({
      reportId: report.reportId,
      s3Key,
      summary,
      timeline: timeline.timeline,
      redFlags: timeline.allRedFlags,
      status: 'success',
      message: 'Report processed successfully'
    });
  } catch (error: any) {
    console.error('Error processing report:', error);
    return errorResponse(
      error.message || 'Failed to process report',
      500
    );
  }
}

/**
 * Handle medical timeline retrieval
 */
async function handleGetTimeline(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  // Extract patientId from path
  const pathParts = event.path.split('/');
  const patientId = pathParts[pathParts.length - 1];

  if (!patientId) {
    return errorResponse('Patient ID is required', 400);
  }

  try {
    console.log(`Generating timeline for patient ${patientId}`);
    
    const timeline = await generateMedicalTimeline(patientId);

    return successResponse({
      patientId,
      timeline: timeline.timeline,
      redFlags: timeline.allRedFlags,
      totalReports: timeline.timeline.length
    });
  } catch (error: any) {
    console.error('Error generating timeline:', error);
    return errorResponse(
      error.message || 'Failed to generate timeline',
      500
    );
  }
}

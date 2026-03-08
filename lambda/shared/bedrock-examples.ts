// Example usage of Bedrock client and prompt templates
// This file demonstrates how to use the Bedrock integration

import { callBedrockJson } from './bedrock-client';
import {
  generateSymptomExtractionPrompt,
  SYMPTOM_EXTRACTION_SYSTEM_PROMPT,
  generateFollowUpPrompt,
  FOLLOWUP_GENERATION_SYSTEM_PROMPT,
  generateDepartmentRecommendationPrompt,
  DEPARTMENT_RECOMMENDATION_SYSTEM_PROMPT,
  generateReportSummarizationPrompt,
  REPORT_SUMMARIZATION_SYSTEM_PROMPT,
  generateSchedulePrompt,
  SCHEDULE_GENERATION_SYSTEM_PROMPT
} from './bedrock-prompts';
import { StructuredSymptoms, FollowUpQuestion, ReportSummary } from './types';

/**
 * Example: Extract structured symptoms from patient text
 */
export async function extractSymptoms(symptomText: string): Promise<StructuredSymptoms> {
  const userPrompt = generateSymptomExtractionPrompt(symptomText);
  
  const result = await callBedrockJson<StructuredSymptoms>(
    SYMPTOM_EXTRACTION_SYSTEM_PROMPT,
    userPrompt,
    ['bodyPart', 'duration', 'severity', 'associatedFactors']
  );
  
  return result;
}

/**
 * Example: Generate follow-up questions based on symptoms
 */
export async function generateFollowUpQuestions(
  structuredSymptoms: StructuredSymptoms
): Promise<FollowUpQuestion[]> {
  const userPrompt = generateFollowUpPrompt(structuredSymptoms);
  
  const result = await callBedrockJson<FollowUpQuestion[]>(
    FOLLOWUP_GENERATION_SYSTEM_PROMPT,
    userPrompt
  );
  
  return result;
}

/**
 * Example: Get department recommendation
 */
export async function getDepartmentRecommendation(
  structuredSymptoms: StructuredSymptoms,
  followUpAnswers: any[] = []
): Promise<{ department: string; urgency: string; reasoning: string }> {
  const userPrompt = generateDepartmentRecommendationPrompt(
    structuredSymptoms,
    followUpAnswers
  );
  
  const result = await callBedrockJson<{
    department: string;
    urgency: string;
    reasoning: string;
  }>(
    DEPARTMENT_RECOMMENDATION_SYSTEM_PROMPT,
    userPrompt,
    ['department', 'urgency', 'reasoning']
  );
  
  return result;
}

/**
 * Example: Summarize medical report
 */
export async function summarizeReport(extractedText: string): Promise<ReportSummary> {
  const userPrompt = generateReportSummarizationPrompt(extractedText);
  
  const result = await callBedrockJson<ReportSummary>(
    REPORT_SUMMARIZATION_SYSTEM_PROMPT,
    userPrompt,
    ['keyFindings', 'diagnoses', 'medications']
  );
  
  return result;
}

/**
 * Example: Generate medicine schedule
 */
export async function generateMedicineSchedule(
  medicineName: string,
  dosage: string,
  frequency: string,
  specialInstructions?: string
): Promise<{
  medicineName: string;
  dosage: string;
  times: string[];
  frequency: string;
  specialInstructions: string;
  foodTiming: string;
}> {
  const userPrompt = generateSchedulePrompt(
    medicineName,
    dosage,
    frequency,
    specialInstructions
  );
  
  const result = await callBedrockJson<{
    medicineName: string;
    dosage: string;
    times: string[];
    frequency: string;
    specialInstructions: string;
    foodTiming: string;
  }>(
    SCHEDULE_GENERATION_SYSTEM_PROMPT,
    userPrompt,
    ['medicineName', 'dosage', 'times', 'frequency']
  );
  
  return result;
}

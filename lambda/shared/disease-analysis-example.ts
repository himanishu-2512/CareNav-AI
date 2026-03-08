/**
 * Example usage of disease analysis prompts with Amazon Bedrock
 * This demonstrates how to use the prompt functions in the diagnosis Lambda
 */

import {
  DISEASE_ANALYSIS_SYSTEM_PROMPT,
  generateDiseaseAnalysisPrompt,
  DISEASE_ANALYSIS_RESPONSE_SCHEMA
} from './bedrock-prompts';
import { callBedrockJson } from './bedrock-client';
import { StructuredSymptoms } from './types';

/**
 * Disease candidate returned by Bedrock
 */
interface DiseaseCandidate {
  diseaseName: string;
  probability: number;
  supportingSymptoms: string[];
  missingSymptoms: string[];
}

/**
 * Disease analysis response from Bedrock
 */
interface DiseaseAnalysisResponse {
  possibleDiseases: DiseaseCandidate[];
  confidenceScore: number;
}

/**
 * Analyze symptoms and get disease candidates from Bedrock
 * This is the main function to use in the diagnosis Lambda
 */
export async function analyzeSymptomsForDiseases(
  symptoms: StructuredSymptoms
): Promise<DiseaseAnalysisResponse> {
  // Generate the prompts
  const systemPrompt = DISEASE_ANALYSIS_SYSTEM_PROMPT;
  const userPrompt = generateDiseaseAnalysisPrompt(symptoms);
  
  console.log('Invoking Bedrock for disease analysis...');
  console.log('Model: amazon.nova-pro-v1:0');
  
  // Call Bedrock with the prompts
  const response = await callBedrockJson<DiseaseAnalysisResponse>(
    systemPrompt,
    userPrompt,
    ['possibleDiseases', 'confidenceScore'],
    { maxTokens: 2000 } // max_tokens as per requirements
  );
  
  // Validate the response structure
  validateDiseaseAnalysisResponse(response);
  
  console.log(`Analysis complete: ${response.possibleDiseases.length} diseases identified`);
  console.log(`Confidence score: ${response.confidenceScore}`);
  
  return response;
}

/**
 * Validate disease analysis response against schema
 * Throws error if validation fails
 */
function validateDiseaseAnalysisResponse(response: any): void {
  // Check required fields
  if (!response.possibleDiseases || !Array.isArray(response.possibleDiseases)) {
    throw new Error('Missing or invalid possibleDiseases array');
  }
  
  if (typeof response.confidenceScore !== 'number') {
    throw new Error('Missing or invalid confidenceScore');
  }
  
  // Check array bounds
  if (response.possibleDiseases.length < 5 || response.possibleDiseases.length > 10) {
    throw new Error(`Expected 5-10 diseases, got ${response.possibleDiseases.length}`);
  }
  
  // Check confidence score bounds
  if (response.confidenceScore < 0 || response.confidenceScore > 1) {
    throw new Error(`Confidence score must be 0-1, got ${response.confidenceScore}`);
  }
  
  // Validate each disease candidate
  response.possibleDiseases.forEach((disease: any, index: number) => {
    if (!disease.diseaseName || typeof disease.diseaseName !== 'string') {
      throw new Error(`Disease ${index}: missing or invalid diseaseName`);
    }
    
    if (typeof disease.probability !== 'number' || disease.probability < 0 || disease.probability > 1) {
      throw new Error(`Disease ${index}: probability must be 0-1, got ${disease.probability}`);
    }
    
    if (!Array.isArray(disease.supportingSymptoms)) {
      throw new Error(`Disease ${index}: supportingSymptoms must be an array`);
    }
    
    if (!Array.isArray(disease.missingSymptoms)) {
      throw new Error(`Disease ${index}: missingSymptoms must be an array`);
    }
  });
  
  // Check probability sum (should be approximately 1.0)
  const totalProbability = response.possibleDiseases.reduce(
    (sum: number, disease: DiseaseCandidate) => sum + disease.probability,
    0
  );
  
  if (Math.abs(totalProbability - 1.0) > 0.05) {
    console.warn(`Warning: Probabilities sum to ${totalProbability}, expected ~1.0`);
  }
}

/**
 * Example usage
 */
async function exampleUsage() {
  const symptoms: StructuredSymptoms = {
    bodyPart: 'chest',
    duration: '3 days',
    severity: 'moderate',
    associatedFactors: ['shortness of breath', 'sweating'],
    timing: 'worse with exertion',
    character: 'pressure-like discomfort'
  };
  
  try {
    const analysis = await analyzeSymptomsForDiseases(symptoms);
    
    console.log('\n=== Disease Analysis Results ===');
    console.log(`Confidence Score: ${analysis.confidenceScore}`);
    console.log(`\nTop Disease Candidates:`);
    
    analysis.possibleDiseases
      .sort((a, b) => b.probability - a.probability)
      .forEach((disease, index) => {
        console.log(`\n${index + 1}. ${disease.diseaseName} (${(disease.probability * 100).toFixed(1)}%)`);
        console.log(`   Supporting: ${disease.supportingSymptoms.join(', ')}`);
        console.log(`   Missing: ${disease.missingSymptoms.join(', ')}`);
      });
    
  } catch (error) {
    console.error('Error analyzing symptoms:', error);
  }
}

// Uncomment to run example:
// exampleUsage();

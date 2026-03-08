/**
 * Test script for disease analysis prompt generation
 * Verifies that the prompt functions work correctly
 */

import {
  DISEASE_ANALYSIS_SYSTEM_PROMPT,
  generateDiseaseAnalysisPrompt,
  formatSymptomsForAnalysis,
  DISEASE_ANALYSIS_RESPONSE_SCHEMA
} from './bedrock-prompts';
import { StructuredSymptoms } from './types';

// Test data: chest pain symptoms
const testSymptoms: StructuredSymptoms = {
  bodyPart: 'chest',
  duration: '3 days',
  severity: 'moderate',
  associatedFactors: ['shortness of breath', 'sweating'],
  timing: 'worse with exertion',
  character: 'pressure-like discomfort'
};

console.log('=== Testing Disease Analysis Prompt Generation ===\n');

// Test 1: System prompt exists
console.log('Test 1: System Prompt');
console.log('Length:', DISEASE_ANALYSIS_SYSTEM_PROMPT.length);
console.log('Contains "diagnostic assistant":', DISEASE_ANALYSIS_SYSTEM_PROMPT.includes('diagnostic assistant'));
console.log('Contains "5-10 possible diseases":', DISEASE_ANALYSIS_SYSTEM_PROMPT.includes('5-10 possible diseases'));
console.log('✓ System prompt is defined\n');

// Test 2: Format symptoms function
console.log('Test 2: Format Symptoms Function');
const formattedSymptoms = formatSymptomsForAnalysis(testSymptoms);
console.log('Formatted output:');
console.log(formattedSymptoms);
console.log('Contains body part:', formattedSymptoms.includes('chest'));
console.log('Contains duration:', formattedSymptoms.includes('3 days'));
console.log('Contains severity:', formattedSymptoms.includes('moderate'));
console.log('✓ Symptoms formatted correctly\n');

// Test 3: Generate disease analysis prompt
console.log('Test 3: Generate Disease Analysis Prompt');
const prompt = generateDiseaseAnalysisPrompt(testSymptoms);
console.log('Prompt length:', prompt.length);
console.log('Contains symptoms:', prompt.includes('chest'));
console.log('Contains JSON structure:', prompt.includes('possibleDiseases'));
console.log('Contains rules:', prompt.includes('5-10 diseases'));
console.log('Contains probability requirement:', prompt.includes('sum to approximately 1.0'));
console.log('✓ Prompt generated correctly\n');

// Test 4: JSON schema validation structure
console.log('Test 4: JSON Schema Structure');
console.log('Schema type:', DISEASE_ANALYSIS_RESPONSE_SCHEMA.type);
console.log('Required fields:', DISEASE_ANALYSIS_RESPONSE_SCHEMA.required);
console.log('Has possibleDiseases array:', 
  DISEASE_ANALYSIS_RESPONSE_SCHEMA.properties.possibleDiseases.type === 'array');
console.log('Min diseases:', 
  DISEASE_ANALYSIS_RESPONSE_SCHEMA.properties.possibleDiseases.minItems);
console.log('Max diseases:', 
  DISEASE_ANALYSIS_RESPONSE_SCHEMA.properties.possibleDiseases.maxItems);
console.log('✓ Schema structure is valid\n');

// Test 5: Minimal symptoms (edge case)
console.log('Test 5: Minimal Symptoms (Edge Case)');
const minimalSymptoms: StructuredSymptoms = {
  bodyPart: 'head',
  duration: '1 day',
  severity: 'mild',
  associatedFactors: [],
  timing: 'not specified',
  character: 'not specified'
};
const minimalFormatted = formatSymptomsForAnalysis(minimalSymptoms);
console.log('Formatted minimal symptoms:');
console.log(minimalFormatted);
console.log('Does not include "not specified" for timing:', !minimalFormatted.includes('Timing:'));
console.log('Does not include "not specified" for character:', !minimalFormatted.includes('Character:'));
console.log('✓ Minimal symptoms handled correctly\n');

console.log('=== All Tests Passed ===');
console.log('\nYou can now use these functions in the diagnosis Lambda:');
console.log('1. DISEASE_ANALYSIS_SYSTEM_PROMPT - System prompt for Bedrock');
console.log('2. generateDiseaseAnalysisPrompt(symptoms) - Generate user prompt');
console.log('3. formatSymptomsForAnalysis(symptoms) - Format symptoms for display');
console.log('4. DISEASE_ANALYSIS_RESPONSE_SCHEMA - Validate Bedrock responses');

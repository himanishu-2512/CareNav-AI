// Test script for disease refinement prompt generation
// Run with: npx ts-node lambda/shared/test-disease-refinement-prompt.ts

import {
  DISEASE_REFINEMENT_SYSTEM_PROMPT,
  generateDiseaseRefinementPrompt,
  DISEASE_REFINEMENT_RESPONSE_SCHEMA
} from './bedrock-prompts';
import { DiseaseCandidate, TargetedQuestion, QuestionAnswer, StructuredSymptoms } from './types';

console.log('=== Testing Disease Refinement Prompt ===\n');

// Sample data for testing
const currentDiseases: DiseaseCandidate[] = [
  {
    diseaseName: 'Angina Pectoris',
    probability: 0.35,
    supportingSymptoms: ['chest pressure', 'exertional', 'duration 3 days'],
    missingSymptoms: ['radiation pattern', 'relief with rest', 'previous episodes']
  },
  {
    diseaseName: 'Myocardial Infarction',
    probability: 0.25,
    supportingSymptoms: ['chest discomfort', 'sweating', 'moderate severity'],
    missingSymptoms: ['nausea', 'arm pain', 'sudden onset']
  },
  {
    diseaseName: 'Costochondritis',
    probability: 0.20,
    supportingSymptoms: ['chest pain', 'localized'],
    missingSymptoms: ['tenderness on palpation', 'worse with movement']
  },
  {
    diseaseName: 'GERD',
    probability: 0.15,
    supportingSymptoms: ['chest discomfort'],
    missingSymptoms: ['burning sensation', 'worse after meals', 'acid reflux']
  }
];

const questions: TargetedQuestion[] = [
  {
    questionId: 'q1_r2',
    questionText: 'Does the discomfort spread to your arm, neck, or jaw?',
    questionType: 'yes_no',
    targetDiseases: ['Angina Pectoris', 'Myocardial Infarction'],
    importance: 'high'
  },
  {
    questionId: 'q2_r2',
    questionText: 'Does resting make the discomfort better?',
    questionType: 'yes_no',
    targetDiseases: ['Angina Pectoris', 'Costochondritis'],
    importance: 'high'
  },
  {
    questionId: 'q3_r2',
    questionText: 'On a scale of 1-10, how would you rate the intensity?',
    questionType: 'scale',
    targetDiseases: ['Myocardial Infarction', 'GERD'],
    importance: 'medium'
  }
];

const answers: QuestionAnswer[] = [
  {
    questionId: 'q1_r2',
    answer: 'yes',
    timestamp: '2024-01-15T10:30:00Z'
  },
  {
    questionId: 'q2_r2',
    answer: 'yes',
    timestamp: '2024-01-15T10:30:15Z'
  },
  {
    questionId: 'q3_r2',
    answer: '6',
    timestamp: '2024-01-15T10:30:30Z'
  }
];

const initialSymptoms: StructuredSymptoms = {
  bodyPart: 'chest',
  duration: '3 days',
  severity: 'moderate',
  associatedFactors: ['shortness of breath', 'sweating'],
  timing: 'worse with exertion',
  character: 'pressure-like discomfort'
};

// Test 1: System Prompt
console.log('1. System Prompt:');
console.log(DISEASE_REFINEMENT_SYSTEM_PROMPT);
console.log('\n' + '='.repeat(80) + '\n');

// Test 2: User Prompt Generation
console.log('2. Generated User Prompt:');
const userPrompt = generateDiseaseRefinementPrompt(
  currentDiseases,
  questions,
  answers,
  initialSymptoms
);
console.log(userPrompt);
console.log('\n' + '='.repeat(80) + '\n');

// Test 3: JSON Schema
console.log('3. Response Validation Schema:');
console.log(JSON.stringify(DISEASE_REFINEMENT_RESPONSE_SCHEMA, null, 2));
console.log('\n' + '='.repeat(80) + '\n');

// Test 4: Expected Response Format
console.log('4. Expected Response Format:');
const expectedResponse = {
  possibleDiseases: [
    {
      diseaseName: 'Angina Pectoris',
      probability: 0.65,
      supportingSymptoms: ['chest pressure', 'exertional', 'radiating to arm', 'relieved by rest'],
      missingSymptoms: ['previous episodes'],
      reasoning: 'Radiation pattern and relief with rest strongly support angina'
    },
    {
      diseaseName: 'Myocardial Infarction',
      probability: 0.25,
      supportingSymptoms: ['chest discomfort', 'sweating', 'radiating pain'],
      missingSymptoms: ['sudden onset', 'severe intensity'],
      reasoning: 'Some features present but less severe presentation'
    },
    {
      diseaseName: 'Costochondritis',
      probability: 0.08,
      supportingSymptoms: ['chest pain'],
      missingSymptoms: ['tenderness on palpation', 'worse with movement', 'no radiation'],
      reasoning: 'Less likely given radiation pattern and exertional nature'
    }
  ],
  confidenceScore: 0.75,
  keyFindings: [
    'Pain radiates to arm and jaw',
    'Symptoms improve with rest',
    'Exertional pattern consistent'
  ]
};
console.log(JSON.stringify(expectedResponse, null, 2));
console.log('\n' + '='.repeat(80) + '\n');

console.log('✅ Disease Refinement Prompt Test Complete!');
console.log('\nKey Features:');
console.log('- System prompt defines role and context');
console.log('- User prompt includes current diseases, questions, answers, and initial symptoms');
console.log('- Prompt instructs AI to update probabilities based on answers');
console.log('- Prompt instructs AI to remove diseases with probability < 0.05');
console.log('- JSON schema validates response structure');
console.log('- Response includes reasoning for probability changes');
console.log('- Response includes keyFindings from the round');
console.log('- Confidence score reflects diagnostic certainty');

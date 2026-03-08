/**
 * Test script for question generation prompt
 * Verifies the prompt formatting and structure
 */

import {
  QUESTION_GENERATION_SYSTEM_PROMPT,
  generateQuestionGenerationPrompt,
  formatDiseaseCandidatesForPrompt,
  formatQuestionHistoryForPrompt,
  QUESTION_GENERATION_RESPONSE_SCHEMA
} from './bedrock-prompts';
import { DiseaseCandidate, QuestionRound, TargetedQuestion, QuestionAnswer } from './types';

// Sample disease candidates
const sampleDiseases: DiseaseCandidate[] = [
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
    probability: 0.15,
    supportingSymptoms: ['chest pain', 'localized'],
    missingSymptoms: ['tenderness on palpation', 'worse with movement']
  },
  {
    diseaseName: 'GERD',
    probability: 0.15,
    supportingSymptoms: ['chest discomfort', 'duration'],
    missingSymptoms: ['burning sensation', 'worse after meals', 'acid reflux']
  },
  {
    diseaseName: 'Anxiety',
    probability: 0.10,
    supportingSymptoms: ['chest discomfort', 'sweating'],
    missingSymptoms: ['palpitations', 'stress triggers', 'breathing difficulty']
  }
];

// Sample question history (Round 1)
const sampleQuestionHistory: QuestionRound[] = [
  {
    roundNumber: 1,
    questions: [
      {
        questionId: 'q1_r1',
        questionText: 'Does the discomfort spread to your arm, neck, or jaw?',
        questionType: 'yes_no',
        targetDiseases: ['Angina Pectoris', 'Myocardial Infarction'],
        importance: 'high'
      },
      {
        questionId: 'q2_r1',
        questionText: 'Have you experienced nausea or lightheadedness?',
        questionType: 'yes_no',
        targetDiseases: ['Myocardial Infarction'],
        importance: 'high'
      },
      {
        questionId: 'q3_r1',
        questionText: 'Do you have a history of heart problems in your family?',
        questionType: 'yes_no',
        targetDiseases: ['Angina Pectoris', 'Myocardial Infarction'],
        importance: 'medium'
      }
    ],
    answers: [
      { questionId: 'q1_r1', answer: 'yes', timestamp: '2024-01-15T10:30:00Z' },
      { questionId: 'q2_r1', answer: 'yes', timestamp: '2024-01-15T10:30:15Z' },
      { questionId: 'q3_r1', answer: 'no', timestamp: '2024-01-15T10:30:30Z' }
    ],
    diseasesBeforeRound: sampleDiseases,
    diseasesAfterRound: sampleDiseases,
    timestamp: '2024-01-15T10:30:00Z'
  }
];

console.log('=== Testing Question Generation Prompt ===\n');

// Test 1: System prompt
console.log('1. System Prompt:');
console.log(QUESTION_GENERATION_SYSTEM_PROMPT);
console.log('\n---\n');

// Test 2: Format disease candidates
console.log('2. Formatted Disease Candidates:');
const formattedDiseases = formatDiseaseCandidatesForPrompt(sampleDiseases);
console.log(formattedDiseases);
console.log('\n---\n');

// Test 3: Format question history
console.log('3. Formatted Question History:');
const formattedHistory = formatQuestionHistoryForPrompt(sampleQuestionHistory);
console.log(formattedHistory);
console.log('\n---\n');

// Test 4: Format question history (empty)
console.log('4. Formatted Question History (Empty):');
const emptyHistory = formatQuestionHistoryForPrompt([]);
console.log(emptyHistory);
console.log('\n---\n');

// Test 5: Complete user prompt (Round 2)
console.log('5. Complete User Prompt (Round 2):');
const userPrompt = generateQuestionGenerationPrompt(sampleDiseases, sampleQuestionHistory, 2);
console.log(userPrompt);
console.log('\n---\n');

// Test 6: Complete user prompt (Round 1 - no history)
console.log('6. Complete User Prompt (Round 1 - No History):');
const userPromptRound1 = generateQuestionGenerationPrompt(sampleDiseases, [], 1);
console.log(userPromptRound1);
console.log('\n---\n');

// Test 7: JSON Schema
console.log('7. Question Generation Response Schema:');
console.log(JSON.stringify(QUESTION_GENERATION_RESPONSE_SCHEMA, null, 2));
console.log('\n---\n');

// Test 8: Verify disease names are NOT in prompt instructions
console.log('8. Verification - Disease Name Isolation:');
const promptText = userPrompt.toLowerCase();
const hasDiseaseMentionWarning = promptText.includes('do not mention disease names') || 
                                  promptText.includes('no disease names');
console.log(`✓ Prompt explicitly forbids disease names: ${hasDiseaseMentionWarning}`);

// Test 9: Verify all required elements are present
console.log('\n9. Verification - Required Elements:');
const requiredElements = [
  'Current Disease Candidates:',
  'Previous Questions Asked:',
  'Current Round:',
  'Generate 3-5 questions',
  'questionId',
  'questionText',
  'questionType',
  'targetDiseases',
  'importance'
];

requiredElements.forEach(element => {
  const present = userPrompt.includes(element);
  console.log(`${present ? '✓' : '✗'} Contains "${element}": ${present}`);
});

console.log('\n=== Test Complete ===');

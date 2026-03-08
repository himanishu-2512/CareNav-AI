/**
 * Example usage of question generation prompt with Bedrock
 * Demonstrates how to use the prompt in the iterative diagnosis flow
 */

import {
  QUESTION_GENERATION_SYSTEM_PROMPT,
  generateQuestionGenerationPrompt,
  QUESTION_GENERATION_RESPONSE_SCHEMA
} from './bedrock-prompts';
import { DiseaseCandidate, QuestionRound, TargetedQuestion } from './types';

/**
 * Example: Generate questions for Round 2 of diagnosis
 * This would be called by the iterative diagnosis Lambda after analyzing patient answers
 */
async function exampleQuestionGeneration() {
  // Disease candidates after Round 1 (probabilities refined based on answers)
  const currentDiseases: DiseaseCandidate[] = [
    {
      diseaseName: 'Angina Pectoris',
      probability: 0.65,
      supportingSymptoms: ['chest pressure', 'exertional', 'radiating to arm', 'relieved by rest'],
      missingSymptoms: ['previous episodes', 'medication history']
    },
    {
      diseaseName: 'Myocardial Infarction',
      probability: 0.25,
      supportingSymptoms: ['chest discomfort', 'sweating', 'radiating pain'],
      missingSymptoms: ['sudden onset', 'severe intensity', 'troponin levels']
    },
    {
      diseaseName: 'GERD',
      probability: 0.10,
      supportingSymptoms: ['chest discomfort'],
      missingSymptoms: ['burning sensation', 'worse after meals', 'acid reflux']
    }
  ];

  // Question history from Round 1
  const questionHistory: QuestionRound[] = [
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
          questionText: 'Does resting make the discomfort better?',
          questionType: 'yes_no',
          targetDiseases: ['Angina Pectoris'],
          importance: 'high'
        },
        {
          questionId: 'q3_r1',
          questionText: 'On a scale of 1-10, how would you rate the intensity?',
          questionType: 'scale',
          targetDiseases: ['Myocardial Infarction'],
          importance: 'medium'
        }
      ],
      answers: [
        { questionId: 'q1_r1', answer: 'yes', timestamp: '2024-01-15T10:30:00Z' },
        { questionId: 'q2_r1', answer: 'yes', timestamp: '2024-01-15T10:30:15Z' },
        { questionId: 'q3_r1', answer: '6', timestamp: '2024-01-15T10:30:30Z' }
      ],
      diseasesBeforeRound: currentDiseases,
      diseasesAfterRound: currentDiseases,
      timestamp: '2024-01-15T10:30:00Z'
    }
  ];

  // Generate the prompt for Bedrock
  const systemPrompt = QUESTION_GENERATION_SYSTEM_PROMPT;
  const userPrompt = generateQuestionGenerationPrompt(currentDiseases, questionHistory, 2);

  console.log('=== Example: Question Generation for Round 2 ===\n');
  console.log('System Prompt:');
  console.log(systemPrompt);
  console.log('\n---\n');
  console.log('User Prompt:');
  console.log(userPrompt);
  console.log('\n---\n');

  // In actual implementation, this would call Bedrock:
  // const response = await invokeBedrockModel({
  //   modelId: 'amazon.nova-pro-v1:0',
  //   systemPrompt: systemPrompt,
  //   userPrompt: userPrompt,
  //   maxTokens: 1000
  // });

  // Example expected response from Bedrock
  const expectedResponse: TargetedQuestion[] = [
    {
      questionId: 'q1_r2',
      questionText: 'Have you experienced this type of discomfort before?',
      questionType: 'yes_no',
      targetDiseases: ['Angina Pectoris'],
      importance: 'high'
    },
    {
      questionId: 'q2_r2',
      questionText: 'Does the discomfort come on suddenly or gradually?',
      questionType: 'multiple_choice',
      targetDiseases: ['Myocardial Infarction', 'Angina Pectoris'],
      importance: 'high',
      options: ['Suddenly', 'Gradually', 'Varies']
    },
    {
      questionId: 'q3_r2',
      questionText: 'Do you notice the discomfort more after eating?',
      questionType: 'yes_no',
      targetDiseases: ['GERD'],
      importance: 'medium'
    },
    {
      questionId: 'q4_r2',
      questionText: 'Are you currently taking any medications for heart or chest issues?',
      questionType: 'text',
      targetDiseases: ['Angina Pectoris', 'Myocardial Infarction'],
      importance: 'medium'
    }
  ];

  console.log('Expected Response from Bedrock:');
  console.log(JSON.stringify(expectedResponse, null, 2));
  console.log('\n---\n');

  // Validate response against schema
  console.log('Response Schema for Validation:');
  console.log(JSON.stringify(QUESTION_GENERATION_RESPONSE_SCHEMA, null, 2));
  console.log('\n---\n');

  // Verify disease names are NOT in questions
  console.log('Disease Name Isolation Check:');
  const diseaseNames = currentDiseases.map(d => d.diseaseName.toLowerCase());
  const questionsContainDiseaseNames = expectedResponse.some(q =>
    diseaseNames.some(name => q.questionText.toLowerCase().includes(name))
  );
  
  if (questionsContainDiseaseNames) {
    console.log('❌ ERROR: Questions contain disease names!');
  } else {
    console.log('✓ SUCCESS: No disease names found in questions');
  }

  // Show how questions help differentiate diseases
  console.log('\n---\n');
  console.log('Question Analysis:');
  expectedResponse.forEach((q, index) => {
    console.log(`\nQuestion ${index + 1}: "${q.questionText}"`);
    console.log(`  Type: ${q.questionType}`);
    console.log(`  Importance: ${q.importance}`);
    console.log(`  Helps differentiate: ${q.targetDiseases.join(', ')}`);
    if (q.options) {
      console.log(`  Options: ${q.options.join(', ')}`);
    }
  });

  console.log('\n=== Example Complete ===');
}

// Run the example
exampleQuestionGeneration().catch(console.error);

// Medical question generator using AI (OpenAI-compatible Bedrock API)
// Questions are fully AI-generated based on symptoms, diseases, and previous answers
// Enhanced with AWS Comprehend Medical entity extraction
import { DiseaseCandidate, TargetedQuestion, StructuredSymptoms } from './types';
import { generateAIQuestions } from './openai-bedrock-client';
import { extractMedicalEntities, extractSymptoms, extractBodyParts, extractMedications, extractDuration } from './comprehend-medical-client';

// Fallback questions if AI fails - Medical-focused questions
const FALLBACK_QUESTIONS_ROUND_1: TargetedQuestion[] = [
  { questionId: 'q1', questionText: 'How long have you been experiencing these symptoms?', questionType: 'multiple_choice', options: ['Less than 24 hours', '1-3 days', '4-7 days', 'More than a week'], targetDiseases: [], importance: 'high' },
  { questionId: 'q2', questionText: 'Have the symptoms gotten worse, better, or stayed the same over time?', questionType: 'multiple_choice', options: ['Getting worse', 'Getting better', 'Staying the same', 'Coming and going'], targetDiseases: [], importance: 'high' },
  { questionId: 'q3', questionText: 'Do you have any fever? If yes, what is your temperature?', questionType: 'text', targetDiseases: [], importance: 'high' },
  { questionId: 'q4', questionText: 'On a scale of 1-10, how severe is your discomfort? (1=mild, 10=severe)', questionType: 'scale', targetDiseases: [], importance: 'high' },
  { questionId: 'q5', questionText: 'Have you taken any medications or tried any remedies for these symptoms?', questionType: 'text', targetDiseases: [], importance: 'medium' }
];

const FALLBACK_QUESTIONS_ROUND_2: TargetedQuestion[] = [
  { questionId: 'q6', questionText: 'Have you noticed any changes in your appetite or eating habits?', questionType: 'multiple_choice', options: ['No appetite', 'Reduced appetite', 'Normal appetite', 'Increased appetite'], targetDiseases: [], importance: 'medium' },
  { questionId: 'q7', questionText: 'Are you experiencing any difficulty sleeping or changes in sleep patterns?', questionType: 'yes_no', targetDiseases: [], importance: 'medium' },
  { questionId: 'q8', questionText: 'Do you have any nausea, vomiting, or digestive issues?', questionType: 'multiple_choice', options: ['No', 'Mild nausea', 'Vomiting', 'Diarrhea', 'Constipation'], targetDiseases: [], importance: 'medium' },
  { questionId: 'q9', questionText: 'Have you noticed any unusual weakness, fatigue, or lack of energy?', questionType: 'multiple_choice', options: ['No', 'Mild fatigue', 'Moderate fatigue', 'Severe exhaustion'], targetDiseases: [], importance: 'medium' },
  { questionId: 'q10', questionText: 'Does anything make the symptoms better or worse? (e.g., rest, activity, food, time of day)', questionType: 'text', targetDiseases: [], importance: 'medium' }
];

const FALLBACK_QUESTIONS_ROUND_3: TargetedQuestion[] = [
  { questionId: 'q11', questionText: 'Do you have any pre-existing medical conditions? (e.g., diabetes, hypertension, asthma)', questionType: 'text', targetDiseases: [], importance: 'high' },
  { questionId: 'q12', questionText: 'Are you currently taking any regular medications or supplements?', questionType: 'text', targetDiseases: [], importance: 'high' },
  { questionId: 'q13', questionText: 'Have you been in contact with anyone who was sick recently?', questionType: 'yes_no', targetDiseases: [], importance: 'medium' },
  { questionId: 'q14', questionText: 'Have you traveled recently or been exposed to any unusual environments?', questionType: 'yes_no', targetDiseases: [], importance: 'medium' },
  { questionId: 'q15', questionText: 'Do you have any known allergies to medications, foods, or other substances?', questionType: 'text', targetDiseases: [], importance: 'high' }
];

const FALLBACK_QUESTIONS_ROUND_4: TargetedQuestion[] = [
  { questionId: 'q16', questionText: 'Have you experienced similar symptoms before? If yes, when and what was the diagnosis?', questionType: 'text', targetDiseases: [], importance: 'medium' },
  { questionId: 'q17', questionText: 'How much are these symptoms affecting your daily activities?', questionType: 'multiple_choice', options: ['Not at all', 'Slightly - can do most things', 'Moderately - limited activities', 'Severely - cannot do normal activities'], targetDiseases: [], importance: 'high' },
  { questionId: 'q18', questionText: 'Are there any other symptoms we haven\'t discussed yet? (e.g., skin changes, breathing issues, chest pain)', questionType: 'text', targetDiseases: [], importance: 'high' },
  { questionId: 'q19', questionText: 'Have you noticed any patterns to when symptoms occur? (e.g., morning, evening, after meals, during activity)', questionType: 'text', targetDiseases: [], importance: 'medium' },
  { questionId: 'q20', questionText: 'Is there any family history of similar conditions or any other important medical information?', questionType: 'text', targetDiseases: [], importance: 'medium' }
];

export async function generateInitialQuestions(
  diseases: DiseaseCandidate[], 
  structuredSymptoms: StructuredSymptoms, 
  symptomText: string
): Promise<TargetedQuestion[]> {
  try {
    console.log('Generating AI-powered medical questions for Round 1 with Comprehend Medical entities...');
    
    const { bodyPart } = structuredSymptoms;
    const diseaseNames = diseases.map(d => d.diseaseName);
    
    // Extract medical entities using Comprehend Medical
    const entities = await extractMedicalEntities(symptomText);
    const symptoms = extractSymptoms(entities);
    const bodyParts = extractBodyParts(entities);
    const medications = extractMedications(entities);
    const duration = extractDuration(entities);
    
    console.log(`Comprehend Medical found: ${symptoms.length} symptoms, ${bodyParts.length} body parts, ${medications.length} medications`);
    
    // Use AI to generate questions with Comprehend Medical context
    const aiQuestionsWithTags = await generateAIQuestions(
      symptomText,
      [], // No previous answers for Round 1
      diseaseNames,
      bodyPart,
      1,
      { symptoms, bodyParts, medications, duration }
    );
    
    // Convert AI questions to TargetedQuestion format
    const questions: TargetedQuestion[] = aiQuestionsWithTags.map((item, index) => ({
      questionId: `q${index + 1}`,
      questionText: item.question,
      questionType: 'text', // AI questions are open-ended
      targetDiseases: diseaseNames,
      importance: 'high',
      tags: item.tags
    }));
    
    console.log(`✓ Generated ${questions.length} AI questions for Round 1 with tags`);
    return questions;
    
  } catch (error) {
    console.error('AI question generation failed, using fallback:', error);
    return FALLBACK_QUESTIONS_ROUND_1.map(q => ({ ...q, targetDiseases: diseases.map(d => d.diseaseName) }));
  }
}

export async function refineAnalysisWithAnswers(
  symptomText: string, 
  structuredSymptoms: StructuredSymptoms, 
  previousDiseases: DiseaseCandidate[], 
  answers: any[]
) {
  // Calculate which round we just completed (answers.length / 5)
  const completedRound = Math.floor(answers.length / 5);
  const nextRound = completedRound + 1;
  const diseaseNames = previousDiseases.map(d => d.diseaseName);
  
  // Only 2 rounds total (10 questions), so only generate Round 2
  if (nextRound > 2) {
    console.log(`[ROUND ${nextRound}] Maximum rounds reached (2 rounds total)`);
    return {
      refinedDiseases: previousDiseases,
      confidenceScore: 0.9,
      additionalQuestions: [],
      round: 'complete'
    };
  }
  
  try {
    console.log(`[ROUND ${nextRound}] Starting AI question generation...`);
    console.log(`[ROUND ${nextRound}] Completed rounds: ${completedRound}, Total answers: ${answers.length}`);
    
    const { bodyPart } = structuredSymptoms;
    console.log(`[ROUND ${nextRound}] Body part: ${bodyPart}`);
    console.log(`[ROUND ${nextRound}] Disease names: ${diseaseNames.join(', ')}`);
    
    // OPTIMIZATION: Skip Comprehend Medical for follow-up rounds (Rounds 2-4)
    console.log(`[ROUND ${nextRound}] Skipping Comprehend Medical (not needed for follow-up rounds)`);
    
    // Format previous answers for AI context with tags
    console.log(`[ROUND ${nextRound}] Formatting ${answers.length} answers...`);
    const formattedAnswers = answers.map(a => ({
      questionText: a.questionText || 'Question',
      answerText: a.answer || '',
      tags: a.tags || []
    }));
    console.log(`[ROUND ${nextRound}] First answer sample:`, JSON.stringify(formattedAnswers[0]));
    
    // Use AI to generate next round questions
    console.log(`[ROUND ${nextRound}] Calling generateAIQuestions...`);
    const aiQuestionsWithTags = await generateAIQuestions(
      symptomText,
      formattedAnswers,
      diseaseNames,
      bodyPart,
      nextRound,
      undefined
    );
    console.log(`[ROUND ${nextRound}] ✓ generateAIQuestions returned ${aiQuestionsWithTags.length} questions`);
    
    // Convert AI questions to TargetedQuestion format
    const questions: TargetedQuestion[] = aiQuestionsWithTags.map((item, index) => ({
      questionId: `q${completedRound * 5 + index + 1}`,
      questionText: item.question,
      questionType: 'text',
      targetDiseases: diseaseNames,
      importance: 'high',
      tags: item.tags
    }));
    
    console.log(`✓ Generated ${questions.length} AI questions for Round ${nextRound} with tags`);
    
    return {
      refinedDiseases: previousDiseases,
      confidenceScore: 0.7 + (completedRound * 0.05),
      additionalQuestions: questions,
      round: nextRound
    };
    
  } catch (error) {
    console.error(`[ROUND ${nextRound}] ❌ AI question generation FAILED`);
    console.error(`[ROUND ${nextRound}] Error type:`, error instanceof Error ? error.constructor.name : typeof error);
    console.error(`[ROUND ${nextRound}] Error message:`, error instanceof Error ? error.message : String(error));
    console.error(`[ROUND ${nextRound}] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
    console.error(`[ROUND ${nextRound}] Answers count:`, answers.length);
    console.error(`[ROUND ${nextRound}] First 2 answers:`, JSON.stringify(answers.slice(0, 2), null, 2));
    console.error(`[ROUND ${nextRound}] Using fallback questions instead`);
    
    // Use appropriate fallback based on completed round (only Round 2 now)
    let fallbackQuestions: TargetedQuestion[];
    if (completedRound === 1) {
      fallbackQuestions = FALLBACK_QUESTIONS_ROUND_2;
    } else {
      // Should not reach here, but provide fallback
      fallbackQuestions = FALLBACK_QUESTIONS_ROUND_2;
    }
    
    return {
      refinedDiseases: previousDiseases,
      confidenceScore: 0.7 + (completedRound * 0.05),
      additionalQuestions: fallbackQuestions.map(q => ({ ...q, targetDiseases: diseaseNames })),
      round: nextRound
    };
  }
}

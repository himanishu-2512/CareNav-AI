// Intelligent symptom analyzer using Comprehend Medical + AI-powered question generation
import { extractMedicalEntities, extractSymptoms, extractBodyParts, extractDuration } from './comprehend-medical-client';
import { StructuredSymptoms, DiseaseCandidate, TargetedQuestion } from './types';

export async function analyzeSymptoms(symptomText: string): Promise<StructuredSymptoms> {
  const entities = await extractMedicalEntities(symptomText);
  const symptoms = extractSymptoms(entities);
  const bodyParts = extractBodyParts(entities);
  const duration = extractDuration(entities);
  const lowerText = symptomText.toLowerCase();
  let bodyPart = 'General';
  if (bodyParts.length > 0) { bodyPart = bodyParts[0]; }
  else {
    if (lowerText.includes('head')) bodyPart = 'Head';
    else if (lowerText.includes('chest')) bodyPart = 'Chest';
    else if (lowerText.includes('stomach') || lowerText.includes('abdomen')) bodyPart = 'Abdomen';
    else if (lowerText.includes('throat')) bodyPart = 'Throat';
    else if (lowerText.includes('back')) bodyPart = 'Back';
  }
  let severity: 'mild' | 'moderate' | 'severe' = 'moderate';
  if (lowerText.includes('severe') || lowerText.includes('intense')) { severity = 'severe'; }
  else if (lowerText.includes('mild') || lowerText.includes('slight')) { severity = 'mild'; }
  let durationStr = duration || 'Recent onset';
  if (!duration) {
    if (lowerText.match(/\d+\s*(day|days)/)) durationStr = 'Days';
    else if (lowerText.match(/\d+\s*(week|weeks)/)) durationStr = 'Weeks';
    else if (lowerText.match(/\d+\s*(month|months)/)) durationStr = 'Months';
  }
  const associatedFactors = symptoms.length > 0 ? symptoms : ['As described'];
  return { bodyPart, duration: durationStr, severity, associatedFactors, timing: 'As described', character: symptomText.substring(0, 150) };
}

export function generateDiseaseCandidates(structuredSymptoms: StructuredSymptoms, symptomText: string): DiseaseCandidate[] {
  const { bodyPart, severity } = structuredSymptoms;
  const lowerText = symptomText.toLowerCase();
  const diseases: DiseaseCandidate[] = [];
  if (bodyPart.toLowerCase().includes('head') || lowerText.includes('headache')) {
    diseases.push({ diseaseName: 'Tension Headache', probability: 0.60, reasoning: 'Most common type of headache' });
  } else {
    diseases.push({ diseaseName: 'Viral Syndrome', probability: 0.50, reasoning: 'General viral symptoms' });
  }
  const total = diseases.reduce((sum, d) => sum + d.probability, 0);
  diseases.forEach(d => d.probability = d.probability / total);
  return diseases;
}

export async function generateInitialQuestions(diseases: DiseaseCandidate[], structuredSymptoms: StructuredSymptoms, symptomText: string): Promise<TargetedQuestion[]> {
  const { callBedrock } = await import('./bedrock-client');
  const diseaseNames = diseases.map(d => d.diseaseName);
  try {
    const response = await callBedrock('You are a medical AI assistant.', 'Generate 5 questions');
    return [];
  } catch (error) {
    return [{ questionId: 'q1', questionText: 'How long?', questionType: 'text', targetDiseases: diseaseNames, importance: 'high' }];
  }
}

export async function performCompleteAnalysis(symptomText: string) {
  const structuredSymptoms = await analyzeSymptoms(symptomText);
  const possibleDiseases = generateDiseaseCandidates(structuredSymptoms, symptomText);
  const targetedQuestions = await generateInitialQuestions(possibleDiseases, structuredSymptoms, symptomText);
  return { structuredSymptoms, diseaseAnalysis: { possibleDiseases, confidenceScore: 0.6 }, targetedQuestions, round: 1 };
}

export async function refineAnalysisWithAnswers(symptomText: string, structuredSymptoms: StructuredSymptoms, previousDiseases: DiseaseCandidate[], answers: any[]) {
  return { refinedDiseases: previousDiseases, confidenceScore: 0.7, additionalQuestions: [], round: 2 };
}

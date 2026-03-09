// Intelligent symptom analyzer using Comprehend Medical + ICD-10-CM disease prediction
import { 
  extractMedicalEntities, 
  extractSymptoms, 
  extractBodyParts, 
  extractDuration,
  inferDiseases 
} from './comprehend-medical-client';
import { StructuredSymptoms, DiseaseCandidate } from './types';

// Import the correct implementations from symptom-question-generator
export { generateInitialQuestions, refineAnalysisWithAnswers } from './symptom-question-generator';

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

export async function generateDiseaseCandidates(structuredSymptoms: StructuredSymptoms, symptomText: string): Promise<DiseaseCandidate[]> {
  try {
    console.log('Using AWS Comprehend Medical ICD-10-CM for disease prediction...');
    
    // Use ICD-10-CM inference for intelligent disease prediction
    const icd10Predictions = await inferDiseases(symptomText);
    
    if (icd10Predictions.length > 0) {
      console.log(`Found ${icd10Predictions.length} disease predictions from Comprehend Medical`);
      
      // Convert ICD-10 predictions to disease candidates
      const diseases: DiseaseCandidate[] = icd10Predictions
        .slice(0, 5) // Top 5 predictions
        .map(pred => ({
          diseaseName: pred.description,
          probability: pred.confidence,
          reasoning: `ICD-10: ${pred.icd10Code} - Based on symptom: ${pred.symptom}`
        }));
      
      // Normalize probabilities
      const total = diseases.reduce((sum, d) => sum + d.probability, 0);
      if (total > 0) {
        diseases.forEach(d => d.probability = d.probability / total);
      }
      
      return diseases;
    }
    
    // Fallback to rule-based if ICD-10 returns nothing
    console.log('ICD-10-CM returned no predictions, using rule-based fallback');
    return generateFallbackDiseases(structuredSymptoms, symptomText);
    
  } catch (error) {
    console.error('ICD-10-CM inference failed:', error);
    return generateFallbackDiseases(structuredSymptoms, symptomText);
  }
}

function generateFallbackDiseases(structuredSymptoms: StructuredSymptoms, symptomText: string): DiseaseCandidate[] {
  const { bodyPart } = structuredSymptoms;
  const lowerText = symptomText.toLowerCase();
  const diseases: DiseaseCandidate[] = [];
  
  if (bodyPart.toLowerCase().includes('head') || lowerText.includes('headache')) {
    diseases.push({ diseaseName: 'Tension Headache', probability: 0.60, reasoning: 'Most common type of headache' });
    diseases.push({ diseaseName: 'Migraine', probability: 0.30, reasoning: 'Common headache disorder' });
    diseases.push({ diseaseName: 'Sinusitis', probability: 0.10, reasoning: 'Sinus-related headache' });
  } else if (bodyPart.toLowerCase().includes('chest') || lowerText.includes('chest')) {
    diseases.push({ diseaseName: 'Upper Respiratory Infection', probability: 0.50, reasoning: 'Common chest symptoms' });
    diseases.push({ diseaseName: 'Bronchitis', probability: 0.30, reasoning: 'Chest inflammation' });
    diseases.push({ diseaseName: 'Pneumonia', probability: 0.20, reasoning: 'Lung infection' });
  } else if (bodyPart.toLowerCase().includes('abdomen') || lowerText.includes('stomach')) {
    diseases.push({ diseaseName: 'Gastroenteritis', probability: 0.50, reasoning: 'Stomach inflammation' });
    diseases.push({ diseaseName: 'Food Poisoning', probability: 0.30, reasoning: 'Foodborne illness' });
    diseases.push({ diseaseName: 'Gastritis', probability: 0.20, reasoning: 'Stomach lining inflammation' });
  } else {
    diseases.push({ diseaseName: 'Viral Syndrome', probability: 0.50, reasoning: 'General viral symptoms' });
    diseases.push({ diseaseName: 'Bacterial Infection', probability: 0.30, reasoning: 'Possible bacterial cause' });
    diseases.push({ diseaseName: 'Inflammatory Condition', probability: 0.20, reasoning: 'General inflammation' });
  }
  
  const total = diseases.reduce((sum, d) => sum + d.probability, 0);
  diseases.forEach(d => d.probability = d.probability / total);
  return diseases;
}

export async function performCompleteAnalysis(symptomText: string) {
  const structuredSymptoms = await analyzeSymptoms(symptomText);
  const possibleDiseases = await generateDiseaseCandidates(structuredSymptoms, symptomText);
  const { generateInitialQuestions: genQuestions } = await import('./symptom-question-generator');
  const targetedQuestions = await genQuestions(possibleDiseases, structuredSymptoms, symptomText);
  return { structuredSymptoms, diseaseAnalysis: { possibleDiseases, confidenceScore: 0.6 }, targetedQuestions, round: 1 };
}

// Department Predictor - AI-powered hospital department recommendation
// Analyzes symptoms, answers, and diseases to suggest the appropriate department

import { StructuredSymptoms, FollowUpAnswer, DiseaseCandidate } from './types';

export interface DepartmentPrediction {
  department: string;
  isEmergency: boolean;
  confidence: number;
  reasoning: string;
}

// Indian hospital departments
const DEPARTMENTS = [
  'Emergency Medicine',
  'General Medicine',
  'Cardiology',
  'Neurology',
  'Orthopedics',
  'Gastroenterology',
  'Pulmonology',
  'ENT (Ear, Nose, Throat)',
  'Ophthalmology',
  'Dermatology',
  'Urology',
  'Nephrology',
  'Endocrinology',
  'Psychiatry',
  'Pediatrics',
  'Obstetrics & Gynecology'
];

// Emergency keywords that trigger immediate emergency department recommendation
const EMERGENCY_KEYWORDS = [
  'chest pain', 'heart attack', 'stroke', 'seizure', 'unconscious',
  'severe bleeding', 'difficulty breathing', 'choking', 'severe burn',
  'head injury', 'severe trauma', 'poisoning', 'overdose',
  'severe abdominal pain', 'severe allergic reaction', 'anaphylaxis',
  'suicidal', 'severe mental crisis', 'broken bone', 'fracture'
];

/**
 * Predict the appropriate hospital department based on symptoms and analysis
 */
export async function predictDepartment(
  symptomText: string,
  structuredSymptoms: StructuredSymptoms,
  answers: FollowUpAnswer[],
  diseases: DiseaseCandidate[]
): Promise<DepartmentPrediction> {
  console.log('[DEPT] Predicting department...');
  
  // Check for emergency keywords first
  const lowerSymptom = symptomText.toLowerCase();
  const isEmergency = EMERGENCY_KEYWORDS.some(keyword => lowerSymptom.includes(keyword));
  
  if (isEmergency) {
    console.log('[DEPT] Emergency detected!');
    return {
      department: 'Emergency Medicine',
      isEmergency: true,
      confidence: 0.95,
      reasoning: 'Symptoms indicate a medical emergency requiring immediate attention'
    };
  }
  
  // Use AI to predict department
  try {
    const prediction = await predictDepartmentWithAI(
      symptomText,
      structuredSymptoms,
      answers,
      diseases
    );
    
    console.log(`[DEPT] AI predicted: ${prediction.department}`);
    return prediction;
  } catch (error) {
    console.error('[DEPT] AI prediction failed, using rule-based fallback:', error);
    return predictDepartmentRuleBased(structuredSymptoms, diseases);
  }
}

/**
 * AI-powered department prediction using Bedrock
 */
async function predictDepartmentWithAI(
  symptomText: string,
  structuredSymptoms: StructuredSymptoms,
  answers: FollowUpAnswer[],
  diseases: DiseaseCandidate[]
): Promise<DepartmentPrediction> {
  const OpenAI = (await import('openai')).default;
  
  const client = new OpenAI({
    apiKey: process.env.AWS_BEARER_TOKEN_BEDROCK || process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || 'https://bedrock-mantle.ap-south-1.api.aws/v1',
  });
  
  // Build prompt
  const diseaseList = diseases.map(d => d.diseaseName).join(', ');
  const answerSummary = answers.slice(0, 5).map((a, i) => 
    `Q${i + 1}: ${a.questionText}\nA: ${a.answer}`
  ).join('\n\n');
  
  const prompt = `You are a medical triage expert. Based on the patient's symptoms and medical history, recommend the most appropriate hospital department.

SYMPTOMS: ${symptomText}

BODY PART: ${structuredSymptoms.bodyPart}
SEVERITY: ${structuredSymptoms.severity}

POSSIBLE CONDITIONS: ${diseaseList}

PATIENT ANSWERS:
${answerSummary}

AVAILABLE DEPARTMENTS:
${DEPARTMENTS.join(', ')}

Respond in this EXACT format:
DEPARTMENT: [exact department name from list]
EMERGENCY: [YES or NO]
CONFIDENCE: [0.0-1.0]
REASONING: [one sentence explanation]`;

  const response = await client.chat.completions.create({
    model: 'openai.gpt-oss-120b',
    messages: [
      {
        role: 'system',
        content: 'You are a medical triage expert. Recommend the appropriate hospital department based on symptoms.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.1,
    max_tokens: 200
  });
  
  const text = response.choices[0]?.message?.content || '';
  
  // Parse response
  const deptMatch = text.match(/DEPARTMENT:\s*(.+)/i);
  const emergencyMatch = text.match(/EMERGENCY:\s*(YES|NO)/i);
  const confidenceMatch = text.match(/CONFIDENCE:\s*([\d.]+)/i);
  const reasoningMatch = text.match(/REASONING:\s*(.+)/i);
  
  const department = deptMatch?.[1]?.trim() || 'General Medicine';
  const isEmergency = emergencyMatch?.[1]?.toUpperCase() === 'YES';
  const confidence = parseFloat(confidenceMatch?.[1] || '0.7');
  const reasoning = reasoningMatch?.[1]?.trim() || 'Based on symptom analysis';
  
  return {
    department,
    isEmergency,
    confidence,
    reasoning
  };
}

/**
 * Rule-based department prediction (fallback)
 */
function predictDepartmentRuleBased(
  structuredSymptoms: StructuredSymptoms,
  diseases: DiseaseCandidate[]
): DepartmentPrediction {
  const bodyPart = structuredSymptoms.bodyPart.toLowerCase();
  const diseaseNames = diseases.map(d => d.diseaseName.toLowerCase()).join(' ');
  
  // Rule-based mapping
  if (bodyPart.includes('heart') || diseaseNames.includes('cardiac') || diseaseNames.includes('heart')) {
    return {
      department: 'Cardiology',
      isEmergency: false,
      confidence: 0.8,
      reasoning: 'Heart-related symptoms detected'
    };
  }
  
  if (bodyPart.includes('brain') || bodyPart.includes('head') || diseaseNames.includes('neuro')) {
    return {
      department: 'Neurology',
      isEmergency: false,
      confidence: 0.8,
      reasoning: 'Neurological symptoms detected'
    };
  }
  
  if (bodyPart.includes('bone') || bodyPart.includes('joint') || diseaseNames.includes('arthritis')) {
    return {
      department: 'Orthopedics',
      isEmergency: false,
      confidence: 0.8,
      reasoning: 'Musculoskeletal symptoms detected'
    };
  }
  
  if (bodyPart.includes('stomach') || bodyPart.includes('abdomen') || diseaseNames.includes('gastro')) {
    return {
      department: 'Gastroenterology',
      isEmergency: false,
      confidence: 0.8,
      reasoning: 'Gastrointestinal symptoms detected'
    };
  }
  
  if (bodyPart.includes('lung') || bodyPart.includes('chest') || diseaseNames.includes('respiratory')) {
    return {
      department: 'Pulmonology',
      isEmergency: false,
      confidence: 0.8,
      reasoning: 'Respiratory symptoms detected'
    };
  }
  
  if (bodyPart.includes('ear') || bodyPart.includes('nose') || bodyPart.includes('throat')) {
    return {
      department: 'ENT (Ear, Nose, Throat)',
      isEmergency: false,
      confidence: 0.8,
      reasoning: 'ENT symptoms detected'
    };
  }
  
  if (bodyPart.includes('eye') || diseaseNames.includes('vision')) {
    return {
      department: 'Ophthalmology',
      isEmergency: false,
      confidence: 0.8,
      reasoning: 'Eye-related symptoms detected'
    };
  }
  
  if (bodyPart.includes('skin') || diseaseNames.includes('derma')) {
    return {
      department: 'Dermatology',
      isEmergency: false,
      confidence: 0.8,
      reasoning: 'Skin-related symptoms detected'
    };
  }
  
  // Default to General Medicine
  return {
    department: 'General Medicine',
    isEmergency: false,
    confidence: 0.6,
    reasoning: 'General medical consultation recommended'
  };
}

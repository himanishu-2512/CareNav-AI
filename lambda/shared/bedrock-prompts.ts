// Prompt templates for Amazon Bedrock AI interactions
// All prompts follow structured format to minimize hallucination and ensure consistent JSON outputs

import { StructuredSymptoms, FollowUpAnswer, DiseaseCandidate, QuestionRound, TargetedQuestion, QuestionAnswer } from './types';

/**
 * System prompt for symptom extraction
 */
export const SYMPTOM_EXTRACTION_SYSTEM_PROMPT = `You are a medical symptom extraction assistant for an Indian healthcare OPD intake system. Your role is to structure patient-reported symptoms into a standardized format. You do NOT diagnose diseases or recommend treatments.

Extract information accurately from the patient's description. If information is not provided, use "not specified" rather than guessing.`;

/**
 * Generate user prompt for symptom extraction
 */
export function generateSymptomExtractionPrompt(symptomText: string): string {
  return `Extract structured symptom information from this patient description:

"${symptomText}"

Return ONLY valid JSON with this exact structure:
{
  "bodyPart": "affected body part or system (e.g., head, chest, abdomen, joints)",
  "duration": "how long symptoms have been present (e.g., 2 days, 1 week, 3 months)",
  "severity": "mild | moderate | severe",
  "associatedFactors": ["list", "of", "related", "symptoms", "or", "triggers"],
  "timing": "when symptoms occur (e.g., morning, after meals, at night)",
  "character": "description of symptom quality (e.g., sharp, dull, throbbing)"
}

Rules:
- Use patient's exact words when possible
- Do NOT mention disease names
- Do NOT add medical interpretations
- If information is missing, use "not specified"
- Return ONLY the JSON object, no additional text`;
}

/**
 * System prompt for follow-up question generation
 */
export const FOLLOWUP_GENERATION_SYSTEM_PROMPT = `You are a medical intake assistant for an Indian OPD. Generate relevant follow-up questions to complete the patient's symptom picture. Focus on information that helps route the patient to the correct department, NOT on diagnosing diseases.`;

/**
 * Generate user prompt for follow-up questions
 */
export function generateFollowUpPrompt(structuredSymptoms: StructuredSymptoms): string {
  return `Based on these structured symptoms, generate 3-5 clarifying questions:

${JSON.stringify(structuredSymptoms, null, 2)}

Generate questions about:
- Timing and onset (sudden vs gradual)
- Aggravating or relieving factors
- Previous similar episodes
- Current medications or treatments tried
- Impact on daily activities
- Associated symptoms not yet mentioned

Return ONLY valid JSON array:
[
  {
    "questionId": "q1",
    "questionText": "clear, simple question in patient-friendly language",
    "questionType": "text"
  }
]

Rules:
- Ask 3-5 questions maximum
- Use simple, non-medical language
- Do NOT ask about diagnoses
- Do NOT suggest diseases
- Focus on practical, actionable information
- Return ONLY the JSON array, no additional text`;
}

/**
 * System prompt for department recommendation
 */
export const DEPARTMENT_RECOMMENDATION_SYSTEM_PROMPT = `You are a healthcare navigation assistant for an Indian hospital OPD. Based on symptom patterns, recommend the most appropriate medical department. You do NOT diagnose diseases. You analyze symptom patterns to suggest which specialist the patient should see.

CRITICAL: Never mention disease names. Focus only on symptom patterns and affected body systems.`;

/**
 * Generate user prompt for department recommendation
 */
export function generateDepartmentRecommendationPrompt(
  structuredSymptoms: StructuredSymptoms,
  followUpAnswers: FollowUpAnswer[] = []
): string {
  const answersText = followUpAnswers.length > 0
    ? `\nFollow-up answers: ${JSON.stringify(followUpAnswers, null, 2)}`
    : '';

  return `Based on these symptoms and patient responses, recommend an appropriate medical department:

Symptoms: ${JSON.stringify(structuredSymptoms, null, 2)}${answersText}

Available departments:
- General Medicine (internal medicine, general health concerns)
- Cardiology (heart and circulation related symptoms)
- Neurology (brain, nerves, headaches, dizziness)
- Orthopedics (bones, joints, muscles, injuries)
- Gastroenterology (digestive system, abdominal symptoms)
- Dermatology (skin, hair, nails)
- ENT (ear, nose, throat, hearing, voice)
- Pulmonology (lungs, breathing, cough)
- Endocrinology (hormones, thyroid, diabetes management)
- Emergency Medicine (life-threatening symptoms)

Classify urgency:
- routine: can wait for scheduled appointment
- urgent: should be seen within 24-48 hours
- emergency: needs immediate medical attention

Return ONLY valid JSON:
{
  "department": "one of the departments listed above",
  "urgency": "routine | urgent | emergency",
  "reasoning": "explain based on symptom patterns and affected body systems, NOT disease names"
}

Rules:
- Choose ONE department most appropriate for initial evaluation
- Base reasoning on symptom patterns, body systems, and timing
- Do NOT mention disease names or diagnoses
- If symptoms suggest emergency (chest pain with sweating, severe head injury, difficulty breathing), classify as emergency
- Return ONLY the JSON object, no additional text`;
}

/**
 * System prompt for medical report summarization
 */
export const REPORT_SUMMARIZATION_SYSTEM_PROMPT = `You are a medical document summarization assistant for an Indian healthcare system. Extract key information from medical reports to create a structured, portable medical history. Preserve factual information without adding interpretations.`;

/**
 * Generate user prompt for report summarization
 */
export function generateReportSummarizationPrompt(extractedText: string): string {
  return `Summarize this medical report text extracted via OCR:

"${extractedText}"

Return ONLY valid JSON:
{
  "reportDate": "date of the report (YYYY-MM-DD format if available)",
  "reportType": "type of report (e.g., lab test, imaging, consultation note, discharge summary)",
  "keyFindings": ["list", "of", "important", "findings"],
  "diagnoses": ["list", "of", "diagnoses", "mentioned"],
  "medications": ["list", "of", "medications", "mentioned"],
  "procedures": ["list", "of", "procedures", "performed"],
  "recommendations": ["list", "of", "doctor", "recommendations"],
  "redFlags": ["allergies", "chronic conditions", "high-risk factors"]
}

Rules:
- Extract only information explicitly stated in the report
- Do NOT add interpretations or inferences
- Preserve medical terminology as written
- If a field has no information, use empty array []
- Identify red flags: allergies, chronic diseases, high-risk conditions
- Return ONLY the JSON object, no additional text`;
}

/**
 * System prompt for treatment schedule generation
 */
export const SCHEDULE_GENERATION_SYSTEM_PROMPT = `You are a treatment schedule assistant for an Indian healthcare system. Convert doctor prescriptions into clear, time-specific medication schedules that patients can easily follow.`;

/**
 * Generate user prompt for treatment schedule generation
 */
export function generateSchedulePrompt(
  medicineName: string,
  dosage: string,
  frequency: string,
  specialInstructions?: string
): string {
  const instructionsText = specialInstructions
    ? `\nSpecial Instructions: ${specialInstructions}`
    : '';

  return `Convert this prescription into a patient-friendly medication schedule:

Medicine: ${medicineName}
Dosage: ${dosage}
Frequency: ${frequency}${instructionsText}

Return ONLY valid JSON:
{
  "medicineName": "medicine name",
  "dosage": "dosage amount",
  "times": ["array", "of", "specific", "times", "in", "HH:MM", "format"],
  "frequency": "human-readable frequency",
  "specialInstructions": "clear instructions for patient",
  "foodTiming": "before food | after food | with food | anytime"
}

Frequency to times mapping:
- "once daily" → ["08:00"]
- "twice daily" → ["08:00", "20:00"]
- "three times daily" → ["08:00", "14:00", "20:00"]
- "four times daily" → ["08:00", "12:00", "16:00", "20:00"]
- "every 6 hours" → ["06:00", "12:00", "18:00", "00:00"]
- "every 8 hours" → ["08:00", "16:00", "00:00"]
- "every 12 hours" → ["08:00", "20:00"]

Rules:
- Use 24-hour time format (HH:MM)
- Space doses evenly throughout the day
- Consider typical meal times for food-related instructions
- Make instructions clear and actionable
- Return ONLY the JSON object, no additional text`;
}

/**
 * System prompt for initial disease analysis
 * Used by iterative diagnosis engine to identify possible diseases from symptoms
 */
export const DISEASE_ANALYSIS_SYSTEM_PROMPT = `You are a medical diagnostic assistant analyzing patient symptoms to identify possible diseases. Your role is to analyze symptom patterns and generate a list of possible diseases with probability scores. You will NOT communicate directly with patients - your analysis is for internal system use only.

Generate a differential diagnosis list based on symptom patterns. Include 5-10 possible diseases ranked by probability.`;

/**
 * Format symptoms into a readable string for the disease analysis prompt
 */
export function formatSymptomsForAnalysis(symptoms: StructuredSymptoms): string {
  const parts: string[] = [];
  
  parts.push(`- Body Part: ${symptoms.bodyPart}`);
  parts.push(`- Duration: ${symptoms.duration}`);
  parts.push(`- Severity: ${symptoms.severity}`);
  
  if (symptoms.associatedFactors && symptoms.associatedFactors.length > 0) {
    parts.push(`- Associated Factors: ${symptoms.associatedFactors.join(', ')}`);
  }
  
  if (symptoms.timing && symptoms.timing !== 'not specified') {
    parts.push(`- Timing: ${symptoms.timing}`);
  }
  
  if (symptoms.character && symptoms.character !== 'not specified') {
    parts.push(`- Character: ${symptoms.character}`);
  }
  
  return parts.join('\n');
}

/**
 * Generate user prompt for initial disease analysis
 * Returns a prompt that instructs Bedrock to analyze symptoms and return 5-10 disease candidates
 */
export function generateDiseaseAnalysisPrompt(symptoms: StructuredSymptoms): string {
  const formattedSymptoms = formatSymptomsForAnalysis(symptoms);
  
  return `Analyze these patient symptoms and generate a differential diagnosis list:

Initial Symptoms:
${formattedSymptoms}

Return ONLY valid JSON with this structure:
{
  "possibleDiseases": [
    {
      "diseaseName": "disease name",
      "probability": 0.0-1.0,
      "supportingSymptoms": ["list", "of", "symptoms", "that", "support", "this"],
      "missingSymptoms": ["list", "of", "symptoms", "to", "ask", "about"]
    }
  ],
  "confidenceScore": 0.0-1.0
}

Rules:
- Include 5-10 diseases ranked by probability
- Probability scores must sum to approximately 1.0
- List symptoms that support each disease
- List symptoms that would help differentiate diseases
- Confidence score reflects how certain the analysis is
- Return ONLY the JSON object, no additional text`;
}

/**
 * JSON schema for disease analysis response validation
 * Used to validate Bedrock responses match expected structure
 */
export const DISEASE_ANALYSIS_RESPONSE_SCHEMA = {
  type: 'object',
  required: ['possibleDiseases', 'confidenceScore'],
  properties: {
    possibleDiseases: {
      type: 'array',
      minItems: 5,
      maxItems: 10,
      items: {
        type: 'object',
        required: ['diseaseName', 'probability', 'supportingSymptoms', 'missingSymptoms'],
        properties: {
          diseaseName: { type: 'string', minLength: 1 },
          probability: { type: 'number', minimum: 0, maximum: 1 },
          supportingSymptoms: {
            type: 'array',
            items: { type: 'string' }
          },
          missingSymptoms: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      }
    },
    confidenceScore: { type: 'number', minimum: 0, maximum: 1 }
  }
};

/**
 * System prompt for targeted question generation
 * Used by iterative diagnosis engine to generate questions that differentiate between disease candidates
 */
export const QUESTION_GENERATION_SYSTEM_PROMPT = `You are a medical question generation assistant. Based on a list of possible diseases, generate targeted questions that will help differentiate between them. Your questions will be shown to patients, so they must be clear, non-technical, and MUST NOT mention disease names.

Generate 3-5 questions that will help narrow down the diagnosis.`;

/**
 * Format disease candidates into a readable string for the question generation prompt
 */
export function formatDiseaseCandidatesForPrompt(diseases: DiseaseCandidate[]): string {
  return diseases.map((disease, index) => {
    const supportingText = disease.supportingSymptoms && disease.supportingSymptoms.length > 0
      ? `\n  Supporting Symptoms: ${disease.supportingSymptoms.join(', ')}`
      : '';
    const missingText = disease.missingSymptoms && disease.missingSymptoms.length > 0
      ? `\n  Missing Symptoms: ${disease.missingSymptoms.join(', ')}`
      : '';
    
    return `${index + 1}. ${disease.diseaseName} (probability: ${disease.probability.toFixed(2)})${supportingText}${missingText}`;
  }).join('\n\n');
}

/**
 * Format question history into a readable string for the question generation prompt
 */
export function formatQuestionHistoryForPrompt(questionHistory: QuestionRound[]): string {
  if (questionHistory.length === 0) {
    return 'None - this is the first round';
  }
  
  return questionHistory.map((round) => {
    const questionsText = round.questions.map((q) => {
      const answerObj = round.answers.find(a => a.questionId === q.questionId);
      const answerText = answerObj ? ` (Answer: ${answerObj.answer})` : '';
      return `  - ${q.questionText}${answerText}`;
    }).join('\n');
    
    return `Round ${round.roundNumber}:\n${questionsText}`;
  }).join('\n\n');
}

/**
 * Generate user prompt for targeted question generation
 * Returns a prompt that instructs Bedrock to generate 3-5 questions that help differentiate between disease candidates
 * CRITICAL: Questions must NOT contain disease names
 */
export function generateQuestionGenerationPrompt(
  diseases: DiseaseCandidate[],
  questionHistory: QuestionRound[],
  currentRound: number
): string {
  const diseasesText = formatDiseaseCandidatesForPrompt(diseases);
  const historyText = formatQuestionHistoryForPrompt(questionHistory);
  
  return `Generate targeted questions to differentiate between these possible diseases:

Current Disease Candidates:
${diseasesText}

Previous Questions Asked:
${historyText}

Current Round: ${currentRound}

Generate 3-5 questions that:
- Help differentiate between the disease candidates
- Are clear and patient-friendly (no medical jargon)
- Do NOT mention disease names
- Focus on symptoms, timing, severity, or related factors
- Are not redundant with previous questions

Return ONLY valid JSON array:
[
  {
    "questionId": "unique_id",
    "questionText": "clear question in simple language",
    "questionType": "yes_no" | "text" | "multiple_choice" | "scale",
    "targetDiseases": ["diseases", "this", "helps", "differentiate"],
    "importance": "high" | "medium" | "low",
    "options": ["option1", "option2"] // only for multiple_choice
  }
]

Rules:
- Generate 3-5 questions
- Questions must be patient-friendly
- NO disease names in questionText
- Each question should help differentiate specific diseases
- Prioritize high-importance questions
- Return ONLY the JSON array, no additional text`;
}

/**
 * JSON schema for question generation response validation
 * Used to validate Bedrock responses match expected structure
 */
export const QUESTION_GENERATION_RESPONSE_SCHEMA = {
  type: 'array',
  minItems: 3,
  maxItems: 5,
  items: {
    type: 'object',
    required: ['questionId', 'questionText', 'questionType', 'targetDiseases', 'importance'],
    properties: {
      questionId: { type: 'string', minLength: 1 },
      questionText: { type: 'string', minLength: 1 },
      questionType: {
        type: 'string',
        enum: ['yes_no', 'text', 'multiple_choice', 'scale']
      },
      targetDiseases: {
        type: 'array',
        items: { type: 'string' },
        minItems: 1
      },
      importance: {
        type: 'string',
        enum: ['high', 'medium', 'low']
      },
      options: {
        type: 'array',
        items: { type: 'string' },
        minItems: 2
      }
    }
  }
};

/**
 * System prompt for disease refinement
 * Used by iterative diagnosis engine to refine disease probabilities based on patient answers
 */
export const DISEASE_REFINEMENT_SYSTEM_PROMPT = `You are a medical diagnostic refinement assistant. Based on patient answers to targeted questions, refine the list of possible diseases and update their probability scores. Your analysis is for internal system use only.

Refine the differential diagnosis based on new information.`;

/**
 * Format questions and answers into a readable string for the refinement prompt
 */
export function formatQuestionsAndAnswersForPrompt(
  questions: TargetedQuestion[],
  answers: QuestionAnswer[]
): string {
  return questions.map((question) => {
    const answerObj = answers.find(a => a.questionId === question.questionId);
    const answerText = answerObj ? answerObj.answer : 'No answer provided';
    
    return `Q: ${question.questionText}\nA: ${answerText}`;
  }).join('\n\n');
}

/**
 * Generate user prompt for disease refinement
 * Returns a prompt that instructs Bedrock to refine disease probabilities based on patient answers
 * Removes diseases with probability < 0.05
 */
export function generateDiseaseRefinementPrompt(
  currentDiseases: DiseaseCandidate[],
  questions: TargetedQuestion[],
  answers: QuestionAnswer[],
  initialSymptoms: StructuredSymptoms
): string {
  const diseasesText = formatDiseaseCandidatesForPrompt(currentDiseases);
  const qaText = formatQuestionsAndAnswersForPrompt(questions, answers);
  const symptomsText = formatSymptomsForAnalysis(initialSymptoms);
  
  return `Refine the disease probability list based on patient answers:

Current Disease Candidates:
${diseasesText}

Questions Asked:
${qaText}

Initial Symptoms:
${symptomsText}

Analyze how the answers support or contradict each disease candidate. Update probability scores accordingly.

Return ONLY valid JSON with this structure:
{
  "possibleDiseases": [
    {
      "diseaseName": "disease name",
      "probability": 0.0-1.0,
      "supportingSymptoms": ["updated", "list"],
      "missingSymptoms": ["updated", "list"],
      "reasoning": "brief explanation of probability change"
    }
  ],
  "confidenceScore": 0.0-1.0,
  "keyFindings": ["important", "findings", "from", "this", "round"]
}

Rules:
- Update probabilities based on answers
- Probabilities must sum to approximately 1.0
- Remove diseases with probability < 0.05
- Confidence score should increase as more information gathered
- Include reasoning for significant probability changes
- Return ONLY the JSON object, no additional text`;
}

/**
 * JSON schema for disease refinement response validation
 * Used to validate Bedrock responses match expected structure
 */
export const DISEASE_REFINEMENT_RESPONSE_SCHEMA = {
  type: 'object',
  required: ['possibleDiseases', 'confidenceScore', 'keyFindings'],
  properties: {
    possibleDiseases: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['diseaseName', 'probability', 'supportingSymptoms', 'missingSymptoms', 'reasoning'],
        properties: {
          diseaseName: { type: 'string', minLength: 1 },
          probability: { type: 'number', minimum: 0, maximum: 1 },
          supportingSymptoms: {
            type: 'array',
            items: { type: 'string' }
          },
          missingSymptoms: {
            type: 'array',
            items: { type: 'string' }
          },
          reasoning: { type: 'string', minLength: 1 }
        }
      }
    },
    confidenceScore: { type: 'number', minimum: 0, maximum: 1 },
    keyFindings: {
      type: 'array',
      items: { type: 'string' }
    }
  }
};

/**
 * System prompt for comprehensive patient analysis
 * Used by patient summary Lambda to generate comprehensive AI analysis for doctor view
 */
export const COMPREHENSIVE_ANALYSIS_SYSTEM_PROMPT = `You are a medical analysis assistant generating comprehensive patient summaries for doctors. Analyze all available patient data including diagnosis sessions, symptoms, medical reports, and treatment history. Generate actionable insights and recommendations.

Your analysis will be viewed by doctors to help them understand the patient's complete medical picture.`;

/**
 * Format diagnosis sessions into a readable string for the comprehensive analysis prompt
 */
export function formatDiagnosisSessionsForAnalysis(sessions: any[]): string {
  if (sessions.length === 0) {
    return 'No diagnosis sessions recorded';
  }
  
  return sessions.map((session, index) => {
    const diseasesText = session.finalDiseases
      .map((d: any) => `  - ${d.diseaseName} (probability: ${d.probability.toFixed(2)})`)
      .join('\n');
    
    const findingsText = session.keyFindings && session.keyFindings.length > 0
      ? `\n  Key Findings:\n${session.keyFindings.map((f: string) => `    - ${f}`).join('\n')}`
      : '';
    
    return `Session ${index + 1} (${session.date}):
  Initial Symptoms: ${session.initialSymptoms.bodyPart} - ${session.initialSymptoms.severity} severity, ${session.initialSymptoms.duration}
  Total Rounds: ${session.totalRounds}
  Confidence Score: ${session.confidenceScore.toFixed(2)}
  Final Disease Candidates:
${diseasesText}${findingsText}`;
  }).join('\n\n');
}

/**
 * Format symptom history into a readable string for the comprehensive analysis prompt
 */
export function formatSymptomHistoryForAnalysis(symptoms: any[]): string {
  if (symptoms.length === 0) {
    return 'No symptom history recorded';
  }
  
  return symptoms.slice(0, 10).map((symptom, index) => {
    return `${index + 1}. ${symptom.structuredSymptoms.bodyPart} - ${symptom.structuredSymptoms.severity} (${symptom.timestamp})`;
  }).join('\n');
}

/**
 * Format reports into a readable string for the comprehensive analysis prompt
 */
export function formatReportsForAnalysis(reports: any[]): string {
  if (reports.length === 0) {
    return 'No medical reports uploaded';
  }
  
  return reports.map((report, index) => {
    const findingsText = report.summary.keyFindings && report.summary.keyFindings.length > 0
      ? `\n  Key Findings: ${report.summary.keyFindings.join(', ')}`
      : '';
    
    const diagnosesText = report.summary.diagnoses && report.summary.diagnoses.length > 0
      ? `\n  Diagnoses: ${report.summary.diagnoses.join(', ')}`
      : '';
    
    const medsText = report.summary.medications && report.summary.medications.length > 0
      ? `\n  Medications: ${report.summary.medications.join(', ')}`
      : '';
    
    return `Report ${index + 1} (${report.uploadDate}):
  Type: ${report.reportType}${findingsText}${diagnosesText}${medsText}`;
  }).join('\n\n');
}

/**
 * Format treatments into a readable string for the comprehensive analysis prompt
 */
export function formatTreatmentsForAnalysis(treatments: any[]): string {
  if (treatments.length === 0) {
    return 'No treatment history recorded';
  }
  
  return treatments.map((treatment, index) => {
    const medsText = treatment.medications
      .map((m: any) => `  - ${m.medicineName} (${m.dosage}, ${m.frequency})`)
      .join('\n');
    
    return `Treatment ${index + 1} (${treatment.startDate}):
  Doctor: ${treatment.doctorName}
  Diagnosis: ${treatment.diagnosis}
  Medications:
${medsText}`;
  }).join('\n\n');
}

/**
 * Format red flags into a readable string for the comprehensive analysis prompt
 */
export function formatRedFlagsForAnalysis(redFlags: any[]): string {
  if (redFlags.length === 0) {
    return 'No red flags identified';
  }
  
  return redFlags.map((flag, index) => {
    return `${index + 1}. [${flag.severity.toUpperCase()}] ${flag.type}: ${flag.description} (Source: ${flag.source})`;
  }).join('\n');
}

/**
 * Generate user prompt for comprehensive patient analysis
 * Returns a prompt that instructs Bedrock to analyze all patient data and generate comprehensive insights
 * Used by patient summary Lambda after QR code scan
 */
export function generateComprehensiveAnalysisPrompt(patientData: {
  patient: any;
  diagnosisSessions: any[];
  symptoms: any[];
  reports: any[];
  treatments: any[];
  redFlags: any[];
}): string {
  const patientInfo = `Name: ${patientData.patient.name}
Age: ${patientData.patient.age}
Gender: ${patientData.patient.gender}`;

  const diagnosisText = formatDiagnosisSessionsForAnalysis(patientData.diagnosisSessions);
  const symptomsText = formatSymptomHistoryForAnalysis(patientData.symptoms);
  const reportsText = formatReportsForAnalysis(patientData.reports);
  const treatmentsText = formatTreatmentsForAnalysis(patientData.treatments);
  const redFlagsText = formatRedFlagsForAnalysis(patientData.redFlags);
  
  return `Generate a comprehensive analysis for this patient:

Patient Profile:
${patientInfo}

Diagnosis Sessions:
${diagnosisText}

Symptom History:
${symptomsText}

Medical Reports:
${reportsText}

Treatment History:
${treatmentsText}

Red Flags Identified:
${redFlagsText}

Provide a comprehensive analysis including:
- Overall health status assessment
- Chronic conditions identified
- Recent symptom patterns and trends
- Report findings and trends over time
- Clinical recommendations for the doctor
- Critical alerts requiring immediate attention

Return ONLY valid JSON with this structure:
{
  "overallHealthStatus": "comprehensive assessment",
  "chronicConditions": ["list", "of", "chronic", "conditions"],
  "recentSymptomPatterns": ["pattern1", "pattern2"],
  "reportTrends": ["trend1", "trend2"],
  "recommendations": ["recommendation1", "recommendation2"],
  "criticalAlerts": ["alert1", "alert2"]
}

Rules:
- Synthesize information from all sources
- Identify patterns and trends
- Provide actionable recommendations
- Highlight critical issues requiring urgent attention
- Use medical terminology appropriate for doctors
- Return ONLY the JSON object, no additional text`;
}

/**
 * JSON schema for comprehensive analysis response validation
 * Used to validate Bedrock responses match expected structure
 */
export const COMPREHENSIVE_ANALYSIS_RESPONSE_SCHEMA = {
  type: 'object',
  required: ['overallHealthStatus', 'chronicConditions', 'recentSymptomPatterns', 'reportTrends', 'recommendations', 'criticalAlerts'],
  properties: {
    overallHealthStatus: { type: 'string', minLength: 1 },
    chronicConditions: {
      type: 'array',
      items: { type: 'string' }
    },
    recentSymptomPatterns: {
      type: 'array',
      items: { type: 'string' }
    },
    reportTrends: {
      type: 'array',
      items: { type: 'string' }
    },
    recommendations: {
      type: 'array',
      items: { type: 'string' }
    },
    criticalAlerts: {
      type: 'array',
      items: { type: 'string' }
    }
  }
};

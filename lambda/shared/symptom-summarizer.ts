// AI-powered symptom summarizer
import { FollowUpAnswer, StructuredSymptoms, DiseaseCandidate } from './types';

/**
 * Generate a comprehensive AI summary of patient's symptoms and answers
 */
export async function generateSymptomSummary(
  symptomText: string,
  structuredSymptoms: StructuredSymptoms,
  followUpAnswers: FollowUpAnswer[],
  diseaseAnalysis: DiseaseCandidate[]
): Promise<string> {
  const { callBedrock } = await import('./bedrock-client');
  
  // Build Q&A context
  const qaContext = followUpAnswers.map((a, i) => 
    `Q${i + 1}: ${a.questionText}\nA${i + 1}: ${a.answer}`
  ).join('\n\n');
  
  const prompt = `You are a medical AI assistant. Generate a clear, concise clinical summary of the patient's condition based on their symptoms and answers to follow-up questions.

INITIAL SYMPTOM DESCRIPTION:
"${symptomText}"

STRUCTURED ANALYSIS:
- Body Part: ${structuredSymptoms.bodyPart}
- Severity: ${structuredSymptoms.severity}
- Duration: ${structuredSymptoms.duration}
- Character: ${structuredSymptoms.character}

FOLLOW-UP QUESTIONS AND ANSWERS (${followUpAnswers.length} total):
${qaContext}

POSSIBLE CONDITIONS IDENTIFIED:
${diseaseAnalysis.map((d, i) => `${i + 1}. ${d.diseaseName} (${(d.probability * 100).toFixed(0)}% probability) - ${d.reasoning}`).join('\n')}

INSTRUCTIONS:
Generate a professional clinical summary that includes:
1. Chief Complaint (1-2 sentences)
2. Key Symptoms and Characteristics (bullet points)
3. Relevant Medical History (from answers)
4. Clinical Impression (possible conditions)
5. Important Findings (red flags or significant details)

Keep it concise, professional, and easy for a doctor to quickly understand the patient's condition.

RESPONSE FORMAT (plain text, not JSON):
Generate the summary now:`;

  try {
    const summary = await callBedrock('You are a medical AI assistant.', prompt);
    return summary.trim();
  } catch (error) {
    console.error('Error generating AI summary:', error);
    // Fallback to basic summary
    return `Chief Complaint: ${symptomText}

Key Symptoms:
- Location: ${structuredSymptoms.bodyPart}
- Severity: ${structuredSymptoms.severity}
- Duration: ${structuredSymptoms.duration}

Total Questions Answered: ${followUpAnswers.length}

Possible Conditions:
${diseaseAnalysis.map((d, i) => `${i + 1}. ${d.diseaseName} (${(d.probability * 100).toFixed(0)}%)`).join('\n')}`;
  }
}

/**
 * Generate a brief one-line summary for list views
 */
export async function generateBriefSummary(
  symptomText: string,
  structuredSymptoms: StructuredSymptoms,
  followUpAnswers: FollowUpAnswer[]
): Promise<string> {
  const { callBedrock } = await import('./bedrock-client');
  
  const prompt = `Generate a brief one-line clinical summary (max 100 characters) of this patient's condition:

Initial Symptom: "${symptomText}"
Body Part: ${structuredSymptoms.bodyPart}
Severity: ${structuredSymptoms.severity}
Questions Answered: ${followUpAnswers.length}

Generate a concise summary:`;

  try {
    const summary = await callBedrock('You are a medical AI assistant.', prompt);
    return summary.trim().substring(0, 100);
  } catch (error) {
    console.error('Error generating brief summary:', error);
    return `${structuredSymptoms.severity} ${structuredSymptoms.bodyPart} symptoms, ${followUpAnswers.length} questions answered`;
  }
}

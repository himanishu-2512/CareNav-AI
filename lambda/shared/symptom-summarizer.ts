// Medical symptom summarizer using AWS Comprehend Medical
import { FollowUpAnswer, StructuredSymptoms, DiseaseCandidate } from './types';
import { extractMedicalEntities, extractSymptoms, extractMedications } from './comprehend-medical-client';

/**
 * Generate a comprehensive clinical summary using Comprehend Medical analysis
 */
export async function generateSymptomSummary(
  symptomText: string,
  structuredSymptoms: StructuredSymptoms,
  followUpAnswers: FollowUpAnswer[],
  diseaseAnalysis: DiseaseCandidate[]
): Promise<string> {
  try {
    console.log('Generating clinical summary using Comprehend Medical...');
    
    // Extract medical entities from all answers
    const allText = [symptomText, ...followUpAnswers.map(a => String(a.answer))].join(' ');
    const entities = await extractMedicalEntities(allText);
    const symptoms = extractSymptoms(entities);
    const medications = extractMedications(entities);
    
    // Build structured summary
    const sections: string[] = [];
    
    // 1. Chief Complaint
    sections.push(`CHIEF COMPLAINT:\n${symptomText}`);
    
    // 2. Key Symptoms
    sections.push(`\nKEY SYMPTOMS:`);
    sections.push(`- Location: ${structuredSymptoms.bodyPart}`);
    sections.push(`- Severity: ${structuredSymptoms.severity}`);
    sections.push(`- Duration: ${structuredSymptoms.duration}`);
    if (symptoms.length > 0) {
      sections.push(`- Identified Symptoms: ${symptoms.join(', ')}`);
    }
    
    // 3. Medical History (from answers)
    sections.push(`\nMEDICAL HISTORY:`);
    const historyAnswers = followUpAnswers.filter(a => 
      a.questionText.toLowerCase().includes('medical condition') ||
      a.questionText.toLowerCase().includes('medication') ||
      a.questionText.toLowerCase().includes('allerg')
    );
    
    if (historyAnswers.length > 0) {
      historyAnswers.forEach(a => {
        sections.push(`- ${a.questionText}: ${a.answer}`);
      });
    } else {
      sections.push(`- No significant medical history reported`);
    }
    
    if (medications.length > 0) {
      sections.push(`- Medications Mentioned: ${medications.join(', ')}`);
    }
    
    // 4. Clinical Impression
    sections.push(`\nCLINICAL IMPRESSION:`);
    diseaseAnalysis.slice(0, 3).forEach((d, i) => {
      sections.push(`${i + 1}. ${d.diseaseName} (${(d.probability * 100).toFixed(0)}% probability)`);
      sections.push(`   Reasoning: ${d.reasoning}`);
    });
    
    // 5. Important Findings
    sections.push(`\nIMPORTANT FINDINGS:`);
    const severeAnswers = followUpAnswers.filter(a => 
      String(a.answer).toLowerCase().includes('severe') ||
      String(a.answer).toLowerCase().includes('worse') ||
      String(a.answer).toLowerCase().includes('unable')
    );
    
    if (severeAnswers.length > 0) {
      severeAnswers.forEach(a => {
        sections.push(`- ${a.questionText}: ${a.answer}`);
      });
    } else {
      sections.push(`- No critical red flags identified`);
    }
    
    sections.push(`\nTOTAL QUESTIONS ANSWERED: ${followUpAnswers.length}/20`);
    
    return sections.join('\n');
    
  } catch (error) {
    console.error('Error generating summary:', error);
    // Fallback to basic summary
    return `CHIEF COMPLAINT: ${symptomText}

KEY SYMPTOMS:
- Location: ${structuredSymptoms.bodyPart}
- Severity: ${structuredSymptoms.severity}
- Duration: ${structuredSymptoms.duration}

TOTAL QUESTIONS ANSWERED: ${followUpAnswers.length}

POSSIBLE CONDITIONS:
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
  try {
    // Extract key symptoms using Comprehend Medical
    const entities = await extractMedicalEntities(symptomText);
    const symptoms = extractSymptoms(entities);
    
    if (symptoms.length > 0) {
      const topSymptoms = symptoms.slice(0, 2).join(', ');
      return `${structuredSymptoms.severity} ${topSymptoms} - ${structuredSymptoms.duration}`;
    }
    
    return `${structuredSymptoms.severity} ${structuredSymptoms.bodyPart} symptoms - ${structuredSymptoms.duration}`;
    
  } catch (error) {
    console.error('Error generating brief summary:', error);
    return `${structuredSymptoms.severity} ${structuredSymptoms.bodyPart} symptoms, ${followUpAnswers.length} questions answered`;
  }
}

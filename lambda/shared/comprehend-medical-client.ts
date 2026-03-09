// Amazon Comprehend Medical client for medical entity extraction
import { 
  ComprehendMedicalClient, 
  DetectEntitiesV2Command, 
  InferICD10CMCommand,
  Entity 
} from '@aws-sdk/client-comprehendmedical';

const client = new ComprehendMedicalClient({
  region: 'us-east-1'
});

/**
 * Extract medical entities from symptom text using Comprehend Medical
 */
export async function extractMedicalEntities(text: string): Promise<Entity[]> {
  try {
    const command = new DetectEntitiesV2Command({ Text: text });
    const response = await client.send(command);
    return response.Entities || [];
  } catch (error) {
    console.error('Comprehend Medical error:', error);
    return [];
  }
}

/**
 * Infer ICD-10-CM codes and disease predictions from symptom text
 */
export async function inferDiseases(text: string) {
  try {
    const command = new InferICD10CMCommand({ Text: text });
    const response = await client.send(command);
    
    // Extract disease predictions with ICD-10 codes
    const diseases = (response.Entities || [])
      .filter(e => e.Category === 'MEDICAL_CONDITION' && e.ICD10CMConcepts && e.ICD10CMConcepts.length > 0)
      .map(entity => {
        const topConcept = entity.ICD10CMConcepts![0];
        return {
          symptom: entity.Text || '',
          icd10Code: topConcept.Code || '',
          description: topConcept.Description || '',
          confidence: topConcept.Score || 0
        };
      });
    
    return diseases;
  } catch (error) {
    console.error('ICD-10-CM inference error:', error);
    return [];
  }
}

/**
 * Extract symptoms from medical entities
 */
export function extractSymptoms(entities: Entity[]): string[] {
  return entities
    .filter(e => 
      e.Category === 'MEDICAL_CONDITION' && 
      e.Traits?.some(t => t.Name === 'SYMPTOM')
    )
    .map(e => e.Text || '')
    .filter(t => t.length > 0);
}

/**
 * Extract body parts/anatomy from medical entities
 */
export function extractBodyParts(entities: Entity[]): string[] {
  return entities
    .filter(e => e.Category === 'ANATOMY')
    .map(e => e.Text || '')
    .filter(t => t.length > 0);
}

/**
 * Extract time expressions (duration) from medical entities
 */
export function extractDuration(entities: Entity[]): string | null {
  const timeEntity = entities.find(e => e.Category === 'TIME_EXPRESSION');
  return timeEntity?.Text || null;
}

/**
 * Extract medical terms/tags from question text using Comprehend Medical
 * This helps track what topics have been covered without sending full question text
 */
export async function extractQuestionTags(questionText: string): Promise<string[]> {
  try {
    const entities = await extractMedicalEntities(questionText);
    const tags: Set<string> = new Set();
    
    // Extract symptoms
    entities
      .filter(e => e.Category === 'MEDICAL_CONDITION')
      .forEach(e => {
        if (e.Text) tags.add(e.Text.toLowerCase());
      });
    
    // Extract anatomy/body parts
    entities
      .filter(e => e.Category === 'ANATOMY')
      .forEach(e => {
        if (e.Text) tags.add(e.Text.toLowerCase());
      });
    
    // Extract test/treatment/procedure
    entities
      .filter(e => e.Category === 'TEST_TREATMENT_PROCEDURE')
      .forEach(e => {
        if (e.Text) tags.add(e.Text.toLowerCase());
      });
    
    return Array.from(tags);
  } catch (error) {
    console.error('Failed to extract question tags:', error);
    return [];
  }
}

/**
 * Extract medications mentioned
 */
export function extractMedications(entities: Entity[]): string[] {
  return entities
    .filter(e => e.Category === 'MEDICATION')
    .map(e => e.Text || '')
    .filter(t => t.length > 0);
}

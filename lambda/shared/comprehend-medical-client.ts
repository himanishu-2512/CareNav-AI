// Amazon Comprehend Medical client for medical entity extraction
import { ComprehendMedicalClient, DetectEntitiesV2Command, Entity } from '@aws-sdk/client-comprehendmedical';

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
 * Extract medications mentioned
 */
export function extractMedications(entities: Entity[]): string[] {
  return entities
    .filter(e => e.Category === 'MEDICATION')
    .map(e => e.Text || '')
    .filter(t => t.length > 0);
}

// Confidence Score Calculator Module
// Calculates diagnostic confidence based on disease probability distribution

import { DiseaseCandidate } from './types';

/**
 * Calculate confidence score from disease probability distribution
 * 
 * The confidence score is based on:
 * 1. The highest disease probability (how likely the top candidate is)
 * 2. The concentration of the probability distribution (how much the top candidate stands out)
 * 
 * A high confidence means one disease clearly stands out from the others.
 * 
 * @param diseases - Array of disease candidates with probabilities
 * @returns Confidence score between 0.0 and 1.0
 * 
 * @example
 * // High confidence: one disease dominates
 * calculateConfidenceScore([
 *   { diseaseName: 'Disease A', probability: 0.85, supportingSymptoms: [], missingSymptoms: [] },
 *   { diseaseName: 'Disease B', probability: 0.10, supportingSymptoms: [], missingSymptoms: [] },
 *   { diseaseName: 'Disease C', probability: 0.05, supportingSymptoms: [], missingSymptoms: [] }
 * ]); // Returns ~0.85
 * 
 * @example
 * // Low confidence: probabilities are spread out
 * calculateConfidenceScore([
 *   { diseaseName: 'Disease A', probability: 0.30, supportingSymptoms: [], missingSymptoms: [] },
 *   { diseaseName: 'Disease B', probability: 0.25, supportingSymptoms: [], missingSymptoms: [] },
 *   { diseaseName: 'Disease C', probability: 0.20, supportingSymptoms: [], missingSymptoms: [] },
 *   { diseaseName: 'Disease D', probability: 0.15, supportingSymptoms: [], missingSymptoms: [] },
 *   { diseaseName: 'Disease E', probability: 0.10, supportingSymptoms: [], missingSymptoms: [] }
 * ]); // Returns ~0.35
 */
export function calculateConfidenceScore(diseases: DiseaseCandidate[]): number {
  // Handle edge cases
  if (!diseases || diseases.length === 0) {
    return 0.0;
  }

  if (diseases.length === 1) {
    // If only one disease, confidence equals its probability
    return Math.min(1.0, Math.max(0.0, diseases[0].probability));
  }

  // Sort diseases by probability (descending)
  const sortedDiseases = [...diseases].sort((a, b) => b.probability - a.probability);

  // Get the highest probability
  const maxProbability = sortedDiseases[0].probability;

  // Calculate the concentration factor
  // This measures how much the top disease stands out from the rest
  // Using entropy-based approach: lower entropy = higher concentration = higher confidence
  
  // Calculate the gap between top disease and second disease
  const secondProbability = sortedDiseases[1].probability;
  const probabilityGap = maxProbability - secondProbability;

  // Calculate normalized entropy to measure distribution spread
  // Lower entropy means more concentrated distribution
  const entropy = calculateNormalizedEntropy(sortedDiseases);
  const concentrationFactor = 1.0 - entropy; // Higher concentration = lower entropy

  // Combine max probability with concentration factor
  // Weight: 70% max probability, 30% concentration
  // This ensures confidence increases as:
  // 1. The top disease probability increases
  // 2. The probability distribution becomes more concentrated
  const confidence = (0.7 * maxProbability) + (0.3 * concentrationFactor);

  // Ensure confidence is between 0.0 and 1.0
  return Math.min(1.0, Math.max(0.0, confidence));
}

/**
 * Calculate normalized entropy of probability distribution
 * 
 * Entropy measures the uncertainty/spread of a probability distribution.
 * Lower entropy = more concentrated distribution = higher confidence
 * 
 * Normalized entropy is scaled to [0, 1] range where:
 * - 0 = completely concentrated (all probability on one disease)
 * - 1 = completely uniform (all diseases equally likely)
 * 
 * @param diseases - Array of disease candidates with probabilities
 * @returns Normalized entropy between 0.0 and 1.0
 */
function calculateNormalizedEntropy(diseases: DiseaseCandidate[]): number {
  if (diseases.length <= 1) {
    return 0.0; // No uncertainty with 0 or 1 disease
  }

  // Calculate Shannon entropy: H = -Σ(p * log2(p))
  let entropy = 0.0;
  for (const disease of diseases) {
    if (disease.probability > 0) {
      entropy -= disease.probability * Math.log2(disease.probability);
    }
  }

  // Normalize by maximum possible entropy (uniform distribution)
  // Max entropy = log2(n) where n is number of diseases
  const maxEntropy = Math.log2(diseases.length);
  
  if (maxEntropy === 0) {
    return 0.0;
  }

  const normalizedEntropy = entropy / maxEntropy;

  // Ensure result is between 0.0 and 1.0
  return Math.min(1.0, Math.max(0.0, normalizedEntropy));
}

/**
 * Validate that confidence score is monotonically non-decreasing
 * 
 * This function checks that the new confidence score is greater than or equal
 * to the previous confidence score, as required by the specification.
 * 
 * @param previousConfidence - Previous round's confidence score
 * @param newConfidence - New confidence score to validate
 * @returns True if monotonicity is maintained, false otherwise
 */
export function validateMonotonicConfidence(
  previousConfidence: number,
  newConfidence: number
): boolean {
  return newConfidence >= previousConfidence;
}

/**
 * Check if diagnosis session should terminate based on confidence
 * 
 * Session should terminate when:
 * - Confidence score >= 0.8 (high confidence threshold)
 * 
 * @param confidenceScore - Current confidence score
 * @returns True if session should terminate, false otherwise
 */
export function shouldTerminateSession(confidenceScore: number): boolean {
  const CONFIDENCE_THRESHOLD = 0.8;
  return confidenceScore >= CONFIDENCE_THRESHOLD;
}

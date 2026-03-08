// Unit tests for confidence score calculator

import { 
  calculateConfidenceScore, 
  validateMonotonicConfidence,
  shouldTerminateSession 
} from './confidence-calculator';
import { DiseaseCandidate } from './types';

describe('Confidence Score Calculator', () => {
  describe('calculateConfidenceScore', () => {
    test('returns 0.0 for empty disease array', () => {
      const confidence = calculateConfidenceScore([]);
      expect(confidence).toBe(0.0);
    });

    test('returns disease probability for single disease', () => {
      const diseases: DiseaseCandidate[] = [
        {
          diseaseName: 'Disease A',
          probability: 0.75,
          supportingSymptoms: ['symptom1'],
          missingSymptoms: []
        }
      ];
      const confidence = calculateConfidenceScore(diseases);
      expect(confidence).toBe(0.75);
    });

    test('returns high confidence when one disease dominates', () => {
      const diseases: DiseaseCandidate[] = [
        {
          diseaseName: 'Disease A',
          probability: 0.85,
          supportingSymptoms: ['symptom1', 'symptom2'],
          missingSymptoms: []
        },
        {
          diseaseName: 'Disease B',
          probability: 0.10,
          supportingSymptoms: ['symptom3'],
          missingSymptoms: ['symptom1']
        },
        {
          diseaseName: 'Disease C',
          probability: 0.05,
          supportingSymptoms: [],
          missingSymptoms: ['symptom1', 'symptom2']
        }
      ];
      const confidence = calculateConfidenceScore(diseases);
      
      // Should be high confidence (> 0.7) since one disease clearly dominates
      expect(confidence).toBeGreaterThan(0.7);
      expect(confidence).toBeLessThanOrEqual(1.0);
    });

    test('returns low confidence when probabilities are spread out', () => {
      const diseases: DiseaseCandidate[] = [
        {
          diseaseName: 'Disease A',
          probability: 0.25,
          supportingSymptoms: ['symptom1'],
          missingSymptoms: []
        },
        {
          diseaseName: 'Disease B',
          probability: 0.22,
          supportingSymptoms: ['symptom2'],
          missingSymptoms: []
        },
        {
          diseaseName: 'Disease C',
          probability: 0.20,
          supportingSymptoms: ['symptom3'],
          missingSymptoms: []
        },
        {
          diseaseName: 'Disease D',
          probability: 0.18,
          supportingSymptoms: ['symptom4'],
          missingSymptoms: []
        },
        {
          diseaseName: 'Disease E',
          probability: 0.15,
          supportingSymptoms: ['symptom5'],
          missingSymptoms: []
        }
      ];
      const confidence = calculateConfidenceScore(diseases);
      
      // Should be low confidence (< 0.5) since probabilities are spread out
      expect(confidence).toBeLessThan(0.5);
      expect(confidence).toBeGreaterThanOrEqual(0.0);
    });

    test('returns confidence between 0.0 and 1.0', () => {
      const diseases: DiseaseCandidate[] = [
        {
          diseaseName: 'Disease A',
          probability: 0.60,
          supportingSymptoms: ['symptom1'],
          missingSymptoms: []
        },
        {
          diseaseName: 'Disease B',
          probability: 0.30,
          supportingSymptoms: ['symptom2'],
          missingSymptoms: []
        },
        {
          diseaseName: 'Disease C',
          probability: 0.10,
          supportingSymptoms: [],
          missingSymptoms: ['symptom1']
        }
      ];
      const confidence = calculateConfidenceScore(diseases);
      
      expect(confidence).toBeGreaterThanOrEqual(0.0);
      expect(confidence).toBeLessThanOrEqual(1.0);
    });

    test('handles two diseases with similar probabilities', () => {
      const diseases: DiseaseCandidate[] = [
        {
          diseaseName: 'Disease A',
          probability: 0.51,
          supportingSymptoms: ['symptom1'],
          missingSymptoms: []
        },
        {
          diseaseName: 'Disease B',
          probability: 0.49,
          supportingSymptoms: ['symptom2'],
          missingSymptoms: []
        }
      ];
      const confidence = calculateConfidenceScore(diseases);
      
      // Should be moderate confidence since probabilities are close
      expect(confidence).toBeGreaterThan(0.3);
      expect(confidence).toBeLessThan(0.7);
    });

    test('handles diseases with zero probabilities', () => {
      const diseases: DiseaseCandidate[] = [
        {
          diseaseName: 'Disease A',
          probability: 0.90,
          supportingSymptoms: ['symptom1'],
          missingSymptoms: []
        },
        {
          diseaseName: 'Disease B',
          probability: 0.10,
          supportingSymptoms: [],
          missingSymptoms: []
        },
        {
          diseaseName: 'Disease C',
          probability: 0.0,
          supportingSymptoms: [],
          missingSymptoms: ['symptom1']
        }
      ];
      const confidence = calculateConfidenceScore(diseases);
      
      // Should still calculate correctly with zero probabilities
      expect(confidence).toBeGreaterThan(0.7);
      expect(confidence).toBeLessThanOrEqual(1.0);
    });

    test('confidence increases as top probability increases', () => {
      const diseases1: DiseaseCandidate[] = [
        { diseaseName: 'A', probability: 0.50, supportingSymptoms: [], missingSymptoms: [] },
        { diseaseName: 'B', probability: 0.30, supportingSymptoms: [], missingSymptoms: [] },
        { diseaseName: 'C', probability: 0.20, supportingSymptoms: [], missingSymptoms: [] }
      ];

      const diseases2: DiseaseCandidate[] = [
        { diseaseName: 'A', probability: 0.70, supportingSymptoms: [], missingSymptoms: [] },
        { diseaseName: 'B', probability: 0.20, supportingSymptoms: [], missingSymptoms: [] },
        { diseaseName: 'C', probability: 0.10, supportingSymptoms: [], missingSymptoms: [] }
      ];

      const confidence1 = calculateConfidenceScore(diseases1);
      const confidence2 = calculateConfidenceScore(diseases2);

      expect(confidence2).toBeGreaterThan(confidence1);
    });

    test('confidence increases as distribution becomes more concentrated', () => {
      // Spread out distribution
      const diseases1: DiseaseCandidate[] = [
        { diseaseName: 'A', probability: 0.40, supportingSymptoms: [], missingSymptoms: [] },
        { diseaseName: 'B', probability: 0.30, supportingSymptoms: [], missingSymptoms: [] },
        { diseaseName: 'C', probability: 0.30, supportingSymptoms: [], missingSymptoms: [] }
      ];

      // Concentrated distribution (same max probability)
      const diseases2: DiseaseCandidate[] = [
        { diseaseName: 'A', probability: 0.40, supportingSymptoms: [], missingSymptoms: [] },
        { diseaseName: 'B', probability: 0.35, supportingSymptoms: [], missingSymptoms: [] },
        { diseaseName: 'C', probability: 0.25, supportingSymptoms: [], missingSymptoms: [] }
      ];

      const confidence1 = calculateConfidenceScore(diseases1);
      const confidence2 = calculateConfidenceScore(diseases2);

      // More concentrated distribution should have higher confidence
      expect(confidence2).toBeGreaterThanOrEqual(confidence1);
    });
  });

  describe('validateMonotonicConfidence', () => {
    test('returns true when confidence increases', () => {
      const result = validateMonotonicConfidence(0.5, 0.7);
      expect(result).toBe(true);
    });

    test('returns true when confidence stays the same', () => {
      const result = validateMonotonicConfidence(0.6, 0.6);
      expect(result).toBe(true);
    });

    test('returns false when confidence decreases', () => {
      const result = validateMonotonicConfidence(0.7, 0.5);
      expect(result).toBe(false);
    });

    test('handles edge case with 0.0 confidence', () => {
      const result = validateMonotonicConfidence(0.0, 0.0);
      expect(result).toBe(true);
    });

    test('handles edge case with 1.0 confidence', () => {
      const result = validateMonotonicConfidence(1.0, 1.0);
      expect(result).toBe(true);
    });
  });

  describe('shouldTerminateSession', () => {
    test('returns true when confidence is exactly 0.8', () => {
      const result = shouldTerminateSession(0.8);
      expect(result).toBe(true);
    });

    test('returns true when confidence is above 0.8', () => {
      const result = shouldTerminateSession(0.85);
      expect(result).toBe(true);
    });

    test('returns true when confidence is 1.0', () => {
      const result = shouldTerminateSession(1.0);
      expect(result).toBe(true);
    });

    test('returns false when confidence is below 0.8', () => {
      const result = shouldTerminateSession(0.79);
      expect(result).toBe(false);
    });

    test('returns false when confidence is 0.0', () => {
      const result = shouldTerminateSession(0.0);
      expect(result).toBe(false);
    });

    test('returns false when confidence is 0.5', () => {
      const result = shouldTerminateSession(0.5);
      expect(result).toBe(false);
    });
  });

  describe('Monotonicity property', () => {
    test('confidence should not decrease when narrowing down diseases', () => {
      // Initial round: many diseases with spread probabilities
      const round1: DiseaseCandidate[] = [
        { diseaseName: 'A', probability: 0.30, supportingSymptoms: [], missingSymptoms: [] },
        { diseaseName: 'B', probability: 0.25, supportingSymptoms: [], missingSymptoms: [] },
        { diseaseName: 'C', probability: 0.20, supportingSymptoms: [], missingSymptoms: [] },
        { diseaseName: 'D', probability: 0.15, supportingSymptoms: [], missingSymptoms: [] },
        { diseaseName: 'E', probability: 0.10, supportingSymptoms: [], missingSymptoms: [] }
      ];

      // After refinement: fewer diseases with more concentrated probabilities
      const round2: DiseaseCandidate[] = [
        { diseaseName: 'A', probability: 0.60, supportingSymptoms: [], missingSymptoms: [] },
        { diseaseName: 'B', probability: 0.30, supportingSymptoms: [], missingSymptoms: [] },
        { diseaseName: 'C', probability: 0.10, supportingSymptoms: [], missingSymptoms: [] }
      ];

      const confidence1 = calculateConfidenceScore(round1);
      const confidence2 = calculateConfidenceScore(round2);

      expect(confidence2).toBeGreaterThanOrEqual(confidence1);
      expect(validateMonotonicConfidence(confidence1, confidence2)).toBe(true);
    });

    test('confidence should increase significantly when converging to one disease', () => {
      // Round 1: Multiple candidates
      const round1: DiseaseCandidate[] = [
        { diseaseName: 'A', probability: 0.40, supportingSymptoms: [], missingSymptoms: [] },
        { diseaseName: 'B', probability: 0.35, supportingSymptoms: [], missingSymptoms: [] },
        { diseaseName: 'C', probability: 0.25, supportingSymptoms: [], missingSymptoms: [] }
      ];

      // Round 2: Clear winner emerges
      const round2: DiseaseCandidate[] = [
        { diseaseName: 'A', probability: 0.85, supportingSymptoms: [], missingSymptoms: [] },
        { diseaseName: 'B', probability: 0.10, supportingSymptoms: [], missingSymptoms: [] },
        { diseaseName: 'C', probability: 0.05, supportingSymptoms: [], missingSymptoms: [] }
      ];

      const confidence1 = calculateConfidenceScore(round1);
      const confidence2 = calculateConfidenceScore(round2);

      expect(confidence2).toBeGreaterThan(confidence1);
      expect(confidence2 - confidence1).toBeGreaterThan(0.2); // Significant increase
    });
  });

  describe('Edge cases', () => {
    test('handles very small probabilities', () => {
      const diseases: DiseaseCandidate[] = [
        { diseaseName: 'A', probability: 0.001, supportingSymptoms: [], missingSymptoms: [] },
        { diseaseName: 'B', probability: 0.0005, supportingSymptoms: [], missingSymptoms: [] }
      ];
      const confidence = calculateConfidenceScore(diseases);
      
      expect(confidence).toBeGreaterThanOrEqual(0.0);
      expect(confidence).toBeLessThanOrEqual(1.0);
    });

    test('handles probabilities that sum to slightly more than 1.0', () => {
      const diseases: DiseaseCandidate[] = [
        { diseaseName: 'A', probability: 0.50, supportingSymptoms: [], missingSymptoms: [] },
        { diseaseName: 'B', probability: 0.30, supportingSymptoms: [], missingSymptoms: [] },
        { diseaseName: 'C', probability: 0.25, supportingSymptoms: [], missingSymptoms: [] } // Sum = 1.05
      ];
      const confidence = calculateConfidenceScore(diseases);
      
      // Should still work and return valid confidence
      expect(confidence).toBeGreaterThanOrEqual(0.0);
      expect(confidence).toBeLessThanOrEqual(1.0);
    });

    test('handles many diseases with uniform distribution', () => {
      const diseases: DiseaseCandidate[] = Array.from({ length: 10 }, (_, i) => ({
        diseaseName: `Disease ${i}`,
        probability: 0.10,
        supportingSymptoms: [],
        missingSymptoms: []
      }));
      const confidence = calculateConfidenceScore(diseases);
      
      // Uniform distribution should have low confidence
      expect(confidence).toBeLessThan(0.3);
    });
  });
});

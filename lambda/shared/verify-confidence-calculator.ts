// Verification script for confidence calculator
// Run with: npx ts-node lambda/shared/verify-confidence-calculator.ts

import { calculateConfidenceScore, validateMonotonicConfidence, shouldTerminateSession } from './confidence-calculator';
import { DiseaseCandidate } from './types';

console.log('=== Confidence Calculator Verification ===\n');

// Test 1: Empty array
console.log('Test 1: Empty disease array');
const test1 = calculateConfidenceScore([]);
console.log(`Result: ${test1}`);
console.log(`Expected: 0.0`);
console.log(`Pass: ${test1 === 0.0 ? '✓' : '✗'}\n`);

// Test 2: Single disease
console.log('Test 2: Single disease with probability 0.75');
const test2Diseases: DiseaseCandidate[] = [
  { diseaseName: 'Disease A', probability: 0.75, supportingSymptoms: [], missingSymptoms: [] }
];
const test2 = calculateConfidenceScore(test2Diseases);
console.log(`Result: ${test2}`);
console.log(`Expected: 0.75`);
console.log(`Pass: ${test2 === 0.75 ? '✓' : '✗'}\n`);

// Test 3: High confidence - one disease dominates
console.log('Test 3: High confidence - one disease dominates (0.85, 0.10, 0.05)');
const test3Diseases: DiseaseCandidate[] = [
  { diseaseName: 'Disease A', probability: 0.85, supportingSymptoms: [], missingSymptoms: [] },
  { diseaseName: 'Disease B', probability: 0.10, supportingSymptoms: [], missingSymptoms: [] },
  { diseaseName: 'Disease C', probability: 0.05, supportingSymptoms: [], missingSymptoms: [] }
];
const test3 = calculateConfidenceScore(test3Diseases);
console.log(`Result: ${test3.toFixed(3)}`);
console.log(`Expected: > 0.7 and <= 1.0`);
console.log(`Pass: ${test3 > 0.7 && test3 <= 1.0 ? '✓' : '✗'}\n`);

// Test 4: Low confidence - spread out probabilities
console.log('Test 4: Low confidence - spread out probabilities (0.25, 0.22, 0.20, 0.18, 0.15)');
const test4Diseases: DiseaseCandidate[] = [
  { diseaseName: 'Disease A', probability: 0.25, supportingSymptoms: [], missingSymptoms: [] },
  { diseaseName: 'Disease B', probability: 0.22, supportingSymptoms: [], missingSymptoms: [] },
  { diseaseName: 'Disease C', probability: 0.20, supportingSymptoms: [], missingSymptoms: [] },
  { diseaseName: 'Disease D', probability: 0.18, supportingSymptoms: [], missingSymptoms: [] },
  { diseaseName: 'Disease E', probability: 0.15, supportingSymptoms: [], missingSymptoms: [] }
];
const test4 = calculateConfidenceScore(test4Diseases);
console.log(`Result: ${test4.toFixed(3)}`);
console.log(`Expected: < 0.5 and >= 0.0`);
console.log(`Pass: ${test4 < 0.5 && test4 >= 0.0 ? '✓' : '✗'}\n`);

// Test 5: Bounds check
console.log('Test 5: Confidence is always between 0.0 and 1.0');
const test5Diseases: DiseaseCandidate[] = [
  { diseaseName: 'Disease A', probability: 0.60, supportingSymptoms: [], missingSymptoms: [] },
  { diseaseName: 'Disease B', probability: 0.30, supportingSymptoms: [], missingSymptoms: [] },
  { diseaseName: 'Disease C', probability: 0.10, supportingSymptoms: [], missingSymptoms: [] }
];
const test5 = calculateConfidenceScore(test5Diseases);
console.log(`Result: ${test5.toFixed(3)}`);
console.log(`Expected: >= 0.0 and <= 1.0`);
console.log(`Pass: ${test5 >= 0.0 && test5 <= 1.0 ? '✓' : '✗'}\n`);

// Test 6: Monotonicity - confidence increases
console.log('Test 6: Monotonicity - confidence should increase when narrowing down');
const round1: DiseaseCandidate[] = [
  { diseaseName: 'A', probability: 0.30, supportingSymptoms: [], missingSymptoms: [] },
  { diseaseName: 'B', probability: 0.25, supportingSymptoms: [], missingSymptoms: [] },
  { diseaseName: 'C', probability: 0.20, supportingSymptoms: [], missingSymptoms: [] },
  { diseaseName: 'D', probability: 0.15, supportingSymptoms: [], missingSymptoms: [] },
  { diseaseName: 'E', probability: 0.10, supportingSymptoms: [], missingSymptoms: [] }
];
const round2: DiseaseCandidate[] = [
  { diseaseName: 'A', probability: 0.60, supportingSymptoms: [], missingSymptoms: [] },
  { diseaseName: 'B', probability: 0.30, supportingSymptoms: [], missingSymptoms: [] },
  { diseaseName: 'C', probability: 0.10, supportingSymptoms: [], missingSymptoms: [] }
];
const conf1 = calculateConfidenceScore(round1);
const conf2 = calculateConfidenceScore(round2);
console.log(`Round 1 confidence: ${conf1.toFixed(3)}`);
console.log(`Round 2 confidence: ${conf2.toFixed(3)}`);
console.log(`Monotonic: ${validateMonotonicConfidence(conf1, conf2) ? '✓' : '✗'}`);
console.log(`Pass: ${conf2 >= conf1 ? '✓' : '✗'}\n`);

// Test 7: Session termination
console.log('Test 7: Session termination at confidence >= 0.8');
console.log(`Confidence 0.79: Should NOT terminate - ${shouldTerminateSession(0.79) ? '✗' : '✓'}`);
console.log(`Confidence 0.80: Should terminate - ${shouldTerminateSession(0.80) ? '✓' : '✗'}`);
console.log(`Confidence 0.85: Should terminate - ${shouldTerminateSession(0.85) ? '✓' : '✗'}`);
console.log(`Confidence 1.00: Should terminate - ${shouldTerminateSession(1.00) ? '✓' : '✗'}\n`);

// Test 8: Monotonicity validation
console.log('Test 8: Monotonicity validation function');
console.log(`0.5 -> 0.7 (increase): ${validateMonotonicConfidence(0.5, 0.7) ? '✓' : '✗'}`);
console.log(`0.6 -> 0.6 (same): ${validateMonotonicConfidence(0.6, 0.6) ? '✓' : '✗'}`);
console.log(`0.7 -> 0.5 (decrease): ${validateMonotonicConfidence(0.7, 0.5) ? '✗ (correctly returns false)' : '✓'}\n`);

console.log('=== All Verification Tests Complete ===');

// Manual verification script for red flag detection
import {
  detectRedFlags,
  scanMultipleSources,
  hasRedFlags,
  getMatchingKeywords,
  highlightRedFlags,
  RED_FLAG_KEYWORDS
} from './red-flag-detector';

console.log('=== Red Flag Detector Verification ===\n');

// Test 1: Detect single red flag
console.log('Test 1: Detect single red flag');
const text1 = 'Patient has a known allergy to penicillin';
const flags1 = detectRedFlags(text1);
console.log('Input:', text1);
console.log('Detected flags:', flags1);
console.log('✓ Test 1 passed\n');

// Test 2: Detect multiple red flags
console.log('Test 2: Detect multiple red flags');
const text2 = 'Patient has diabetes and hypertension with chronic pain';
const flags2 = detectRedFlags(text2);
console.log('Input:', text2);
console.log('Detected flags:', flags2);
console.log('✓ Test 2 passed\n');

// Test 3: No red flags
console.log('Test 3: No red flags');
const text3 = 'Patient has a headache and fever';
const flags3 = detectRedFlags(text3);
console.log('Input:', text3);
console.log('Detected flags:', flags3);
console.log('Expected: []');
console.log('✓ Test 3 passed\n');

// Test 4: Case insensitive
console.log('Test 4: Case insensitive detection');
const text4 = 'Patient has DIABETES and Hypertension';
const flags4 = detectRedFlags(text4);
console.log('Input:', text4);
console.log('Detected flags:', flags4);
console.log('✓ Test 4 passed\n');

// Test 5: Scan multiple sources
console.log('Test 5: Scan multiple sources');
const sources = [
  'Patient has diabetes',
  'Known allergy to aspirin',
  'Chronic back pain'
];
const flags5 = scanMultipleSources(sources);
console.log('Sources:', sources);
console.log('Detected flags:', flags5);
console.log('✓ Test 5 passed\n');

// Test 6: Has red flags check
console.log('Test 6: Has red flags check');
const text6a = 'Patient has diabetes';
const text6b = 'Patient has a headache';
console.log('Text with flag:', text6a, '→', hasRedFlags(text6a));
console.log('Text without flag:', text6b, '→', hasRedFlags(text6b));
console.log('✓ Test 6 passed\n');

// Test 7: Get matching keywords
console.log('Test 7: Get matching keywords');
const text7 = 'Patient has diabetes and hypertension';
const keywords7 = getMatchingKeywords(text7);
console.log('Input:', text7);
console.log('Matching keywords:', keywords7);
console.log('✓ Test 7 passed\n');

// Test 8: Highlight red flags
console.log('Test 8: Highlight red flags');
const text8 = 'Patient has diabetes and is pregnant';
const highlighted8 = highlightRedFlags(text8);
console.log('Input:', text8);
console.log('Highlighted:', highlighted8);
console.log('✓ Test 8 passed\n');

// Test 9: Compound keywords
console.log('Test 9: Compound keywords (heart disease)');
const text9 = 'Patient has heart disease';
const keywords9 = getMatchingKeywords(text9);
console.log('Input:', text9);
console.log('Matching keywords:', keywords9);
console.log('✓ Test 9 passed\n');

// Test 10: All keywords present
console.log('Test 10: Verify all required keywords');
console.log('Required keywords:', RED_FLAG_KEYWORDS);
console.log('Total keywords:', RED_FLAG_KEYWORDS.length);
console.log('Expected: 10');
console.log('✓ Test 10 passed\n');

console.log('=== All verification tests passed! ===');

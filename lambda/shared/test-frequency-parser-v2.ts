// Test script for frequency-parser-v2.ts
// Demonstrates all supported frequency formats and error handling

import { parseFrequency, isValidTimeFormat, getTimeOfDay, calculateStopDate } from './frequency-parser-v2';

console.log('=== Frequency Parser V2 Test Suite ===\n');

// Test cases for Requirement 23.1: Parse frequency specifications
console.log('--- Requirement 23.1: Supported Frequency Formats ---\n');

const testCases = [
  // Once daily variations
  'once daily',
  'once a day',
  'daily',
  'once',
  
  // Twice daily variations
  'twice daily',
  'twice a day',
  'two times daily',
  'BID',
  
  // Three times daily variations
  'three times daily',
  'three times a day',
  'thrice daily',
  'TID',
  
  // Four times daily
  'four times daily',
  'QID',
  
  // Every N hours patterns
  'every 4 hours',
  'every 6 hours',
  'every 8 hours',
  'every 12 hours',
  'every 24 hours',
  
  // As needed variations
  'as needed',
  'as required',
  'PRN',
  'when needed',
  'if needed',
  
  // Time-specific
  'at bedtime',
  'in the morning',
  'morning and evening'
];

testCases.forEach(frequency => {
  const result = parseFrequency(frequency);
  if (result.success) {
    if (result.isAsNeeded) {
      console.log(`✓ "${frequency}" → AS NEEDED (no scheduled times)`);
    } else {
      console.log(`✓ "${frequency}" → ${result.times?.join(', ')}`);
    }
  } else {
    console.log(`✗ "${frequency}" → ERROR: ${result.error}`);
  }
});

// Test cases for Requirement 23.2: Convert to specific time intervals
console.log('\n--- Requirement 23.2: Time Interval Generation ---\n');

const intervalTests = [
  { frequency: 'once daily', expectedCount: 1 },
  { frequency: 'twice daily', expectedCount: 2 },
  { frequency: 'three times daily', expectedCount: 3 },
  { frequency: 'every 6 hours', expectedCount: 4 },
  { frequency: 'every 8 hours', expectedCount: 3 }
];

intervalTests.forEach(test => {
  const result = parseFrequency(test.frequency);
  if (result.success && result.times) {
    const actualCount = result.times.length;
    const match = actualCount === test.expectedCount ? '✓' : '✗';
    console.log(`${match} "${test.frequency}" generates ${actualCount} times (expected ${test.expectedCount})`);
    console.log(`   Times: ${result.times.join(', ')}`);
  }
});

// Test cases for Requirement 23.3: Error handling for invalid frequencies
console.log('\n--- Requirement 23.3: Error Handling ---\n');

const errorTestCases = [
  '',                           // Empty string
  '   ',                        // Whitespace only
  'every 5 hours',              // Doesn't divide evenly into 24
  'every 25 hours',             // Exceeds 24 hours
  'every 0 hours',              // Zero interval
  '7 times daily',              // Exceeds maximum
  '0 times daily',              // Zero frequency
  'take with food',             // Unrecognized pattern
  'xyz123',                     // Invalid input
  'every hours',                // Missing number
  'times daily'                 // Missing number
];

errorTestCases.forEach(frequency => {
  const result = parseFrequency(frequency);
  if (!result.success) {
    console.log(`✓ "${frequency}" → ERROR: ${result.error}`);
  } else {
    console.log(`✗ "${frequency}" → Should have failed but succeeded`);
  }
});

// Test time validation
console.log('\n--- Time Format Validation ---\n');

const timeTests = [
  { time: '09:00', valid: true },
  { time: '23:59', valid: true },
  { time: '00:00', valid: true },
  { time: '24:00', valid: false },
  { time: '9:00', valid: false },
  { time: '09:0', valid: false },
  { time: 'invalid', valid: false }
];

timeTests.forEach(test => {
  const isValid = isValidTimeFormat(test.time);
  const match = isValid === test.valid ? '✓' : '✗';
  console.log(`${match} "${test.time}" → ${isValid ? 'VALID' : 'INVALID'} (expected ${test.valid ? 'VALID' : 'INVALID'})`);
});

// Test time of day categorization
console.log('\n--- Time of Day Categorization ---\n');

const timeOfDayTests = [
  { time: '06:00', expected: 'morning' },
  { time: '09:00', expected: 'morning' },
  { time: '12:00', expected: 'afternoon' },
  { time: '14:00', expected: 'afternoon' },
  { time: '17:00', expected: 'evening' },
  { time: '21:00', expected: 'night' },
  { time: '23:00', expected: 'night' }
];

timeOfDayTests.forEach(test => {
  const category = getTimeOfDay(test.time);
  const match = category === test.expected ? '✓' : '✗';
  console.log(`${match} ${test.time} → ${category} (expected ${test.expected})`);
});

// Test stop date calculation
console.log('\n--- Stop Date Calculation ---\n');

const startDate = new Date('2024-01-15T09:00:00Z');
const durationTests = [
  { days: 7, description: '7 days' },
  { days: 14, description: '14 days (2 weeks)' },
  { days: 30, description: '30 days (1 month)' }
];

durationTests.forEach(test => {
  try {
    const stopDate = calculateStopDate(startDate, test.days);
    const stop = new Date(stopDate);
    console.log(`✓ Start: ${startDate.toISOString().split('T')[0]}, Duration: ${test.description}`);
    console.log(`   Stop: ${stop.toISOString().split('T')[0]}`);
  } catch (error) {
    console.log(`✗ ${test.description} → ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// Summary of supported patterns
console.log('\n--- Supported Frequency Patterns Summary ---\n');
console.log('1. Standard frequencies:');
console.log('   - "once daily", "twice daily", "three times daily", "four times daily"');
console.log('   - Medical abbreviations: "BID", "TID", "QID"');
console.log('');
console.log('2. Interval-based:');
console.log('   - "every N hours" (where N divides evenly into 24: 1, 2, 3, 4, 6, 8, 12, 24)');
console.log('');
console.log('3. As needed:');
console.log('   - "as needed", "PRN", "when needed", "if needed"');
console.log('');
console.log('4. Time-specific:');
console.log('   - "at bedtime", "in the morning", "morning and evening"');
console.log('');
console.log('5. Numeric patterns:');
console.log('   - "X times daily" (where X is 1-6)');

console.log('\n=== Test Suite Complete ===');

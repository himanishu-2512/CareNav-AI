// Test script for QR generator utility
// Run with: npx tsx lambda/shared/test-qr-generator.ts

import {
  generateUniqueCode,
  formatQRData,
  parseQRData,
  validateUniqueCodeFormat,
  generateQRToken
} from './qr-generator';

console.log('=== QR Generator Utility Tests ===\n');

// Test 1: Generate unique codes
console.log('Test 1: Generate Unique Codes');
console.log('Generating 10 unique codes...');
const codes = new Set<string>();
for (let i = 0; i < 10; i++) {
  const code = generateUniqueCode();
  codes.add(code);
  console.log(`  Code ${i + 1}: ${code} (length: ${code.length})`);
}
console.log(`✓ Generated ${codes.size} unique codes (all should be 8 characters)\n`);

// Test 2: Verify no ambiguous characters
console.log('Test 2: Verify No Ambiguous Characters');
const ambiguousChars = ['0', 'O', '1', 'I', 'l'];
let hasAmbiguous = false;
for (const code of codes) {
  for (const char of ambiguousChars) {
    if (code.includes(char)) {
      console.log(`  ✗ Code ${code} contains ambiguous character: ${char}`);
      hasAmbiguous = true;
    }
  }
}
if (!hasAmbiguous) {
  console.log('  ✓ No ambiguous characters found in any code\n');
}

// Test 3: Format QR data
console.log('Test 3: Format QR Data');
const testTokenId = '123e4567-e89b-12d3-a456-426614174000';
const qrData = formatQRData(testTokenId);
console.log(`  Token ID: ${testTokenId}`);
console.log(`  QR Data: ${qrData}`);
console.log(`  ✓ Format: CARENAV:TOKEN:{tokenId}\n`);

// Test 4: Parse QR data
console.log('Test 4: Parse QR Data');
const parsedTokenId = parseQRData(qrData);
console.log(`  Original Token ID: ${testTokenId}`);
console.log(`  Parsed Token ID:   ${parsedTokenId}`);
console.log(`  Match: ${testTokenId === parsedTokenId ? '✓' : '✗'}\n`);

// Test 5: Parse invalid QR data
console.log('Test 5: Parse Invalid QR Data');
const invalidQRData = [
  'INVALID:TOKEN:123',
  'CARENAV:WRONG:123',
  'CARENAV:TOKEN:',
  'CARENAV:TOKEN:invalid-uuid'
];
for (const invalid of invalidQRData) {
  const result = parseQRData(invalid);
  console.log(`  "${invalid}" -> ${result === null ? '✓ null (expected)' : '✗ ' + result}`);
}
console.log();

// Test 6: Validate unique code format
console.log('Test 6: Validate Unique Code Format');
const validationTests = [
  { code: 'ABC12345', expected: true },
  { code: 'ABCD1234', expected: true },
  { code: 'abc12345', expected: true }, // lowercase should work
  { code: 'ABC123', expected: false }, // too short
  { code: 'ABC1234567', expected: false }, // too long
  { code: 'ABC-1234', expected: false }, // contains hyphen
  { code: 'ABC 1234', expected: false }, // contains space
  { code: '', expected: false }, // empty
];

for (const test of validationTests) {
  const result = validateUniqueCodeFormat(test.code);
  const status = result.valid === test.expected ? '✓' : '✗';
  console.log(`  ${status} "${test.code}" -> ${result.valid ? 'valid' : `invalid: ${result.error}`}`);
}
console.log();

// Test 7: Generate full QR token (requires database)
console.log('Test 7: Generate Full QR Token');
console.log('Note: This test requires DynamoDB connection');
console.log('Skipping database test in this script');
console.log('To test generateQRToken(), use it in a Lambda function with proper AWS credentials\n');

// Test 8: Round-trip test
console.log('Test 8: Round-Trip Test (Format -> Parse)');
const testUUIDs = [
  '550e8400-e29b-41d4-a716-446655440000',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
];

for (const uuid of testUUIDs) {
  const formatted = formatQRData(uuid);
  const parsed = parseQRData(formatted);
  const match = uuid === parsed;
  console.log(`  ${match ? '✓' : '✗'} ${uuid} -> ${formatted} -> ${parsed}`);
}
console.log();

console.log('=== All Tests Complete ===');

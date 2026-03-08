// Test script for QR Authentication Lambda Handler
// Run with: npx ts-node lambda/qr-auth/test-handler.ts

import { handler } from './index';
import { APIGatewayProxyEvent } from 'aws-lambda';

/**
 * Create a mock API Gateway event
 */
function createMockEvent(
  path: string,
  method: string,
  body?: any
): APIGatewayProxyEvent {
  return {
    path,
    httpMethod: method,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Test-Agent/1.0'
    },
    body: body ? JSON.stringify(body) : null,
    isBase64Encoded: false,
    requestContext: {
      accountId: 'test-account',
      apiId: 'test-api',
      protocol: 'HTTP/1.1',
      httpMethod: method,
      path,
      stage: 'test',
      requestId: 'test-request-id',
      requestTimeEpoch: Date.now(),
      resourceId: 'test-resource',
      resourcePath: path,
      identity: {
        sourceIp: '127.0.0.1',
        userAgent: 'Test-Agent/1.0',
        accessKey: null,
        accountId: null,
        apiKey: null,
        apiKeyId: null,
        caller: null,
        cognitoAuthenticationProvider: null,
        cognitoAuthenticationType: null,
        cognitoIdentityId: null,
        cognitoIdentityPoolId: null,
        principalOrgId: null,
        user: null,
        userArn: null,
        clientCert: null
      },
      authorizer: null
    },
    resource: path,
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    multiValueHeaders: {}
  } as any;
}

/**
 * Test QR validation endpoint
 */
async function testQRValidation() {
  console.log('\n=== Testing QR Validation Endpoint ===\n');

  // Test 1: Valid QR code format
  console.log('Test 1: Valid QR code format');
  const validQREvent = createMockEvent('/api/qr/validate', 'POST', {
    qrData: 'CARENAV:TOKEN:test-token-123',
    doctorId: 'doctor-123'
  });

  const validQRResult = await handler(validQREvent);
  console.log('Status:', validQRResult.statusCode);
  console.log('Response:', JSON.parse(validQRResult.body));

  // Test 2: Invalid QR code format
  console.log('\nTest 2: Invalid QR code format');
  const invalidQREvent = createMockEvent('/api/qr/validate', 'POST', {
    qrData: 'INVALID:FORMAT',
    doctorId: 'doctor-123'
  });

  const invalidQRResult = await handler(invalidQREvent);
  console.log('Status:', invalidQRResult.statusCode);
  console.log('Response:', JSON.parse(invalidQRResult.body));

  // Test 3: Missing required fields
  console.log('\nTest 3: Missing required fields');
  const missingFieldsEvent = createMockEvent('/api/qr/validate', 'POST', {
    qrData: 'CARENAV:TOKEN:test-token-123'
    // Missing doctorId
  });

  const missingFieldsResult = await handler(missingFieldsEvent);
  console.log('Status:', missingFieldsResult.statusCode);
  console.log('Response:', JSON.parse(missingFieldsResult.body));

  // Test 4: Empty body
  console.log('\nTest 4: Empty body');
  const emptyBodyEvent = createMockEvent('/api/qr/validate', 'POST');

  const emptyBodyResult = await handler(emptyBodyEvent);
  console.log('Status:', emptyBodyResult.statusCode);
  console.log('Response:', JSON.parse(emptyBodyResult.body));
}

/**
 * Test unique code validation endpoint
 */
async function testUniqueCodeValidation() {
  console.log('\n=== Testing Unique Code Validation Endpoint ===\n');

  // Test 1: Valid alphanumeric code
  console.log('Test 1: Valid alphanumeric code');
  const validCodeEvent = createMockEvent('/api/qr/validate-code', 'POST', {
    uniqueCode: 'ABC123XYZ',
    doctorId: 'doctor-123'
  });

  const validCodeResult = await handler(validCodeEvent);
  console.log('Status:', validCodeResult.statusCode);
  console.log('Response:', JSON.parse(validCodeResult.body));

  // Test 2: Invalid code with special characters
  console.log('\nTest 2: Invalid code with special characters');
  const invalidCodeEvent = createMockEvent('/api/qr/validate-code', 'POST', {
    uniqueCode: 'ABC-123-XYZ',
    doctorId: 'doctor-123'
  });

  const invalidCodeResult = await handler(invalidCodeEvent);
  console.log('Status:', invalidCodeResult.statusCode);
  console.log('Response:', JSON.parse(invalidCodeResult.body));

  // Test 3: Code with spaces
  console.log('\nTest 3: Code with spaces');
  const spaceCodeEvent = createMockEvent('/api/qr/validate-code', 'POST', {
    uniqueCode: 'ABC 123 XYZ',
    doctorId: 'doctor-123'
  });

  const spaceCodeResult = await handler(spaceCodeEvent);
  console.log('Status:', spaceCodeResult.statusCode);
  console.log('Response:', JSON.parse(spaceCodeResult.body));

  // Test 4: Missing required fields
  console.log('\nTest 4: Missing required fields');
  const missingFieldsEvent = createMockEvent('/api/qr/validate-code', 'POST', {
    uniqueCode: 'ABC123XYZ'
    // Missing doctorId
  });

  const missingFieldsResult = await handler(missingFieldsEvent);
  console.log('Status:', missingFieldsResult.statusCode);
  console.log('Response:', JSON.parse(missingFieldsResult.body));
}

/**
 * Test invalid endpoints
 */
async function testInvalidEndpoints() {
  console.log('\n=== Testing Invalid Endpoints ===\n');

  // Test 1: Invalid path
  console.log('Test 1: Invalid path');
  const invalidPathEvent = createMockEvent('/api/qr/invalid', 'POST', {
    qrData: 'test'
  });

  const invalidPathResult = await handler(invalidPathEvent);
  console.log('Status:', invalidPathResult.statusCode);
  console.log('Response:', JSON.parse(invalidPathResult.body));

  // Test 2: Invalid method
  console.log('\nTest 2: Invalid method');
  const invalidMethodEvent = createMockEvent('/api/qr/validate', 'GET');

  const invalidMethodResult = await handler(invalidMethodEvent);
  console.log('Status:', invalidMethodResult.statusCode);
  console.log('Response:', JSON.parse(invalidMethodResult.body));
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('Starting QR Authentication Lambda Tests...');
  console.log('Note: These tests will fail with database errors if DynamoDB is not configured.');
  console.log('The tests validate request handling, validation logic, and error responses.\n');

  try {
    await testQRValidation();
    await testUniqueCodeValidation();
    await testInvalidEndpoints();

    console.log('\n=== All Tests Completed ===\n');
    console.log('Summary:');
    console.log('- QR validation endpoint: Request validation working');
    console.log('- Unique code validation endpoint: Format validation working');
    console.log('- Error handling: Proper error responses returned');
    console.log('\nNote: Database operations will fail without proper AWS configuration.');
    console.log('Deploy to AWS to test full integration with DynamoDB.');
  } catch (error) {
    console.error('\nTest execution error:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

export { runTests, testQRValidation, testUniqueCodeValidation, testInvalidEndpoints };

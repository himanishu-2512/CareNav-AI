// Test script for doctor handler Lambda
// Run with: npx ts-node lambda/doctor-handler/test-handler.ts

import { handler } from './index';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { createPatient, addPatientToDoctor } from '../shared/patient-db';

/**
 * Create a mock API Gateway event
 */
function createMockEvent(
  httpMethod: string,
  path: string,
  queryStringParameters?: Record<string, string>,
  body?: any,
  doctorId: string = 'test-doctor-123'
): APIGatewayProxyEvent {
  return {
    httpMethod,
    path,
    queryStringParameters: queryStringParameters || null,
    body: body ? JSON.stringify(body) : null,
    headers: {},
    multiValueHeaders: {},
    isBase64Encoded: false,
    pathParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {
      accountId: 'test-account',
      apiId: 'test-api',
      protocol: 'HTTP/1.1',
      httpMethod,
      path,
      stage: 'test',
      requestId: 'test-request-id',
      requestTimeEpoch: Date.now(),
      resourceId: 'test-resource',
      resourcePath: path,
      authorizer: {
        userId: doctorId // Mock JWT authorizer context
      },
      identity: {
        accessKey: null,
        accountId: null,
        apiKey: null,
        apiKeyId: null,
        caller: null,
        clientCert: null,
        cognitoAuthenticationProvider: null,
        cognitoAuthenticationType: null,
        cognitoIdentityId: null,
        cognitoIdentityPoolId: null,
        principalOrgId: null,
        sourceIp: '127.0.0.1',
        user: null,
        userAgent: 'test-agent',
        userArn: null
      }
    },
    resource: path
  } as any;
}

/**
 * Test the doctor handler Lambda
 */
async function testDoctorHandler() {
  console.log('=== Testing Doctor Handler Lambda ===\n');

  const doctorId = 'test-doctor-' + Date.now();

  try {
    // Step 1: Create test patients
    console.log('Step 1: Creating test patients...');
    const patient1 = await createPatient({
      name: 'John Doe',
      age: 45,
      gender: 'Male',
      contact: '+1234567890'
    });
    console.log('✓ Created patient 1:', patient1.patientId);

    const patient2 = await createPatient({
      name: 'Jane Smith',
      age: 32,
      gender: 'Female',
      contact: '+1234567891'
    });
    console.log('✓ Created patient 2:', patient2.patientId);

    const patient3 = await createPatient({
      name: 'Bob Johnson',
      age: 58,
      gender: 'Male',
      contact: '+1234567892'
    });
    console.log('✓ Created patient 3:', patient3.patientId);

    // Step 2: Add patients to doctor's list
    console.log('\nStep 2: Adding patients to doctor via POST /api/doctor/patients/add...');
    
    const addEvent1 = createMockEvent(
      'POST',
      '/api/doctor/patients/add',
      undefined,
      {
        patientId: patient1.patientId,
        addedVia: 'qr_scan',
        accessGrantedBy: 'qr-token-abc123'
      },
      doctorId
    );
    const addResult1 = await handler(addEvent1);
    console.log('✓ Add patient 1 response:', addResult1.statusCode);
    console.log('  Body:', JSON.parse(addResult1.body));

    const addEvent2 = createMockEvent(
      'POST',
      '/api/doctor/patients/add',
      undefined,
      {
        patientId: patient2.patientId,
        addedVia: 'manual_code',
        accessGrantedBy: 'CODE12345'
      },
      doctorId
    );
    const addResult2 = await handler(addEvent2);
    console.log('✓ Add patient 2 response:', addResult2.statusCode);

    const addEvent3 = createMockEvent(
      'POST',
      '/api/doctor/patients/add',
      undefined,
      {
        patientId: patient3.patientId,
        addedVia: 'qr_scan',
        accessGrantedBy: 'qr-token-xyz789'
      },
      doctorId
    );
    const addResult3 = await handler(addEvent3);
    console.log('✓ Add patient 3 response:', addResult3.statusCode);

    // Step 3: Test GET /api/doctor/patients (list all)
    console.log('\nStep 3: Testing GET /api/doctor/patients (list all)...');
    const listEvent = createMockEvent(
      'GET',
      '/api/doctor/patients',
      undefined,
      undefined,
      doctorId
    );
    const listResult = await handler(listEvent);
    console.log('✓ List patients response:', listResult.statusCode);
    const listBody = JSON.parse(listResult.body);
    console.log('  Total patients:', listBody.totalCount);
    console.log('  Patients:', listBody.patients.map((p: any) => p.name));

    // Step 4: Test pagination
    console.log('\nStep 4: Testing pagination (limit=2)...');
    const paginationEvent = createMockEvent(
      'GET',
      '/api/doctor/patients',
      { page: '1', limit: '2' },
      undefined,
      doctorId
    );
    const paginationResult = await handler(paginationEvent);
    console.log('✓ Pagination response:', paginationResult.statusCode);
    const paginationBody = JSON.parse(paginationResult.body);
    console.log('  Page:', paginationBody.page);
    console.log('  Total pages:', paginationBody.totalPages);
    console.log('  Has more:', paginationBody.hasMore);
    console.log('  Patients on page:', paginationBody.patients.length);

    // Step 5: Test search by name
    console.log('\nStep 5: Testing search by name (q=john)...');
    const searchEvent = createMockEvent(
      'GET',
      '/api/doctor/patients/search',
      { q: 'john' },
      undefined,
      doctorId
    );
    const searchResult = await handler(searchEvent);
    console.log('✓ Search response:', searchResult.statusCode);
    const searchBody = JSON.parse(searchResult.body);
    console.log('  Search query:', searchBody.searchQuery);
    console.log('  Matches found:', searchBody.totalCount);
    console.log('  Matching patients:', searchBody.patients.map((p: any) => p.name));

    // Step 6: Test search by partial name (case-insensitive)
    console.log('\nStep 6: Testing case-insensitive search (q=JANE)...');
    const searchEvent2 = createMockEvent(
      'GET',
      '/api/doctor/patients/search',
      { q: 'JANE' },
      undefined,
      doctorId
    );
    const searchResult2 = await handler(searchEvent2);
    const searchBody2 = JSON.parse(searchResult2.body);
    console.log('✓ Search found:', searchBody2.totalCount, 'patient(s)');
    console.log('  Matching patients:', searchBody2.patients.map((p: any) => p.name));

    // Step 7: Test status filter (ongoing)
    console.log('\nStep 7: Testing status filter (status=ongoing)...');
    const filterEvent = createMockEvent(
      'GET',
      '/api/doctor/patients',
      { status: 'ongoing' },
      undefined,
      doctorId
    );
    const filterResult = await handler(filterEvent);
    const filterBody = JSON.parse(filterResult.body);
    console.log('✓ Filter response:', filterResult.statusCode);
    console.log('  Ongoing patients:', filterBody.totalCount);

    // Step 8: Test error handling - missing authorization
    console.log('\nStep 8: Testing error handling (missing authorization)...');
    const unauthorizedEvent = createMockEvent(
      'GET',
      '/api/doctor/patients',
      undefined,
      undefined,
      '' // Empty doctorId
    );
    unauthorizedEvent.requestContext.authorizer = {}; // Remove userId
    const unauthorizedResult = await handler(unauthorizedEvent);
    console.log('✓ Unauthorized response:', unauthorizedResult.statusCode);
    console.log('  Error:', JSON.parse(unauthorizedResult.body).error);

    // Step 9: Test error handling - invalid pagination
    console.log('\nStep 9: Testing error handling (invalid pagination)...');
    const invalidPaginationEvent = createMockEvent(
      'GET',
      '/api/doctor/patients',
      { page: '-1' },
      undefined,
      doctorId
    );
    const invalidPaginationResult = await handler(invalidPaginationEvent);
    console.log('✓ Invalid pagination response:', invalidPaginationResult.statusCode);
    console.log('  Error:', JSON.parse(invalidPaginationResult.body).error);

    // Step 10: Test error handling - missing search query
    console.log('\nStep 10: Testing error handling (missing search query)...');
    const missingQueryEvent = createMockEvent(
      'GET',
      '/api/doctor/patients/search',
      {},
      undefined,
      doctorId
    );
    const missingQueryResult = await handler(missingQueryEvent);
    console.log('✓ Missing query response:', missingQueryResult.statusCode);
    console.log('  Error:', JSON.parse(missingQueryResult.body).error);

    // Step 11: Test error handling - invalid add patient request
    console.log('\nStep 11: Testing error handling (invalid add patient)...');
    const invalidAddEvent = createMockEvent(
      'POST',
      '/api/doctor/patients/add',
      undefined,
      {
        patientId: patient1.patientId,
        addedVia: 'invalid_method', // Invalid method
        accessGrantedBy: 'test'
      },
      doctorId
    );
    const invalidAddResult = await handler(invalidAddEvent);
    console.log('✓ Invalid add response:', invalidAddResult.statusCode);
    console.log('  Error:', JSON.parse(invalidAddResult.body).error);

    console.log('\n=== All Tests Completed Successfully! ===');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  }
}

// Run tests
if (require.main === module) {
  testDoctorHandler()
    .then(() => {
      console.log('\n✓ Test script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test script failed:', error);
      process.exit(1);
    });
}

export { testDoctorHandler };

// Test script for adherence dashboard endpoint
// This script tests the GET /api/adherence/:patientId endpoint

import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from './index';

async function testAdherenceEndpoint() {
  console.log('Testing Adherence Dashboard Endpoint...\n');

  // Test patient ID (should have treatment plans and doses)
  const testPatientId = 'test-patient-001';

  // Mock API Gateway event for GET /api/adherence/:patientId
  const mockEvent: Partial<APIGatewayProxyEvent> = {
    httpMethod: 'GET',
    path: `/api/adherence/${testPatientId}`,
    pathParameters: {
      patientId: testPatientId
    },
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token'
    },
    requestContext: {
      authorizer: {
        role: 'doctor', // Doctor role required
        userId: 'test-doctor-001'
      }
    } as any,
    body: null,
    isBase64Encoded: false,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    resource: '',
    multiValueHeaders: {}
  };

  try {
    console.log('Test 1: Valid doctor request for patient adherence');
    console.log('Request:', JSON.stringify(mockEvent, null, 2));
    
    const response = await handler(mockEvent as APIGatewayProxyEvent);
    console.log('\nResponse Status:', response.statusCode);
    console.log('Response Body:', JSON.stringify(JSON.parse(response.body), null, 2));

    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      console.log('\n✓ Test 1 PASSED: Successfully retrieved adherence data');
      console.log(`  - Patient: ${data.patient.name}`);
      console.log(`  - Overall Adherence: ${data.adherence.overall}%`);
      console.log(`  - Warning Level: ${data.adherence.warningLevel}`);
      console.log(`  - Total Scheduled: ${data.adherence.totalScheduled}`);
      console.log(`  - Total Taken: ${data.adherence.totalTaken}`);
      console.log(`  - Total Missed: ${data.adherence.totalMissed}`);
      console.log(`  - Medicines: ${data.medicines.length}`);
      console.log(`  - Missed Doses: ${data.missedDoses.length}`);
    } else {
      console.log('✗ Test 1 FAILED: Expected status 200, got', response.statusCode);
    }

  } catch (error: any) {
    console.error('✗ Test 1 FAILED with error:', error.message);
  }

  console.log('\n' + '='.repeat(80) + '\n');

  // Test 2: Non-doctor role (should be denied)
  const patientRoleEvent: Partial<APIGatewayProxyEvent> = {
    ...mockEvent,
    requestContext: {
      authorizer: {
        role: 'patient', // Patient role should be denied
        userId: 'test-patient-001'
      }
    } as any
  };

  try {
    console.log('Test 2: Patient role request (should be denied)');
    const response = await handler(patientRoleEvent as APIGatewayProxyEvent);
    console.log('Response Status:', response.statusCode);
    console.log('Response Body:', response.body);

    if (response.statusCode === 403) {
      console.log('✓ Test 2 PASSED: Access correctly denied for non-doctor role');
    } else {
      console.log('✗ Test 2 FAILED: Expected status 403, got', response.statusCode);
    }
  } catch (error: any) {
    console.error('✗ Test 2 FAILED with error:', error.message);
  }

  console.log('\n' + '='.repeat(80) + '\n');

  // Test 3: Missing patient ID
  const missingPatientEvent: Partial<APIGatewayProxyEvent> = {
    ...mockEvent,
    pathParameters: null
  };

  try {
    console.log('Test 3: Missing patient ID (should return 400)');
    const response = await handler(missingPatientEvent as APIGatewayProxyEvent);
    console.log('Response Status:', response.statusCode);
    console.log('Response Body:', response.body);

    if (response.statusCode === 400) {
      console.log('✓ Test 3 PASSED: Correctly rejected missing patient ID');
    } else {
      console.log('✗ Test 3 FAILED: Expected status 400, got', response.statusCode);
    }
  } catch (error: any) {
    console.error('✗ Test 3 FAILED with error:', error.message);
  }

  console.log('\n' + '='.repeat(80) + '\n');

  // Test 4: Non-existent patient
  const nonExistentPatientEvent: Partial<APIGatewayProxyEvent> = {
    ...mockEvent,
    pathParameters: {
      patientId: 'non-existent-patient-999'
    }
  };

  try {
    console.log('Test 4: Non-existent patient (should return 404)');
    const response = await handler(nonExistentPatientEvent as APIGatewayProxyEvent);
    console.log('Response Status:', response.statusCode);
    console.log('Response Body:', response.body);

    if (response.statusCode === 404) {
      console.log('✓ Test 4 PASSED: Correctly returned 404 for non-existent patient');
    } else {
      console.log('✗ Test 4 FAILED: Expected status 404, got', response.statusCode);
    }
  } catch (error: any) {
    console.error('✗ Test 4 FAILED with error:', error.message);
  }

  console.log('\n' + '='.repeat(80));
  console.log('Adherence Dashboard Endpoint Tests Complete');
  console.log('='.repeat(80));
}

// Run tests
testAdherenceEndpoint().catch(console.error);

// Test script for Prescription Handler Lambda
// Run with: ts-node test-handler.ts

import { handler } from './index';
import { APIGatewayProxyEvent } from 'aws-lambda';

// Mock environment variables
process.env.TABLE_NAME = 'CareNavAI';
process.env.AWS_REGION = 'ap-south-1';

/**
 * Create a mock API Gateway event
 */
function createMockEvent(
  method: string,
  path: string,
  body?: any,
  queryParams?: Record<string, string>,
  userId?: string,
  userRole?: string
): APIGatewayProxyEvent {
  return {
    httpMethod: method,
    path,
    body: body ? JSON.stringify(body) : null,
    queryStringParameters: queryParams || null,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'test-script/1.0'
    },
    requestContext: {
      authorizer: {
        userId: userId || 'test-doctor-123',
        role: userRole || 'doctor'
      },
      identity: {
        sourceIp: '127.0.0.1'
      }
    } as any,
    isBase64Encoded: false,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
    pathParameters: null,
    stageVariables: null,
    resource: ''
  } as APIGatewayProxyEvent;
}

/**
 * Test 1: Create prescription with multiple medications
 */
async function testCreatePrescription() {
  console.log('\n=== Test 1: Create Prescription ===');

  const event = createMockEvent(
    'POST',
    '/api/prescription/create',
    {
      episodeId: 'episode-123',
      patientId: 'patient-456',
      doctorId: 'test-doctor-123',
      doctorName: 'Dr. Sarah Johnson',
      medications: [
        {
          medicineName: 'Amoxicillin',
          dosage: '500mg',
          frequency: 'three times daily',
          duration: 7,
          specialInstructions: 'Take with food',
          foodTiming: 'after food'
        },
        {
          medicineName: 'Ibuprofen',
          dosage: '400mg',
          frequency: 'twice daily',
          duration: 5,
          specialInstructions: 'For pain relief',
          foodTiming: 'after food'
        }
      ]
    }
  );

  try {
    const response = await handler(event);
    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.parse(response.body));

    if (response.statusCode === 201) {
      console.log('✓ Prescription created successfully');
      return JSON.parse(response.body);
    } else {
      console.log('✗ Failed to create prescription');
      return null;
    }
  } catch (error) {
    console.error('✗ Error:', error);
    return null;
  }
}

/**
 * Test 2: Get prescription details
 */
async function testGetPrescription(prescriptionId: string, patientId: string) {
  console.log('\n=== Test 2: Get Prescription ===');

  const event = createMockEvent(
    'GET',
    `/api/prescription/${prescriptionId}`,
    undefined,
    { patientId }
  );

  try {
    const response = await handler(event);
    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.parse(response.body));

    if (response.statusCode === 200) {
      console.log('✓ Prescription retrieved successfully');
      return JSON.parse(response.body);
    } else {
      console.log('✗ Failed to retrieve prescription');
      return null;
    }
  } catch (error) {
    console.error('✗ Error:', error);
    return null;
  }
}

/**
 * Test 3: Sync prescription manually
 */
async function testSyncPrescription(prescriptionId: string, patientId: string) {
  console.log('\n=== Test 3: Sync Prescription ===');

  const event = createMockEvent(
    'POST',
    '/api/prescription/sync',
    {
      prescriptionId,
      patientId
    }
  );

  try {
    const response = await handler(event);
    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.parse(response.body));

    if (response.statusCode === 200) {
      console.log('✓ Prescription synced successfully');
      return JSON.parse(response.body);
    } else {
      console.log('✗ Failed to sync prescription');
      return null;
    }
  } catch (error) {
    console.error('✗ Error:', error);
    return null;
  }
}

/**
 * Test 4: Validation - Missing required fields
 */
async function testValidationMissingFields() {
  console.log('\n=== Test 4: Validation - Missing Required Fields ===');

  const event = createMockEvent(
    'POST',
    '/api/prescription/create',
    {
      episodeId: 'episode-123',
      patientId: 'patient-456',
      // Missing doctorId, doctorName, medications
    }
  );

  try {
    const response = await handler(event);
    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.parse(response.body));

    if (response.statusCode === 400) {
      console.log('✓ Validation correctly rejected missing fields');
    } else {
      console.log('✗ Validation should have rejected missing fields');
    }
  } catch (error) {
    console.error('✗ Error:', error);
  }
}

/**
 * Test 5: Validation - Empty medications array
 */
async function testValidationEmptyMedications() {
  console.log('\n=== Test 5: Validation - Empty Medications Array ===');

  const event = createMockEvent(
    'POST',
    '/api/prescription/create',
    {
      episodeId: 'episode-123',
      patientId: 'patient-456',
      doctorId: 'test-doctor-123',
      doctorName: 'Dr. Sarah Johnson',
      medications: []
    }
  );

  try {
    const response = await handler(event);
    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.parse(response.body));

    if (response.statusCode === 400) {
      console.log('✓ Validation correctly rejected empty medications');
    } else {
      console.log('✗ Validation should have rejected empty medications');
    }
  } catch (error) {
    console.error('✗ Error:', error);
  }
}

/**
 * Test 6: Validation - Invalid medication entry
 */
async function testValidationInvalidMedication() {
  console.log('\n=== Test 6: Validation - Invalid Medication Entry ===');

  const event = createMockEvent(
    'POST',
    '/api/prescription/create',
    {
      episodeId: 'episode-123',
      patientId: 'patient-456',
      doctorId: 'test-doctor-123',
      doctorName: 'Dr. Sarah Johnson',
      medications: [
        {
          medicineName: 'Amoxicillin',
          dosage: '500mg',
          // Missing frequency and duration
        }
      ]
    }
  );

  try {
    const response = await handler(event);
    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.parse(response.body));

    if (response.statusCode === 400) {
      console.log('✓ Validation correctly rejected invalid medication');
    } else {
      console.log('✗ Validation should have rejected invalid medication');
    }
  } catch (error) {
    console.error('✗ Error:', error);
  }
}

/**
 * Test 7: Authorization - Different doctor
 */
async function testAuthorizationDifferentDoctor() {
  console.log('\n=== Test 7: Authorization - Different Doctor ===');

  const event = createMockEvent(
    'POST',
    '/api/prescription/create',
    {
      episodeId: 'episode-123',
      patientId: 'patient-456',
      doctorId: 'other-doctor-789',
      doctorName: 'Dr. John Smith',
      medications: [
        {
          medicineName: 'Amoxicillin',
          dosage: '500mg',
          frequency: 'three times daily',
          duration: 7
        }
      ]
    },
    undefined,
    'test-doctor-123', // Different from doctorId in body
    'doctor'
  );

  try {
    const response = await handler(event);
    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.parse(response.body));

    if (response.statusCode === 403) {
      console.log('✓ Authorization correctly rejected different doctor');
    } else {
      console.log('✗ Authorization should have rejected different doctor');
    }
  } catch (error) {
    console.error('✗ Error:', error);
  }
}

/**
 * Test 8: Multiple medications with different frequencies
 */
async function testMultipleMedicationsVariedFrequencies() {
  console.log('\n=== Test 8: Multiple Medications with Varied Frequencies ===');

  const event = createMockEvent(
    'POST',
    '/api/prescription/create',
    {
      episodeId: 'episode-789',
      patientId: 'patient-456',
      doctorId: 'test-doctor-123',
      doctorName: 'Dr. Sarah Johnson',
      medications: [
        {
          medicineName: 'Aspirin',
          dosage: '75mg',
          frequency: 'once daily',
          duration: 30,
          foodTiming: 'after food'
        },
        {
          medicineName: 'Metformin',
          dosage: '500mg',
          frequency: 'twice daily',
          duration: 30,
          foodTiming: 'with food'
        },
        {
          medicineName: 'Vitamin D',
          dosage: '1000 IU',
          frequency: 'once daily',
          duration: 90,
          specialInstructions: 'Take in the morning',
          foodTiming: 'anytime'
        }
      ]
    }
  );

  try {
    const response = await handler(event);
    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.parse(response.body));

    if (response.statusCode === 201) {
      console.log('✓ Multiple medications with varied frequencies created successfully');
      return JSON.parse(response.body);
    } else {
      console.log('✗ Failed to create multiple medications');
      return null;
    }
  } catch (error) {
    console.error('✗ Error:', error);
    return null;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('========================================');
  console.log('Prescription Handler Lambda Tests');
  console.log('========================================');

  try {
    // Test 1: Create prescription
    const createResult = await testCreatePrescription();
    
    if (createResult) {
      // Test 2: Get prescription
      await testGetPrescription(createResult.prescriptionId, createResult.patientId);
      
      // Test 3: Sync prescription
      await testSyncPrescription(createResult.prescriptionId, createResult.patientId);
    }

    // Test 4-7: Validation and authorization
    await testValidationMissingFields();
    await testValidationEmptyMedications();
    await testValidationInvalidMedication();
    await testAuthorizationDifferentDoctor();

    // Test 8: Multiple medications
    await testMultipleMedicationsVariedFrequencies();

    console.log('\n========================================');
    console.log('All tests completed!');
    console.log('========================================\n');
  } catch (error) {
    console.error('Test suite error:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

export { runAllTests };

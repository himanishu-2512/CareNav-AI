// Test script for Treatment Handler Lambda
// Run with: npx ts-node lambda/treatment-handler/test-handler.ts

import { handler } from './index';
import { APIGatewayProxyEvent } from 'aws-lambda';

// Mock event creator
function createMockEvent(
  method: string,
  path: string,
  body?: any,
  queryParams?: Record<string, string>,
  userId: string = 'test-doctor-123',
  role: string = 'doctor'
): APIGatewayProxyEvent {
  return {
    httpMethod: method,
    path: path,
    body: body ? JSON.stringify(body) : null,
    queryStringParameters: queryParams || null,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'test-client'
    },
    requestContext: {
      authorizer: {
        userId: userId,
        role: role
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

// Test data
const testPatientId = 'test-patient-456';
const testDoctorId = 'test-doctor-123';
let testEpisodeId: string;

async function runTests() {
  console.log('🧪 Starting Treatment Handler Lambda Tests\n');

  try {
    // Test 1: Create Treatment Episode
    console.log('Test 1: Create Treatment Episode');
    console.log('=====================================');
    
    const createEvent = createMockEvent(
      'POST',
      '/api/treatment/episode/create',
      {
        patientId: testPatientId,
        doctorId: testDoctorId,
        initialSymptoms: 'Patient reports persistent headache and mild fever for 2 days'
      }
    );

    const createResponse = await handler(createEvent);
    console.log('Status:', createResponse.statusCode);
    console.log('Response:', JSON.parse(createResponse.body));
    
    if (createResponse.statusCode === 201) {
      const createData = JSON.parse(createResponse.body);
      testEpisodeId = createData.episodeId;
      console.log('✅ Episode created successfully');
      console.log(`Episode ID: ${testEpisodeId}\n`);
    } else {
      console.log('❌ Failed to create episode\n');
      return;
    }

    // Test 2: Get Episode Details
    console.log('Test 2: Get Episode Details');
    console.log('=====================================');
    
    const getEvent = createMockEvent(
      'GET',
      `/api/treatment/episode/${testEpisodeId}`,
      undefined,
      { patientId: testPatientId }
    );

    const getResponse = await handler(getEvent);
    console.log('Status:', getResponse.statusCode);
    const getBody = JSON.parse(getResponse.body);
    console.log('Episode:', JSON.stringify(getBody.episode, null, 2));
    console.log('Messages count:', getBody.messages?.length || 0);
    
    if (getResponse.statusCode === 200) {
      console.log('✅ Episode retrieved successfully\n');
    } else {
      console.log('❌ Failed to get episode\n');
    }

    // Test 3: Add Doctor Message
    console.log('Test 3: Add Doctor Message');
    console.log('=====================================');
    
    const doctorMessageEvent = createMockEvent(
      'POST',
      `/api/treatment/episode/${testEpisodeId}/message`,
      {
        content: 'Hello, I have reviewed your symptoms. Can you tell me more about when the headache started?',
        senderName: 'Dr. Sarah Johnson',
        type: 'text'
      }
    );

    const doctorMessageResponse = await handler(doctorMessageEvent);
    console.log('Status:', doctorMessageResponse.statusCode);
    console.log('Response:', JSON.parse(doctorMessageResponse.body));
    
    if (doctorMessageResponse.statusCode === 201) {
      console.log('✅ Doctor message added successfully\n');
    } else {
      console.log('❌ Failed to add doctor message\n');
    }

    // Test 4: Add Patient Message
    console.log('Test 4: Add Patient Message');
    console.log('=====================================');
    
    const patientMessageEvent = createMockEvent(
      'POST',
      `/api/treatment/episode/${testEpisodeId}/message`,
      {
        content: 'The headache started on Monday morning. It gets worse in the afternoon.',
        senderName: 'John Doe',
        type: 'text'
      },
      undefined,
      testPatientId,
      'patient'
    );

    const patientMessageResponse = await handler(patientMessageEvent);
    console.log('Status:', patientMessageResponse.statusCode);
    console.log('Response:', JSON.parse(patientMessageResponse.body));
    
    if (patientMessageResponse.statusCode === 201) {
      console.log('✅ Patient message added successfully\n');
    } else {
      console.log('❌ Failed to add patient message\n');
    }

    // Test 5: Add Prescription Message
    console.log('Test 5: Add Prescription Message');
    console.log('=====================================');
    
    const prescriptionMessageEvent = createMockEvent(
      'POST',
      `/api/treatment/episode/${testEpisodeId}/message`,
      {
        content: 'Prescription: Ibuprofen 400mg, twice daily for 5 days',
        senderName: 'Dr. Sarah Johnson',
        type: 'prescription',
        metadata: {
          prescriptionId: 'prescription-789',
          medications: [
            {
              name: 'Ibuprofen',
              dosage: '400mg',
              frequency: 'twice daily',
              duration: 5
            }
          ]
        }
      }
    );

    const prescriptionMessageResponse = await handler(prescriptionMessageEvent);
    console.log('Status:', prescriptionMessageResponse.statusCode);
    console.log('Response:', JSON.parse(prescriptionMessageResponse.body));
    
    if (prescriptionMessageResponse.statusCode === 201) {
      console.log('✅ Prescription message added successfully\n');
    } else {
      console.log('❌ Failed to add prescription message\n');
    }

    // Test 6: Get Episode with All Messages
    console.log('Test 6: Get Episode with All Messages');
    console.log('=====================================');
    
    const getWithMessagesEvent = createMockEvent(
      'GET',
      `/api/treatment/episode/${testEpisodeId}`,
      undefined,
      { patientId: testPatientId }
    );

    const getWithMessagesResponse = await handler(getWithMessagesEvent);
    console.log('Status:', getWithMessagesResponse.statusCode);
    const messagesBody = JSON.parse(getWithMessagesResponse.body);
    console.log('Total messages:', messagesBody.messages?.length || 0);
    
    if (messagesBody.messages && messagesBody.messages.length > 0) {
      console.log('\nChat History:');
      messagesBody.messages.forEach((msg: any, index: number) => {
        console.log(`\n${index + 1}. [${msg.sender}] ${msg.senderName} (${msg.type}):`);
        console.log(`   ${msg.content}`);
        console.log(`   Time: ${msg.createdAt}`);
      });
      console.log('\n✅ All messages retrieved successfully\n');
    } else {
      console.log('❌ No messages found\n');
    }

    // Test 7: Complete Treatment Episode
    console.log('Test 7: Complete Treatment Episode');
    console.log('=====================================');
    
    const completeEvent = createMockEvent(
      'POST',
      `/api/treatment/episode/${testEpisodeId}/complete`,
      {
        patientId: testPatientId,
        diagnosis: 'Tension headache with mild viral fever',
        outcome: 'Patient responded well to treatment. Symptoms resolved after 3 days. Advised to rest and stay hydrated. Follow-up if symptoms return.'
      }
    );

    const completeResponse = await handler(completeEvent);
    console.log('Status:', completeResponse.statusCode);
    console.log('Response:', JSON.stringify(JSON.parse(completeResponse.body), null, 2));
    
    if (completeResponse.statusCode === 200) {
      console.log('✅ Episode completed successfully\n');
    } else {
      console.log('❌ Failed to complete episode\n');
    }

    // Test 8: Get Patient Episodes (All)
    console.log('Test 8: Get All Patient Episodes');
    console.log('=====================================');
    
    const getAllEpisodesEvent = createMockEvent(
      'GET',
      `/api/treatment/patient/${testPatientId}/episodes`
    );

    const getAllEpisodesResponse = await handler(getAllEpisodesEvent);
    console.log('Status:', getAllEpisodesResponse.statusCode);
    const allEpisodesBody = JSON.parse(getAllEpisodesResponse.body);
    console.log('Total episodes:', allEpisodesBody.totalCount);
    console.log('Episodes:', JSON.stringify(allEpisodesBody.episodes, null, 2));
    
    if (getAllEpisodesResponse.statusCode === 200) {
      console.log('✅ All episodes retrieved successfully\n');
    } else {
      console.log('❌ Failed to get all episodes\n');
    }

    // Test 9: Get Patient Episodes (Completed Only)
    console.log('Test 9: Get Completed Patient Episodes');
    console.log('=====================================');
    
    const getCompletedEpisodesEvent = createMockEvent(
      'GET',
      `/api/treatment/patient/${testPatientId}/episodes`,
      undefined,
      { status: 'completed' }
    );

    const getCompletedEpisodesResponse = await handler(getCompletedEpisodesEvent);
    console.log('Status:', getCompletedEpisodesResponse.statusCode);
    const completedEpisodesBody = JSON.parse(getCompletedEpisodesResponse.body);
    console.log('Completed episodes:', completedEpisodesBody.totalCount);
    console.log('Episodes:', JSON.stringify(completedEpisodesBody.episodes, null, 2));
    
    if (getCompletedEpisodesResponse.statusCode === 200) {
      console.log('✅ Completed episodes retrieved successfully\n');
    } else {
      console.log('❌ Failed to get completed episodes\n');
    }

    // Test 10: Get Patient Episodes (Ongoing Only)
    console.log('Test 10: Get Ongoing Patient Episodes');
    console.log('=====================================');
    
    const getOngoingEpisodesEvent = createMockEvent(
      'GET',
      `/api/treatment/patient/${testPatientId}/episodes`,
      undefined,
      { status: 'ongoing' }
    );

    const getOngoingEpisodesResponse = await handler(getOngoingEpisodesEvent);
    console.log('Status:', getOngoingEpisodesResponse.statusCode);
    const ongoingEpisodesBody = JSON.parse(getOngoingEpisodesResponse.body);
    console.log('Ongoing episodes:', ongoingEpisodesBody.totalCount);
    console.log('Episodes:', JSON.stringify(ongoingEpisodesBody.episodes, null, 2));
    
    if (getOngoingEpisodesResponse.statusCode === 200) {
      console.log('✅ Ongoing episodes retrieved successfully\n');
    } else {
      console.log('❌ Failed to get ongoing episodes\n');
    }

    // Error Handling Tests
    console.log('\n🔍 Error Handling Tests');
    console.log('=====================================\n');

    // Test 11: Missing Required Fields
    console.log('Test 11: Create Episode - Missing Required Fields');
    const missingFieldsEvent = createMockEvent(
      'POST',
      '/api/treatment/episode/create',
      { patientId: testPatientId } // Missing doctorId
    );

    const missingFieldsResponse = await handler(missingFieldsEvent);
    console.log('Status:', missingFieldsResponse.statusCode);
    console.log('Response:', JSON.parse(missingFieldsResponse.body));
    console.log(missingFieldsResponse.statusCode === 400 ? '✅ Validation working\n' : '❌ Validation failed\n');

    // Test 12: Invalid Episode ID
    console.log('Test 12: Get Episode - Invalid Episode ID');
    const invalidEpisodeEvent = createMockEvent(
      'GET',
      '/api/treatment/episode/invalid-episode-id',
      undefined,
      { patientId: testPatientId }
    );

    const invalidEpisodeResponse = await handler(invalidEpisodeEvent);
    console.log('Status:', invalidEpisodeResponse.statusCode);
    console.log('Response:', JSON.parse(invalidEpisodeResponse.body));
    console.log(invalidEpisodeResponse.statusCode === 404 ? '✅ Error handling working\n' : '❌ Error handling failed\n');

    // Test 13: Missing Query Parameter
    console.log('Test 13: Get Episode - Missing patientId Query Parameter');
    const missingQueryEvent = createMockEvent(
      'GET',
      `/api/treatment/episode/${testEpisodeId}`
      // No query parameters
    );

    const missingQueryResponse = await handler(missingQueryEvent);
    console.log('Status:', missingQueryResponse.statusCode);
    console.log('Response:', JSON.parse(missingQueryResponse.body));
    console.log(missingQueryResponse.statusCode === 400 ? '✅ Validation working\n' : '❌ Validation failed\n');

    // Test 14: Invalid Message Type
    console.log('Test 14: Add Message - Invalid Message Type');
    const invalidTypeEvent = createMockEvent(
      'POST',
      `/api/treatment/episode/${testEpisodeId}/message`,
      {
        content: 'Test message',
        senderName: 'Test User',
        type: 'invalid_type'
      }
    );

    const invalidTypeResponse = await handler(invalidTypeEvent);
    console.log('Status:', invalidTypeResponse.statusCode);
    console.log('Response:', JSON.parse(invalidTypeResponse.body));
    console.log(invalidTypeResponse.statusCode === 400 ? '✅ Validation working\n' : '❌ Validation failed\n');

    // Test 15: Invalid Status Filter
    console.log('Test 15: Get Episodes - Invalid Status Filter');
    const invalidStatusEvent = createMockEvent(
      'GET',
      `/api/treatment/patient/${testPatientId}/episodes`,
      undefined,
      { status: 'invalid_status' }
    );

    const invalidStatusResponse = await handler(invalidStatusEvent);
    console.log('Status:', invalidStatusResponse.statusCode);
    console.log('Response:', JSON.parse(invalidStatusResponse.body));
    console.log(invalidStatusResponse.statusCode === 400 ? '✅ Validation working\n' : '❌ Validation failed\n');

    console.log('\n✅ All tests completed!\n');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run tests
runTests();

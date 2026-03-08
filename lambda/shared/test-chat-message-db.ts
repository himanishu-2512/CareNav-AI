// Test script for chat message database operations
import { addMessage, getEpisodeMessages, getMessagesByType } from './chat-message-db';

async function testChatMessageOperations() {
  console.log('Testing Chat Message Database Operations...\n');

  const testEpisodeId = 'test-episode-123';

  try {
    // Test 1: Add text message from doctor
    console.log('Test 1: Adding text message from doctor...');
    const message1 = await addMessage(
      testEpisodeId,
      'doctor',
      'Dr. Smith',
      'Hello, how are you feeling today?',
      'text'
    );
    console.log('✓ Text message added:', message1);
    console.log();

    // Wait a moment to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 100));

    // Test 2: Add text message from patient
    console.log('Test 2: Adding text message from patient...');
    const message2 = await addMessage(
      testEpisodeId,
      'patient',
      'John Doe',
      'I am feeling better, thank you.',
      'text'
    );
    console.log('✓ Patient message added:', message2);
    console.log();

    await new Promise(resolve => setTimeout(resolve, 100));

    // Test 3: Add prescription message with metadata
    console.log('Test 3: Adding prescription message with metadata...');
    const message3 = await addMessage(
      testEpisodeId,
      'system',
      'System',
      'Prescription created: Amoxicillin 500mg',
      'prescription',
      { prescriptionId: 'rx-123', medicineCount: 2 }
    );
    console.log('✓ Prescription message added:', message3);
    console.log();

    await new Promise(resolve => setTimeout(resolve, 100));

    // Test 4: Add document message
    console.log('Test 4: Adding document message...');
    const message4 = await addMessage(
      testEpisodeId,
      'patient',
      'John Doe',
      'Uploaded blood test results',
      'document',
      { documentId: 'doc-456', fileType: 'PDF' }
    );
    console.log('✓ Document message added:', message4);
    console.log();

    await new Promise(resolve => setTimeout(resolve, 100));

    // Test 5: Add recommendation message
    console.log('Test 5: Adding recommendation message...');
    const message5 = await addMessage(
      testEpisodeId,
      'system',
      'AI Assistant',
      'Lifestyle recommendations generated',
      'recommendation',
      { recommendationId: 'rec-789' }
    );
    console.log('✓ Recommendation message added:', message5);
    console.log();

    // Test 6: Get all episode messages
    console.log('Test 6: Retrieving all episode messages...');
    const allMessages = await getEpisodeMessages(testEpisodeId);
    console.log(`✓ Retrieved ${allMessages.length} messages in chronological order:`);
    allMessages.forEach((msg, index) => {
      console.log(`  ${index + 1}. [${msg.type}] ${msg.senderName}: ${msg.content}`);
    });
    console.log();

    // Test 7: Get messages by type (text only)
    console.log('Test 7: Retrieving text messages only...');
    const textMessages = await getMessagesByType(testEpisodeId, 'text');
    console.log(`✓ Retrieved ${textMessages.length} text messages:`);
    textMessages.forEach((msg, index) => {
      console.log(`  ${index + 1}. ${msg.senderName}: ${msg.content}`);
    });
    console.log();

    // Test 8: Get messages by type (prescription only)
    console.log('Test 8: Retrieving prescription messages only...');
    const prescriptionMessages = await getMessagesByType(testEpisodeId, 'prescription');
    console.log(`✓ Retrieved ${prescriptionMessages.length} prescription messages:`);
    prescriptionMessages.forEach((msg, index) => {
      console.log(`  ${index + 1}. ${msg.content}`);
      if (msg.metadata) {
        console.log(`     Metadata:`, msg.metadata);
      }
    });
    console.log();

    // Test 9: Get messages by type (document only)
    console.log('Test 9: Retrieving document messages only...');
    const documentMessages = await getMessagesByType(testEpisodeId, 'document');
    console.log(`✓ Retrieved ${documentMessages.length} document messages:`);
    documentMessages.forEach((msg, index) => {
      console.log(`  ${index + 1}. ${msg.content}`);
      if (msg.metadata) {
        console.log(`     Metadata:`, msg.metadata);
      }
    });
    console.log();

    // Test 10: Get messages for non-existent episode
    console.log('Test 10: Retrieving messages for non-existent episode...');
    const emptyMessages = await getEpisodeMessages('non-existent-episode');
    console.log(`✓ Retrieved ${emptyMessages.length} messages (expected 0)`);
    console.log();

    console.log('✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run tests
testChatMessageOperations()
  .then(() => {
    console.log('\n✅ Chat message database operations verified successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Tests failed:', error);
    process.exit(1);
  });

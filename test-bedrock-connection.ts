// Test script to verify Bedrock connection
// Run with: npx ts-node test-bedrock-connection.ts

import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';

async function testBedrockConnection() {
  console.log('Testing Bedrock connection...\n');

  // Test configuration
  const region = 'us-east-1';
  const modelId = 'us.amazon.nova-lite-v1:0';

  console.log(`Region: ${region}`);
  console.log(`Model ID: ${modelId}\n`);

  // Create client
  const client = new BedrockRuntimeClient({ region });

  try {
    console.log('Sending test request to Bedrock...');
    
    const command = new ConverseCommand({
      modelId,
      messages: [
        {
          role: 'user',
          content: [{ text: 'Say "Hello, Bedrock is working!" in JSON format: {"message": "..."}' }]
        }
      ],
      inferenceConfig: {
        maxTokens: 100,
        temperature: 0.7
      }
    });

    const response = await client.send(command);
    
    if (response.output?.message?.content?.[0]?.text) {
      console.log('\n✅ SUCCESS! Bedrock is working!\n');
      console.log('Response:', response.output.message.content[0].text);
      console.log('\nBedrock connection is configured correctly.');
    } else {
      console.log('\n❌ ERROR: Invalid response format');
      console.log('Response:', JSON.stringify(response, null, 2));
    }
  } catch (error: any) {
    console.log('\n❌ ERROR: Bedrock connection failed\n');
    console.log('Error name:', error.name);
    console.log('Error message:', error.message);
    console.log('\nFull error:', error);
    
    console.log('\n--- Troubleshooting Steps ---\n');
    
    if (error.name === 'ResourceNotFoundException') {
      console.log('❌ Model not found');
      console.log('   Solution: Check if the model ID is correct and available in us-east-1');
      console.log('   Try: aws bedrock list-foundation-models --region us-east-1');
    } else if (error.name === 'AccessDeniedException') {
      console.log('❌ Access denied');
      console.log('   Solution: Check IAM permissions for bedrock:InvokeModel');
      console.log('   Required permission:');
      console.log('   {');
      console.log('     "Effect": "Allow",');
      console.log('     "Action": ["bedrock:InvokeModel"],');
      console.log('     "Resource": "arn:aws:bedrock:us-east-1::foundation-model/us.amazon.nova-*"');
      console.log('   }');
    } else if (error.name === 'ValidationException') {
      console.log('❌ Validation error');
      console.log('   Solution: Check the request format or model parameters');
    } else if (error.name === 'ThrottlingException') {
      console.log('❌ Rate limit exceeded');
      console.log('   Solution: Wait a moment and try again');
    } else {
      console.log('❌ Unknown error');
      console.log('   Solution: Check AWS credentials and network connectivity');
    }
  }
}

// Run the test
testBedrockConnection().catch(console.error);

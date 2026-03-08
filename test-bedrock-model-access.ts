// Test script to verify Bedrock model access
// Run with: npx ts-node test-bedrock-model-access.ts

import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';

async function testBedrockAccess() {
  console.log('Testing Bedrock Model Access...\n');

  const client = new BedrockRuntimeClient({
    region: 'us-east-1'
  });

  const modelsToTest = [
    'amazon.nova-lite-v1:0',
    'us.amazon.nova-lite-v1:0',
    'anthropic.claude-3-haiku-20240307-v1:0',
    'us.anthropic.claude-3-haiku-20240307-v1:0'
  ];

  for (const modelId of modelsToTest) {
    console.log(`\nTesting model: ${modelId}`);
    console.log('='.repeat(60));

    try {
      const command = new ConverseCommand({
        modelId,
        messages: [
          {
            role: 'user',
            content: [{ text: 'Hello' }]
          }
        ],
        inferenceConfig: {
          maxTokens: 10,
          temperature: 0.7
        }
      });

      const response = await client.send(command);
      
      if (response.output?.message?.content?.[0]?.text) {
        console.log('✅ SUCCESS - Model is accessible!');
        console.log(`Response: ${response.output.message.content[0].text}`);
        console.log(`\n✅ USE THIS MODEL ID: ${modelId}`);
        return modelId;
      }
    } catch (error: any) {
      console.log(`❌ FAILED - ${error.name}: ${error.message}`);
      
      if (error.name === 'ValidationException') {
        console.log('   → Model access not enabled or model doesn\'t exist');
      } else if (error.name === 'AccessDeniedException') {
        console.log('   → IAM permissions issue');
      } else if (error.name === 'ResourceNotFoundException') {
        console.log('   → Model not found in this region');
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('❌ No working models found!');
  console.log('\nNext steps:');
  console.log('1. Go to AWS Console → Bedrock (us-east-1 region)');
  console.log('2. Click "Model access" in left sidebar');
  console.log('3. Click "Manage model access"');
  console.log('4. Enable "Amazon Nova Lite" or "Claude 3 Haiku"');
  console.log('5. Wait 1-2 minutes for access to be granted');
  console.log('6. Run this script again');
  
  return null;
}

testBedrockAccess()
  .then((workingModel) => {
    if (workingModel) {
      console.log('\n✅ Test completed successfully!');
      process.exit(0);
    } else {
      console.log('\n❌ Test failed - no accessible models');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
  });

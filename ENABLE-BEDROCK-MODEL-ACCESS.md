# Enable AWS Bedrock Model Access

## Current Issue

The application is configured to use Amazon Bedrock (Amazon Nova Pro model), but model access needs to be enabled in your AWS account first.

## Steps to Enable Bedrock Model Access

### 1. Open AWS Bedrock Console

1. Go to the AWS Console: https://console.aws.amazon.com/
2. Make sure you're in the **ap-south-1** (Mumbai) region (check top-right corner)
3. Search for "Bedrock" in the search bar
4. Click on "Amazon Bedrock"

### 2. Request Model Access

1. In the left sidebar, click on **"Model access"**
2. Click the **"Manage model access"** or **"Request model access"** button
3. Find **"Amazon Nova Pro"** in the list of models
4. Check the box next to **"Amazon Nova Pro"**
5. Scroll down and click **"Request model access"** or **"Save changes"**

### 3. Wait for Approval

- Model access is usually granted **instantly** for most models
- You should see the status change to **"Access granted"** within a few seconds
- If it says "Pending", wait a few minutes and refresh the page

### 4. Verify Model Access

Once access is granted, you should see:
- Status: **"Access granted"** next to Amazon Nova Pro
- Model ID: `us.amazon.nova-pro-v1:0`

## Alternative: Use a Different Model

If Amazon Nova Pro is not available in ap-south-1, you can use Claude 3 Sonnet instead:

### Check Available Models

1. In the Bedrock console, go to **"Model access"**
2. Look for models with **"Access granted"** status
3. Common models available in ap-south-1:
   - Claude 3 Sonnet (`anthropic.claude-3-sonnet-20240229-v1:0`)
   - Claude 3 Haiku (`anthropic.claude-3-haiku-20240307-v1:0`)

### Update Application to Use Claude

If you want to use Claude instead, I can update the `BEDROCK_MODEL_ID` in the code.

## About the API Key

**Important**: The API key you provided (`ABSKQmVkcm9ja0FQSUtleS0...`) is not used by AWS Bedrock. 

AWS Bedrock uses **IAM credentials** (which your Lambda functions already have through their execution role). The API key format you provided looks like it might be for a different service.

## Current Configuration

- **Region**: ap-south-1 (Mumbai)
- **Model**: Amazon Nova Pro (`amazon.nova-pro-v1:0`)
- **Authentication**: IAM role (already configured)
- **Permissions**: Already granted in Lambda execution role
- **Status**: ✅ Deployed and ready (just needs model access enabled)

## Testing After Enabling Access

Once you've enabled model access:

1. Go to the frontend: http://localhost:3000/
2. Login with: `patient@demo.com` / `patient123`
3. Try the symptom input feature
4. You should see AI-powered symptom analysis instead of mock data

## Troubleshooting

### If you still get errors after enabling access:

1. **Check the model ID**: Make sure `us.amazon.nova-pro-v1:0` is available in ap-south-1
2. **Check CloudWatch Logs**: 
   ```bash
   aws logs tail /aws/lambda/CareNavBackendStack-SymptomFunction --follow
   ```
3. **Try a different model**: Let me know and I can switch to Claude 3 Sonnet

### Common Error Messages:

- **"AccessDeniedException"**: Model access not enabled yet
- **"ResourceNotFoundException"**: Model not available in this region
- **"ThrottlingException"**: Too many requests, will retry automatically
- **"ValidationException"**: Model ID incorrect or not available

## Next Steps

1. Enable model access in AWS Bedrock console (steps above)
2. Test the symptom input feature
3. If it still doesn't work, check CloudWatch logs or let me know the error message

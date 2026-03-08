# Bedrock AI Not Working - Troubleshooting Guide

## Quick Diagnosis

If you're still seeing generic questions like "Have you experienced this before?", the Bedrock API calls are failing. Let's diagnose why.

## Step 1: Check CloudWatch Logs

The logs will tell us exactly what's failing. Look for these patterns:

### ✅ Success Pattern (AI Working)
```
Extracting symptoms for patient: xxx
Analyzing symptoms for disease candidates...
Disease analysis complete: 7 candidates, confidence: 0.85
Generating targeted questions...
Generated 4 targeted questions
```

### ❌ Failure Pattern (AI Not Working)
```
Bedrock error, using mock data: [error details]
```

Common errors:
- `ResourceNotFoundException` - Model not found or not available
- `AccessDeniedException` - IAM permissions issue
- `ValidationException` - Wrong model ID format or parameters
- `ThrottlingException` - Rate limit exceeded

## Step 2: Test Bedrock Connection

Run this test script to verify Bedrock is accessible:

```bash
npx ts-node test-bedrock-connection.ts
```

This will test:
- ✅ Connection to us-east-1 Bedrock
- ✅ Model availability (us.amazon.nova-lite-v1:0)
- ✅ IAM permissions
- ✅ Request/response format

## Step 3: Verify Model Access in AWS Console

### Option A: Using AWS Console
1. Go to AWS Console → Bedrock (make sure you're in **us-east-1** region)
2. Click "Model access" in the left sidebar
3. Look for "Amazon Nova Lite"
4. Status should be "Access granted" (green checkmark)
5. If not, click "Manage model access" and enable it

### Option B: Using AWS CLI (if installed)
```bash
aws bedrock list-foundation-models --region us-east-1 --query "modelSummaries[?contains(modelId, 'nova-lite')]"
```

Expected output:
```json
[
  {
    "modelId": "us.amazon.nova-lite-v1:0",
    "modelName": "Nova Lite",
    "providerName": "Amazon",
    ...
  }
]
```

## Step 4: Verify IAM Permissions

The Lambda execution role needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": [
        "arn:aws:bedrock:us-east-1::foundation-model/us.amazon.nova-*"
      ]
    }
  ]
}
```

### Check Current Permissions
1. Go to AWS Console → IAM → Roles
2. Search for "CareNavBackendStack-LambdaExecutionRole"
3. Check the attached policies
4. Look for Bedrock permissions

## Common Issues & Solutions

### Issue 1: Model Not Found
**Error**: `ResourceNotFoundException: Could not find model us.amazon.nova-lite-v1:0`

**Solutions**:
1. Enable model access in Bedrock console (us-east-1)
2. Try a different model that's available:
   - `us.anthropic.claude-3-5-sonnet-20241022-v2:0` (Claude 3.5 Sonnet)
   - `us.anthropic.claude-3-haiku-20240307-v1:0` (Claude 3 Haiku - faster)

### Issue 2: Access Denied
**Error**: `AccessDeniedException: User is not authorized to perform: bedrock:InvokeModel`

**Solutions**:
1. Update IAM role permissions (already done in backend-stack.ts)
2. Redeploy: `cdk deploy CareNavBackendStack --require-approval never`
3. Wait 1-2 minutes for IAM changes to propagate

### Issue 3: Wrong Model ID Format
**Error**: `ValidationException: Invalid model identifier`

**Solutions**:
- US East models use `us.` prefix: `us.amazon.nova-lite-v1:0`
- Other regions don't use prefix: `amazon.nova-lite-v1:0`
- Make sure you're using the correct format for your region

### Issue 4: Bedrock Not Available in Region
**Error**: `InvalidSignatureException` or connection timeout

**Solutions**:
- Bedrock is available in us-east-1 (confirmed)
- Check your AWS credentials are valid
- Verify network connectivity

### Issue 5: Rate Limiting
**Error**: `ThrottlingException: Rate exceeded`

**Solutions**:
- Bedrock has rate limits (varies by model)
- Wait a few seconds between requests
- The code already has retry logic with exponential backoff

## Step 5: Alternative Models

If Nova Lite isn't working, try these alternatives:

### Claude 3.5 Sonnet (Recommended)
```typescript
// In lambda/shared/bedrock-client.ts
export const BEDROCK_MODEL_ID = 'us.anthropic.claude-3-5-sonnet-20241022-v2:0';
```

### Claude 3 Haiku (Faster, Cheaper)
```typescript
// In lambda/shared/bedrock-client.ts
export const BEDROCK_MODEL_ID = 'us.anthropic.claude-3-haiku-20240307-v1:0';
```

After changing, rebuild and redeploy:
```bash
cd lambda
npm run build
cd ..
cdk deploy CareNavBackendStack --require-approval never
```

## Step 6: Enable Bedrock Model Access

If the model is not enabled, follow these steps:

### Using AWS Console
1. Open AWS Console
2. Switch to **us-east-1** region (top right corner)
3. Navigate to Amazon Bedrock service
4. Click "Model access" in left sidebar
5. Click "Manage model access" button
6. Find "Amazon Nova Lite" in the list
7. Check the box next to it
8. Click "Save changes" at the bottom
9. Wait 1-2 minutes for access to be granted
10. Refresh the page - status should show "Access granted"

### Using AWS CLI (if installed)
```bash
# List available models
aws bedrock list-foundation-models --region us-east-1

# Request model access (if needed)
aws bedrock put-model-invocation-logging-configuration --region us-east-1
```

## Step 7: Test the Application

After enabling model access:

1. **Clear browser cache** (important!)
2. **Login to the application**
3. **Navigate to symptom input**
4. **Enter test symptoms**: "I have chest pain that started 2 days ago"
5. **Submit**
6. **Check the questions**:
   - ✅ Should see 3-5 specific questions
   - ✅ Questions should be relevant to chest pain
   - ✅ Should have yes/no buttons or sliders
   - ❌ Should NOT see "Have you experienced this before?"

## Step 8: Monitor Logs in Real-Time

If you have AWS CLI installed, monitor logs while testing:

```bash
aws logs tail /aws/lambda/CareNavBackendStack-SymptomFunction --follow --region ap-south-1
```

Then submit symptoms and watch for:
- ✅ "Disease analysis complete"
- ✅ "Generated X targeted questions"
- ❌ "Bedrock error, using mock data"

## What You Should See When Working

### Generic Questions (AI NOT working) ❌
```
Question 1: Have you experienced this before?
Question 2: Does anything make it better or worse?
```

### AI-Powered Questions (AI working) ✅
```
Question 1: Does the discomfort spread to your arm, jaw, or back? [Yes] [No]
Question 2: How would you rate the intensity right now? [Slider 1-10]
Question 3: Does the discomfort get worse with physical activity? [Yes] [No]
Question 4: Have you noticed any shortness of breath? [Yes] [No]
```

## Quick Fix Checklist

- [ ] Model access enabled in Bedrock console (us-east-1)
- [ ] IAM permissions include us-east-1 Bedrock resources
- [ ] Model ID is correct: `us.amazon.nova-lite-v1:0`
- [ ] Region is correct: `us-east-1`
- [ ] Lambda functions redeployed after changes
- [ ] Browser cache cleared
- [ ] CloudWatch logs checked for specific error

## Need More Help?

Share the specific error from CloudWatch logs and I can provide targeted solutions. Look for lines containing:
- "Bedrock error, using mock data:"
- Error names like "ResourceNotFoundException", "AccessDeniedException", etc.
- Full error messages

## Alternative: Use Mock Mode for Testing

If you want to test the UI without Bedrock working, the system will automatically fall back to generic questions. This is useful for:
- Testing the frontend UI
- Demonstrating the flow
- Development without Bedrock access

The AI-powered questions will work once Bedrock access is properly configured.

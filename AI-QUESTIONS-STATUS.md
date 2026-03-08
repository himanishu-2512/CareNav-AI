# AI-Powered Questions Status Report

## Current Situation

The AI-powered targeted questions feature **is already implemented** in the codebase, but users are seeing generic fallback questions instead. This indicates the Bedrock API calls are failing.

## What's Implemented

### Backend (Lambda)
✅ Disease analysis using `DISEASE_ANALYSIS_SYSTEM_PROMPT`
✅ Targeted question generation using `QUESTION_GENERATION_SYSTEM_PROMPT`
✅ Disease name filtering for privacy
✅ Fallback to generic questions when Bedrock fails

### Frontend
✅ Support for multiple question types (text, yes_no, multiple_choice, scale)
✅ Both "one-at-a-time" and "list" display modes
✅ Proper rendering of all question types

## Why Users See Generic Questions

The code in `lambda/symptom-processor/index.ts` has a try-catch block that falls back to generic questions when Bedrock API calls fail:

```typescript
try {
  // AI-powered disease analysis and question generation
  structuredSymptoms = await callBedrockJson<StructuredSymptoms>(...);
  diseaseAnalysis = await callBedrockJson<{ possibleDiseases: DiseaseCandidate[]; confidenceScore: number }>(...);
  targetedQuestions = await callBedrockJson<TargetedQuestion[]>(...);
} catch (bedrockError: any) {
  console.error('Bedrock error, using mock data:', bedrockError);
  
  // FALLBACK: Generic questions
  targetedQuestions = [
    {
      questionId: 'q1',
      questionText: 'Have you experienced this before?',
      questionType: 'text',
      targetDiseases: [],
      importance: 'medium'
    },
    {
      questionId: 'q2',
      questionText: 'Does anything make it better or worse?',
      questionType: 'text',
      targetDiseases: [],
      importance: 'medium'
    }
  ];
}
```

## Root Cause Analysis

The Bedrock API calls are failing for one of these reasons:

### 1. Bedrock Model Access Not Enabled
- The Claude model needs to be explicitly enabled in AWS Bedrock console
- Model ID: `anthropic.claude-3-5-sonnet-20241022-v2:0`
- Region: `ap-south-1` (Mumbai)

### 2. IAM Permissions Missing
- Lambda execution role needs `bedrock:InvokeModel` permission
- Check if the Lambda has proper Bedrock permissions

### 3. Bedrock Service Not Available in Region
- Bedrock might not be available in `ap-south-1`
- May need to use a different region (e.g., `us-east-1`)

### 4. API Quota or Rate Limiting
- Bedrock API might be hitting rate limits
- Check CloudWatch logs for specific error messages

## How to Diagnose

### Step 1: Check CloudWatch Logs
```bash
# View Lambda logs to see the actual Bedrock error
aws logs tail /aws/lambda/CareNavBackendStack-SymptomFunction --follow
```

Look for log entries like:
- `Bedrock error, using mock data:`
- Error messages from the Bedrock client

### Step 2: Verify Bedrock Model Access
1. Go to AWS Console → Bedrock → Model access
2. Check if `Claude 3.5 Sonnet v2` is enabled
3. If not, request access (may take a few minutes)

### Step 3: Check IAM Permissions
```bash
# Check Lambda execution role permissions
aws iam get-role-policy --role-name <lambda-role-name> --policy-name <policy-name>
```

Should include:
```json
{
  "Effect": "Allow",
  "Action": [
    "bedrock:InvokeModel"
  ],
  "Resource": "arn:aws:bedrock:ap-south-1::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0"
}
```

### Step 4: Test Bedrock Directly
Create a test script to verify Bedrock is working:

```typescript
// test-bedrock.ts
import { callBedrockJson } from './lambda/shared/bedrock-client';

async function testBedrock() {
  try {
    const result = await callBedrockJson(
      'You are a helpful assistant.',
      'Say hello',
      []
    );
    console.log('Bedrock working:', result);
  } catch (error) {
    console.error('Bedrock error:', error);
  }
}

testBedrock();
```

## Solution Steps

### Option 1: Enable Bedrock Model Access (Recommended)
1. Go to AWS Console → Bedrock → Model access
2. Click "Manage model access"
3. Enable "Claude 3.5 Sonnet v2"
4. Wait for approval (usually instant)
5. Test the symptom input flow again

### Option 2: Update IAM Permissions
If model access is enabled but still failing, update Lambda IAM role:

```typescript
// In lib/backend-stack.ts
symptomFunction.addToRolePolicy(new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  actions: ['bedrock:InvokeModel'],
  resources: [
    'arn:aws:bedrock:ap-south-1::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0'
  ]
}));
```

Then redeploy:
```bash
cdk deploy CareNavBackendStack
```

### Option 3: Change Bedrock Region
If Bedrock is not available in `ap-south-1`, update the region in `lambda/shared/bedrock-client.ts`:

```typescript
const bedrockClient = new BedrockRuntimeClient({
  region: 'us-east-1', // Change from ap-south-1
});
```

### Option 4: Use Different Model
If Claude 3.5 Sonnet v2 is not available, try a different model:

```typescript
// In lambda/shared/bedrock-client.ts
const modelId = 'anthropic.claude-3-sonnet-20240229-v1:0'; // Older version
```

## Expected Behavior After Fix

Once Bedrock is working correctly, users should see:

1. **Intelligent, targeted questions** based on their specific symptoms
2. **Multiple question types**: yes/no buttons, multiple choice, scale sliders
3. **No disease names** in questions (filtered for privacy)
4. **3-5 questions** that help differentiate between disease candidates

Example for chest pain:
- "Does the discomfort spread to your arm, jaw, or back?" (yes/no)
- "How would you rate the intensity right now?" (scale 1-10)
- "Does the discomfort get worse with physical activity?" (yes/no)

## Verification

After applying the fix:

1. Submit symptoms via the symptom input page
2. Check that questions are specific to the symptoms (not generic)
3. Verify questions don't mention disease names
4. Check CloudWatch logs to confirm no Bedrock errors

## Files Reference

- `lambda/symptom-processor/index.ts` - Main symptom processing logic
- `lambda/shared/bedrock-client.ts` - Bedrock API client
- `lambda/shared/bedrock-prompts.ts` - AI prompts for disease analysis and questions
- `lambda/shared/disease-filter.ts` - Disease name filtering
- `frontend/src/components/FollowUpQuestions.tsx` - Question rendering

## Next Steps

1. Check CloudWatch logs to identify the specific Bedrock error
2. Enable Bedrock model access if not already done
3. Verify IAM permissions for Lambda
4. Test the symptom flow again
5. If still failing, consider changing region or model

The implementation is complete and correct - we just need to fix the Bedrock API connectivity issue.

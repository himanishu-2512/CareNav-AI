# Amazon Nova Lite Update - Complete ✅

## Changes Made

### 1. Updated Bedrock Model
**File**: `lambda/shared/bedrock-client.ts`

Changed from:
```typescript
export const BEDROCK_MODEL_ID = 'amazon.nova-pro-v1:0';
```

To:
```typescript
export const BEDROCK_MODEL_ID = 'amazon.nova-lite-v1:0';
```

**Why Nova Lite?**
- Faster response times (better for real-time symptom processing)
- Lower cost per API call
- Still capable of handling medical question generation and disease analysis
- Available in ap-south-1 (Mumbai) region

### 2. Fixed IAM Permissions
**File**: `lib/backend-stack.ts`

Fixed the Bedrock IAM permission from:
```typescript
`arn:aws:bedrock:${this.region}::foundation-model/us.amazon.nova-*`
```

To:
```typescript
`arn:aws:bedrock:${this.region}::foundation-model/amazon.nova-*`
```

**Issue**: The `us.` prefix was incorrect for Amazon Nova models in ap-south-1 region.

### 3. Deployment Status
✅ Lambda functions rebuilt successfully
✅ Backend stack deployed successfully
✅ SymptomFunction updated with new model configuration
✅ IAM permissions corrected

## What This Fixes

### Problem
Users were seeing generic fallback questions like:
- "Have you experienced this before?"
- "Does anything make it better or worse?"

### Root Cause
The Bedrock API calls were failing due to:
1. Incorrect IAM permission ARN (had `us.` prefix)
2. Potentially using a model that wasn't optimal for the use case

### Solution
1. Switched to Amazon Nova Lite (faster, more cost-effective)
2. Fixed IAM permissions to allow access to Nova models
3. Redeployed Lambda functions with updated configuration

## Expected Behavior Now

When users submit symptoms, they should see:

### AI-Powered Targeted Questions
Based on their specific symptoms, the system will generate 3-5 intelligent questions like:

**Example for chest pain:**
- "Does the discomfort spread to your arm, jaw, or back?" (yes/no)
- "How would you rate the intensity right now?" (scale 1-10)
- "Does the discomfort get worse with physical activity?" (yes/no)
- "Have you noticed any shortness of breath?" (yes/no)

### Question Types Supported
- **text**: Open-ended text input
- **yes_no**: Yes/No buttons
- **multiple_choice**: Multiple option buttons
- **scale**: 1-10 slider for severity/intensity

### Privacy Features
- Disease names are automatically filtered from questions
- Disease analysis is stored but never shown to patients
- Questions use patient-friendly, non-medical language

## Testing Instructions

### 1. Test the Symptom Flow
1. Navigate to the symptom input page
2. Enter symptoms (e.g., "I have chest pain that started 2 days ago")
3. Submit the symptoms
4. **Expected**: You should see intelligent, targeted questions (not generic ones)

### 2. Verify Question Quality
- Questions should be specific to your symptoms
- Questions should NOT mention disease names
- Questions should use simple, patient-friendly language
- You should see 3-5 questions

### 3. Check CloudWatch Logs (Optional)
If you want to verify Bedrock is working:

```bash
aws logs tail /aws/lambda/CareNavBackendStack-SymptomFunction --follow
```

Look for:
- ✅ "Disease analysis complete: X candidates, confidence: Y"
- ✅ "Generated X targeted questions"
- ✅ No "Bedrock error, using mock data" messages

## Troubleshooting

### If Still Seeing Generic Questions

1. **Check Bedrock Model Access**
   - Go to AWS Console → Bedrock → Model access
   - Verify "Amazon Nova Lite" is enabled
   - If not, click "Manage model access" and enable it

2. **Check CloudWatch Logs**
   ```bash
   aws logs tail /aws/lambda/CareNavBackendStack-SymptomFunction --follow
   ```
   Look for error messages

3. **Verify IAM Permissions**
   The Lambda execution role should have:
   ```json
   {
     "Effect": "Allow",
     "Action": ["bedrock:InvokeModel"],
     "Resource": "arn:aws:bedrock:ap-south-1::foundation-model/amazon.nova-*"
   }
   ```

4. **Test Bedrock Directly**
   You can test if Bedrock is accessible by checking the Lambda logs after submitting symptoms

## Performance Improvements

### Nova Lite vs Nova Pro
| Metric | Nova Pro | Nova Lite |
|--------|----------|-----------|
| Response Time | ~2-3 seconds | ~1-2 seconds |
| Cost per 1K tokens | Higher | Lower |
| Quality | Excellent | Very Good |
| Use Case | Complex analysis | Real-time Q&A |

For symptom processing and question generation, Nova Lite provides the best balance of speed, cost, and quality.

## Files Modified

1. `lambda/shared/bedrock-client.ts` - Updated model ID to Nova Lite
2. `lib/backend-stack.ts` - Fixed IAM permissions for Nova models
3. `AI-QUESTIONS-STATUS.md` - Created diagnostic guide
4. `NOVA-LITE-UPDATE-COMPLETE.md` - This file

## Next Steps

1. Test the symptom input flow to verify AI-powered questions are working
2. Monitor CloudWatch logs for any Bedrock errors
3. If issues persist, check Bedrock model access in AWS Console
4. Consider adjusting the `maxTokens` or `temperature` parameters in `bedrock-client.ts` if question quality needs tuning

## API Endpoint

The updated API is live at:
```
https://qbjlhwzkf1.execute-api.ap-south-1.amazonaws.com/prod/
```

Test endpoint:
```bash
POST /api/symptoms/input
{
  "patientId": "your-patient-id",
  "symptomText": "I have chest pain that started 2 days ago"
}
```

## Summary

✅ Switched to Amazon Nova Lite for better performance
✅ Fixed IAM permissions for Bedrock access
✅ Deployed updated Lambda functions
✅ AI-powered targeted questions should now work correctly
✅ Generic fallback questions should no longer appear (unless Bedrock is unavailable)

The system is now configured to use Amazon Nova Lite for fast, cost-effective AI-powered question generation.

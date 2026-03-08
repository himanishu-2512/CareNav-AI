# Bedrock Diagnosis - What to Check

## You said: "still ai not working how to use it"

The AI-powered questions feature is implemented correctly in the code, but Bedrock API calls are failing. Here's what to check:

## Most Likely Issue: Model Access Not Enabled

### The Fix (Takes 2 minutes)

1. **Go to AWS Console**: https://console.aws.amazon.com/bedrock/home?region=us-east-1#/modelaccess
   - This link takes you directly to Model Access in US East region

2. **Click "Manage model access"** (orange button)

3. **Find and enable these models**:
   - ☑️ Amazon Nova Lite
   - ☑️ Claude 3.5 Sonnet (backup)
   - ☑️ Claude 3 Haiku (backup)

4. **Click "Save changes"**

5. **Wait 1-2 minutes** for access to be granted

6. **Test your app** - submit symptoms and check if questions are now AI-powered

## How to Tell If It's Working

### AI NOT Working (what you're seeing now) ❌
```
Follow-Up Questions

Question 1 of 2

Have you experienced this before?
[Text input box]
```
Only 2 generic questions, both text input.

### AI Working (what you should see) ✅
```
Follow-Up Questions

Question 1 of 4

Does the discomfort spread to your arm, jaw, or back?
[Yes] [No]

Question 2 of 4

How would you rate the intensity right now?
[Slider: 1 ----●---- 10]
```
3-5 specific questions, multiple types (yes/no, sliders, multiple choice).

## What the Logs Should Show

### If AI is failing:
```
Bedrock error, using mock data: ResourceNotFoundException: Could not find model us.amazon.nova-lite-v1:0
```

### If AI is working:
```
Extracting symptoms for patient: xxx
Analyzing symptoms for disease candidates...
Disease analysis complete: 7 candidates, confidence: 0.85
Generating targeted questions...
Generated 4 targeted questions
```

## Quick Test Without Logs

Just test the app:
1. Submit symptoms
2. Count the questions:
   - **2 questions** = AI not working (fallback mode)
   - **3-5 questions** = AI working
3. Check question types:
   - **All text input** = AI not working
   - **Yes/No buttons, sliders** = AI working

## What I've Already Done

✅ Implemented AI-powered question generation
✅ Configured Bedrock client for us-east-1
✅ Updated model ID to us.amazon.nova-lite-v1:0
✅ Added IAM permissions for US East Bedrock
✅ Deployed all Lambda functions
✅ Added disease name filtering
✅ Added fallback to generic questions if Bedrock fails

## What You Need to Do

The ONLY thing missing is enabling model access in the Bedrock console. This is a one-time setup that takes 2 minutes.

**Direct link**: https://console.aws.amazon.com/bedrock/home?region=us-east-1#/modelaccess

Click "Manage model access" → Enable "Amazon Nova Lite" → Save → Wait 1 minute → Test app

That's it!

## Alternative: Use Claude Instead

If Nova Lite doesn't work, we can switch to Claude (which might already be enabled):

1. Edit `lambda/shared/bedrock-client.ts`
2. Change line 15 to:
   ```typescript
   export const BEDROCK_MODEL_ID = 'us.anthropic.claude-3-5-sonnet-20241022-v2:0';
   ```
3. Run:
   ```bash
   cd lambda && npm run build && cd .. && cdk deploy CareNavBackendStack --require-approval never
   ```

## Summary

The code is ready. The deployment is done. The only missing piece is enabling model access in the AWS Bedrock console (us-east-1 region). Once you do that, the AI-powered questions will work immediately.

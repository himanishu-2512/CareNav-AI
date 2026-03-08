# Enable Bedrock Model Access - Step by Step

## The Problem

You're seeing generic questions because Bedrock API calls are failing. The most common reason is that the model access hasn't been enabled in the AWS Bedrock console.

## The Solution (5 minutes)

### Step 1: Open AWS Console
1. Go to https://console.aws.amazon.com/
2. Login with your AWS credentials

### Step 2: Switch to US East Region
1. Look at the top right corner of the console
2. Click on the region dropdown (currently might show "Mumbai" or "ap-south-1")
3. Select **"US East (N. Virginia)"** or **"us-east-1"**
4. This is CRITICAL - your Bedrock API key is for US East

### Step 3: Navigate to Bedrock
1. In the search bar at the top, type "Bedrock"
2. Click on "Amazon Bedrock" service
3. You should see the Bedrock dashboard

### Step 4: Enable Model Access
1. In the left sidebar, click **"Model access"**
2. You'll see a list of available models
3. Click the **"Manage model access"** button (orange button, top right)
4. Scroll down to find **"Amazon Nova Lite"**
5. Check the box next to "Amazon Nova Lite"
6. Optionally, also enable:
   - "Claude 3.5 Sonnet" (backup option)
   - "Claude 3 Haiku" (faster, cheaper backup)
7. Scroll to the bottom and click **"Save changes"**
8. Wait 1-2 minutes for access to be granted

### Step 5: Verify Access
1. Go back to "Model access" page
2. Look for "Amazon Nova Lite"
3. Status should show **"Access granted"** with a green checkmark
4. If it says "In progress", wait another minute and refresh

### Step 6: Test Your Application
1. Open your application in the browser
2. **Clear browser cache** (Ctrl+Shift+Delete or Cmd+Shift+Delete)
3. Login to the application
4. Navigate to symptom input
5. Enter symptoms: "I have chest pain that started 2 days ago"
6. Click Submit
7. **You should now see AI-powered questions!**

## What You Should See

### Before (Generic Questions) ❌
```
Follow-Up Questions

Question 1 of 2

Have you experienced this before?
[Text input box]

[Skip] [Next]
```

### After (AI-Powered Questions) ✅
```
Follow-Up Questions

Question 1 of 4

Does the discomfort spread to your arm, jaw, or back?

[Yes] [No]

[Skip] [Next]
```

## Still Not Working?

### Check 1: Verify Region
Make sure you enabled model access in **us-east-1** (US East), not ap-south-1 (Mumbai).

### Check 2: Wait for Propagation
IAM and Bedrock changes can take 1-2 minutes to propagate. Wait a bit and try again.

### Check 3: Check CloudWatch Logs
If you have AWS CLI installed:
```bash
aws logs tail /aws/lambda/CareNavBackendStack-SymptomFunction --follow --region ap-south-1
```

Then submit symptoms and look for error messages.

### Check 4: Try Alternative Model
If Nova Lite doesn't work, try Claude instead:

1. Open `lambda/shared/bedrock-client.ts`
2. Change this line:
   ```typescript
   export const BEDROCK_MODEL_ID = 'us.amazon.nova-lite-v1:0';
   ```
   To:
   ```typescript
   export const BEDROCK_MODEL_ID = 'us.anthropic.claude-3-5-sonnet-20241022-v2:0';
   ```
3. Rebuild and redeploy:
   ```bash
   cd lambda
   npm run build
   cd ..
   cdk deploy CareNavBackendStack --require-approval never
   ```

## Visual Guide

### Finding Model Access in Bedrock Console

```
AWS Console
  └─ Services (search bar)
      └─ "Bedrock"
          └─ Amazon Bedrock Dashboard
              └─ Left Sidebar
                  └─ "Model access" (click here)
                      └─ "Manage model access" button
                          └─ Find "Amazon Nova Lite"
                              └─ Check the box
                                  └─ "Save changes" button
```

### Verifying Model Access

After enabling, you should see:

```
Model access

┌─────────────────────────────────────────────────────────┐
│ Model name          Provider    Status                  │
├─────────────────────────────────────────────────────────┤
│ Amazon Nova Lite    Amazon      ✓ Access granted        │
│ Claude 3.5 Sonnet   Anthropic   ✓ Access granted        │
│ Claude 3 Haiku      Anthropic   ✓ Access granted        │
└─────────────────────────────────────────────────────────┘
```

## Common Mistakes

### Mistake 1: Wrong Region
❌ Enabling model access in ap-south-1 (Mumbai)
✅ Enable model access in us-east-1 (US East)

### Mistake 2: Not Waiting
❌ Testing immediately after enabling
✅ Wait 1-2 minutes for changes to propagate

### Mistake 3: Browser Cache
❌ Testing with old cached frontend
✅ Clear browser cache before testing

### Mistake 4: Wrong Model ID
❌ Using `amazon.nova-lite-v1:0` (no prefix)
✅ Using `us.amazon.nova-lite-v1:0` (with us. prefix for US East)

## Expected Timeline

1. **Enable model access**: 30 seconds
2. **Wait for propagation**: 1-2 minutes
3. **Test application**: 30 seconds
4. **Total time**: ~3-4 minutes

## What Happens After Enabling

Once model access is enabled:

1. **Symptom Extraction**: AI extracts structured data from patient text
2. **Disease Analysis**: AI identifies 5-10 possible diseases (hidden from patient)
3. **Question Generation**: AI generates 3-5 targeted questions
4. **Disease Filtering**: System removes any disease names from questions
5. **Display to Patient**: Patient sees intelligent, relevant questions

## Support

If you're still having issues after following these steps:

1. Share the CloudWatch log error message
2. Confirm which region you enabled model access in
3. Confirm the model status shows "Access granted"
4. Share any error messages from the browser console

I can then provide specific solutions based on the exact error.

## Quick Reference

| Configuration | Value |
|--------------|-------|
| Bedrock Region | us-east-1 |
| Model ID | us.amazon.nova-lite-v1:0 |
| Lambda Region | ap-south-1 |
| API Endpoint | https://qbjlhwzkf1.execute-api.ap-south-1.amazonaws.com/prod/ |

## Next Steps

1. ✅ Enable model access in Bedrock console (us-east-1)
2. ✅ Wait 1-2 minutes
3. ✅ Clear browser cache
4. ✅ Test the application
5. ✅ Verify AI-powered questions appear

The AI should work immediately after enabling model access!

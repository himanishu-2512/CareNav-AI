# Enable Bedrock Model Access - Step by Step

## Current Error
```
ValidationException: Operation not allowed
```

This means **Amazon Nova Lite model access is NOT enabled** in your AWS account for the us-east-1 region.

## Fix: Enable Model Access in AWS Console

### Step 1: Open AWS Console
1. Go to https://console.aws.amazon.com/
2. Login with your AWS credentials
3. **IMPORTANT**: Switch to **us-east-1** region (top right corner - select "N. Virginia")

### Step 2: Navigate to Bedrock
1. In the search bar at the top, type "Bedrock"
2. Click on "Amazon Bedrock" service

### Step 3: Enable Model Access
1. In the left sidebar, click **"Model access"**
2. You'll see a list of available models
3. Click the orange **"Manage model access"** button (top right)
4. Find **"Amazon Nova Lite"** in the list
5. Check the box next to it
6. Scroll down and click **"Save changes"**
7. Wait 1-2 minutes for access to be granted
8. Refresh the page - status should show **"Access granted"** with a green checkmark

### Alternative: Enable Claude 3 Haiku (Faster)
If Nova Lite is not available, enable Claude 3 Haiku instead:
1. Find **"Claude 3 Haiku"** in the model list
2. Check the box next to it
3. Click **"Save changes"**

## Step 4: Test Model Access

Run this test script to verify access:

```bash
npx ts-node test-bedrock-model-access.ts
```

This will test multiple model IDs and tell you which one works.

## Step 5: Update Model ID (if needed)

If the test shows a different model ID works, update `lambda/shared/bedrock-client.ts`:

```typescript
// If Nova Lite works:
export const BEDROCK_MODEL_ID = 'amazon.nova-lite-v1:0';

// OR if Claude 3 Haiku works:
export const BEDROCK_MODEL_ID = 'anthropic.claude-3-haiku-20240307-v1:0';
```

Then rebuild and redeploy:
```bash
cd lambda
npm run build
cd ..
npx cdk deploy CareNavBackendStack --require-approval never
```

## Why This Happens

AWS Bedrock requires explicit model access to be enabled for each model you want to use. By default, NO models are enabled. This is a security feature to prevent unauthorized usage and costs.

## Visual Guide

### What "Model access" page looks like:

**Before enabling (red X)**:
```
Model Name              Status
Amazon Nova Lite        ❌ Access not granted
```

**After enabling (green checkmark)**:
```
Model Name              Status
Amazon Nova Lite        ✅ Access granted
```

## Troubleshooting

### "I don't see Model access in the sidebar"
- Make sure you're in the **us-east-1** region (top right corner)
- Make sure you're in the **Amazon Bedrock** service (not Bedrock Agent or Bedrock Studio)

### "I enabled it but still getting errors"
- Wait 2-3 minutes for changes to propagate
- Clear your browser cache
- Run the test script again: `npx ts-node test-bedrock-model-access.ts`

### "Nova Lite is not in the list"
- Try enabling **Claude 3 Haiku** instead (it's faster and cheaper)
- Update the model ID in `bedrock-client.ts` to `anthropic.claude-3-haiku-20240307-v1:0`

### "I don't have permission to enable models"
- You need IAM permissions: `bedrock:PutFoundationModelEntitlement`
- Contact your AWS account administrator

## Expected Timeline

1. Enable model access: **30 seconds**
2. Wait for propagation: **1-2 minutes**
3. Test and verify: **30 seconds**
4. Total time: **~3 minutes**

## Next Steps After Enabling

1. ✅ Enable model access in Bedrock console
2. ✅ Run test script to verify: `npx ts-node test-bedrock-model-access.ts`
3. ✅ Test symptom submission in your app
4. ✅ Verify you see AI-powered questions (not generic ones)

## Summary

The "ValidationException: Operation not allowed" error means you need to enable model access in the Bedrock console. This is a one-time setup step that takes about 3 minutes.

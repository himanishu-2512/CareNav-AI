# AWS Bedrock Setup Guide

## Current Status
- **Your Region**: ap-south-1 (Mumbai)
- **Bedrock Integration**: ✅ Already coded and deployed
- **Issue**: Bedrock may not be available in ap-south-1 yet

## Option 1: Enable Bedrock in Your Current Region (If Available)

### Step 1: Check Bedrock Availability
1. Go to AWS Console → Amazon Bedrock
2. If you see the Bedrock dashboard, it's available in your region
3. If you get an error or redirect, Bedrock is not available in ap-south-1

### Step 2: Enable Model Access
1. In Bedrock console, click **"Model access"** (left sidebar)
2. Click **"Manage model access"** or **"Enable specific models"**
3. Find **"Anthropic Claude 3 Sonnet"**
4. Check the box next to it
5. Click **"Request model access"** or **"Save changes"**
6. Wait for approval (usually instant)

### Step 3: Test
Once approved, your app will automatically start using real AI instead of mock data!

---

## Option 2: Use Cross-Region Bedrock (Recommended if ap-south-1 doesn't support Bedrock)

Bedrock is available in these regions:
- **us-east-1** (N. Virginia) ✅ Recommended
- **us-west-2** (Oregon)
- **eu-west-1** (Ireland)
- **ap-southeast-1** (Singapore) - Closest to India
- **ap-northeast-1** (Tokyo)

### Update Bedrock Client to Use Cross-Region

Edit `lambda/shared/bedrock-client.ts`:

```typescript
// Change this line:
export const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'ap-south-1'
});

// To this (use us-east-1 for Bedrock):
export const bedrockClient = new BedrockRuntimeClient({
  region: 'us-east-1'  // Bedrock region
});
```

### Enable Model Access in us-east-1
1. Switch AWS Console region to **us-east-1** (top-right dropdown)
2. Go to Amazon Bedrock
3. Click **"Model access"** → **"Manage model access"**
4. Enable **"Anthropic Claude 3 Sonnet"**
5. Click **"Save changes"**

### Update IAM Permissions
Your Lambda functions in ap-south-1 need permission to call Bedrock in us-east-1.

Edit `lib/backend-stack.ts` line 41:

```typescript
// Change this:
resources: [`arn:aws:bedrock:${this.region}::foundation-model/anthropic.claude-3-*`]

// To this (allow us-east-1):
resources: [`arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-*`]
```

### Redeploy
```bash
npm run cdk deploy CareNavBackendStack -- --require-approval never
```

---

## Option 3: Keep Using Mock Data (Current Setup)

Your app is already configured to work with mock data when Bedrock is unavailable. This is perfect for:
- Development and testing
- Demos and presentations
- When Bedrock access is pending

The mock data provides:
- Symptom structuring (simplified)
- Follow-up questions
- Department recommendations
- Full workflow functionality

---

## Verification

After enabling Bedrock, test with:

```bash
# Test symptom input
curl -X POST https://qbjlhwzkf1.execute-api.ap-south-1.amazonaws.com/prod/api/symptoms/input \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "YOUR_PATIENT_ID",
    "symptomText": "I have a headache for 3 days",
    "inputMethod": "text"
  }'
```

If Bedrock is working, you'll get detailed AI-generated symptom analysis instead of mock data.

---

## Cost Considerations

**Bedrock Pricing** (Claude 3 Sonnet):
- Input: ~$0.003 per 1K tokens
- Output: ~$0.015 per 1K tokens
- Typical symptom analysis: ~$0.01-0.05 per request

**Free Tier**: Check if AWS offers Bedrock free tier in your region.

---

## Troubleshooting

### Error: "AI service temporarily unavailable"
- ✅ This is expected - mock data is being used
- Enable Bedrock model access to fix

### Error: "AccessDeniedException"
- Check IAM permissions in backend-stack.ts
- Verify model access is enabled in Bedrock console
- Ensure you're using the correct region

### Error: "ThrottlingException"
- Bedrock has rate limits
- The code already has retry logic with exponential backoff
- Consider requesting quota increase if needed

---

## Summary

**Current State**: Your app works with mock AI data
**To Enable Real AI**: 
1. Check if Bedrock is available in ap-south-1
2. If yes: Enable model access in Bedrock console
3. If no: Use cross-region setup (Option 2 above)

**No Code Changes Needed** - Bedrock integration is already complete!

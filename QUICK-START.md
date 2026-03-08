# CareNav AI - Quick Start Guide

## You're Logged into AWS - Here's What to Do Next

### ⚡ Fast Track (15 minutes)

#### 1. Install Node Packages (2 min)
```bash
# Root dependencies
npm install

# Lambda dependencies
cd lambda && npm install && cd ..

# Frontend dependencies
cd frontend && npm install && cd ..
```

#### 2. Enable Bedrock Models (3 min)
🚨 **CRITICAL STEP** - Do this in AWS Console:
1. Open AWS Console → Search "Bedrock"
2. Click "Model access" (left sidebar)
3. Click "Manage model access"
4. Check boxes for:
   - ✅ Claude 3 Sonnet
   - ✅ Claude 3 Haiku
5. Click "Save changes"
6. Wait for "Access granted" status

#### 3. Create AWS Secrets (1 min)
```bash
# JWT Secret
aws secretsmanager create-secret \
  --name carenav-jwt-secret \
  --secret-string "your-super-secret-jwt-key-change-this" \
  --region ap-south-1

# Bedrock Model ID
aws secretsmanager create-secret \
  --name carenav-bedrock-model \
  --secret-string "anthropic.claude-3-sonnet-20240229-v1:0" \
  --region ap-south-1
```

#### 4. Bootstrap CDK (First Time Only) (1 min)
```bash
# Get your AWS account ID
aws sts get-caller-identity

# Bootstrap (replace ACCOUNT-ID with your actual account ID)
npx cdk bootstrap aws://ACCOUNT-ID/ap-south-1
```

#### 5. Deploy Backend (5-7 min)
```bash
# Deploy all infrastructure
npx cdk deploy --all --require-approval never
```

⏳ Wait for deployment... This creates DynamoDB, S3, API Gateway, Lambda functions, etc.

#### 6. Configure Frontend (1 min)
After deployment completes, you'll see output like:
```
ApiStack.ApiEndpoint = https://xxxxxxxxxx.execute-api.ap-south-1.amazonaws.com/prod
```

Copy that URL and update `frontend/.env`:
```env
VITE_API_URL=https://xxxxxxxxxx.execute-api.ap-south-1.amazonaws.com/prod
```

#### 7. Create Test Users (1 min)
```bash
cd lambda
npx ts-node scripts/create-test-user.ts
cd ..
```

#### 8. Start Frontend (1 min)
```bash
cd frontend
npm run dev
```

Open browser: `http://localhost:3000`

### 🎉 You're Done!

Login with:
- **Patient**: `patient@demo.com` / `demo123`
- **Doctor**: `doctor@demo.com` / `demo123`

---

## What You Just Deployed

### Backend (AWS)
- ✅ DynamoDB table for all data
- ✅ S3 bucket for medical reports
- ✅ API Gateway REST API
- ✅ 8 Lambda functions
- ✅ EventBridge rules for reminders
- ✅ IAM roles and policies

### Frontend (Local)
- ✅ React app with TypeScript
- ✅ 9 UI components
- ✅ Authentication system
- ✅ Patient and doctor dashboards

---

## Quick Test Checklist

### As Patient
- [ ] Login
- [ ] Enter symptoms
- [ ] Answer follow-up questions
- [ ] View department recommendation
- [ ] Upload medical report
- [ ] View treatment schedule

### As Doctor
- [ ] Login
- [ ] Create treatment plan
- [ ] View patient summary with red flags
- [ ] Check adherence dashboard

---

## Common Issues & Fixes

### ❌ "Bedrock Access Denied"
**Fix**: Enable Bedrock models in AWS Console (Step 2)

### ❌ "CDK Deploy Failed"
**Fix**: Check AWS credentials
```bash
aws configure list
```

### ❌ "Frontend Can't Connect"
**Fix**: Verify API URL in `frontend/.env`

### ❌ "Lambda Errors"
**Fix**: Check CloudWatch Logs
```bash
aws logs tail /aws/lambda/auth-handler --follow --region ap-south-1
```

---

## Architecture at a Glance

```
Browser (React)
    ↓
API Gateway
    ↓
Lambda Functions → DynamoDB
    ↓              → S3
    ↓              → Bedrock AI
    ↓              → EventBridge
```

---

## Cost Estimate

**Free Tier Usage** (first 12 months):
- Lambda: 1M requests/month FREE
- DynamoDB: 25GB storage FREE
- S3: 5GB storage FREE
- API Gateway: 1M requests/month FREE

**Beyond Free Tier**:
- Bedrock: ~$0.003 per 1K input tokens
- Estimated: $5-10/month for demo usage

---

## Next Steps

1. ✅ Test all features
2. 🔄 Deploy frontend to S3 + CloudFront (optional)
3. 🔄 Set up monitoring and alerts
4. 🔄 Add more test data
5. 🔄 Customize for your use case

---

## Need Help?

Check these logs:
```bash
# API Gateway logs
aws logs tail /aws/apigateway/carenav-api --follow

# Lambda logs
aws logs tail /aws/lambda/FUNCTION-NAME --follow

# All Lambda functions
aws lambda list-functions --region ap-south-1
```

---

## Clean Up (When Done)

To delete everything and stop charges:
```bash
npx cdk destroy --all
```

---

**You're all set! Start testing the application.** 🚀

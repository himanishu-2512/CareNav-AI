# 🚀 START HERE - CareNav AI Deployment

You're logged into AWS. Here's exactly what to do:

## 📋 Quick Commands (Copy & Paste)

### 1. Install Everything
```bash
npm install && cd lambda && npm install && cd .. && cd frontend && npm install && cd ..
```

### 2. Enable Bedrock (Do in AWS Console)
1. Open: https://console.aws.amazon.com/bedrock
2. Click "Model access" → "Manage model access"
3. Enable: Claude 3 Sonnet + Claude 3 Haiku
4. Save and wait for "Access granted"

### 3. Create Secrets
```bash
aws secretsmanager create-secret --name carenav-jwt-secret --secret-string "your-super-secret-jwt-key" --region ap-south-1

aws secretsmanager create-secret --name carenav-bedrock-model --secret-string "anthropic.claude-3-sonnet-20240229-v1:0" --region ap-south-1
```

### 4. Get Your AWS Account ID
```bash
aws sts get-caller-identity
```
Copy the "Account" number.

### 5. Bootstrap CDK (Replace ACCOUNT-ID)
```bash
npx cdk bootstrap aws://ACCOUNT-ID/ap-south-1
```

### 6. Deploy Backend (Wait 5-10 min)
```bash
npx cdk deploy --all --require-approval never
```

### 7. Copy API URL
After deployment, you'll see:
```
ApiStack.ApiEndpoint = https://xxxxxxxxxx.execute-api.ap-south-1.amazonaws.com/prod
```
Copy this URL!

### 8. Update Frontend Config
Edit `frontend/.env`:
```env
VITE_API_URL=https://xxxxxxxxxx.execute-api.ap-south-1.amazonaws.com/prod
```
(Paste your API URL)

### 9. Create Test Users
```bash
cd lambda && npx ts-node scripts/create-test-user.ts && cd ..
```

### 10. Start App
```bash
cd frontend && npm run dev
```

Open: http://localhost:3000

## 🎯 Login Credentials

**Patient**: patient@demo.com / demo123
**Doctor**: doctor@demo.com / demo123

## ⏱️ Total Time: 15-20 minutes

## 📚 Detailed Guides

- `QUICK-START.md` - Fast track guide
- `SETUP-AND-DEPLOYMENT-GUIDE.md` - Complete guide
- `DEPLOYMENT-CHECKLIST.md` - Step-by-step checklist

## ❓ Problems?

### Bedrock Access Denied
→ Enable models in AWS Console (Step 2)

### CDK Deploy Failed
→ Check: `aws configure list`

### Frontend Can't Connect
→ Verify API URL in frontend/.env

## 🧹 Clean Up When Done
```bash
npx cdk destroy --all
```

---

**Ready? Start with Step 1!** ⬆️

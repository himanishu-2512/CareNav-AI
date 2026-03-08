# CareNav AI - Setup and Deployment Guide

## Prerequisites

Before you begin, ensure you have:
- ✅ AWS Account with admin access (logged in)
- Node.js 18+ installed
- AWS CLI configured with your credentials
- AWS CDK CLI installed globally

## Step-by-Step Deployment

### 1. Install Dependencies

#### Backend Dependencies
```bash
# Install root dependencies (CDK)
npm install

# Install Lambda dependencies
cd lambda
npm install
cd ..
```

#### Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

### 2. Configure AWS Credentials

Verify your AWS credentials are configured:
```bash
aws configure list
```

If not configured, run:
```bash
aws configure
```

Enter:
- AWS Access Key ID
- AWS Secret Access Key
- Default region: `ap-south-1` (Mumbai)
- Default output format: `json`

### 3. Enable Amazon Bedrock Access

**CRITICAL**: You must enable Bedrock model access in AWS Console:

1. Go to AWS Console → Amazon Bedrock
2. Navigate to "Model access" in the left sidebar
3. Click "Manage model access"
4. Enable these models:
   - ✅ Claude 3 Sonnet
   - ✅ Claude 3 Haiku
5. Click "Save changes"
6. Wait for status to change to "Access granted" (may take a few minutes)

### 4. Bootstrap AWS CDK (First Time Only)

If this is your first time using CDK in this AWS account/region:
```bash
npx cdk bootstrap aws://ACCOUNT-ID/ap-south-1
```

Replace `ACCOUNT-ID` with your AWS account ID (find it in AWS Console top-right).

### 5. Create Secrets in AWS Secrets Manager

Create a secret for JWT:
```bash
aws secretsmanager create-secret \
  --name carenav-jwt-secret \
  --secret-string "your-super-secret-jwt-key-change-this-in-production" \
  --region ap-south-1
```

Create a secret for Bedrock model ID:
```bash
aws secretsmanager create-secret \
  --name carenav-bedrock-model \
  --secret-string "anthropic.claude-3-sonnet-20240229-v1:0" \
  --region ap-south-1
```

### 6. Deploy Backend Infrastructure

Deploy all CDK stacks:
```bash
# Synthesize CloudFormation templates
npx cdk synth

# Deploy all stacks
npx cdk deploy --all --require-approval never
```

This will create:
- DynamoDB table
- S3 bucket for medical reports
- API Gateway REST API
- Lambda functions (auth, patient, symptom, navigation, treatment, etc.)
- IAM roles and policies
- EventBridge rules for reminders

**Note**: Deployment takes 5-10 minutes. Wait for completion.

### 7. Get API Gateway URL

After deployment completes, note the API Gateway URL from the output:
```
Outputs:
ApiStack.ApiEndpoint = https://xxxxxxxxxx.execute-api.ap-south-1.amazonaws.com/prod
```

Copy this URL - you'll need it for the frontend.

### 8. Configure Frontend Environment

Update the frontend `.env` file:
```bash
cd frontend
```

Edit `.env` file:
```env
VITE_API_URL=https://xxxxxxxxxx.execute-api.ap-south-1.amazonaws.com/prod
```

Replace with your actual API Gateway URL from step 7.

### 9. Create Test Users

Run the user creation script:
```bash
cd lambda
npx ts-node scripts/create-test-user.ts
```

This creates:
- Patient user: `patient@demo.com` / `demo123`
- Doctor user: `doctor@demo.com` / `demo123`

### 10. Run Frontend Locally

```bash
cd frontend
npm run dev
```

The app will start at: `http://localhost:3000`

### 11. Test the Application

#### Login as Patient
1. Go to `http://localhost:3000`
2. Login with: `patient@demo.com` / `demo123`
3. Try these features:
   - Start Symptom Input
   - Upload Medical Report
   - View Treatment Schedule

#### Login as Doctor
1. Logout and login with: `doctor@demo.com` / `demo123`
2. Try these features:
   - Create Treatment Plan
   - View Patient Summary
   - Adherence Dashboard

## Troubleshooting

### Issue: CDK Deploy Fails

**Solution**: Check AWS credentials and permissions
```bash
aws sts get-caller-identity
```

### Issue: Bedrock Access Denied

**Solution**: Enable model access in Bedrock console (see Step 3)

### Issue: Frontend Can't Connect to API

**Solution**: 
1. Verify API Gateway URL in `.env`
2. Check CORS configuration in `lib/api-stack.ts`
3. Verify Lambda functions are deployed

### Issue: Lambda Function Errors

**Solution**: Check CloudWatch Logs
```bash
aws logs tail /aws/lambda/FUNCTION-NAME --follow --region ap-south-1
```

### Issue: DynamoDB Access Denied

**Solution**: Verify IAM roles have DynamoDB permissions in CDK stack

## Architecture Overview

```
┌─────────────┐
│   Browser   │
│  (React)    │
└──────┬──────┘
       │
       ↓
┌─────────────────┐
│  API Gateway    │
│  (REST API)     │
└──────┬──────────┘
       │
       ↓
┌─────────────────────────────────────┐
│         Lambda Functions            │
│  ┌──────────┐  ┌──────────────┐   │
│  │   Auth   │  │   Patient    │   │
│  └──────────┘  └──────────────┘   │
│  ┌──────────┐  ┌──────────────┐   │
│  │ Symptom  │  │  Navigation  │   │
│  └──────────┘  └──────────────┘   │
│  ┌──────────┐  ┌──────────────┐   │
│  │ Treatment│  │   Reports    │   │
│  └──────────┘  └──────────────┘   │
└─────────┬───────────────────────────┘
          │
          ↓
┌─────────────────────────────────────┐
│         AWS Services                │
│  ┌──────────┐  ┌──────────────┐   │
│  │ DynamoDB │  │      S3      │   │
│  └──────────┘  └──────────────┘   │
│  ┌──────────┐  ┌──────────────┐   │
│  │ Bedrock  │  │ EventBridge  │   │
│  └──────────┘  └──────────────┘   │
└─────────────────────────────────────┘
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Patient Management
- `POST /api/patients/register` - Register new patient
- `GET /api/patients/:patientId` - Get patient details
- `GET /api/patients/:patientId/red-flags` - Get red flags

### Symptom Processing
- `POST /api/symptoms/input` - Submit symptoms
- `POST /api/symptoms/followup` - Generate follow-up questions
- `POST /api/symptoms/followup/answer` - Submit answers

### Care Navigation
- `POST /api/navigation/recommend` - Get department recommendation

### Medical Reports
- `POST /api/reports/upload` - Upload medical report
- `GET /api/reports/timeline/:patientId` - Get medical timeline

### Treatment Management
- `POST /api/treatment/create` - Create treatment plan (doctor only)
- `GET /api/treatment/schedule/:patientId` - Get treatment schedule
- `POST /api/treatment/mark-taken` - Mark dose as taken

### Adherence Tracking
- `GET /api/adherence/:patientId` - Get adherence metrics (doctor only)

## Demo Credentials

### Patient Account
- Email: `patient@demo.com`
- Password: `demo123`

### Doctor Account
- Email: `doctor@demo.com`
- Password: `demo123`

## Important Notes

### Demo Data Only
- This system is for DEMONSTRATION purposes only
- Do NOT use with real patient data
- Do NOT use for actual medical decisions
- All data is synthetic and for testing

### Security Considerations
- Change JWT secret in production
- Enable AWS WAF for API Gateway
- Implement rate limiting
- Use AWS Cognito for production authentication
- Enable CloudTrail for audit logging

### Cost Optimization
- DynamoDB is on-demand pricing
- Lambda has free tier (1M requests/month)
- Bedrock charges per API call
- S3 charges for storage and requests
- Monitor costs in AWS Cost Explorer

## Next Steps

1. ✅ Deploy backend infrastructure
2. ✅ Create test users
3. ✅ Run frontend locally
4. ✅ Test all features
5. 🔄 Deploy frontend to S3 + CloudFront (optional)
6. 🔄 Set up CI/CD pipeline (optional)
7. 🔄 Configure custom domain (optional)

## Production Deployment (Optional)

### Deploy Frontend to S3 + CloudFront

1. Build frontend:
```bash
cd frontend
npm run build
```

2. Create S3 bucket:
```bash
aws s3 mb s3://carenav-frontend --region ap-south-1
```

3. Upload build:
```bash
aws s3 sync dist/ s3://carenav-frontend --delete
```

4. Configure S3 for static hosting:
```bash
aws s3 website s3://carenav-frontend --index-document index.html
```

5. Create CloudFront distribution (via AWS Console or CDK)

## Support

For issues or questions:
1. Check CloudWatch Logs for Lambda errors
2. Verify AWS service quotas
3. Review IAM permissions
4. Check Bedrock model access

## Clean Up

To delete all resources and avoid charges:
```bash
# Delete CDK stacks
npx cdk destroy --all

# Delete S3 bucket contents
aws s3 rm s3://carenav-reports-ACCOUNT-ID --recursive

# Delete secrets
aws secretsmanager delete-secret --secret-id carenav-jwt-secret --force-delete-without-recovery
aws secretsmanager delete-secret --secret-id carenav-bedrock-model --force-delete-without-recovery
```

---

**Ready to deploy!** Follow the steps above in order. The entire setup takes about 15-20 minutes.

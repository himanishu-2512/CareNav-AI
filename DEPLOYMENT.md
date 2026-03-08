# CareNav AI - Deployment Guide

This guide provides step-by-step instructions for deploying CareNav AI to AWS.

## Prerequisites Checklist

- [ ] Node.js 20.x or later installed
- [ ] AWS CLI installed and configured
- [ ] AWS CDK CLI installed (`npm install -g aws-cdk`)
- [ ] AWS account with administrator access
- [ ] Amazon Bedrock access enabled in ap-south-1 region
- [ ] Git installed (optional)

## Step 1: Verify AWS Configuration

```bash
# Check AWS CLI configuration
aws sts get-caller-identity

# Expected output should show your AWS account ID and user/role
```

## Step 2: Enable Amazon Bedrock

1. Go to AWS Console → Amazon Bedrock
2. Navigate to "Model access" in the left sidebar
3. Click "Manage model access"
4. Enable access to "Claude 3 Sonnet" and "Claude 3 Haiku"
5. Wait for access to be granted (usually takes a few minutes)

## Step 3: Install Project Dependencies

```bash
# From project root
npm install

# Install Lambda dependencies
cd lambda
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..
```

## Step 4: Bootstrap AWS CDK

This step is required only once per AWS account/region combination.

```bash
# Get your AWS account ID
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Bootstrap CDK
cdk bootstrap aws://${AWS_ACCOUNT_ID}/ap-south-1
```

Expected output:
```
✅  Environment aws://123456789012/ap-south-1 bootstrapped
```

## Step 5: Review CDK Stacks

```bash
# List all stacks that will be created
cdk list

# Expected output:
# CareNavDataStack
# CareNavStorageStack
# CareNavApiStack
```

## Step 6: Deploy Infrastructure

### Option A: Deploy All Stacks at Once

```bash
npm run deploy
```

### Option B: Deploy Stacks Individually

```bash
# Deploy data layer first
cdk deploy CareNavDataStack

# Deploy storage layer
cdk deploy CareNavStorageStack

# Deploy API layer
cdk deploy CareNavApiStack
```

**Note**: The deployment will take approximately 5-10 minutes.

## Step 7: Capture Deployment Outputs

After deployment, CDK will output important values. Save these:

```
Outputs:
CareNavApiStack.ApiUrl = https://abc123xyz.execute-api.ap-south-1.amazonaws.com/prod/
CareNavApiStack.ApiId = abc123xyz
CareNavDataStack.TableName = carenav-patients
CareNavStorageStack.ReportsBucketName = carenav-medical-reports-123456789012
CareNavApiStack.SecretsArn = arn:aws:secretsmanager:ap-south-1:123456789012:secret:carenav-app-secrets-xxxxx
```

## Step 8: Configure Frontend

```bash
cd frontend

# Copy environment template
cp .env.example .env

# Edit .env file
nano .env  # or use your preferred editor
```

Update `.env` with your API Gateway URL:

```env
VITE_API_URL=https://abc123xyz.execute-api.ap-south-1.amazonaws.com/prod
VITE_AWS_REGION=ap-south-1
```

## Step 9: Test API Endpoints

```bash
# Test the API Gateway
curl https://your-api-url.execute-api.ap-south-1.amazonaws.com/prod/api/patients/register

# Expected response:
# {"message":"Endpoint not yet implemented","path":"/api/patients/register"}
```

## Step 10: Run Frontend Locally

```bash
cd frontend
npm run dev
```

The application should open at `http://localhost:3000`.

## Step 11: Verify AWS Resources

### Check DynamoDB Table

```bash
aws dynamodb describe-table --table-name carenav-patients --region ap-south-1
```

### Check S3 Bucket

```bash
aws s3 ls | grep carenav-medical-reports
```

### Check API Gateway

```bash
aws apigateway get-rest-apis --region ap-south-1 --query 'items[?name==`CareNav AI API`]'
```

### Check Secrets Manager

```bash
aws secretsmanager list-secrets --region ap-south-1 --query 'SecretList[?Name==`carenav-app-secrets`]'
```

## Troubleshooting

### Issue: CDK Bootstrap Fails

**Error**: `Need to perform AWS calls for account 123456789012, but no credentials found`

**Solution**:
```bash
aws configure
# Enter your AWS credentials
```

### Issue: Bedrock Access Denied

**Error**: `User is not authorized to perform: bedrock:InvokeModel`

**Solution**:
1. Go to AWS Console → Amazon Bedrock
2. Enable model access for Claude 3 models
3. Wait 5-10 minutes for access to propagate

### Issue: CDK Deploy Fails with "Stack already exists"

**Solution**:
```bash
# Update existing stack
cdk deploy --force
```

### Issue: API Gateway Returns 403 Forbidden

**Solution**:
- Check CORS configuration in API Gateway
- Verify API Gateway deployment stage is "prod"
- Check CloudWatch Logs for detailed error messages

### Issue: Lambda Function Timeout

**Solution**:
- Increase Lambda timeout in `lib/api-stack.ts`
- Check CloudWatch Logs for specific errors
- Verify IAM permissions for Lambda execution role

## Monitoring and Logs

### View Lambda Logs

```bash
# List log groups
aws logs describe-log-groups --region ap-south-1 | grep carenav

# Tail logs for a specific function
aws logs tail /aws/lambda/CareNavApiStack-PlaceholderFunction --follow --region ap-south-1
```

### View API Gateway Logs

1. Go to AWS Console → API Gateway
2. Select "CareNav AI API"
3. Click "Stages" → "prod"
4. Click "Logs/Tracing" tab
5. View CloudWatch Logs

### Monitor Costs

```bash
# Set up billing alert
aws budgets create-budget \
  --account-id $(aws sts get-caller-identity --query Account --output text) \
  --budget file://budget.json
```

Create `budget.json`:
```json
{
  "BudgetName": "CareNav-AI-Budget",
  "BudgetLimit": {
    "Amount": "50",
    "Unit": "USD"
  },
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST"
}
```

## Updating the Application

### Update Lambda Functions

```bash
# Make changes to Lambda code
cd lambda
npm run build

# Redeploy
cd ..
cdk deploy CareNavApiStack
```

### Update Frontend

```bash
cd frontend
npm run build

# Deploy to S3 (if using S3 hosting)
aws s3 sync dist/ s3://your-frontend-bucket --delete
```

## Cleanup

To remove all AWS resources and avoid ongoing charges:

```bash
# Destroy all stacks
npm run destroy

# Confirm deletion when prompted
```

**Warning**: This will permanently delete all data, including:
- DynamoDB table and all records
- S3 bucket and all uploaded files
- API Gateway and Lambda functions
- Secrets Manager secrets

## Production Deployment Considerations

For production deployment, consider:

1. **Custom Domain**: Configure Route 53 and ACM certificate
2. **WAF**: Add AWS WAF for API protection
3. **Monitoring**: Set up CloudWatch alarms and dashboards
4. **Backup**: Enable DynamoDB point-in-time recovery
5. **CI/CD**: Set up GitHub Actions or AWS CodePipeline
6. **Multi-Region**: Deploy to multiple regions for high availability
7. **Cost Optimization**: Use Reserved Capacity for DynamoDB
8. **Security**: Implement API keys and rate limiting

## Next Steps

After successful deployment:

1. Implement Lambda function handlers (Tasks 2-16)
2. Build frontend components (Tasks 17-19)
3. Test end-to-end workflows
4. Create demo data
5. Prepare hackathon presentation

## Support

For deployment issues:
1. Check CloudWatch Logs for detailed error messages
2. Review AWS Service Health Dashboard
3. Verify IAM permissions
4. Check AWS service quotas

## Estimated Costs

For demo/hackathon usage (assuming 100 requests/day):

- DynamoDB: ~$1-2/month (on-demand)
- Lambda: ~$0.50/month (free tier eligible)
- S3: ~$0.50/month (minimal storage)
- API Gateway: ~$1/month (free tier eligible)
- Bedrock: ~$5-10/month (depends on usage)

**Total**: ~$8-15/month for light usage

Set up AWS Budgets to monitor and control costs.

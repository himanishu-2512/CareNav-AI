# CareNav AI

AI-powered OPD workflow optimization system for Indian healthcare, built for the AI for Bharat Hackathon.

## Overview

CareNav AI addresses critical inefficiencies in Indian healthcare OPDs by:
- Structuring patient symptom communication using AI
- Providing intelligent care navigation (non-diagnostic)
- Automating treatment adherence tracking
- Processing medical reports with OCR and summarization

**Critical Boundaries:**
- Does NOT diagnose diseases
- Does NOT prescribe or modify medications
- Does NOT replace clinical judgment
- Operates strictly as a workflow assistant

## Architecture

- **Frontend**: React 18+ with TypeScript, Vite, Tailwind CSS
- **Backend**: AWS Lambda (Node.js 20.x) with TypeScript
- **API**: Amazon API Gateway (REST API)
- **Database**: Amazon DynamoDB (single-table design)
- **Storage**: Amazon S3 (encrypted medical reports)
- **AI/ML**: Amazon Bedrock (Claude 3 Sonnet)
- **OCR**: Amazon Textract
- **Speech**: Amazon Transcribe
- **Scheduling**: Amazon EventBridge
- **Secrets**: AWS Secrets Manager
- **IaC**: AWS CDK (TypeScript)

## Project Structure

```
carenav-ai/
├── bin/
│   └── carenav-stack.ts          # CDK app entry point
├── lib/
│   ├── data-stack.ts             # DynamoDB tables
│   ├── storage-stack.ts          # S3 buckets
│   └── api-stack.ts              # API Gateway + Lambda
├── lambda/
│   ├── shared/                   # Shared utilities
│   │   ├── types.ts              # TypeScript types
│   │   ├── dynamodb-client.ts    # DynamoDB client
│   │   ├── bedrock-client.ts     # Bedrock client
│   │   └── response.ts           # API response helpers
│   ├── auth-handler/             # Authentication
│   ├── symptom-processor/        # Symptom extraction
│   ├── care-navigation/          # Department recommendation
│   ├── report-processor/         # Medical report OCR
│   ├── treatment-planner/        # Treatment scheduling
│   └── reminder-processor/       # Medication reminders
├── frontend/
│   ├── src/
│   │   ├── components/           # React components
│   │   ├── pages/                # Page components
│   │   ├── services/             # API services
│   │   └── App.tsx               # Main app component
│   └── package.json
├── cdk.json                      # CDK configuration
├── package.json                  # Root package.json
└── README.md                     # This file
```

## Prerequisites

- Node.js 20.x or later
- AWS CLI configured with credentials
- AWS CDK CLI (`npm install -g aws-cdk`)
- AWS account with appropriate permissions
- Access to Amazon Bedrock (Claude 3 models)

## Setup Instructions

### 1. Install Dependencies

```bash
# Install root dependencies
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

### 2. Configure AWS Credentials

```bash
aws configure
# Enter your AWS Access Key ID, Secret Access Key, and region (ap-south-1)
```

### 3. Bootstrap CDK (First Time Only)

```bash
cdk bootstrap aws://ACCOUNT-ID/ap-south-1
```

Replace `ACCOUNT-ID` with your AWS account ID.

### 4. Deploy Infrastructure

```bash
# Deploy all stacks
npm run deploy

# Or deploy individual stacks
cdk deploy CareNavDataStack
cdk deploy CareNavStorageStack
cdk deploy CareNavApiStack
```

After deployment, note the API Gateway URL from the outputs.

### 5. Configure Frontend

```bash
cd frontend

# Copy environment template
cp .env.example .env

# Edit .env and add your API Gateway URL
# VITE_API_URL=https://your-api-id.execute-api.ap-south-1.amazonaws.com/prod
```

### 6. Run Frontend Locally

```bash
cd frontend
npm run dev
```

The application will open at `http://localhost:3000`.

## Development

### Build Lambda Functions

```bash
cd lambda
npm run build
```

### Build Frontend

```bash
cd frontend
npm run build
```

### Deploy Changes

```bash
# From root directory
npm run deploy
```

## AWS Resources Created

### DynamoDB
- **Table**: `carenav-patients`
  - Single-table design with PK/SK composite keys
  - Global Secondary Index on email for authentication
  - Encryption at rest enabled
  - On-demand billing mode

### S3
- **Bucket**: `carenav-medical-reports-{account-id}`
  - Server-side encryption (SSE-S3)
  - 30-day lifecycle policy for demo data
  - CORS enabled for frontend uploads

### API Gateway
- **REST API**: CareNav AI API
  - CORS enabled
  - CloudWatch logging enabled
  - Rate limiting configured

### Lambda Functions
- Placeholder functions created (to be implemented in subsequent tasks)
- IAM roles with least privilege permissions
- Environment variables configured

### Secrets Manager
- **Secret**: `carenav-app-secrets`
  - JWT_SECRET (auto-generated)
  - BEDROCK_MODEL_ID

## Environment Variables

Lambda functions use the following environment variables:

- `DYNAMODB_TABLE`: DynamoDB table name
- `REPORTS_BUCKET`: S3 bucket for medical reports
- `SECRETS_ARN`: Secrets Manager ARN
- `AWS_REGION`: AWS region (ap-south-1)

## Security

- All data encrypted at rest (DynamoDB, S3)
- All data encrypted in transit (HTTPS/TLS 1.2+)
- IAM roles follow least privilege principle
- Secrets stored in AWS Secrets Manager
- CORS configured for frontend domain
- Demo data auto-deleted after 30 days

## Disclaimers

**IMPORTANT**: This system is for demonstration purposes only.

- **DEMO DATA ONLY** - Do not enter real medical information
- This system does NOT diagnose diseases
- This system does NOT prescribe medications
- This system does NOT replace medical professionals
- Always consult healthcare providers for medical advice

## Cost Considerations

This project uses AWS services that may incur costs:

- DynamoDB: On-demand billing (pay per request)
- Lambda: Pay per invocation
- S3: Storage and data transfer costs
- Bedrock: Pay per API call
- API Gateway: Pay per request

Set up AWS Budgets to monitor spending.

## Cleanup

To remove all AWS resources:

```bash
npm run destroy
```

This will delete all CDK stacks and associated resources.

## Next Steps

1. Implement Lambda function handlers (Task 2-16)
2. Build frontend components (Task 17-19)
3. Integrate Amazon Bedrock for AI capabilities
4. Add authentication and session management
5. Implement treatment planner with EventBridge reminders
6. Add medical report upload with Textract OCR
7. Create demo data and test end-to-end flows

## Support

For issues or questions, refer to the design document in `.kiro/specs/carenav-ai/design.md`.

## License

MIT License - For demonstration purposes only.

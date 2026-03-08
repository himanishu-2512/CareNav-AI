# Design Document: CareNav AI

## Overview

CareNav AI is an AI-powered OPD workflow optimization system built on AWS cloud services for the AI for Bharat Hackathon. The system addresses critical inefficiencies in Indian healthcare OPDs by structuring patient symptom communication, providing intelligent care navigation, and automating treatment adherence tracking.

**Core Capabilities:**
- AI-powered patient symptom intake and structuring
- Non-diagnostic department recommendation
- Medical report OCR and structured history generation
- Red flag highlighting for critical patient information
- Doctor-authored treatment plan conversion to patient schedules
- Automated medication reminders using EventBridge and Lambda
- Adherence tracking dashboard

**Critical Boundaries:**
- Does NOT diagnose diseases
- Does NOT prescribe or modify medications
- Does NOT replace clinical judgment
- Operates strictly as a workflow assistant

**Architecture Philosophy:**
- Serverless-first for scalability and cost efficiency
- AWS-native services for rapid development
- Modular design for hackathon incremental delivery
- Designed for Indian healthcare context (Tier-2/Tier-3 hospitals)
- Multilingual-ready architecture (English MVP, extensible to Hindi, Tamil, Telugu, Bengali)

## High-Level AWS Cloud Architecture

### Architecture Diagram (Text Representation)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                               │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  React Web Application (AWS Amplify / S3 + CloudFront)     │    │
│  │  - Patient Interface  - Doctor Interface  - Auth UI        │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                          HTTPS / REST API
                                  │
┌─────────────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                               │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Amazon API Gateway (REST API)                              │    │
│  │  - Request validation  - CORS  - Rate limiting              │    │
│  │  - JWT authorization  - Request/response transformation     │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                          Lambda Invocation
                                  │
┌─────────────────────────────────────────────────────────────────────┐
│                    SERVERLESS COMPUTE LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Symptom    │  │     Care     │  │  Treatment   │             │
│  │   Lambda     │  │  Navigation  │  │   Planner    │             │
│  │              │  │   Lambda     │  │   Lambda     │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │    Report    │  │     Auth     │  │   Reminder   │             │
│  │   Processor  │  │   Lambda     │  │   Lambda     │             │
│  │   Lambda     │  │              │  │ (EventBridge)│             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    AWS SDK / Service Integration
                                  │
┌─────────────────────────────────────────────────────────────────────┐
│                       AWS AI/ML SERVICES                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Bedrock    │  │  Transcribe  │  │   Textract   │             │
│  │ (Claude 3)   │  │ (Speech-to-  │  │    (OCR)     │             │
│  │ - Symptom    │  │    Text)     │  │ - Report     │             │
│  │   extraction │  │ - Voice      │  │   extraction │             │
│  │ - Follow-up  │  │   input      │  │ - Medical    │             │
│  │   questions  │  │              │  │   timeline   │             │
│  │ - Dept rec.  │  │              │  │              │             │
│  │ - Summarize  │  │              │  │              │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
                                  │
┌─────────────────────────────────────────────────────────────────────┐
│                    DATA & STORAGE LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  DynamoDB    │  │      S3      │  │ EventBridge  │             │
│  │ - Patients   │  │ - Medical    │  │ - Scheduled  │             │
│  │ - Symptoms   │  │   reports    │  │   reminders  │             │
│  │ - Treatment  │  │ - Encrypted  │  │ - Dose times │             │
│  │   plans      │  │   at rest    │  │              │             │
│  │ - Sessions   │  │              │  │              │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
                                  │
┌─────────────────────────────────────────────────────────────────────┐
│                  SECURITY & MONITORING LAYER                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │     IAM      │  │  CloudWatch  │  │    Secrets   │             │
│  │ - Roles      │  │ - Logs       │  │   Manager    │             │
│  │ - Policies   │  │ - Metrics    │  │ - API keys   │             │
│  │ - Least      │  │ - Alarms     │  │ - DB creds   │             │
│  │   privilege  │  │              │  │              │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

1. **Serverless-First**: AWS Lambda for compute eliminates server management and enables automatic scaling
2. **API Gateway**: Centralized API management with built-in authentication, rate limiting, and CORS
3. **DynamoDB**: NoSQL database for flexible schema and single-digit millisecond latency
4. **EventBridge**: Native AWS event scheduling for medication reminders without custom cron jobs
5. **Bedrock**: Managed AI service with Claude 3 models for all NLP tasks
6. **S3 + Textract**: Scalable document storage and OCR processing
7. **CloudWatch**: Centralized logging and monitoring for all services
8. **Secrets Manager**: Secure credential storage and rotation

## End-to-End Data Flows

### Flow 1: Patient Symptom Intake and Care Navigation

```
1. Patient enters symptoms (text or voice)
   ↓
2. Frontend → API Gateway → Symptom Lambda
   ↓
3. If voice: Symptom Lambda → Amazon Transcribe → text
   ↓
4. Symptom Lambda → Amazon Bedrock (symptom extraction prompt)
   ↓
5. Bedrock returns structured JSON: {bodyPart, duration, severity, factors}
   ↓
6. Symptom Lambda → DynamoDB (store symptom record)
   ↓
7. Symptom Lambda → Amazon Bedrock (follow-up question generation)
   ↓
8. Bedrock returns 3-5 clarifying questions
   ↓
9. Frontend displays questions → Patient answers
   ↓
10. Answers → API Gateway → Symptom Lambda → DynamoDB (update symptom)
    ↓
11. Care Navigation Lambda → Amazon Bedrock (department recommendation)
    ↓
12. Bedrock returns {department, urgency, reasoning}
    ↓
13. Care Navigation Lambda adds disclaimer
    ↓
14. Care Navigation Lambda → DynamoDB (store recommendation)
    ↓
15. Frontend displays department + urgency + disclaimer
```

### Flow 2: Medical Report Upload and Timeline Generation

```
1. Patient uploads PDF/image report
   ↓
2. Frontend → API Gateway → Report Processor Lambda
   ↓
3. Report Processor → S3 (store encrypted file)
   ↓
4. S3 event trigger → Report Processor Lambda
   ↓
5. Report Processor → Amazon Textract (extract text from document)
   ↓
6. Textract returns extracted text
   ↓
7. Report Processor → Amazon Bedrock (medical summary prompt)
   ↓
8. Bedrock returns structured summary: {keyFindings, dates, diagnoses, medications}
   ↓
9. Report Processor → DynamoDB (store report metadata + summary)
   ↓
10. Report Processor queries all patient reports from DynamoDB
    ↓
11. Report Processor generates chronological medical timeline
    ↓
12. Report Processor scans for red flag keywords (allergy, chronic, etc.)
    ↓
13. Report Processor → DynamoDB (store timeline + red flags)
    ↓
14. Frontend displays structured medical history with red flags highlighted
```

### Flow 3: Treatment Plan Creation and Automated Reminders

```
1. Doctor enters prescription details (medicine, dosage, frequency, duration)
   ↓
2. Frontend → API Gateway → Treatment Planner Lambda
   ↓
3. Treatment Planner validates required fields
   ↓
4. Treatment Planner → Amazon Bedrock (schedule generation prompt)
   ↓
5. Bedrock returns structured schedule with specific times
   ↓
6. Treatment Planner calculates stop date (start date + duration)
   ↓
7. Treatment Planner → DynamoDB (store treatment plan)
   ↓
8. For each dose time, Treatment Planner → EventBridge (create scheduled rule)
   ↓
9. EventBridge rule configured: cron(minute hour * * ? *)
   ↓
10. EventBridge rule target: Reminder Lambda with medicine details
    ↓
11. At scheduled time: EventBridge triggers Reminder Lambda
    ↓
12. Reminder Lambda → DynamoDB (mark dose as "due")
    ↓
13. Reminder Lambda → DynamoDB (record reminder event)
    ↓
14. Patient frontend polls or receives notification: "Time to take [Medicine]"
    ↓
15. Patient marks dose as taken → API Gateway → Treatment Planner Lambda
    ↓
16. Treatment Planner → DynamoDB (update dose status to "taken", record timestamp)
    ↓
17. On stop date: Treatment Planner Lambda → EventBridge (disable rule)
```

### Flow 4: Doctor Adherence Dashboard

```
1. Doctor accesses adherence dashboard
   ↓
2. Frontend → API Gateway → Treatment Planner Lambda
   ↓
3. Treatment Planner → DynamoDB (query all active treatment plans)
   ↓
4. For each patient, Treatment Planner → DynamoDB (query dose records)
   ↓
5. Treatment Planner calculates: adherence = (doses taken / doses scheduled) × 100
   ↓
6. Treatment Planner identifies patients with adherence < 80%
   ↓
7. Treatment Planner → Frontend (return adherence metrics + flagged patients)
    ↓
8. Frontend displays adherence dashboard with visual indicators
```

## Technology Stack

### Frontend Layer
- **Framework**: React 18+ with TypeScript
- **State Management**: React Context API or Zustand (lightweight)
- **HTTP Client**: Axios with interceptors for JWT handling
- **UI Library**: Tailwind CSS + shadcn/ui components (rapid development)
- **Voice Input**: Web Speech API (browser native) with fallback to Amazon Transcribe
- **Build Tool**: Vite (fast builds for hackathon iteration)
- **Deployment**: AWS Amplify (CI/CD integrated) or S3 + CloudFront

### Backend Layer (Serverless)
- **Compute**: AWS Lambda (Node.js 20.x runtime)
- **Language**: TypeScript for type safety
- **API Management**: Amazon API Gateway (REST API)
- **AWS SDK**: AWS SDK v3 for JavaScript
  - @aws-sdk/client-bedrock-runtime
  - @aws-sdk/client-transcribe
  - @aws-sdk/client-textract
  - @aws-sdk/client-s3
  - @aws-sdk/client-dynamodb
  - @aws-sdk/lib-dynamodb (DocumentClient)
  - @aws-sdk/client-eventbridge
  - @aws-sdk/client-cloudwatch-logs
- **Authentication**: JWT tokens with jsonwebtoken library
- **Validation**: Zod for runtime type validation
- **Environment**: AWS Secrets Manager for sensitive config

### AWS AI/ML Services
- **Primary AI**: Amazon Bedrock
  - Model: Claude 3 Sonnet (production) or Haiku (development/cost optimization)
  - API: Converse API for structured conversations
  - Use cases: Symptom extraction, follow-up generation, department recommendation, report summarization, schedule generation
- **Speech-to-Text**: Amazon Transcribe
  - Real-time or batch transcription
  - Language: English (extensible to Hindi, Tamil, Telugu, Bengali)
- **OCR**: Amazon Textract
  - Document text extraction
  - Table and form detection for structured reports

### Data Layer
- **Primary Database**: Amazon DynamoDB
  - Single-table design with composite keys (PK, SK)
  - On-demand billing for hackathon (no capacity planning)
  - Point-in-time recovery enabled
  - Encryption at rest with AWS KMS
- **File Storage**: Amazon S3
  - Bucket: carenav-medical-reports-{env}
  - Encryption: SSE-S3 or SSE-KMS
  - Lifecycle policy: Delete after 30 days (demo data)
  - Versioning: Disabled for hackathon simplicity
- **Event Scheduling**: Amazon EventBridge
  - Scheduled rules for medication reminders
  - Cron expressions for dose times
  - Lambda targets for reminder processing

### Security & Monitoring
- **Identity & Access**: AWS IAM
  - Lambda execution roles with least privilege
  - Service-to-service authentication
- **Secrets Management**: AWS Secrets Manager
  - JWT signing keys
  - Third-party API keys (if any)
- **Logging**: Amazon CloudWatch Logs
  - Lambda function logs
  - API Gateway access logs
  - Custom application metrics
- **Monitoring**: Amazon CloudWatch
  - Lambda duration and error metrics
  - DynamoDB read/write capacity
  - Bedrock API call metrics
  - Custom alarms for error rates

### Development & Deployment
- **Infrastructure as Code**: AWS CDK (TypeScript) or AWS SAM
  - Rapid stack deployment
  - Environment-specific configurations
- **Containerization**: Docker (optional for local Lambda testing)
- **CI/CD**: AWS Amplify or GitHub Actions with AWS credentials
- **Local Development**: 
  - AWS SAM Local for Lambda testing
  - DynamoDB Local for database testing
  - LocalStack (optional) for full AWS emulation
- **Package Manager**: npm or pnpm
- **Linting**: ESLint + Prettier for code quality

### Deployment Target
- **Primary Region**: AWS Mumbai (ap-south-1) for Indian user latency
- **Fallback Region**: AWS Singapore (ap-southeast-1) if Mumbai services unavailable
- **Environment**: Single environment for hackathon (production-like configuration)

## AI Prompt Engineering Design

All Amazon Bedrock prompts follow a structured format to minimize hallucination and ensure consistent JSON outputs. The system uses Claude 3 Sonnet or Haiku models via the Converse API.

### Prompt Design Principles

1. **Explicit Boundaries**: Every prompt includes instructions to avoid diagnosis and prescription
2. **Structured Output**: All prompts request JSON format with specific schema
3. **Context Limitation**: Prompts include only necessary context to reduce token usage
4. **Error Handling**: Prompts include fallback instructions for edge cases
5. **Multilingual Ready**: Prompts designed for future translation to Indian languages

### Prompt 1: Symptom Extraction

**Purpose**: Convert natural language symptom description into structured JSON

**System Prompt**:
```
You are a medical symptom extraction assistant for an Indian healthcare OPD intake system. Your role is to structure patient-reported symptoms into a standardized format. You do NOT diagnose diseases or recommend treatments.

Extract information accurately from the patient's description. If information is not provided, use "not specified" rather than guessing.
```

**User Prompt Template**:
```
Extract structured symptom information from this patient description:

"{symptomText}"

Return ONLY valid JSON with this exact structure:
{
  "bodyPart": "affected body part or system (e.g., head, chest, abdomen, joints)",
  "duration": "how long symptoms have been present (e.g., 2 days, 1 week, 3 months)",
  "severity": "mild | moderate | severe",
  "associatedFactors": ["list", "of", "related", "symptoms", "or", "triggers"],
  "timing": "when symptoms occur (e.g., morning, after meals, at night)",
  "character": "description of symptom quality (e.g., sharp, dull, throbbing)"
}

Rules:
- Use patient's exact words when possible
- Do NOT mention disease names
- Do NOT add medical interpretations
- If information is missing, use "not specified"
- Return ONLY the JSON object, no additional text
```

**Expected Output**:
```json
{
  "bodyPart": "chest",
  "duration": "3 days",
  "severity": "moderate",
  "associatedFactors": ["shortness of breath", "sweating"],
  "timing": "worse with exertion",
  "character": "pressure-like discomfort"
}
```

### Prompt 2: Follow-Up Question Generation

**Purpose**: Generate 3-5 clarifying questions based on initial symptoms

**System Prompt**:
```
You are a medical intake assistant for an Indian OPD. Generate relevant follow-up questions to complete the patient's symptom picture. Focus on information that helps route the patient to the correct department, NOT on diagnosing diseases.
```

**User Prompt Template**:
```
Based on these structured symptoms, generate 3-5 clarifying questions:

{structuredSymptoms}

Generate questions about:
- Timing and onset (sudden vs gradual)
- Aggravating or relieving factors
- Previous similar episodes
- Current medications or treatments tried
- Impact on daily activities
- Associated symptoms not yet mentioned

Return ONLY valid JSON array:
[
  {
    "questionId": "q1",
    "questionText": "clear, simple question in patient-friendly language",
    "questionType": "text"
  }
]

Rules:
- Ask 3-5 questions maximum
- Use simple, non-medical language
- Do NOT ask about diagnoses
- Do NOT suggest diseases
- Focus on practical, actionable information
- Return ONLY the JSON array, no additional text
```

**Expected Output**:
```json
[
  {
    "questionId": "q1",
    "questionText": "Did the chest discomfort start suddenly or gradually?",
    "questionType": "text"
  },
  {
    "questionId": "q2",
    "questionText": "Have you experienced this type of discomfort before?",
    "questionType": "text"
  },
  {
    "questionId": "q3",
    "questionText": "Are you currently taking any medications?",
    "questionType": "text"
  }
]
```

### Prompt 3: Department Recommendation (Care Navigation)

**Purpose**: Recommend appropriate medical department based on symptom patterns

**System Prompt**:
```
You are a healthcare navigation assistant for an Indian hospital OPD. Based on symptom patterns, recommend the most appropriate medical department. You do NOT diagnose diseases. You analyze symptom patterns to suggest which specialist the patient should see.

CRITICAL: Never mention disease names. Focus only on symptom patterns and affected body systems.
```

**User Prompt Template**:
```
Based on these symptoms and patient responses, recommend an appropriate medical department:

Symptoms: {structuredSymptoms}
Follow-up answers: {followUpAnswers}

Available departments:
- General Medicine (internal medicine, general health concerns)
- Cardiology (heart and circulation related symptoms)
- Neurology (brain, nerves, headaches, dizziness)
- Orthopedics (bones, joints, muscles, injuries)
- Gastroenterology (digestive system, abdominal symptoms)
- Dermatology (skin, hair, nails)
- ENT (ear, nose, throat, hearing, voice)
- Pulmonology (lungs, breathing, cough)
- Endocrinology (hormones, thyroid, diabetes management)
- Emergency Medicine (life-threatening symptoms)

Classify urgency:
- routine: can wait for scheduled appointment
- urgent: should be seen within 24-48 hours
- emergency: needs immediate medical attention

Return ONLY valid JSON:
{
  "department": "one of the departments listed above",
  "urgency": "routine | urgent | emergency",
  "reasoning": "explain based on symptom patterns and affected body systems, NOT disease names"
}

Rules:
- Choose ONE department most appropriate for initial evaluation
- Base reasoning on symptom patterns, body systems, and timing
- Do NOT mention disease names or diagnoses
- If symptoms suggest emergency (chest pain with sweating, severe head injury, difficulty breathing), classify as emergency
- Return ONLY the JSON object, no additional text
```

**Expected Output**:
```json
{
  "department": "Cardiology",
  "urgency": "urgent",
  "reasoning": "Chest discomfort with associated shortness of breath and sweating, worse with exertion, suggests cardiovascular system involvement requiring specialist evaluation within 24-48 hours"
}
```

### Prompt 4: Medical Report Summarization

**Purpose**: Extract structured information from OCR-extracted medical reports

**System Prompt**:
```
You are a medical document summarization assistant for an Indian healthcare system. Extract key information from medical reports to create a structured, portable medical history. Preserve factual information without adding interpretations.
```

**User Prompt Template**:
```
Summarize this medical report text extracted via OCR:

"{extractedText}"

Return ONLY valid JSON:
{
  "reportDate": "date of the report (YYYY-MM-DD format if available)",
  "reportType": "type of report (e.g., lab test, imaging, consultation note, discharge summary)",
  "keyFindings": ["list", "of", "important", "findings"],
  "diagnoses": ["list", "of", "diagnoses", "mentioned"],
  "medications": ["list", "of", "medications", "mentioned"],
  "procedures": ["list", "of", "procedures", "performed"],
  "recommendations": ["list", "of", "doctor", "recommendations"],
  "redFlags": ["allergies", "chronic conditions", "high-risk factors"]
}

Rules:
- Extract only information explicitly stated in the report
- Do NOT add interpretations or inferences
- Preserve medical terminology as written
- If a field has no information, use empty array []
- Identify red flags: allergies, chronic diseases, high-risk conditions
- Return ONLY the JSON object, no additional text
```

**Expected Output**:
```json
{
  "reportDate": "2024-01-15",
  "reportType": "lab test",
  "keyFindings": ["HbA1c: 8.2%", "Fasting glucose: 156 mg/dL"],
  "diagnoses": ["Type 2 Diabetes Mellitus"],
  "medications": ["Metformin 500mg"],
  "procedures": [],
  "recommendations": ["Dietary modification", "Regular blood sugar monitoring"],
  "redFlags": ["Type 2 Diabetes Mellitus"]
}
```

### Prompt 5: Treatment Schedule Generation

**Purpose**: Convert doctor prescription into patient-friendly schedule with specific times

**System Prompt**:
```
You are a treatment schedule assistant for an Indian healthcare system. Convert doctor prescriptions into clear, time-specific medication schedules that patients can easily follow.
```

**User Prompt Template**:
```
Convert this prescription into a patient-friendly medication schedule:

Medicine: {medicineName}
Dosage: {dosage}
Frequency: {frequency}
Duration: {duration}
Special Instructions: {specialInstructions}

Return ONLY valid JSON:
{
  "medicineName": "medicine name",
  "dosage": "dosage amount",
  "times": ["array", "of", "specific", "times", "in", "HH:MM", "format"],
  "frequency": "human-readable frequency",
  "specialInstructions": "clear instructions for patient",
  "foodTiming": "before food | after food | with food | anytime"
}

Frequency to times mapping:
- "once daily" → ["08:00"]
- "twice daily" → ["08:00", "20:00"]
- "three times daily" → ["08:00", "14:00", "20:00"]
- "four times daily" → ["08:00", "12:00", "16:00", "20:00"]
- "every 6 hours" → ["06:00", "12:00", "18:00", "00:00"]
- "every 8 hours" → ["08:00", "16:00", "00:00"]
- "every 12 hours" → ["08:00", "20:00"]

Rules:
- Use 24-hour time format (HH:MM)
- Space doses evenly throughout the day
- Consider typical meal times for food-related instructions
- Make instructions clear and actionable
- Return ONLY the JSON object, no additional text
```

**Expected Output**:
```json
{
  "medicineName": "Amoxicillin",
  "dosage": "500mg",
  "times": ["08:00", "14:00", "20:00"],
  "frequency": "Three times daily",
  "specialInstructions": "Complete the full course even if you feel better",
  "foodTiming": "after food"
}
```

### Prompt Error Handling

All Lambda functions calling Bedrock include error handling:

```typescript
try {
  const response = await bedrockClient.send(converseCommand);
  const jsonText = response.output.message.content[0].text;
  const parsed = JSON.parse(jsonText);
  // Validate against expected schema
  return parsed;
} catch (error) {
  if (error.name === 'ThrottlingException') {
    // Retry with exponential backoff
  } else if (error.name === 'ValidationException') {
    // Log and return fallback response
  } else {
    // Log error and return user-friendly message
    throw new Error('AI service temporarily unavailable');
  }
}
```

## Lambda Function Designs

### Lambda 1: Symptom Processor

**Purpose**: Handle symptom input, extraction, and follow-up generation

**Trigger**: API Gateway POST /api/symptoms/input

**Environment Variables**:
- BEDROCK_MODEL_ID: anthropic.claude-3-sonnet-20240229-v1:0
- DYNAMODB_TABLE: carenav-patients
- TRANSCRIBE_BUCKET: carenav-transcribe-temp

**Handler Logic**:
```typescript
export async function handler(event: APIGatewayProxyEvent) {
  const { patientId, symptomText, inputMethod } = JSON.parse(event.body);
  
  // 1. If voice input, transcribe first
  let text = symptomText;
  if (inputMethod === 'voice') {
    text = await transcribeAudio(symptomText); // S3 URL
  }
  
  // 2. Extract structured symptoms using Bedrock
  const structuredSymptoms = await extractSymptoms(text);
  
  // 3. Store in DynamoDB
  const symptomId = uuidv4();
  await dynamodb.put({
    TableName: process.env.DYNAMODB_TABLE,
    Item: {
      PK: `PATIENT#${patientId}`,
      SK: `SYMPTOM#${symptomId}`,
      symptomId,
      patientId,
      rawText: text,
      structuredSymptoms,
      inputMethod,
      createdAt: new Date().toISOString()
    }
  });
  
  // 4. Generate follow-up questions
  const followUpQuestions = await generateFollowUpQuestions(structuredSymptoms);
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      symptomId,
      structuredSymptoms,
      followUpQuestions
    })
  };
}
```

**IAM Permissions**:
- bedrock:InvokeModel
- dynamodb:PutItem
- transcribe:StartTranscriptionJob (if voice enabled)
- s3:GetObject (for transcribe bucket)

### Lambda 2: Care Navigation

**Purpose**: Generate department recommendation based on symptoms

**Trigger**: API Gateway POST /api/navigation/recommend

**Handler Logic**:
```typescript
export async function handler(event: APIGatewayProxyEvent) {
  const { symptomId, patientId } = JSON.parse(event.body);
  
  // 1. Retrieve symptom data from DynamoDB
  const symptomData = await dynamodb.get({
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      PK: `PATIENT#${patientId}`,
      SK: `SYMPTOM#${symptomId}`
    }
  });
  
  // 2. Get department recommendation from Bedrock
  const recommendation = await getDepartmentRecommendation(
    symptomData.Item.structuredSymptoms,
    symptomData.Item.followUpAnswers || []
  );
  
  // 3. Add mandatory disclaimer
  const disclaimerText = "This is not a medical diagnosis. Please consult a healthcare provider for professional medical advice.";
  
  // 4. Add emergency services message if urgent
  let emergencyMessage = null;
  if (recommendation.urgency === 'emergency') {
    emergencyMessage = "CALL EMERGENCY SERVICES IMMEDIATELY - Dial 102 or 108";
  }
  
  // 5. Store recommendation in DynamoDB
  const navigationId = uuidv4();
  await dynamodb.put({
    TableName: process.env.DYNAMODB_TABLE,
    Item: {
      PK: `PATIENT#${patientId}`,
      SK: `NAVIGATION#${navigationId}`,
      navigationId,
      patientId,
      symptomId,
      ...recommendation,
      disclaimer: disclaimerText,
      emergencyMessage,
      createdAt: new Date().toISOString()
    }
  });
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      navigationId,
      ...recommendation,
      disclaimer: disclaimerText,
      emergencyMessage
    })
  };
}
```

### Lambda 3: Report Processor

**Purpose**: Process uploaded medical reports with OCR and summarization

**Trigger**: S3 event (object created) or API Gateway POST /api/reports/upload

**Handler Logic**:
```typescript
export async function handler(event: S3Event | APIGatewayProxyEvent) {
  let s3Key, patientId;
  
  // Handle both S3 trigger and API Gateway trigger
  if ('Records' in event) {
    // S3 event
    s3Key = event.Records[0].s3.object.key;
    patientId = s3Key.split('/')[0]; // Assuming key format: patientId/reportId.pdf
  } else {
    // API Gateway event - upload file first
    const { patientId: pid, fileData, fileName } = JSON.parse(event.body);
    patientId = pid;
    s3Key = `${patientId}/${uuidv4()}-${fileName}`;
    
    await s3.putObject({
      Bucket: process.env.REPORTS_BUCKET,
      Key: s3Key,
      Body: Buffer.from(fileData, 'base64'),
      ServerSideEncryption: 'AES256'
    });
  }
  
  // 1. Extract text using Textract
  const extractedText = await extractTextFromDocument(s3Key);
  
  // 2. Summarize using Bedrock
  const summary = await summarizeReport(extractedText);
  
  // 3. Scan for red flags
  const redFlags = scanForRedFlags(summary);
  
  // 4. Store in DynamoDB
  const reportId = uuidv4();
  await dynamodb.put({
    TableName: process.env.DYNAMODB_TABLE,
    Item: {
      PK: `PATIENT#${patientId}`,
      SK: `REPORT#${reportId}`,
      reportId,
      patientId,
      s3Key,
      extractedText,
      summary,
      redFlags,
      uploadedAt: new Date().toISOString()
    }
  });
  
  // 5. Update medical timeline
  await updateMedicalTimeline(patientId);
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      reportId,
      summary,
      redFlags
    })
  };
}
```

**IAM Permissions**:
- s3:GetObject, s3:PutObject
- textract:DetectDocumentText
- bedrock:InvokeModel
- dynamodb:PutItem, dynamodb:Query

### Lambda 4: Treatment Planner

**Purpose**: Create treatment plans and configure EventBridge reminders

**Trigger**: API Gateway POST /api/treatment/create

**Handler Logic**:
```typescript
export async function handler(event: APIGatewayProxyEvent) {
  const { patientId, doctorId, prescriptions } = JSON.parse(event.body);
  
  const treatmentPlanId = uuidv4();
  const scheduledMedicines = [];
  
  for (const prescription of prescriptions) {
    // 1. Generate schedule using Bedrock
    const schedule = await generateMedicineSchedule(prescription);
    
    // 2. Calculate stop date
    const startDate = new Date();
    const stopDate = calculateStopDate(startDate, prescription.duration);
    
    const medicineId = uuidv4();
    scheduledMedicines.push({
      medicineId,
      ...prescription,
      ...schedule,
      startDate: startDate.toISOString(),
      stopDate: stopDate.toISOString()
    });
    
    // 3. Create EventBridge rules for each dose time
    for (const time of schedule.times) {
      const [hour, minute] = time.split(':');
      const ruleName = `carenav-reminder-${medicineId}-${hour}${minute}`;
      
      await eventBridge.putRule({
        Name: ruleName,
        ScheduleExpression: `cron(${minute} ${hour} * * ? *)`,
        State: 'ENABLED',
        Description: `Reminder for ${prescription.medicineName}`
      });
      
      // 4. Set Lambda target for the rule
      await eventBridge.putTargets({
        Rule: ruleName,
        Targets: [{
          Id: '1',
          Arn: process.env.REMINDER_LAMBDA_ARN,
          Input: JSON.stringify({
            patientId,
            medicineId,
            medicineName: prescription.medicineName,
            dosage: prescription.dosage,
            time,
            stopDate: stopDate.toISOString()
          })
        }]
      });
    }
  }
  
  // 5. Store treatment plan in DynamoDB
  await dynamodb.put({
    TableName: process.env.DYNAMODB_TABLE,
    Item: {
      PK: `PATIENT#${patientId}`,
      SK: `TREATMENT#${treatmentPlanId}`,
      treatmentPlanId,
      patientId,
      doctorId,
      prescriptions: scheduledMedicines,
      createdAt: new Date().toISOString()
    }
  });
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      treatmentPlanId,
      schedules: scheduledMedicines
    })
  };
}
```

**IAM Permissions**:
- bedrock:InvokeModel
- dynamodb:PutItem
- events:PutRule, events:PutTargets
- lambda:AddPermission (for EventBridge to invoke Reminder Lambda)

### Lambda 5: Reminder Processor

**Purpose**: Process scheduled medication reminders

**Trigger**: EventBridge scheduled rule

**Handler Logic**:
```typescript
export async function handler(event: EventBridgeEvent) {
  const { patientId, medicineId, medicineName, dosage, time, stopDate } = event.detail;
  
  // 1. Check if we've passed stop date
  if (new Date() > new Date(stopDate)) {
    // Disable the EventBridge rule
    const ruleName = event.resources[0].split('/').pop();
    await eventBridge.disableRule({ Name: ruleName });
    return { statusCode: 200, message: 'Treatment completed' };
  }
  
  // 2. Mark dose as "due" in DynamoDB
  const doseId = `${medicineId}#${new Date().toISOString().split('T')[0]}#${time}`;
  await dynamodb.put({
    TableName: process.env.DYNAMODB_TABLE,
    Item: {
      PK: `PATIENT#${patientId}`,
      SK: `DOSE#${doseId}`,
      patientId,
      medicineId,
      medicineName,
      dosage,
      scheduledTime: time,
      scheduledDate: new Date().toISOString().split('T')[0],
      status: 'due',
      takenAt: null,
      createdAt: new Date().toISOString()
    }
  });
  
  // 3. Log reminder event
  console.log(`Reminder sent: ${medicineName} ${dosage} at ${time} for patient ${patientId}`);
  
  // 4. Optional: Send push notification (future enhancement)
  // await sendPushNotification(patientId, `Time to take ${medicineName}`);
  
  return {
    statusCode: 200,
    message: 'Reminder processed'
  };
}
```

**IAM Permissions**:
- dynamodb:PutItem
- events:DisableRule
- sns:Publish (if push notifications enabled)

### Lambda 6: Auth Handler

**Purpose**: Handle user authentication and JWT generation

**Trigger**: API Gateway POST /api/auth/login, /api/auth/logout

**Handler Logic**:
```typescript
export async function handler(event: APIGatewayProxyEvent) {
  const path = event.path;
  
  if (path === '/api/auth/login') {
    const { email, password } = JSON.parse(event.body);
    
    // 1. Retrieve user from DynamoDB
    const user = await dynamodb.query({
      TableName: process.env.DYNAMODB_TABLE,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email }
    });
    
    if (!user.Items || user.Items.length === 0) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Invalid credentials' }) };
    }
    
    // 2. Verify password (bcrypt)
    const isValid = await bcrypt.compare(password, user.Items[0].passwordHash);
    if (!isValid) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Invalid credentials' }) };
    }
    
    // 3. Generate JWT
    const token = jwt.sign(
      { userId: user.Items[0].userId, role: user.Items[0].role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // 4. Store session in DynamoDB
    await dynamodb.put({
      TableName: process.env.DYNAMODB_TABLE,
      Item: {
        PK: `SESSION#${token}`,
        SK: 'METADATA',
        token,
        userId: user.Items[0].userId,
        role: user.Items[0].role,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString()
      }
    });
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        token,
        userId: user.Items[0].userId,
        role: user.Items[0].role
      })
    };
  }
  
  if (path === '/api/auth/logout') {
    const token = event.headers.Authorization?.replace('Bearer ', '');
    
    // Delete session from DynamoDB
    await dynamodb.delete({
      TableName: process.env.DYNAMODB_TABLE,
      Key: { PK: `SESSION#${token}`, SK: 'METADATA' }
    });
    
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  }
}
```

**IAM Permissions**:
- dynamodb:Query, dynamodb:PutItem, dynamodb:DeleteItem
- secretsmanager:GetSecretValue (for JWT_SECRET)

### 1. Patient Registration Component

**Purpose**: Collect basic patient information for personalization

**Interface**:
```javascript
// POST /api/patients/register
Request: {
  name: string,
  age: number,
  gender: string,
  contact: string
}

Response: {
  patientId: string,
  message: string,
  privacyNotice: string
}
```

**Processing Logic**:
1. Validate all required fields are non-empty
2. Generate unique patient ID (UUID)
3. Store in DynamoDB patients table
4. Return patient ID and privacy notice
5. Display demo ID scan placeholder button (no actual implementation)

### 2. Symptom Input Component

**Purpose**: Capture patient symptoms via text or voice

**Interface**:
```javascript
// POST /api/symptoms/input
Request: {
  patientId: string,
  symptomText: string,
  inputMethod: "text" | "voice"
}

Response: {
  symptomId: string,
  structuredSymptoms: {
    bodyPart: string,
    duration: string,
    severity: string,
    associatedFactors: string[]
  },
  rawText: string
}
```

**Processing Logic**:
1. If inputMethod is "voice", call Amazon Transcribe to convert audio to text
2. Send symptom text to Amazon Bedrock with structured extraction prompt
3. Parse Bedrock response into structured format
4. Store in DynamoDB symptoms table
5. Return structured symptoms for patient confirmation

**Bedrock Prompt Design**:
```
You are a medical symptom extraction assistant. Extract structured information from the patient's symptom description.

Patient description: {symptomText}

Extract and return JSON with these fields:
- bodyPart: affected body part or system
- duration: how long symptoms have been present
- severity: mild, moderate, or severe
- associatedFactors: list of related symptoms or triggers

Return ONLY valid JSON. Do not diagnose or name diseases.
```

### 3. AI Follow-Up Clarification Component

**Purpose**: Generate relevant follow-up questions to complete symptom picture

**Interface**:
```javascript
// POST /api/symptoms/followup
Request: {
  symptomId: string,
  structuredSymptoms: object
}

Response: {
  questions: [
    {
      questionId: string,
      questionText: string,
      questionType: "text" | "multiple_choice"
    }
  ]
}

// POST /api/symptoms/followup/answer
Request: {
  symptomId: string,
  questionId: string,
  answer: string
}

Response: {
  updatedSymptoms: object
}
```

**Processing Logic**:
1. Send structured symptoms to Amazon Bedrock with follow-up generation prompt
2. Parse response to extract 3-5 questions
3. Store questions in DynamoDB
4. When answers received, update symptom record with additional information

**Bedrock Prompt Design**:
```
You are a medical intake assistant. Based on these symptoms, generate 3-5 clarifying questions to better understand the patient's condition.

Symptoms: {structuredSymptoms}

Generate questions about:
- Timing and onset
- Aggravating or relieving factors
- Previous similar episodes
- Current medications
- Impact on daily activities

Return JSON array of questions. Each question should be clear and specific.
Do not ask about diagnoses or suggest diseases.
```

### 4. Care Navigation Component

**Purpose**: Recommend appropriate medical department based on symptoms

**Interface**:
```javascript
// POST /api/navigation/recommend
Request: {
  symptomId: string,
  structuredSymptoms: object,
  followUpAnswers: object[]
}

Response: {
  recommendedDepartment: string,
  urgencyLevel: "routine" | "urgent" | "emergency",
  reasoning: string,
  disclaimer: string
}
```

**Processing Logic**:
1. Combine structured symptoms and follow-up answers
2. Send to Amazon Bedrock with department recommendation prompt
3. Parse response for department and urgency
4. Add mandatory disclaimer
5. If urgency is "emergency", add emergency services message
6. Store recommendation in DynamoDB
7. Return recommendation with disclaimer

**Bedrock Prompt Design**:
```
You are a healthcare navigation assistant. Based on symptom patterns, recommend an appropriate medical department.

Symptoms: {structuredSymptoms}
Additional information: {followUpAnswers}

Recommend ONE of these departments:
- General Medicine
- Cardiology
- Neurology
- Orthopedics
- Gastroenterology
- Dermatology
- ENT (Ear, Nose, Throat)
- Emergency Medicine

Also classify urgency as: routine, urgent, or emergency

Return JSON with:
- department: string
- urgency: string
- reasoning: string (explain based on symptom patterns, NOT disease names)

CRITICAL: Do NOT mention disease names or diagnoses. Focus on symptom patterns only.
```

### 5. Medical Report Upload Component

**Purpose**: Upload and summarize previous medical documents

**Interface**:
```javascript
// POST /api/reports/upload
Request: FormData {
  patientId: string,
  file: File (PDF or image)
}

Response: {
  reportId: string,
  s3Key: string,
  extractedText: string,
  summary: {
    keyFindings: string[],
    dates: string[],
    relevantInfo: string
  }
}
```

**Processing Logic**:
1. Validate file size (max 10MB) and format (PDF, JPG, PNG)
2. Upload file to S3 bucket with patient-specific prefix
3. If image file, call Amazon Textract to extract text
4. If PDF, use Textract or extract text directly
5. Send extracted text to Amazon Bedrock for summarization
6. Store report metadata and summary in DynamoDB
7. Return report ID and summary

**Bedrock Prompt Design**:
```
You are a medical document summarization assistant. Summarize this medical report.

Report text: {extractedText}

Extract and return JSON with:
- keyFindings: array of important medical findings
- dates: array of relevant dates mentioned
- relevantInfo: brief summary of the report's main points

Focus on factual information. Do not add interpretations or diagnoses not in the original text.
```

### 6. Doctor Treatment Planner Component

**Purpose**: Convert doctor prescriptions into patient-friendly schedules

**Interface**:
```javascript
// POST /api/treatment/create
Request: {
  patientId: string,
  doctorId: string,
  prescriptions: [
    {
      medicineName: string,
      dosage: string,
      frequency: string, // e.g., "twice daily", "every 8 hours"
      duration: string, // e.g., "7 days", "2 weeks"
      specialInstructions: string
    }
  ]
}

Response: {
  treatmentPlanId: string,
  schedules: [
    {
      medicineId: string,
      medicineName: string,
      dosage: string,
      times: string[], // e.g., ["08:00", "20:00"]
      stopDate: string, // ISO date
      specialInstructions: string
    }
  ]
}
```

**Processing Logic**:
1. Validate medicine name and dosage are non-empty
2. Parse frequency to determine daily times (e.g., "twice daily" → ["08:00", "20:00"])
3. Calculate stop date based on duration
4. Generate medicine schedule with specific times
5. Store treatment plan in DynamoDB
6. Return structured schedule for patient view

**Frequency Parsing Logic**:
- "once daily" → ["08:00"]
- "twice daily" → ["08:00", "20:00"]
- "three times daily" → ["08:00", "14:00", "20:00"]
- "every 6 hours" → ["06:00", "12:00", "18:00", "00:00"]
- "every 8 hours" → ["08:00", "16:00", "00:00"]

### 7. Treatment Schedule Display Component

**Purpose**: Show patient their daily medicine schedule

**Interface**:
```javascript
// GET /api/treatment/schedule/:patientId
Response: {
  activeMedicines: [
    {
      medicineId: string,
      medicineName: string,
      dosage: string,
      todayDoses: [
        {
          time: string,
          status: "pending" | "due" | "taken" | "missed",
          takenAt: string | null
        }
      ],
      stopDate: string,
      specialInstructions: string
    }
  ],
  completedMedicines: [...]
}

// POST /api/treatment/mark-taken
Request: {
  patientId: string,
  medicineId: string,
  doseTime: string
}

Response: {
  success: boolean,
  takenAt: string
}
```

**Processing Logic**:
1. Query DynamoDB for active treatment plans
2. Filter medicines where current date < stop date
3. For each medicine, generate today's dose schedule
4. Check dose status based on current time and taken records
5. Group medicines by time of day (morning, afternoon, evening, night)
6. When patient marks dose taken, record timestamp in DynamoDB

### 8. Authentication and Session Management

**Purpose**: Secure access with role-based permissions

**Interface**:
```javascript
// POST /api/auth/login
Request: {
  email: string,
  password: string
}

Response: {
  token: string, // JWT
  userId: string,
  role: "patient" | "doctor",
  expiresAt: string
}

// POST /api/auth/logout
Request: {
  token: string
}

Response: {
  success: boolean
}
```

**Processing Logic**:
1. Validate credentials against DynamoDB users table
2. Generate JWT token with user ID and role
3. Set expiration time (e.g., 24 hours)
4. Store session in DynamoDB sessions table
5. Return token for client-side storage
6. Middleware validates token on protected routes
7. On logout, invalidate session in DynamoDB

**Role-Based Access**:
- **Patient role**: Access symptom input, care navigation, treatment schedule
- **Doctor role**: Access treatment planner, patient summaries
- **Middleware**: Check JWT role claim before allowing access

## Data Models

### DynamoDB Table Structures

#### Patients Table
```javascript
{
  PK: "PATIENT#{patientId}",
  SK: "PROFILE",
  patientId: string,
  name: string,
  age: number,
  gender: string,
  contact: string,
  createdAt: string,
  updatedAt: string
}
```

#### Symptoms Table
```javascript
{
  PK: "PATIENT#{patientId}",
  SK: "SYMPTOM#{symptomId}",
  symptomId: string,
  patientId: string,
  rawText: string,
  structuredSymptoms: {
    bodyPart: string,
    duration: string,
    severity: string,
    associatedFactors: string[]
  },
  followUpAnswers: object[],
  inputMethod: string,
  createdAt: string
}
```

#### Care Navigation Table
```javascript
{
  PK: "PATIENT#{patientId}",
  SK: "NAVIGATION#{navigationId}",
  navigationId: string,
  patientId: string,
  symptomId: string,
  recommendedDepartment: string,
  urgencyLevel: string,
  reasoning: string,
  createdAt: string
}
```

#### Reports Table
```javascript
{
  PK: "PATIENT#{patientId}",
  SK: "REPORT#{reportId}",
  reportId: string,
  patientId: string,
  s3Key: string,
  extractedText: string,
  summary: {
    keyFindings: string[],
    dates: string[],
    relevantInfo: string
  },
  uploadedAt: string
}
```

#### Treatment Plans Table
```javascript
{
  PK: "PATIENT#{patientId}",
  SK: "TREATMENT#{treatmentPlanId}",
  treatmentPlanId: string,
  patientId: string,
  doctorId: string,
  prescriptions: [
    {
      medicineId: string,
      medicineName: string,
      dosage: string,
      frequency: string,
      times: string[],
      startDate: string,
      stopDate: string,
      specialInstructions: string
    }
  ],
  createdAt: string
}
```

#### Dose Records Table
```javascript
{
  PK: "PATIENT#{patientId}",
  SK: "DOSE#{medicineId}#{date}#{time}",
  patientId: string,
  medicineId: string,
  scheduledTime: string,
  takenAt: string | null,
  status: string
}
```

#### Users Table
```javascript
{
  PK: "USER#{userId}",
  SK: "PROFILE",
  userId: string,
  email: string,
  passwordHash: string,
  role: string,
  createdAt: string
}
```

#### Sessions Table
```javascript
{
  PK: "SESSION#{token}",
  SK: "METADATA",
  token: string,
  userId: string,
  role: string,
  expiresAt: string,
  createdAt: string
}
```

### S3 Bucket Structure
```
carenav-medical-reports/
  {patientId}/
    {reportId}.pdf
    {reportId}.jpg
```



## API Gateway Configuration

### REST API Design

**Base URL**: `https://api.carenav.ai` (or API Gateway generated URL)

**Endpoints**:

```
POST   /api/auth/login                    # User authentication
POST   /api/auth/logout                   # Session termination
POST   /api/patients/register             # Patient registration
POST   /api/symptoms/input                # Symptom submission
POST   /api/symptoms/followup             # Follow-up question generation
POST   /api/symptoms/followup/answer      # Submit follow-up answers
POST   /api/navigation/recommend          # Department recommendation
POST   /api/reports/upload                # Medical report upload
GET    /api/reports/:patientId            # Retrieve patient reports
GET    /api/treatment/schedule/:patientId # Get treatment schedule
POST   /api/treatment/create              # Create treatment plan
POST   /api/treatment/mark-taken          # Mark dose as taken
GET    /api/adherence/:patientId          # Get adherence metrics (doctor only)
```

**API Gateway Features**:
- **Request Validation**: JSON schema validation for all POST requests
- **CORS Configuration**: Allow frontend domain with credentials
- **Rate Limiting**: 100 requests per minute per IP
- **JWT Authorizer**: Lambda authorizer validates JWT tokens
- **Request/Response Transformation**: Standardize error responses
- **CloudWatch Logging**: Enable execution and access logs

**Lambda Authorizer**:
```typescript
export async function authorizer(event: APIGatewayAuthorizerEvent) {
  const token = event.authorizationToken?.replace('Bearer ', '');
  
  try {
    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check session in DynamoDB
    const session = await dynamodb.get({
      TableName: process.env.DYNAMODB_TABLE,
      Key: { PK: `SESSION#${token}`, SK: 'METADATA' }
    });
    
    if (!session.Item || new Date(session.Item.expiresAt) < new Date()) {
      throw new Error('Session expired');
    }
    
    // Generate IAM policy
    return {
      principalId: decoded.userId,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [{
          Action: 'execute-api:Invoke',
          Effect: 'Allow',
          Resource: event.methodArn
        }]
      },
      context: {
        userId: decoded.userId,
        role: decoded.role
      }
    };
  } catch (error) {
    throw new Error('Unauthorized');
  }
}
```

## Security & Compliance Design

### Data Encryption

**At Rest**:
- **DynamoDB**: Encryption enabled using AWS KMS
- **S3**: Server-side encryption (SSE-S3 or SSE-KMS)
- **Secrets Manager**: Automatic encryption of secrets

**In Transit**:
- **HTTPS Only**: All API Gateway endpoints enforce TLS 1.2+
- **CloudFront**: SSL/TLS certificates for frontend
- **Internal AWS**: Service-to-service communication encrypted by default

### IAM Roles and Policies

**Lambda Execution Roles** (Least Privilege):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": "arn:aws:bedrock:ap-south-1::foundation-model/anthropic.claude-3-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:UpdateItem"
      ],
      "Resource": "arn:aws:dynamodb:ap-south-1:*:table/carenav-patients"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::carenav-medical-reports/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "textract:DetectDocumentText"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:ap-south-1:*:*"
    }
  ]
}
```

### Disclaimer and Consent Management

**Mandatory Disclaimers** (displayed on every relevant screen):

1. **Registration Screen**: "DEMO DATA ONLY - Do not enter real medical information"
2. **Symptom Input**: "This system does not diagnose diseases or provide medical advice"
3. **Care Navigation**: "This is not a medical diagnosis. Consult a healthcare provider for professional medical advice."
4. **Emergency Urgency**: "CALL EMERGENCY SERVICES IMMEDIATELY - Dial 102 or 108"
5. **Treatment Schedule**: "Follow your doctor's instructions. Contact your doctor if you have questions."

**Consent Checkboxes**:
- User acknowledges system is for demonstration purposes only
- User confirms they will not enter real medical data
- User understands system does not replace medical professionals

### Logging and Monitoring

**CloudWatch Logs**:
- All Lambda function executions logged
- API Gateway access logs enabled
- Bedrock API call logs with request/response metadata
- Error logs with stack traces for debugging

**CloudWatch Metrics**:
- Lambda invocation count, duration, errors
- API Gateway 4xx and 5xx error rates
- DynamoDB read/write capacity utilization
- Bedrock API latency and throttling

**CloudWatch Alarms**:
- Lambda error rate > 5%
- API Gateway 5xx error rate > 1%
- DynamoDB throttling events
- Bedrock API throttling

## Scalability & Performance Design

### Serverless Auto-Scaling

**AWS Lambda**:
- Concurrent execution limit: 1000 (default, can be increased)
- Auto-scales based on incoming requests
- Cold start mitigation: Provisioned concurrency for critical functions (optional)

**DynamoDB**:
- On-demand billing mode for hackathon (auto-scales)
- No capacity planning required
- Scales to handle traffic spikes automatically

**API Gateway**:
- Default limit: 10,000 requests per second
- Throttling: 100 requests per minute per IP (configurable)

### Caching Strategy

**API Gateway Caching** (optional for production):
- Cache GET requests for treatment schedules (TTL: 5 minutes)
- Cache department recommendations for identical symptom patterns (TTL: 1 hour)

**Application-Level Caching**:
- Cache Bedrock responses for common queries in DynamoDB
- Reduce redundant AI API calls for similar symptoms

### Performance Optimization

**Lambda Optimization**:
- Use AWS SDK v3 for smaller bundle sizes
- Reuse AWS SDK clients across invocations
- Minimize cold starts with smaller deployment packages
- Use Lambda layers for shared dependencies

**DynamoDB Optimization**:
- Single-table design reduces cross-table queries
- Composite keys (PK, SK) enable efficient queries
- Global Secondary Index on email for user lookup

**Bedrock Optimization**:
- Use Claude 3 Haiku for development (faster, cheaper)
- Use Claude 3 Sonnet for production (higher quality)
- Implement request batching where possible
- Set appropriate max_tokens limits to reduce latency

### Bharat Context Scalability

**Regional Deployment**:
- Primary: AWS Mumbai (ap-south-1) for lowest latency to Indian users
- Fallback: AWS Singapore (ap-southeast-1) if Mumbai unavailable

**Multilingual Extension** (Future):
- Prompt templates stored in DynamoDB with language key
- Frontend language selector triggers appropriate prompt retrieval
- Bedrock supports Hindi, Tamil, Telugu, Bengali with appropriate prompts

**Tier-2/Tier-3 Hospital Deployment**:
- Lightweight frontend (< 2MB bundle size)
- Works on 3G/4G connections
- Progressive Web App (PWA) for offline capability (future)
- Minimal infrastructure requirements (cloud-only)

**Cost Optimization for Scale**:
- DynamoDB on-demand billing (pay per request)
- Lambda pay-per-invocation (no idle costs)
- S3 lifecycle policy: Delete demo data after 30 days
- Bedrock API call optimization through caching

## Deployment Architecture

### Infrastructure as Code (AWS CDK)

**Stack Structure**:
```
carenav-stack/
├── lib/
│   ├── api-stack.ts          # API Gateway + Lambda functions
│   ├── data-stack.ts          # DynamoDB tables
│   ├── storage-stack.ts       # S3 buckets
│   ├── ai-stack.ts            # Bedrock configuration
│   ├── auth-stack.ts          # Cognito or custom auth
│   └── monitoring-stack.ts    # CloudWatch alarms
├── lambda/
│   ├── symptom-processor/
│   ├── care-navigation/
│   ├── report-processor/
│   ├── treatment-planner/
│   ├── reminder-processor/
│   └── auth-handler/
├── frontend/
│   └── (React application)
└── cdk.json
```

**Deployment Commands**:
```bash
# Install dependencies
npm install

# Bootstrap CDK (first time only)
cdk bootstrap aws://ACCOUNT-ID/ap-south-1

# Deploy all stacks
cdk deploy --all

# Deploy specific stack
cdk deploy CareNavApiStack

# Destroy all resources (after hackathon)
cdk destroy --all
```

### Environment Configuration

**Environment Variables** (stored in AWS Secrets Manager):
```json
{
  "BEDROCK_MODEL_ID": "anthropic.claude-3-sonnet-20240229-v1:0",
  "DYNAMODB_TABLE": "carenav-patients",
  "REPORTS_BUCKET": "carenav-medical-reports-prod",
  "TRANSCRIBE_BUCKET": "carenav-transcribe-temp",
  "JWT_SECRET": "generated-secret-key",
  "REMINDER_LAMBDA_ARN": "arn:aws:lambda:ap-south-1:*:function:carenav-reminder",
  "AWS_REGION": "ap-south-1"
}
```

### Frontend Deployment

**AWS Amplify Hosting**:
```yaml
# amplify.yml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

**Alternative: S3 + CloudFront**:
```bash
# Build frontend
npm run build

# Upload to S3
aws s3 sync dist/ s3://carenav-frontend-prod --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id DISTID --paths "/*"
```

### CI/CD Pipeline (Optional)

**GitHub Actions Workflow**:
```yaml
name: Deploy CareNav AI

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm install
      - name: Run tests
        run: npm test
      - name: Deploy CDK
        run: |
          npm install -g aws-cdk
          cdk deploy --all --require-approval never
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: ap-south-1
```

## Hackathon Development Plan

### Phase 1: Core Infrastructure (4 hours)
- Set up AWS account and IAM roles
- Deploy DynamoDB table with single-table design
- Create S3 bucket for medical reports
- Set up API Gateway with basic endpoints
- Deploy Lambda functions (empty handlers)

### Phase 2: AI Integration (6 hours)
- Implement Bedrock integration for symptom extraction
- Develop and test prompt templates
- Implement follow-up question generation
- Implement department recommendation logic
- Add error handling and retry logic

### Phase 3: Frontend Development (8 hours)
- Create React application structure
- Implement patient registration and login
- Build symptom input interface (text only, voice optional)
- Build care navigation display
- Build treatment schedule display
- Implement basic styling with Tailwind CSS

### Phase 4: Treatment Planner (4 hours)
- Implement doctor prescription input
- Integrate Bedrock for schedule generation
- Create EventBridge rules for reminders
- Implement dose tracking functionality

### Phase 5: Report Upload (3 hours)
- Implement file upload to S3
- Integrate Textract for OCR (or placeholder)
- Implement report summarization
- Display medical timeline

### Phase 6: Testing & Demo Prep (3 hours)
- Create synthetic demo data
- Test all user flows end-to-end
- Add disclaimers to all screens
- Prepare demo script
- Record demo video

### Total: 28 hours (fits within 48-hour hackathon with buffer)

### Minimum Viable Product (MVP) Features

**Must Have**:
1. Patient registration
2. Text-based symptom input
3. AI symptom extraction
4. Department recommendation with disclaimer
5. Doctor treatment plan creation
6. Patient treatment schedule display
7. Basic authentication

**Nice to Have** (if time permits):
1. Voice input via Transcribe
2. Medical report upload with OCR
3. EventBridge automated reminders
4. Adherence tracking dashboard
5. Red flag highlighting

**Future Enhancements** (post-hackathon):
1. Multilingual support (Hindi, Tamil, Telugu, Bengali)
2. Push notifications for reminders
3. Integration with hospital EMR systems
4. Telemedicine video consultation
5. Pharmacy integration
6. Mobile app (React Native)

## Testing Strategy

### Unit Testing
- Test Lambda function handlers with mock AWS SDK calls
- Test Bedrock prompt generation logic
- Test date calculation functions (stop date, adherence)
- Test JWT token generation and validation

### Integration Testing
- Test API Gateway → Lambda → DynamoDB flow
- Test S3 → Textract → Bedrock pipeline
- Test EventBridge → Lambda reminder flow
- Test authentication and authorization

### End-to-End Testing
- Patient symptom submission flow
- Care navigation flow
- Treatment plan creation and schedule display
- Report upload and summarization

### Demo Data
```javascript
// Sample patient
{
  patientId: "demo-patient-001",
  name: "Rajesh Kumar",
  age: 45,
  gender: "Male",
  contact: "+91-9876543210"
}

// Sample symptom
{
  symptomText: "I have been experiencing chest discomfort for the past 3 days. It feels like pressure and gets worse when I walk or climb stairs. I also feel short of breath and sometimes sweaty.",
  structuredSymptoms: {
    bodyPart: "chest",
    duration: "3 days",
    severity: "moderate",
    associatedFactors: ["shortness of breath", "sweating", "worse with exertion"],
    timing: "worse with physical activity",
    character: "pressure-like discomfort"
  }
}

// Sample department recommendation
{
  department: "Cardiology",
  urgency: "urgent",
  reasoning: "Chest discomfort with associated shortness of breath and sweating, worse with exertion, suggests cardiovascular system involvement requiring specialist evaluation within 24-48 hours"
}

// Sample prescription
{
  medicineName: "Aspirin",
  dosage: "75mg",
  frequency: "once daily",
  duration: "30 days",
  specialInstructions: "Take after breakfast"
}
```

## Conclusion

CareNav AI is designed as a technically feasible, AWS-native healthcare workflow assistant for the AI for Bharat Hackathon. The architecture prioritizes:

- **Serverless scalability** for Indian healthcare context
- **Responsible AI** with clear boundaries against diagnosis/prescription
- **Rapid development** using managed AWS services
- **Cost efficiency** through pay-per-use pricing
- **Future extensibility** for multilingual support and additional features

The system demonstrates practical AI application in healthcare while maintaining strict ethical boundaries and technical feasibility within hackathon constraints.

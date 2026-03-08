# CareNav AI - AWS Architecture Diagram

## Visual Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USERS LAYER                                     │
│  ┌──────────────────┐                        ┌──────────────────┐          │
│  │     Patients     │                        │     Doctors      │          │
│  │   (Web Browser)  │                        │  (Web Browser)   │          │
│  └────────┬─────────┘                        └────────┬─────────┘          │
└───────────┼──────────────────────────────────────────┼────────────────────┘
            │                                            │
            └────────────────────┬──────────────────────┘
                                 │ HTTPS
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND LAYER                                     │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                    AWS Amplify / S3 + CloudFront                       │ │
│  │                         React Web Application                          │ │
│  │  • Patient Interface  • Doctor Interface  • Authentication UI          │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                 │ REST API
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY LAYER                                    │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                      Amazon API Gateway                                │ │
│  │  • JWT Authorization  • Rate Limiting  • CORS  • Request Validation   │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
                    ▼            ▼            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SERVERLESS COMPUTE LAYER                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Symptom    │  │     Care     │  │  Treatment   │  │    Report    │  │
│  │  Processor   │  │  Navigation  │  │   Planner    │  │  Processor   │  │
│  │   Lambda     │  │    Lambda    │  │    Lambda    │  │    Lambda    │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                  │                  │                  │          │
│  ┌──────────────┐  ┌──────────────┐                                        │
│  │     Auth     │  │   Reminder   │                                        │
│  │   Handler    │  │  Processor   │◄───────────────┐                      │
│  │   Lambda     │  │    Lambda    │                │                      │
│  └──────┬───────┘  └──────┬───────┘                │                      │
└─────────┼──────────────────┼────────────────────────┼──────────────────────┘
          │                  │                        │
          │                  │                        │
          ▼                  ▼                        │
┌─────────────────────────────────────────────────────────────────────────────┐
│                          AI/ML SERVICES LAYER                                │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                        Amazon Bedrock (Claude 3)                       │ │
│  │  • Symptom Extraction  • Follow-up Questions  • Dept Recommendations  │ │
│  │  • Report Summarization  • Treatment Schedule Generation              │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌──────────────────────┐              ┌──────────────────────┐           │
│  │  Amazon Transcribe   │              │   Amazon Textract    │           │
│  │  (Voice-to-Text)     │              │   (OCR Processing)   │           │
│  └──────────────────────┘              └──────────────────────┘           │
└─────────────────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
                    ▼            ▼            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       DATA & STORAGE LAYER                                   │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                         Amazon DynamoDB                                │ │
│  │  • Patients  • Symptoms  • Treatments  • Sessions  • Dose Records     │ │
│  │  • Care Navigation  • Reports Metadata  • Medical Timeline            │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌──────────────────────┐              ┌──────────────────────┐           │
│  │     Amazon S3        │              │  Amazon EventBridge  │           │
│  │  (Medical Reports)   │              │ (Medication Reminders│           │
│  │  • Encrypted at Rest │              │  Scheduled Rules)    │───────────┘
│  └──────────────────────┘              └──────────────────────┘
└─────────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SECURITY & MONITORING LAYER                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   AWS IAM    │  │  CloudWatch  │  │   Secrets    │  │   AWS KMS    │  │
│  │  • Roles     │  │  • Logs      │  │   Manager    │  │ (Encryption) │  │
│  │  • Policies  │  │  • Metrics   │  │  • JWT Keys  │  │              │  │
│  │  • Least     │  │  • Alarms    │  │  • API Keys  │  │              │  │
│  │  Privilege   │  │              │  │              │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Key Data Flows

### Flow 1: Patient Symptom Intake
```
Patient → Amplify → API Gateway → Symptom Lambda → Bedrock (extraction)
                                                  → Transcribe (if voice)
                                                  → DynamoDB (store)
                                                  → Bedrock (follow-up questions)
```

### Flow 2: Care Navigation
```
Symptom Data → API Gateway → Navigation Lambda → Bedrock (dept recommendation)
                                                → DynamoDB (store)
                                                → Frontend (display with disclaimer)
```

### Flow 3: Medical Report Processing
```
Patient Upload → API Gateway → Report Lambda → S3 (store encrypted)
                                             → Textract (OCR)
                                             → Bedrock (summarize)
                                             → DynamoDB (timeline + red flags)
```

### Flow 4: Treatment Plan & Reminders
```
Doctor Prescription → API Gateway → Treatment Lambda → Bedrock (schedule generation)
                                                     → DynamoDB (store plan)
                                                     → EventBridge (create rules)

EventBridge (scheduled) → Reminder Lambda → DynamoDB (mark dose as due)
                                          → Frontend (notification)
```

### Flow 5: Medication Adherence Tracking
```
Patient marks taken → API Gateway → Treatment Lambda → DynamoDB (update status)

Doctor views dashboard → API Gateway → Treatment Lambda → DynamoDB (query records)
                                                        → Calculate adherence %
                                                        → Frontend (display metrics)
```

## AWS Services Summary

| Service | Purpose | Key Features |
|---------|---------|--------------|
| **AWS Amplify** | Frontend hosting | CI/CD, HTTPS, CDN |
| **API Gateway** | API management | Auth, rate limiting, CORS |
| **Lambda** | Serverless compute | Auto-scaling, pay-per-use |
| **Bedrock** | AI/ML processing | Claude 3 for NLP tasks |
| **Transcribe** | Speech-to-text | Voice symptom input |
| **Textract** | OCR | Medical report extraction |
| **DynamoDB** | NoSQL database | Single-table design, fast queries |
| **S3** | Object storage | Encrypted medical reports |
| **EventBridge** | Event scheduling | Medication reminders |
| **IAM** | Access control | Role-based permissions |
| **Secrets Manager** | Credential storage | JWT keys, API credentials |
| **CloudWatch** | Monitoring | Logs, metrics, alarms |
| **KMS** | Encryption | Data at rest encryption |

## Deployment Region
- **Primary**: AWS Mumbai (ap-south-1) - Optimized for Indian users
- **Fallback**: AWS Singapore (ap-southeast-1)

## Architecture Principles
1. **Serverless-First**: No server management, automatic scaling
2. **Event-Driven**: EventBridge for scheduled reminders
3. **Secure by Default**: Encryption at rest and in transit
4. **Cost-Optimized**: Pay-per-use, on-demand billing
5. **Modular Design**: Independent Lambda functions
6. **AI-Powered**: Bedrock for all NLP tasks
7. **Scalable**: Handles 100+ concurrent users
8. **Monitored**: CloudWatch for observability

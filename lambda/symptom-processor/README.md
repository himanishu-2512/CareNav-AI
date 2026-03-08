# Symptom Processor Lambda Function

## Overview

The Symptom Processor Lambda function handles patient symptom input, AI-powered extraction of structured symptom data, and generation of follow-up clarification questions. This is a core component of the CareNav AI system that enables patients to describe their symptoms in natural language.

## Features

- **Text Input Processing**: Accepts symptom descriptions up to 2000 characters
- **Voice Input Support**: Optional integration with Amazon Transcribe for voice-to-text conversion
- **AI-Powered Extraction**: Uses Amazon Bedrock (Claude 3) to extract structured symptom data
- **Follow-Up Questions**: Automatically generates 3-5 clarifying questions based on initial symptoms
- **Answer Management**: Stores patient responses to follow-up questions

## API Endpoints

### POST /api/symptoms/input

Submit patient symptoms and receive structured extraction with follow-up questions.

**Request Body:**
```json
{
  "patientId": "uuid",
  "symptomText": "I have been experiencing chest pain for 3 days...",
  "inputMethod": "text",  // or "voice"
  "audioData": "base64-encoded-audio"  // required if inputMethod is "voice"
}
```

**Response:**
```json
{
  "symptomId": "uuid",
  "structuredSymptoms": {
    "bodyPart": "chest",
    "duration": "3 days",
    "severity": "moderate",
    "associatedFactors": ["shortness of breath", "sweating"],
    "timing": "worse with exertion",
    "character": "pressure-like discomfort"
  },
  "followUpQuestions": [
    {
      "questionId": "q1",
      "questionText": "Did the chest discomfort start suddenly or gradually?",
      "questionType": "text"
    },
    {
      "questionId": "q2",
      "questionText": "Have you experienced this type of discomfort before?",
      "questionType": "text"
    }
  ]
}
```

### POST /api/symptoms/followup/answer

Submit answers to follow-up questions.

**Request Body:**
```json
{
  "patientId": "uuid",
  "symptomId": "uuid",
  "answers": [
    {
      "questionId": "q1",
      "answer": "It started gradually over the past few days"
    },
    {
      "questionId": "q2",
      "answer": "No, this is the first time"
    }
  ]
}
```

**Response:**
```json
{
  "symptomId": "uuid",
  "structuredSymptoms": { ... },
  "followUpAnswers": [
    {
      "questionId": "q1",
      "answer": "It started gradually over the past few days"
    }
  ]
}
```

## Implementation Details

### Symptom Extraction Process

1. **Input Validation**: Validates required fields and text length
2. **Voice Transcription** (optional): Converts audio to text using Amazon Transcribe
3. **AI Extraction**: Sends text to Amazon Bedrock with structured prompt
4. **Data Storage**: Stores raw text and structured data in DynamoDB
5. **Follow-Up Generation**: Generates clarifying questions using Bedrock
6. **Response**: Returns structured symptoms and questions to frontend

### Data Model

Symptoms are stored in DynamoDB with the following structure:

```typescript
{
  PK: "PATIENT#{patientId}",
  SK: "SYMPTOM#{symptomId}",
  symptomId: string,
  patientId: string,
  rawText: string,
  structuredSymptoms: {
    bodyPart: string,
    duration: string,
    severity: "mild" | "moderate" | "severe",
    associatedFactors: string[],
    timing?: string,
    character?: string
  },
  followUpAnswers?: Array<{
    questionId: string,
    answer: string
  }>,
  inputMethod: "text" | "voice",
  createdAt: string
}
```

### AI Prompts

The function uses carefully crafted prompts to ensure:
- No disease diagnosis or medical advice
- Structured JSON output
- Patient-friendly language
- Focus on symptom patterns, not diseases

See `lambda/shared/bedrock-prompts.ts` for full prompt templates.

## Error Handling

- **400 Bad Request**: Missing required fields or invalid input
- **404 Not Found**: Symptom record not found
- **500 Internal Server Error**: Unexpected errors
- **503 Service Unavailable**: Bedrock API temporarily unavailable

## Environment Variables

- `DYNAMODB_TABLE`: DynamoDB table name for patient data
- `AWS_REGION`: AWS region (default: ap-south-1)
- `TRANSCRIBE_BUCKET`: S3 bucket for temporary audio storage (optional)

## Dependencies

- `@aws-sdk/client-bedrock-runtime`: Amazon Bedrock API
- `@aws-sdk/lib-dynamodb`: DynamoDB operations
- `@aws-sdk/client-transcribe`: Voice transcription (optional)
- `@aws-sdk/client-s3`: Audio file storage (optional)
- `uuid`: Generate unique IDs

## Testing

To test the symptom processor:

1. **Create a test patient** using the patient registration endpoint
2. **Submit symptoms** via POST /api/symptoms/input
3. **Verify structured extraction** in the response
4. **Answer follow-up questions** via POST /api/symptoms/followup/answer
5. **Check DynamoDB** to verify data storage

Example test symptom:
```
"I have been experiencing severe headaches for the past week. The pain is throbbing and located on the right side of my head. It gets worse in bright light and I sometimes feel nauseous."
```

## Requirements Satisfied

This implementation satisfies the following requirements from the CareNav AI specification:

- **Requirement 2.1**: Text and voice input options
- **Requirement 2.2**: Accept input of at least 2000 characters
- **Requirement 2.3**: Voice-to-text conversion using Amazon Transcribe
- **Requirement 2.4**: Send text to Amazon Bedrock within 5 seconds
- **Requirement 2.5**: Extract structured symptom data
- **Requirement 2.6**: Display symptom summary for confirmation
- **Requirement 12.1**: Store data in DynamoDB with encryption

## Next Steps

After symptom processing, the data flows to:
1. **Care Navigation Module** (Task 8): Generates department recommendations
2. **Doctor Interface**: Displays structured patient symptoms with red flags
3. **Medical Timeline**: Integrates with uploaded medical reports

## Notes

- Voice input is optional and requires TRANSCRIBE_BUCKET environment variable
- The function includes retry logic for Bedrock API calls (3 attempts with exponential backoff)
- All AI responses are validated against expected JSON schemas
- The system does NOT diagnose diseases or provide medical advice

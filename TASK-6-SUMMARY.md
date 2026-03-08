# Task 6 Implementation Summary: Symptom Input and Extraction Module

## Overview

Successfully implemented the symptom input and extraction module for CareNav AI, enabling patients to describe their symptoms in natural language and receive AI-powered structured extraction with follow-up clarification questions.

## Completed Subtasks

### ✅ 6.1 Create Symptom Data Model and DynamoDB Operations

**File Created:** `lambda/shared/symptom-db.ts`

Implemented comprehensive DynamoDB operations for symptom management:
- `createSymptom()`: Store new symptom records with structured data
- `getSymptom()`: Retrieve symptom by patient ID and symptom ID
- `updateSymptomWithAnswers()`: Update symptom with follow-up answers

**Data Model:**
- Uses composite keys (PK: `PATIENT#{patientId}`, SK: `SYMPTOM#{symptomId}`)
- Stores raw text, structured symptoms, follow-up answers, and metadata
- Supports both text and voice input methods

### ✅ 6.2 Create Symptom Processor Lambda Function

**File Updated:** `lambda/symptom-processor/index.ts`

Implemented two main endpoints:

1. **POST /api/symptoms/input**
   - Accepts symptom text (up to 2000 characters)
   - Validates required fields (patientId, symptomText)
   - Calls Amazon Bedrock for structured extraction
   - Generates 3-5 follow-up clarification questions
   - Stores data in DynamoDB
   - Returns structured symptoms and questions

2. **POST /api/symptoms/followup/answer**
   - Accepts answers to follow-up questions
   - Updates symptom record in DynamoDB
   - Returns updated symptom data

**Key Features:**
- Input validation with clear error messages
- AI-powered extraction using Bedrock Claude 3
- Automatic follow-up question generation
- Comprehensive error handling
- Bedrock retry logic (3 attempts with exponential backoff)
- User-friendly error messages for AI service failures

### ✅ 6.3 Add Amazon Transcribe Integration for Voice Input (Optional)

**File Created:** `lambda/shared/transcribe-client.ts`

Implemented voice-to-text conversion support:
- `transcribeVoiceToText()`: Convert audio to text using Amazon Transcribe
- `uploadAudioToS3()`: Store audio files temporarily in S3
- `startTranscriptionJob()`: Initiate Transcribe job
- `waitForTranscription()`: Poll for completion with timeout
- `isVoiceInputEnabled()`: Check if voice input is configured

**Features:**
- Supports English (India) language code
- Handles base64-encoded audio data
- Automatic S3 upload and cleanup
- Polling mechanism with 30-second timeout
- Graceful fallback to text input if voice fails

**Integration:**
- Updated symptom processor to handle voice input
- Checks for `inputMethod: "voice"` in request
- Transcribes audio before AI extraction
- Provides clear error messages if voice input unavailable

## Infrastructure Updates

**File Updated:** `lib/api-stack.ts`

- Created dedicated Symptom Processor Lambda function
- Configured Lambda with proper IAM permissions:
  - DynamoDB read/write access
  - Bedrock InvokeModel permission
  - Transcribe job permissions
  - S3 bucket access for audio files
- Integrated symptom endpoints with API Gateway:
  - `/api/symptoms/input` → Symptom Lambda
  - `/api/symptoms/followup/answer` → Symptom Lambda
- Added JWT authorization for protected endpoints
- Configured CloudWatch logging

## AI Integration

**Existing Files Used:**
- `lambda/shared/bedrock-client.ts`: Bedrock API wrapper with retry logic
- `lambda/shared/bedrock-prompts.ts`: Structured prompts for symptom extraction and follow-up generation

**Prompt Design:**
- Symptom extraction prompt: Extracts bodyPart, duration, severity, associatedFactors, timing, character
- Follow-up generation prompt: Creates 3-5 clarifying questions
- Both prompts explicitly avoid disease diagnosis
- Structured JSON output with validation

## Data Flow

```
1. Patient submits symptoms (text or voice)
   ↓
2. [If voice] Transcribe audio to text via Amazon Transcribe
   ↓
3. Validate input (length, required fields)
   ↓
4. Send to Amazon Bedrock for structured extraction
   ↓
5. Store symptom in DynamoDB
   ↓
6. Generate follow-up questions via Bedrock
   ↓
7. Return structured symptoms + questions to frontend
   ↓
8. Patient answers follow-up questions
   ↓
9. Update symptom record with answers
```

## Requirements Satisfied

✅ **Requirement 2.1**: Text and voice input options provided  
✅ **Requirement 2.2**: Accepts input up to 2000 characters  
✅ **Requirement 2.3**: Amazon Transcribe integration for voice input  
✅ **Requirement 2.4**: Bedrock processing within 5 seconds (with timeout)  
✅ **Requirement 2.5**: Structured symptom extraction (bodyPart, duration, severity, etc.)  
✅ **Requirement 2.6**: Returns symptom summary for patient confirmation  
✅ **Requirement 12.1**: Data stored in DynamoDB with encryption  

## Testing Recommendations

### Manual Testing

1. **Test Text Input:**
   ```bash
   curl -X POST https://api-url/api/symptoms/input \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
       "patientId": "test-patient-id",
       "symptomText": "I have severe headaches for 5 days with nausea",
       "inputMethod": "text"
     }'
   ```

2. **Test Follow-Up Answers:**
   ```bash
   curl -X POST https://api-url/api/symptoms/followup/answer \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
       "patientId": "test-patient-id",
       "symptomId": "symptom-uuid",
       "answers": [
         {"questionId": "q1", "answer": "Started suddenly"},
         {"questionId": "q2", "answer": "No previous episodes"}
       ]
     }'
   ```

3. **Test Voice Input** (if TRANSCRIBE_BUCKET configured):
   ```bash
   curl -X POST https://api-url/api/symptoms/input \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
       "patientId": "test-patient-id",
       "symptomText": "",
       "inputMethod": "voice",
       "audioData": "<base64-encoded-wav-file>"
     }'
   ```

### Expected Outputs

**Structured Symptoms Example:**
```json
{
  "bodyPart": "head",
  "duration": "5 days",
  "severity": "severe",
  "associatedFactors": ["nausea"],
  "timing": "not specified",
  "character": "not specified"
}
```

**Follow-Up Questions Example:**
```json
[
  {
    "questionId": "q1",
    "questionText": "Did the headache start suddenly or gradually?",
    "questionType": "text"
  },
  {
    "questionId": "q2",
    "questionText": "Where exactly is the pain located?",
    "questionType": "text"
  },
  {
    "questionId": "q3",
    "questionText": "Does anything make the headache better or worse?",
    "questionType": "text"
  }
]
```

## Error Handling

Implemented comprehensive error handling:
- **400 Bad Request**: Missing fields, invalid input, text too long
- **404 Not Found**: Symptom record not found
- **500 Internal Server Error**: Unexpected errors
- **503 Service Unavailable**: Bedrock API temporarily unavailable

User-friendly error messages:
- "AI service temporarily unavailable. Please try again in a few minutes."
- "Voice input is not currently enabled. Please use text input."
- "Symptom text exceeds maximum length of 2000 characters"

## Files Created/Modified

### Created:
1. `lambda/shared/symptom-db.ts` - DynamoDB operations for symptoms
2. `lambda/shared/transcribe-client.ts` - Amazon Transcribe integration
3. `lambda/symptom-processor/README.md` - Documentation
4. `TASK-6-SUMMARY.md` - This summary

### Modified:
1. `lambda/symptom-processor/index.ts` - Full implementation
2. `lib/api-stack.ts` - Added Symptom Lambda and routes

### Existing (Used):
1. `lambda/shared/types.ts` - Symptom data types
2. `lambda/shared/bedrock-client.ts` - Bedrock API wrapper
3. `lambda/shared/bedrock-prompts.ts` - AI prompts
4. `lambda/shared/dynamodb-client.ts` - DynamoDB client
5. `lambda/shared/response.ts` - API response utilities

## Next Steps

The symptom data is now ready to be consumed by:

1. **Task 7**: AI Follow-Up Clarification Module (partially implemented)
2. **Task 8**: Care Navigation Module - Generate department recommendations
3. **Task 11**: Red Flag Highlighting - Scan symptoms for critical information
4. **Task 18**: Frontend Symptom Input Component

## Notes

- Voice input requires `TRANSCRIBE_BUCKET` environment variable to be configured
- All AI processing includes retry logic and timeout handling
- The system explicitly avoids disease diagnosis per requirements
- Structured prompts ensure consistent JSON output from Bedrock
- Data is encrypted at rest in DynamoDB (AWS KMS)
- CloudWatch logging enabled for debugging and monitoring

## Deployment

To deploy the updated symptom processor:

```bash
# Install dependencies
cd lambda
npm install

# Deploy infrastructure
cd ..
cdk deploy ApiStack

# Verify deployment
aws lambda list-functions --query 'Functions[?contains(FunctionName, `Symptom`)].FunctionName'
```

## Conclusion

Task 6 is complete with all subtasks implemented. The symptom input and extraction module is fully functional and ready for integration with the care navigation module (Task 8) and frontend components (Task 18).

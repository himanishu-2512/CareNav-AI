# Iterative Diagnosis Lambda

This Lambda function handles the AI-powered iterative diagnosis feature, which analyzes patient symptoms to identify possible diseases and generates progressively targeted questions to narrow down the diagnosis.

## Endpoints

### POST /api/diagnosis/start
Start a new iterative diagnosis session.

**Request Body:**
```json
{
  "patientId": "string",
  "symptoms": {
    "bodyPart": "string",
    "duration": "string",
    "severity": "mild" | "moderate" | "severe",
    "associatedFactors": ["string"],
    "timing": "string (optional)",
    "character": "string (optional)"
  }
}
```

**Response (200):**
```json
{
  "sessionId": "string",
  "currentRound": 1,
  "questions": [
    {
      "questionId": "string",
      "questionText": "string",
      "questionType": "yes_no" | "text" | "multiple_choice" | "scale",
      "importance": "high" | "medium" | "low",
      "options": ["string"] // only for multiple_choice
    }
  ],
  "status": "active",
  "message": "string"
}
```

**Error Responses:**
- 400: Missing required fields or invalid data
- 404: Patient not found
- 500: Internal server error
- 503: AI service unavailable

### POST /api/diagnosis/continue
Continue an existing diagnosis session with answers.

**Request Body:**
```json
{
  "sessionId": "string",
  "answers": [
    {
      "questionId": "string",
      "answer": "string",
      "timestamp": "string (ISO 8601)"
    }
  ]
}
```

**Response (200) - Session Continuing:**
```json
{
  "sessionId": "string",
  "currentRound": 2,
  "confidenceScore": 0.65,
  "questions": [
    {
      "questionId": "string",
      "questionText": "string",
      "questionType": "yes_no" | "text" | "multiple_choice" | "scale",
      "importance": "high" | "medium" | "low"
    }
  ],
  "status": "active",
  "message": "string"
}
```

**Response (200) - Session Completed:**
```json
{
  "sessionId": "string",
  "currentRound": 4,
  "confidenceScore": 0.85,
  "status": "completed",
  "message": "Thank you. Your information has been recorded for your doctor."
}
```

**Error Responses:**
- 400: Missing required fields or invalid data
- 404: Session not found
- 409: Session already completed
- 500: Internal server error
- 503: AI service unavailable

## Features

### Disease Name Isolation
- Questions shown to patients never contain disease names
- All disease information is stored for doctor access only
- Maintains patient privacy and prevents self-diagnosis anxiety

### Iterative Refinement
- Starts with 5-10 possible disease candidates
- Generates 3-5 targeted questions per round
- Refines disease probabilities based on answers
- Continues until confidence >= 0.8 or 5 rounds completed

### Error Handling
- Graceful handling of AI service unavailability
- Retry logic with exponential backoff for Bedrock calls
- User-friendly error messages
- Proper HTTP status codes (200, 400, 404, 409, 500, 503)

## Implementation Status

### Task 4.1 - COMPLETED ✓
- Lambda handler with API Gateway event parsing
- Routing for /diagnosis/start and /diagnosis/continue endpoints
- Error handling and response formatting
- Proper HTTP status codes

### Task 4.2 - TODO
- Implement startDiagnosisSession function
- Bedrock integration for disease analysis
- DynamoDB session storage
- Question generation and filtering

### Task 4.3 - TODO
- Implement continueDiagnosisSession function
- Session retrieval and validation
- Disease refinement logic
- Confidence score calculation
- Termination condition checking

## Requirements Validated

- **Requirement 1.1**: Diagnosis session creation with initial symptoms
- **Requirement 13.1**: API response format for start endpoint
- **Requirement 13.2**: API response format for continue endpoint

## Next Steps

1. Implement startDiagnosisSession function (Task 4.2)
2. Implement continueDiagnosisSession function (Task 4.3)
3. Add unit tests (Task 4.6)
4. Add property-based tests (Tasks 4.4, 4.5)

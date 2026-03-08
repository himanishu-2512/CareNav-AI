# Care Navigation Lambda Function

## Overview

The Care Navigation Lambda function provides non-diagnostic department recommendations based on patient symptom patterns. It analyzes structured symptoms and follow-up answers to suggest the most appropriate medical department for initial evaluation.

**Critical Boundaries:**
- Does NOT diagnose diseases
- Does NOT name specific medical conditions
- Focuses on symptom patterns and affected body systems
- Always includes mandatory disclaimers

## Requirements Implemented

- **4.1**: Generate department recommendation using Amazon Bedrock
- **4.2**: Classify urgency level (routine, urgent, emergency)
- **4.3**: Display mandatory disclaimer on all outputs
- **4.4**: Ensure no disease names appear in recommendations
- **4.5**: Display emergency services message for emergency urgency
- **4.6**: Store navigation recommendation in DynamoDB

## API Endpoint

**POST** `/api/navigation/recommend`

### Request

```json
{
  "patientId": "string (required)",
  "symptomId": "string (required)"
}
```

### Response

```json
{
  "navigationId": "uuid",
  "recommendedDepartment": "string",
  "urgencyLevel": "routine | urgent | emergency",
  "reasoning": "string (based on symptom patterns, not disease names)",
  "disclaimer": "This is not a medical diagnosis. Please consult a healthcare provider for professional medical advice.",
  "emergencyMessage": "CALL EMERGENCY SERVICES IMMEDIATELY - Dial 102 or 108 (only if urgency is emergency)"
}
```

### Error Responses

- **400**: Missing required fields (patientId or symptomId)
- **404**: Symptom not found
- **500**: Internal server error
- **503**: AI service temporarily unavailable

## Available Departments

The system recommends one of the following departments:

- **General Medicine**: Internal medicine, general health concerns
- **Cardiology**: Heart and circulation related symptoms
- **Neurology**: Brain, nerves, headaches, dizziness
- **Orthopedics**: Bones, joints, muscles, injuries
- **Gastroenterology**: Digestive system, abdominal symptoms
- **Dermatology**: Skin, hair, nails
- **ENT**: Ear, nose, throat, hearing, voice
- **Pulmonology**: Lungs, breathing, cough
- **Endocrinology**: Hormones, thyroid, diabetes management
- **Emergency Medicine**: Life-threatening symptoms

## Urgency Classification

### Routine
- Can wait for scheduled appointment
- Non-urgent symptoms
- Stable condition

### Urgent
- Should be seen within 24-48 hours
- Concerning symptoms requiring prompt evaluation
- Not immediately life-threatening

### Emergency
- Needs immediate medical attention
- Life-threatening symptoms
- Displays emergency services message: "CALL EMERGENCY SERVICES IMMEDIATELY - Dial 102 or 108"

## AI Integration

The function uses Amazon Bedrock (Claude 3 Sonnet) with structured prompts to:

1. Analyze symptom patterns
2. Consider affected body systems
3. Evaluate timing and severity
4. Recommend appropriate department
5. Classify urgency level
6. Generate reasoning without disease names

## Data Flow

1. Retrieve symptom data from DynamoDB using `patientId` and `symptomId`
2. Extract structured symptoms and follow-up answers
3. Generate department recommendation prompt
4. Call Amazon Bedrock Converse API
5. Parse and validate JSON response
6. Validate urgency level
7. Add mandatory disclaimer
8. Add emergency message if needed
9. Store navigation recommendation in DynamoDB
10. Return recommendation to client

## DynamoDB Schema

### Navigation Record

```typescript
{
  PK: "PATIENT#{patientId}",
  SK: "NAVIGATION#{navigationId}",
  navigationId: string,
  patientId: string,
  symptomId: string,
  recommendedDepartment: string,
  urgencyLevel: "routine" | "urgent" | "emergency",
  reasoning: string,
  disclaimer: string,
  emergencyMessage?: string,
  createdAt: string (ISO 8601)
}
```

## Environment Variables

- `DYNAMODB_TABLE`: DynamoDB table name
- `AWS_REGION`: AWS region (default: ap-south-1)
- `BEDROCK_MODEL_ID`: Bedrock model ID (set via Secrets Manager)

## Error Handling

- **Bedrock API failures**: Retry with exponential backoff (3 attempts)
- **Timeout**: 5 seconds for Bedrock API calls
- **Invalid response**: Validates required fields (department, urgency, reasoning)
- **User-friendly errors**: Returns appropriate error messages without technical details

## Disclaimers

### Mandatory Disclaimer (Always Displayed)
"This is not a medical diagnosis. Please consult a healthcare provider for professional medical advice."

### Emergency Message (Emergency Urgency Only)
"CALL EMERGENCY SERVICES IMMEDIATELY - Dial 102 or 108"

## Testing

### Example Request

```bash
curl -X POST https://api-url/api/navigation/recommend \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient-123",
    "symptomId": "symptom-456"
  }'
```

### Example Response (Urgent Case)

```json
{
  "navigationId": "nav-789",
  "recommendedDepartment": "Cardiology",
  "urgencyLevel": "urgent",
  "reasoning": "Chest discomfort with associated shortness of breath and sweating, worse with exertion, suggests cardiovascular system involvement requiring specialist evaluation within 24-48 hours",
  "disclaimer": "This is not a medical diagnosis. Please consult a healthcare provider for professional medical advice."
}
```

### Example Response (Emergency Case)

```json
{
  "navigationId": "nav-101",
  "recommendedDepartment": "Emergency Medicine",
  "urgencyLevel": "emergency",
  "reasoning": "Severe chest pain with radiation to arm, profuse sweating, and difficulty breathing indicates critical cardiovascular symptoms requiring immediate emergency evaluation",
  "disclaimer": "This is not a medical diagnosis. Please consult a healthcare provider for professional medical advice.",
  "emergencyMessage": "CALL EMERGENCY SERVICES IMMEDIATELY - Dial 102 or 108"
}
```

## Logging

The function logs:
- Patient and symptom IDs being processed
- Retrieved symptom data
- Bedrock API calls and responses
- Generated navigation recommendations
- Errors and warnings

## Security

- **Authentication**: Requires valid JWT token via API Gateway Lambda Authorizer
- **Authorization**: Validates user session in DynamoDB
- **Encryption**: Data encrypted at rest in DynamoDB
- **IAM**: Least privilege permissions for Bedrock and DynamoDB access

## Performance

- **Timeout**: 30 seconds
- **Memory**: 512 MB
- **Expected Duration**: 2-5 seconds (including Bedrock API call)
- **Cold Start**: ~1-2 seconds

## Dependencies

- `@aws-sdk/client-bedrock-runtime`: Bedrock API integration
- `@aws-sdk/lib-dynamodb`: DynamoDB operations
- `uuid`: Generate unique navigation IDs
- Shared modules:
  - `bedrock-client`: Bedrock API wrapper with retry logic
  - `bedrock-prompts`: Structured prompt templates
  - `symptom-db`: Symptom data retrieval
  - `dynamodb-client`: DynamoDB client configuration
  - `types`: TypeScript type definitions
  - `response`: API response helpers

## Future Enhancements

- Multilingual support (Hindi, Tamil, Telugu, Bengali)
- Confidence scores for recommendations
- Alternative department suggestions
- Integration with hospital department availability
- Patient history consideration
- Symptom severity scoring

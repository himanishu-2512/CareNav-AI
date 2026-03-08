# CareNav AI - Bedrock Integration

This directory contains the shared modules for Amazon Bedrock integration in the CareNav AI system.

## Files

### bedrock-client.ts
Core Bedrock client wrapper with retry logic, timeout handling, and response validation.

**Key Features:**
- AWS SDK v3 Bedrock Runtime client initialization
- Converse API wrapper with configurable options
- Exponential backoff retry logic (3 retries by default)
- 5-second timeout for API calls
- JSON response parsing and validation
- Error handling for ThrottlingException and ValidationException

**Main Functions:**
- `callBedrock()` - Call Bedrock with system and user prompts
- `parseBedrockJson()` - Parse JSON from Bedrock response
- `validateBedrockResponse()` - Validate response against required fields
- `callBedrockJson()` - Combined call, parse, and validate

### bedrock-prompts.ts
Structured prompt templates for all AI interactions.

**Prompt Templates:**
1. **Symptom Extraction** - Convert natural language to structured symptoms
2. **Follow-up Questions** - Generate 3-5 clarifying questions
3. **Department Recommendation** - Non-diagnostic care navigation
4. **Report Summarization** - Extract key info from medical reports
5. **Schedule Generation** - Convert prescriptions to time-specific schedules

**Design Principles:**
- Explicit boundaries (no diagnosis/prescription)
- Structured JSON output
- Context limitation for token efficiency
- Error handling instructions
- Multilingual-ready design

### bedrock-examples.ts
Example usage patterns for Bedrock integration.

**Example Functions:**
- `extractSymptoms()` - Extract structured symptoms from text
- `generateFollowUpQuestions()` - Generate clarifying questions
- `getDepartmentRecommendation()` - Get department and urgency
- `summarizeReport()` - Summarize medical report
- `generateMedicineSchedule()` - Create medication schedule

### types.ts
TypeScript interfaces for all data models used in the system.

## Usage Examples

### Extract Symptoms
```typescript
import { extractSymptoms } from './bedrock-examples';

const symptomText = "I have chest pain for 3 days, worse with exertion";
const structured = await extractSymptoms(symptomText);
// Returns: { bodyPart, duration, severity, associatedFactors, timing, character }
```

### Generate Follow-up Questions
```typescript
import { generateFollowUpQuestions } from './bedrock-examples';

const questions = await generateFollowUpQuestions(structuredSymptoms);
// Returns: [{ questionId, questionText, questionType }, ...]
```

### Get Department Recommendation
```typescript
import { getDepartmentRecommendation } from './bedrock-examples';

const recommendation = await getDepartmentRecommendation(
  structuredSymptoms,
  followUpAnswers
);
// Returns: { department, urgency, reasoning }
```

### Custom Bedrock Call
```typescript
import { callBedrockJson } from './bedrock-client';

const result = await callBedrockJson<MyType>(
  systemPrompt,
  userPrompt,
  ['requiredField1', 'requiredField2'],
  { maxTokens: 1000, temperature: 0.5 }
);
```

## Configuration

### Environment Variables
- `AWS_REGION` - AWS region (default: ap-south-1)
- `BEDROCK_MODEL_ID` - Model ID (default: anthropic.claude-3-sonnet-20240229-v1:0)

### Bedrock Call Options
```typescript
interface BedrockCallOptions {
  maxTokens?: number;      // Default: 2000
  temperature?: number;    // Default: 0.7
  topP?: number;          // Default: 0.9
  timeout?: number;       // Default: 5000ms
}
```

## Error Handling

The Bedrock client implements comprehensive error handling:

1. **Retry Logic**: Automatically retries on ThrottlingException and ValidationException
2. **Exponential Backoff**: Delays increase exponentially (2^attempt * 1000ms)
3. **Timeout**: 5-second default timeout prevents hanging requests
4. **Validation**: Validates required fields in JSON responses
5. **Logging**: Logs all errors with attempt numbers

## Requirements Satisfied

This implementation satisfies the following requirements from the spec:

- **11.1**: Bedrock Converse API integration
- **11.2**: Structured prompts with clear instructions
- **11.3**: Retry logic with exponential backoff (3 retries)
- **11.4**: User-friendly error messages on failure
- **11.5**: Response format validation before processing
- **11.6**: 5-second timeout for 95% of requests

## Testing

To test the Bedrock integration:

1. Ensure AWS credentials are configured
2. Ensure Bedrock model access is enabled in your AWS account
3. Run the Lambda functions that use these modules
4. Check CloudWatch logs for Bedrock API call details

## Next Steps

The following tasks will use this Bedrock integration:

- Task 6: Symptom input and extraction module
- Task 7: AI follow-up clarification module
- Task 8: Care navigation module
- Task 10: Medical report processing
- Task 12: Treatment planner module

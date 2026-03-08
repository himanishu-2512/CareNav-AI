# Task 2.1 Implementation: Disease Analysis Prompt

## Summary

Successfully implemented the disease analysis prompt system in `lambda/shared/bedrock-prompts.ts` for the AI-powered iterative diagnosis feature.

## What Was Implemented

### 1. System Prompt for Disease Analysis
- **Constant**: `DISEASE_ANALYSIS_SYSTEM_PROMPT`
- Instructs Bedrock to act as a medical diagnostic assistant
- Specifies that analysis is for internal use only (not patient-facing)
- Requests 5-10 disease candidates with probability scores

### 2. Symptom Formatting Function
- **Function**: `formatSymptomsForAnalysis(symptoms: StructuredSymptoms)`
- Formats structured symptoms into a readable bullet-point list
- Intelligently excludes "not specified" fields
- Includes: body part, duration, severity, associated factors, timing, character

### 3. Disease Analysis Prompt Generator
- **Function**: `generateDiseaseAnalysisPrompt(symptoms: StructuredSymptoms)`
- Generates complete user prompt for Bedrock
- Includes formatted symptoms
- Specifies exact JSON response structure
- Enforces rules:
  - 5-10 diseases ranked by probability
  - Probabilities must sum to ~1.0
  - Include supporting and missing symptoms
  - Return only JSON (no additional text)

### 4. JSON Schema Validation
- **Constant**: `DISEASE_ANALYSIS_RESPONSE_SCHEMA`
- Defines expected response structure
- Validates:
  - Array of 5-10 disease candidates
  - Each disease has: name, probability (0-1), supporting symptoms, missing symptoms
  - Confidence score (0-1)

## Files Created/Modified

### Modified
- `lambda/shared/bedrock-prompts.ts` - Added disease analysis prompt functions

### Created
- `lambda/shared/test-disease-analysis-prompt.ts` - Test script for prompt generation
- `lambda/shared/disease-analysis-example.ts` - Example usage with Bedrock integration
- `TASK-2.1-IMPLEMENTATION.md` - This documentation

## Testing

### Test Results
All tests passed successfully:
- ✓ System prompt is defined and contains required text
- ✓ Symptoms formatted correctly with all fields
- ✓ Prompt generated with correct structure and rules
- ✓ JSON schema structure is valid (5-10 items, required fields)
- ✓ Minimal symptoms handled correctly (excludes "not specified")

### Run Tests
```bash
npx ts-node lambda/shared/test-disease-analysis-prompt.ts
```

## Usage Example

```typescript
import {
  DISEASE_ANALYSIS_SYSTEM_PROMPT,
  generateDiseaseAnalysisPrompt
} from './bedrock-prompts';
import { callBedrockJson } from './bedrock-client';

// Analyze symptoms
const symptoms = {
  bodyPart: 'chest',
  duration: '3 days',
  severity: 'moderate',
  associatedFactors: ['shortness of breath', 'sweating'],
  timing: 'worse with exertion',
  character: 'pressure-like discomfort'
};

const response = await callBedrockJson(
  DISEASE_ANALYSIS_SYSTEM_PROMPT,
  generateDiseaseAnalysisPrompt(symptoms),
  ['possibleDiseases', 'confidenceScore'],
  { maxTokens: 2000 }
);

// Response contains:
// - possibleDiseases: Array of 5-10 disease candidates
// - confidenceScore: 0.0 to 1.0
```

## Expected Bedrock Response Format

```json
{
  "possibleDiseases": [
    {
      "diseaseName": "Angina Pectoris",
      "probability": 0.35,
      "supportingSymptoms": ["chest pressure", "exertional", "duration 3 days"],
      "missingSymptoms": ["radiation pattern", "relief with rest"]
    },
    {
      "diseaseName": "Myocardial Infarction",
      "probability": 0.25,
      "supportingSymptoms": ["chest discomfort", "sweating"],
      "missingSymptoms": ["nausea", "arm pain", "sudden onset"]
    }
  ],
  "confidenceScore": 0.45
}
```

## Requirements Validated

This implementation satisfies the following requirements:

- **Requirement 2.1**: Bedrock invoked with symptom analysis prompt ✓
- **Requirement 2.2**: JSON response parsed with possibleDiseases array ✓
- **Requirement 16.1**: Uses amazon.nova-pro-v1:0 model ✓
- **Requirement 16.2**: Sets max_tokens to 2000 ✓
- **Requirement 16.8**: Includes system prompt and user prompt as specified ✓

## Design Compliance

The implementation follows the design document specifications:

1. **System Prompt**: Matches Prompt 1 specification exactly
2. **User Prompt Template**: Includes all required elements:
   - Formatted symptoms
   - JSON structure definition
   - Rules for 5-10 diseases
   - Probability sum requirement
   - Supporting/missing symptoms
3. **Response Validation**: Schema enforces 5-10 diseases with required fields
4. **Symptom Formatting**: Clean, readable format for AI analysis

## Next Steps

This prompt will be used by:
- Task 2.2: Implement diagnosis Lambda handler
- Task 2.3: Create diagnosis session management
- Task 2.4: Implement question generation prompts

The diagnosis Lambda can now invoke Bedrock to analyze symptoms and receive structured disease candidate lists.

## Notes

- The prompt explicitly instructs Bedrock to return ONLY JSON (no markdown)
- Probability validation ensures sum is approximately 1.0 (within 0.05 tolerance)
- The system prompt emphasizes internal use only (not patient-facing)
- Symptom formatting intelligently excludes "not specified" values
- Example file demonstrates complete integration with bedrock-client

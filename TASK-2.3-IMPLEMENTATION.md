# Task 2.3 Implementation: Disease Refinement Prompt

## Summary

Successfully implemented the disease refinement prompt in `lambda/shared/bedrock-prompts.ts` for the AI-powered iterative diagnosis system. This prompt enables the AI to refine disease probabilities based on patient answers to targeted questions.

## Implementation Details

### Files Modified

1. **lambda/shared/bedrock-prompts.ts**
   - Added `DISEASE_REFINEMENT_SYSTEM_PROMPT` constant
   - Added `formatQuestionsAndAnswersForPrompt()` helper function
   - Added `generateDiseaseRefinementPrompt()` function
   - Added `DISEASE_REFINEMENT_RESPONSE_SCHEMA` for validation
   - Updated imports to include `TargetedQuestion` and `QuestionAnswer` types

### Key Components

#### 1. System Prompt
```typescript
export const DISEASE_REFINEMENT_SYSTEM_PROMPT
```
- Defines the AI's role as a medical diagnostic refinement assistant
- Specifies that analysis is for internal system use only
- Sets context for refining differential diagnosis

#### 2. Helper Function: formatQuestionsAndAnswersForPrompt()
```typescript
function formatQuestionsAndAnswersForPrompt(
  questions: TargetedQuestion[],
  answers: QuestionAnswer[]
): string
```
- Formats questions and answers into readable Q&A pairs
- Matches answers to questions by questionId
- Returns formatted string for inclusion in prompt

#### 3. Main Function: generateDiseaseRefinementPrompt()
```typescript
function generateDiseaseRefinementPrompt(
  currentDiseases: DiseaseCandidate[],
  questions: TargetedQuestion[],
  answers: QuestionAnswer[],
  initialSymptoms: StructuredSymptoms
): string
```
- Generates complete user prompt for Bedrock
- Includes current disease candidates with probabilities
- Includes questions asked and patient answers
- Includes initial symptoms for context
- Instructs AI to update probabilities based on answers
- **Instructs AI to remove diseases with probability < 0.05**
- Requests reasoning for probability changes
- Requests key findings from the round

#### 4. Response Schema: DISEASE_REFINEMENT_RESPONSE_SCHEMA
```typescript
export const DISEASE_REFINEMENT_RESPONSE_SCHEMA
```
- Validates Bedrock response structure
- Ensures all required fields are present
- Validates data types and constraints
- Includes validation for:
  - possibleDiseases array (min 1 item)
  - Each disease has: diseaseName, probability, supportingSymptoms, missingSymptoms, reasoning
  - confidenceScore (0.0-1.0)
  - keyFindings array

## Requirements Validated

This implementation satisfies the following requirements:

- **Requirement 2.5**: Refine disease probabilities based on patient answers
- **Requirement 2.6**: Remove diseases with probability < 0.05
- **Requirement 16.4**: Use amazon.nova-pro-v1:0 model with max_tokens: 1500 (configured in Lambda)
- **Requirement 16.8**: Include system prompt and user prompt as specified in design

## Expected Response Format

```json
{
  "possibleDiseases": [
    {
      "diseaseName": "Angina Pectoris",
      "probability": 0.65,
      "supportingSymptoms": ["chest pressure", "exertional", "radiating to arm", "relieved by rest"],
      "missingSymptoms": ["previous episodes"],
      "reasoning": "Radiation pattern and relief with rest strongly support angina"
    }
  ],
  "confidenceScore": 0.75,
  "keyFindings": [
    "Pain radiates to arm and jaw",
    "Symptoms improve with rest",
    "Exertional pattern consistent"
  ]
}
```

## Testing

Created `lambda/shared/test-disease-refinement-prompt.ts` to verify:
- System prompt is properly defined
- User prompt generation works correctly
- Prompt includes all required information
- JSON schema is valid
- Expected response format is documented

Test execution: ✅ All tests pass

## Usage Example

```typescript
import {
  DISEASE_REFINEMENT_SYSTEM_PROMPT,
  generateDiseaseRefinementPrompt,
  DISEASE_REFINEMENT_RESPONSE_SCHEMA
} from './bedrock-prompts';

// In the iterative diagnosis Lambda function
const userPrompt = generateDiseaseRefinementPrompt(
  currentDiseases,
  questions,
  answers,
  initialSymptoms
);

// Invoke Bedrock with system and user prompts
const response = await invokeBedrockModel({
  systemPrompt: DISEASE_REFINEMENT_SYSTEM_PROMPT,
  userPrompt: userPrompt,
  modelId: 'amazon.nova-pro-v1:0',
  maxTokens: 1500
});

// Validate response against schema
validateResponse(response, DISEASE_REFINEMENT_RESPONSE_SCHEMA);
```

## Next Steps

This prompt will be used in:
- Task 3.2: Implement `continueDiagnosisSession()` Lambda function
- Task 3.3: Integrate disease refinement into diagnosis flow
- Task 4.x: Complete iterative diagnosis workflow

## Notes

- The prompt explicitly instructs the AI to remove diseases with probability < 0.05
- Probabilities must sum to approximately 1.0
- Confidence score should increase as more information is gathered
- The reasoning field helps track why probabilities changed
- Key findings provide a summary of important discoveries in each round

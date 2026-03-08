# Task 2.2 Implementation: Targeted Question Generation Prompt

## Overview
Successfully implemented the targeted question generation prompt system in `lambda/shared/bedrock-prompts.ts`. This prompt is used by the iterative diagnosis engine to generate 3-5 targeted questions that help differentiate between disease candidates while ensuring disease names are never shown to patients.

## Implementation Details

### 1. System Prompt
Added `QUESTION_GENERATION_SYSTEM_PROMPT` that instructs the AI to:
- Generate targeted questions based on disease candidates
- Use clear, patient-friendly language
- **NEVER mention disease names** in questions
- Generate 3-5 questions to narrow down diagnosis

### 2. Helper Functions

#### `formatDiseaseCandidatesForPrompt(diseases: DiseaseCandidate[]): string`
Formats disease candidates into a readable structure showing:
- Disease name with probability score
- Supporting symptoms
- Missing symptoms (to help guide question generation)

#### `formatQuestionHistoryForPrompt(questionHistory: QuestionRound[]): string`
Formats previous question rounds showing:
- Round number
- Questions asked
- Patient answers
- Handles empty history (first round)

#### `generateQuestionGenerationPrompt(diseases, questionHistory, currentRound): string`
Main function that generates the complete user prompt including:
- Current disease candidates with probabilities
- Previous questions and answers
- Current round number
- Explicit instructions to avoid disease names
- JSON structure requirements
- Question generation rules

### 3. JSON Schema Validation
Added `QUESTION_GENERATION_RESPONSE_SCHEMA` that validates:
- Array of 3-5 questions
- Required fields: questionId, questionText, questionType, targetDiseases, importance
- Valid question types: yes_no, text, multiple_choice, scale
- Valid importance levels: high, medium, low
- Options array (minimum 2) for multiple_choice questions

### 4. Disease Name Isolation
The prompt explicitly forbids disease names in multiple places:
- System prompt: "MUST NOT mention disease names"
- User prompt instructions: "Do NOT mention disease names"
- Rules section: "NO disease names in questionText"

This ensures compliance with Requirements 3.6, 4.1, 16.3, and 16.8.

## Files Modified

### `lambda/shared/bedrock-prompts.ts`
- Added imports for `DiseaseCandidate` and `QuestionRound` types
- Added `QUESTION_GENERATION_SYSTEM_PROMPT` constant
- Added `formatDiseaseCandidatesForPrompt()` function
- Added `formatQuestionHistoryForPrompt()` function
- Added `generateQuestionGenerationPrompt()` function
- Added `QUESTION_GENERATION_RESPONSE_SCHEMA` constant

## Testing

### Test File: `lambda/shared/test-question-generation-prompt.ts`
Created comprehensive test that verifies:
1. ✓ System prompt is properly defined
2. ✓ Disease candidates format correctly with probabilities and symptoms
3. ✓ Question history formats with answers
4. ✓ Empty history handled correctly (first round)
5. ✓ Complete user prompt generated for Round 2
6. ✓ Complete user prompt generated for Round 1 (no history)
7. ✓ JSON schema is valid
8. ✓ Prompt explicitly forbids disease names
9. ✓ All required elements present in prompt

### Test Results
```
=== Test Complete ===
✓ Prompt explicitly forbids disease names: true
✓ All required elements present
✓ Proper formatting of disease candidates
✓ Proper formatting of question history
✓ Valid JSON schema structure
```

## Example Output

### Formatted Disease Candidates
```
1. Angina Pectoris (probability: 0.35)
  Supporting Symptoms: chest pressure, exertional, duration 3 days
  Missing Symptoms: radiation pattern, relief with rest, previous episodes

2. Myocardial Infarction (probability: 0.25)
  Supporting Symptoms: chest discomfort, sweating, moderate severity
  Missing Symptoms: nausea, arm pain, sudden onset
```

### Complete User Prompt Structure
```
Generate targeted questions to differentiate between these possible diseases:

Current Disease Candidates:
[formatted disease list]

Previous Questions Asked:
[formatted question history with answers]

Current Round: 2

Generate 3-5 questions that:
- Help differentiate between the disease candidates
- Are clear and patient-friendly (no medical jargon)
- Do NOT mention disease names
- Focus on symptoms, timing, severity, or related factors
- Are not redundant with previous questions

Return ONLY valid JSON array:
[JSON structure specification]

Rules:
- Generate 3-5 questions
- Questions must be patient-friendly
- NO disease names in questionText
- Each question should help differentiate specific diseases
- Prioritize high-importance questions
- Return ONLY the JSON array, no additional text
```

## Requirements Validated

This implementation validates the following requirements:

- **Requirement 3.1**: Generate 3-5 targeted questions ✓
- **Requirement 3.2**: Each question has unique questionId ✓
- **Requirement 3.6**: Filter out disease names from questionText ✓
- **Requirement 4.1**: Exclude disease names from patient-facing content ✓
- **Requirement 16.3**: Set max_tokens to 1000 for question generation (to be used in Lambda)
- **Requirement 16.8**: Include system prompt and user prompt as specified ✓

## Integration Points

This prompt will be used by:
1. **Iterative Diagnosis Lambda** - To generate questions after disease analysis
2. **Question Generation Service** - To create targeted questions for each round
3. **Bedrock Integration** - With amazon.nova-pro-v1:0 model

## Next Steps

The following tasks will use this prompt:
- Task 2.3: Implement disease refinement prompt
- Task 3.x: Create iterative diagnosis Lambda function
- Task 4.x: Integrate question generation into diagnosis flow

## Model Configuration

When using this prompt with Bedrock:
- **Model**: amazon.nova-pro-v1:0
- **Max Tokens**: 1000 (as per Requirement 16.3)
- **System Prompt**: `QUESTION_GENERATION_SYSTEM_PROMPT`
- **User Prompt**: Generated by `generateQuestionGenerationPrompt()`
- **Response Validation**: Use `QUESTION_GENERATION_RESPONSE_SCHEMA`

## Security & Privacy

✓ Disease names explicitly forbidden in patient-facing questions
✓ Only internal system uses disease information
✓ Questions focus on symptoms and patterns, not diagnoses
✓ Complies with privacy requirements (Req 4.1-4.5)

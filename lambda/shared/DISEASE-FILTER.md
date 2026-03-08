# Disease Name Filter Module

## Overview

The Disease Name Filter is a critical privacy component that scans question text for disease names and filters them out to ensure patient privacy. Questions containing disease names should never be shown to patients.

**Requirements Validated:** 3.6, 4.1, 4.2

## Purpose

In the AI-powered iterative diagnosis system, the AI analyzes symptoms to identify possible diseases and generates targeted questions. However, patients should never see disease names to prevent:
- Self-diagnosis and anxiety
- Misinterpretation of medical information
- Privacy concerns

This filter ensures that any questions accidentally containing disease names are flagged and removed before being shown to patients.

## Core Functions

### 1. `filterDiseaseNames()`

Filters an array of questions to remove any that contain disease names.

```typescript
function filterDiseaseNames(
  questions: TargetedQuestion[],
  diseases: DiseaseCandidate[]
): FilterResult
```

**Parameters:**
- `questions`: Array of questions to filter
- `diseases`: Array of disease candidates to check against

**Returns:**
- `FilterResult` object containing:
  - `cleanQuestions`: Questions safe to show to patients
  - `flaggedQuestions`: Questions containing disease names
  - `totalFiltered`: Count of filtered questions

**Example:**
```typescript
const result = filterDiseaseNames(questions, diseases);

// Use clean questions for patient display
const patientQuestions = result.cleanQuestions;

// Log flagged questions for debugging
if (result.totalFiltered > 0) {
  console.warn(`Filtered ${result.totalFiltered} questions containing disease names`);
  console.warn('Flagged questions:', result.flaggedQuestions);
}
```

### 2. `containsDiseaseNames()`

Checks if text contains any disease names (case-insensitive).

```typescript
function containsDiseaseNames(
  text: string,
  diseaseNames: string[]
): boolean
```

**Parameters:**
- `text`: Text to check
- `diseaseNames`: Array of disease names (should be lowercase)

**Returns:**
- `true` if text contains any disease name, `false` otherwise

**Example:**
```typescript
const diseaseNames = ['angina', 'heart attack', 'gerd'];

containsDiseaseNames("Do you have chest pain?", diseaseNames);
// Returns: false

containsDiseaseNames("Is your angina worse?", diseaseNames);
// Returns: true
```

### 3. `validateNoDiseaseNames()`

Validates that questions array contains no disease names. Throws an error if any are found.

```typescript
function validateNoDiseaseNames(
  questions: TargetedQuestion[],
  diseases: DiseaseCandidate[]
): void
```

**Parameters:**
- `questions`: Questions to validate
- `diseases`: Disease candidates to check against

**Throws:**
- `Error` if any questions contain disease names

**Example:**
```typescript
try {
  validateNoDiseaseNames(questions, diseases);
  // Safe to send questions to patient
  return { questions };
} catch (error) {
  // Questions contain disease names - log and regenerate
  console.error('Questions failed validation:', error.message);
  // Regenerate questions or use fallback
}
```

### 4. `extractDiseaseNames()`

Extracts disease names from an array of disease candidates.

```typescript
function extractDiseaseNames(
  diseases: DiseaseCandidate[]
): string[]
```

**Parameters:**
- `diseases`: Array of disease candidates

**Returns:**
- Array of disease names (lowercase)

**Example:**
```typescript
const diseases = [
  { diseaseName: 'Angina Pectoris', probability: 0.65, ... },
  { diseaseName: 'GERD', probability: 0.10, ... }
];

const names = extractDiseaseNames(diseases);
// Returns: ['angina pectoris', 'gerd']
```

## Features

### Case-Insensitive Matching

The filter performs case-insensitive matching to catch disease names regardless of capitalization:

```typescript
// All of these will be flagged:
"Is your ANGINA worse?"
"Do you have angina?"
"Angina symptoms present?"
```

### Word Boundary Detection

The filter uses word boundaries to avoid false positives:

```typescript
// "pain" should not match "Spain"
containsDiseaseNames("I visited Spain", ["pain"]);
// Returns: false

// But should match whole words
containsDiseaseNames("Do you have pain?", ["pain"]);
// Returns: true
```

### Multi-Word Disease Names

The filter handles multi-word disease names correctly:

```typescript
const diseases = [
  { diseaseName: 'Myocardial Infarction', ... }
];

// Both parts of the disease name are checked
containsDiseaseNames("Do you have myocardial symptoms?", ...);
// Returns: true

containsDiseaseNames("Is there any infarction?", ...);
// Returns: true
```

### Special Characters

The filter handles special characters in disease names:

```typescript
const diseases = [
  { diseaseName: "Crohn's Disease", ... }
];

containsDiseaseNames("Do you have Crohn's disease?", ...);
// Returns: true
```

## Integration with Iterative Diagnosis

### Usage in Question Generation Flow

```typescript
import { filterDiseaseNames, validateNoDiseaseNames } from './disease-filter';
import { invokeBedrockModel } from './bedrock-client';

async function generateTargetedQuestions(
  diseases: DiseaseCandidate[],
  questionHistory: QuestionRound[],
  currentRound: number
): Promise<TargetedQuestion[]> {
  // Step 1: Generate questions using Bedrock
  const aiQuestions = await invokeBedrockModel({
    systemPrompt: QUESTION_GENERATION_SYSTEM_PROMPT,
    userPrompt: generateQuestionGenerationPrompt(diseases, questionHistory, currentRound),
    maxTokens: 1000
  });

  // Step 2: Filter out questions containing disease names
  const filterResult = filterDiseaseNames(aiQuestions, diseases);

  // Step 3: Log any flagged questions for monitoring
  if (filterResult.totalFiltered > 0) {
    console.warn(`Filtered ${filterResult.totalFiltered} questions containing disease names`);
    console.warn('Flagged questions:', filterResult.flaggedQuestions.map(q => q.questionText));
  }

  // Step 4: Validate that we have enough clean questions
  if (filterResult.cleanQuestions.length < 3) {
    // Not enough clean questions - regenerate or use fallback
    console.error('Insufficient clean questions after filtering');
    throw new Error('Unable to generate sufficient clean questions');
  }

  // Step 5: Return only clean questions
  return filterResult.cleanQuestions;
}
```

### Usage in API Response

```typescript
import { validateNoDiseaseNames } from './disease-filter';

export async function startDiagnosisSession(
  patientId: string,
  symptoms: StructuredSymptoms
): Promise<DiagnosisSessionResponse> {
  // Analyze symptoms and identify diseases
  const diseases = await analyzeSymptomsWithBedrock(symptoms);

  // Generate targeted questions
  const questions = await generateTargetedQuestions(diseases, [], 1);

  // CRITICAL: Validate no disease names before sending to patient
  validateNoDiseaseNames(questions, diseases);

  // Store session in database
  const session = await createDiagnosisSession(patientId, symptoms, diseases, questions);

  // Return response WITHOUT disease information
  return {
    sessionId: session.sessionId,
    currentRound: 1,
    questions: questions, // Safe - validated to contain no disease names
    status: 'active',
    message: 'Please answer the following questions to help us understand your condition.'
  };
}
```

## Testing

### Unit Tests

The module includes comprehensive unit tests covering:

1. **Basic Filtering**
   - Clean questions (no disease names)
   - Contaminated questions (with disease names)
   - Mixed clean and contaminated questions

2. **Case Sensitivity**
   - Uppercase disease names
   - Lowercase disease names
   - Mixed case

3. **Word Boundaries**
   - Whole word matching
   - Partial word rejection
   - Multi-word disease names

4. **Edge Cases**
   - Empty arrays
   - Special characters
   - Punctuation
   - Numbers
   - Very long disease names
   - Abbreviations

5. **Integration**
   - Filtering AI-generated questions
   - Validation in API responses

### Running Tests

```bash
# Run all tests
npm test

# Run disease filter tests specifically
npm test -- disease-filter.test.ts

# Run verification script
npx ts-node verify-disease-filter.ts
```

## Error Handling

### Validation Errors

When `validateNoDiseaseNames()` detects disease names, it throws an error with details:

```typescript
try {
  validateNoDiseaseNames(questions, diseases);
} catch (error) {
  // Error message includes flagged questions
  console.error(error.message);
  // "Questions contain disease names and cannot be shown to patients.
  //  Flagged questions: ["Is your angina worse?", "Do you have GERD?"]"
}
```

### Handling Insufficient Clean Questions

If filtering removes too many questions:

```typescript
const result = filterDiseaseNames(questions, diseases);

if (result.cleanQuestions.length < 3) {
  // Option 1: Regenerate questions with stricter prompt
  const newQuestions = await regenerateQuestions(diseases, questionHistory);
  
  // Option 2: Use fallback generic questions
  const fallbackQuestions = getGenericQuestions(symptoms);
  
  // Option 3: Log and alert for manual review
  console.error('Insufficient clean questions after filtering');
  await alertDevelopmentTeam('Question generation needs review');
}
```

## Best Practices

### 1. Always Filter Before Sending to Patients

```typescript
// ✓ GOOD
const filtered = filterDiseaseNames(questions, diseases);
return { questions: filtered.cleanQuestions };

// ✗ BAD - Never send unfiltered questions
return { questions: questions };
```

### 2. Log Flagged Questions for Monitoring

```typescript
if (result.totalFiltered > 0) {
  console.warn(`Filtered ${result.totalFiltered} questions`);
  // Send to monitoring system
  await logMetric('questions_filtered', result.totalFiltered);
}
```

### 3. Validate in Multiple Layers

```typescript
// Layer 1: Filter during question generation
const questions = await generateAndFilterQuestions(diseases);

// Layer 2: Validate before API response
validateNoDiseaseNames(questions, diseases);

// Layer 3: Frontend validation (defense in depth)
// Frontend should also check for unexpected disease names
```

### 4. Handle Edge Cases Gracefully

```typescript
// Handle empty inputs
if (!questions || questions.length === 0) {
  return { cleanQuestions: [], flaggedQuestions: [], totalFiltered: 0 };
}

// Handle missing diseases
if (!diseases || diseases.length === 0) {
  return { cleanQuestions: questions, flaggedQuestions: [], totalFiltered: 0 };
}
```

## Performance Considerations

### Complexity

- **Time Complexity**: O(n × m × k) where:
  - n = number of questions
  - m = number of diseases
  - k = average words per disease name

- **Space Complexity**: O(n) for storing filtered results

### Optimization Tips

1. **Cache Disease Names**: Extract disease names once and reuse
   ```typescript
   const diseaseNames = extractDiseaseNames(diseases);
   // Reuse diseaseNames for multiple checks
   ```

2. **Early Exit**: Stop checking once a disease name is found
   ```typescript
   // Already implemented in containsDiseaseNames()
   ```

3. **Batch Processing**: Filter multiple question sets together
   ```typescript
   const allQuestions = [...round1Questions, ...round2Questions];
   const result = filterDiseaseNames(allQuestions, diseases);
   ```

## Security Considerations

### Privacy Protection

The filter is a critical privacy component:

1. **Defense in Depth**: Use multiple validation layers
2. **Fail Secure**: If validation fails, don't send questions
3. **Audit Logging**: Log all filtered questions for review
4. **Monitoring**: Alert on high filter rates (may indicate AI issues)

### Compliance

Ensures compliance with:
- Patient privacy requirements
- Medical information disclosure regulations
- System design principle: "Never reveal diagnosis to patients"

## Troubleshooting

### High Filter Rate

If many questions are being filtered:

1. **Check AI Prompts**: Ensure prompts explicitly forbid disease names
2. **Review Examples**: Provide better examples in prompts
3. **Adjust Temperature**: Lower temperature for more consistent AI output
4. **Add Constraints**: Add explicit constraints in system prompt

### False Positives

If legitimate questions are being filtered:

1. **Check Word Boundaries**: Ensure regex is using `\b` correctly
2. **Review Disease Names**: Some common words may match disease names
3. **Add Exceptions**: Consider maintaining an exception list for common words

### False Negatives

If disease names are getting through:

1. **Check Case Sensitivity**: Ensure lowercase normalization
2. **Check Special Characters**: Ensure special chars are handled
3. **Check Abbreviations**: Add common abbreviations to disease list
4. **Review Logs**: Check flagged questions for patterns

## Future Enhancements

Potential improvements:

1. **Synonym Detection**: Detect disease synonyms and common names
2. **Partial Match Threshold**: Allow partial matches with confidence scores
3. **Machine Learning**: Train ML model to detect medical terminology
4. **Multilingual Support**: Support disease names in multiple languages
5. **Performance Optimization**: Use trie or other efficient data structures

## Related Modules

- `bedrock-prompts.ts`: Question generation prompts
- `confidence-calculator.ts`: Diagnosis confidence calculation
- `diagnosis-db.ts`: Diagnosis session storage
- `types.ts`: Type definitions

## References

- Requirements: 3.6, 4.1, 4.2
- Design Document: Section on Disease Information Isolation
- Property 1: Disease Name Isolation

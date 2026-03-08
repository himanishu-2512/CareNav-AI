# Recovery Recommender Module

## Overview

The Recovery Recommender module generates AI-powered daily life modifications and recovery tips for patients based on their diagnosis and profile. It provides personalized, actionable guidance to support patient recovery and self-management.

## Features

### Daily Life Modifications
- **Sleep Schedule Adjustments**: Specific guidance on sleep duration, timing, and quality
- **Stress Management Techniques**: Practical stress reduction strategies
- **Physical Activity Guidelines**: Tailored exercise and movement recommendations
- **Impact-Based Prioritization**: Modifications sorted by expected impact on recovery
- **Difficulty Levels**: Clear indication of implementation difficulty (easy, moderate, challenging)

### Recovery Tips
- **Warning Signs**: Critical symptoms requiring immediate medical attention
- **Recovery Timeline**: Expected milestones and recovery stages
- **Self-Monitoring**: Techniques for tracking recovery progress
- **Follow-Up Guidance**: When to schedule appointments with healthcare providers

## Requirements Addressed

- **Requirement 18.1**: Generate daily life modification recommendations based on diagnosed disease
- **Requirement 18.2**: Include sleep schedule adjustments, stress management techniques, and physical activity guidelines
- **Requirement 18.3**: Provide specific, measurable guidance for each modification
- **Requirement 19.1**: Generate recovery tips specific to diagnosed disease
- **Requirement 19.2**: Include warning signs requiring immediate medical attention
- **Requirement 19.3**: Specify expected recovery timeline milestones
- **Requirement 19.4**: Provide guidance on self-monitoring techniques
- **Requirement 19.5**: Include when to schedule follow-up appointments

## API Reference

### Types

#### `RecoveryRecommendationInput`
```typescript
interface RecoveryRecommendationInput {
  diagnosis: string;        // Patient's diagnosis
  patientAge: number;       // Patient's age
  patientGender: string;    // Patient's gender
}
```

#### `DailyLifeModification`
```typescript
interface DailyLifeModification {
  modification: string;              // Brief title
  category: 'sleep' | 'stress_management' | 'physical_activity' | 'other';
  specificGuidance: string;          // Detailed, measurable guidance
  expectedImpact: 'high' | 'medium' | 'low';
  difficulty: 'easy' | 'moderate' | 'challenging';
}
```

#### `RecoveryTip`
```typescript
interface RecoveryTip {
  tip: string;                       // Brief title
  category: 'warning_signs' | 'timeline' | 'monitoring' | 'follow_up';
  description: string;               // Detailed explanation
}
```

#### `RecoveryRecommendations`
```typescript
interface RecoveryRecommendations {
  dailyLifeModifications: DailyLifeModification[];
  recoveryTips: RecoveryTip[];
}
```

### Functions

#### `generateRecoveryRecommendations(input: RecoveryRecommendationInput): Promise<RecoveryRecommendations>`

Generates personalized recovery recommendations using AI.

**Parameters:**
- `input`: Patient information and diagnosis

**Returns:**
- Promise resolving to structured recovery recommendations

**Throws:**
- Error if AI service fails
- Error if validation fails
- Error if API key is not configured

**Example:**
```typescript
const recommendations = await generateRecoveryRecommendations({
  diagnosis: 'Type 2 Diabetes Mellitus',
  patientAge: 55,
  patientGender: 'male'
});
```

#### `formatRecoveryRecommendations(recommendations: RecoveryRecommendations): string`

Formats recovery recommendations as plain text for display.

**Parameters:**
- `recommendations`: The recovery recommendations to format

**Returns:**
- Formatted string representation with sections and emojis

**Example:**
```typescript
const formatted = formatRecoveryRecommendations(recommendations);
console.log(formatted);
```

## Validation Rules

### Daily Life Modifications
- Minimum 6 modifications required
- At least 2 sleep-related modifications
- At least 2 stress management modifications
- At least 2 physical activity modifications
- Each modification must have all required fields
- Sorted by impact (high > medium > low), then difficulty (easy > moderate > challenging)

### Recovery Tips
- Minimum 8 tips required
- At least 3 warning signs
- At least 2 timeline milestones
- At least 2 monitoring techniques
- At least 1 follow-up guidance
- Each tip must have all required fields

## Usage Examples

### Basic Usage
```typescript
import { generateRecoveryRecommendations } from './recovery-recommender';

const recommendations = await generateRecoveryRecommendations({
  diagnosis: 'Essential Hypertension',
  patientAge: 48,
  patientGender: 'female'
});

console.log(`Generated ${recommendations.dailyLifeModifications.length} modifications`);
console.log(`Generated ${recommendations.recoveryTips.length} recovery tips`);
```

### Filtering by Category
```typescript
// Get only sleep modifications
const sleepMods = recommendations.dailyLifeModifications
  .filter(m => m.category === 'sleep');

// Get only warning signs
const warnings = recommendations.recoveryTips
  .filter(t => t.category === 'warning_signs');
```

### Filtering by Impact/Difficulty
```typescript
// Get high-impact modifications
const highImpact = recommendations.dailyLifeModifications
  .filter(m => m.expectedImpact === 'high');

// Get easy-to-implement modifications
const easyMods = recommendations.dailyLifeModifications
  .filter(m => m.difficulty === 'easy');
```

### Display Formatted Output
```typescript
import { formatRecoveryRecommendations } from './recovery-recommender';

const formatted = formatRecoveryRecommendations(recommendations);

// Display in UI, send via email, or save to file
console.log(formatted);
```

## Integration with Treatment Episodes

```typescript
// In a Lambda handler
async function handleTreatmentCompletion(episodeId: string, diagnosis: string) {
  // Get patient info
  const patient = await getPatient(patientId);
  
  // Generate recommendations
  const recommendations = await generateRecoveryRecommendations({
    diagnosis: diagnosis,
    patientAge: patient.age,
    patientGender: patient.gender
  });
  
  // Save to database
  await saveRecommendations({
    recommendationId: generateId(),
    patientId: patient.id,
    episodeId: episodeId,
    ...recommendations,
    generatedAt: new Date().toISOString()
  });
  
  // Sync to patient app
  await syncToPatientApp(patient.id, recommendations);
  
  // Add to chat thread
  await addChatMessage(episodeId, {
    type: 'recommendation',
    content: formatRecoveryRecommendations(recommendations)
  });
}
```

## Error Handling

```typescript
try {
  const recommendations = await generateRecoveryRecommendations(input);
  // Use recommendations
} catch (error) {
  if (error.message.includes('GEMINI_API_KEY')) {
    // API key not configured
    console.error('AI service not configured');
  } else if (error.message.includes('timeout')) {
    // Service timeout
    console.error('AI service timeout, retrying...');
  } else if (error.message.includes('validation')) {
    // Validation failed
    console.error('Generated recommendations failed validation');
  } else {
    // Other errors
    console.error('Unexpected error:', error);
  }
}
```

## AI Prompt Design

The module uses carefully crafted prompts to ensure:
- **Specificity**: Measurable, actionable guidance (e.g., "Sleep 7-8 hours per night")
- **Clarity**: Non-technical language patients can understand
- **Completeness**: All required categories and minimum counts
- **Prioritization**: Sorted by impact and difficulty
- **Personalization**: Age and gender-appropriate recommendations

## Output Format

### Daily Life Modifications
Organized by impact level:
- 🔴 **HIGH IMPACT** (Prioritize These)
- 🟡 **MEDIUM IMPACT**
- 🟢 **LOWER IMPACT** (Still Beneficial)

Each modification includes:
- Category icon (😴 Sleep, 🧘 Stress, 🏃 Activity)
- Specific guidance
- Difficulty indicator

### Recovery Tips
Organized by category:
- ⚠️ **WARNING SIGNS** - Seek immediate medical attention if
- 📅 **EXPECTED RECOVERY TIMELINE**
- 📊 **SELF-MONITORING GUIDANCE**
- 🏥 **FOLLOW-UP APPOINTMENTS**

## Testing

Run the test script:
```bash
npx ts-node lambda/shared/test-recovery-recommender.ts
```

The test script validates:
- Successful generation for multiple diagnoses
- Correct category distribution
- Proper sorting by impact and difficulty
- Formatted output quality
- Validation rules enforcement

## Dependencies

- `gemini-client.ts`: AI service integration
- `@google/generative-ai`: Google Gemini API client

## Environment Variables

- `GEMINI_API_KEY`: Required for AI service access

## Performance

- **Generation Time**: ~5-10 seconds per request
- **Token Usage**: ~2000-3000 tokens per generation
- **Retry Logic**: Built-in with exponential backoff
- **Timeout**: 30 seconds default

## Best Practices

1. **Cache recommendations**: Store in database to avoid regenerating
2. **Validate input**: Ensure diagnosis is specific and accurate
3. **Handle errors gracefully**: Provide fallback recommendations if AI fails
4. **Monitor usage**: Track API calls and costs
5. **Update regularly**: Regenerate if diagnosis changes or treatment progresses
6. **Personalize display**: Filter and format based on patient preferences

## Future Enhancements

- Support for multiple diagnoses (comorbidities)
- Integration with patient's existing medications
- Consideration of patient's occupation and lifestyle
- Multi-language support
- Patient feedback and rating system
- Progress tracking and adjustment recommendations

# Activity Avoidance Recommender Module

## Overview

The Activity Avoidance Recommender module generates AI-powered, personalized activity avoidance recommendations for patients based on their diagnosis and profile. It uses Google Gemini AI to create specific, actionable guidance on activities patients should avoid during their recovery period.

## Requirements Addressed

- **17.1**: Generate list of activities to avoid based on diagnosed disease
- **17.2**: Explain the reason for each avoidance recommendation
- **17.3**: Specify the duration for which each activity should be avoided
- **17.4**: Prioritize critical avoidances at the top of the list
- **17.5**: Use clear, non-technical language for activity descriptions

## Features

### Core Capabilities

1. **AI-Powered Generation**: Uses Google Gemini 1.5 Flash to generate personalized recommendations
2. **Priority-Based Sorting**: Automatically sorts activities by criticality (critical > high > medium)
3. **Clear Language**: Uses non-technical, patient-friendly language
4. **Structured Output**: Returns well-structured JSON with all required fields
5. **Validation**: Validates recommendations to ensure quality and completeness
6. **Formatting**: Provides formatted text output for display

### Priority Levels

- **Critical**: Activities that could cause immediate harm, worsen the condition significantly, or delay recovery substantially
- **High**: Activities that should be avoided to prevent complications or slow recovery
- **Medium**: Activities that are advisable to avoid for optimal recovery

## API Reference

### Types

#### `ActivityPriority`
```typescript
type ActivityPriority = 'critical' | 'high' | 'medium';
```

#### `ActivityRecommendation`
```typescript
interface ActivityRecommendation {
  activity: string;      // Name of the activity to avoid
  reason: string;        // Why this activity should be avoided
  duration: string;      // How long to avoid (e.g., "2 weeks", "until symptoms resolve")
  priority: ActivityPriority;  // Criticality level
}
```

#### `ActivityAvoidanceRecommendations`
```typescript
interface ActivityAvoidanceRecommendations {
  activitiesToAvoid: ActivityRecommendation[];
}
```

#### `ActivityAvoidanceInput`
```typescript
interface ActivityAvoidanceInput {
  diagnosis: string;      // Patient's diagnosis
  patientAge: number;     // Patient's age
  patientGender: string;  // Patient's gender
}
```

### Functions

#### `generateActivityAvoidanceRecommendations(input: ActivityAvoidanceInput): Promise<ActivityAvoidanceRecommendations>`

Generates personalized activity avoidance recommendations using AI.

**Parameters:**
- `input`: Patient information and diagnosis

**Returns:**
- Promise resolving to structured activity avoidance recommendations

**Throws:**
- Error if AI generation fails
- Error if validation fails

**Example:**
```typescript
const recommendations = await generateActivityAvoidanceRecommendations({
  diagnosis: 'Fractured right radius',
  patientAge: 35,
  patientGender: 'male'
});
```

#### `formatActivityAvoidanceRecommendations(recommendations: ActivityAvoidanceRecommendations): string`

Formats recommendations as plain text for display.

**Parameters:**
- `recommendations`: The activity avoidance recommendations to format

**Returns:**
- Formatted string with priority grouping and visual indicators

**Example:**
```typescript
const formatted = formatActivityAvoidanceRecommendations(recommendations);
console.log(formatted);
```

## Usage Examples

### Basic Usage

```typescript
import { 
  generateActivityAvoidanceRecommendations,
  formatActivityAvoidanceRecommendations 
} from './activity-avoidance';

const input = {
  diagnosis: 'Herniated lumbar disc (L4-L5)',
  patientAge: 45,
  patientGender: 'male'
};

const recommendations = await generateActivityAvoidanceRecommendations(input);
console.log(formatActivityAvoidanceRecommendations(recommendations));
```

### Integration with Treatment Episode

```typescript
// Generate recommendations as part of treatment
const treatmentEpisode = {
  episodeId: 'episode-123',
  patientId: 'patient-456',
  diagnosis: 'Acute myocardial infarction',
  patientAge: 62,
  patientGender: 'female'
};

const recommendations = await generateActivityAvoidanceRecommendations({
  diagnosis: treatmentEpisode.diagnosis,
  patientAge: treatmentEpisode.patientAge,
  patientGender: treatmentEpisode.patientGender
});

// Store with treatment episode
const treatmentData = {
  ...treatmentEpisode,
  activityRecommendations: recommendations,
  recommendationsGeneratedAt: new Date().toISOString()
};
```

### Filtering by Priority

```typescript
const recommendations = await generateActivityAvoidanceRecommendations(input);

// Get only critical activities
const critical = recommendations.activitiesToAvoid.filter(
  a => a.priority === 'critical'
);

// Display critical activities to patient
critical.forEach(activity => {
  console.log(`⚠️  ${activity.activity}`);
  console.log(`   ${activity.reason}`);
  console.log(`   Avoid for: ${activity.duration}\n`);
});
```

### Error Handling

```typescript
try {
  const recommendations = await generateActivityAvoidanceRecommendations(input);
  // Use recommendations
} catch (error) {
  console.error('Failed to generate recommendations:', error);
  // Provide fallback or retry logic
}
```

## Validation Rules

The module validates all generated recommendations to ensure:

1. **Minimum Count**: At least 5 activities to avoid
2. **Required Fields**: Each activity has activity, reason, duration, and priority
3. **Valid Priorities**: Priority is one of 'critical', 'high', or 'medium'
4. **Priority Distribution**:
   - At least 2 critical priority items
   - At least 2 high priority items
   - At least 1 medium priority item
5. **Proper Sorting**: Activities are sorted by priority (critical first)

## Output Format

### JSON Structure

```json
{
  "activitiesToAvoid": [
    {
      "activity": "Heavy lifting over 10 pounds",
      "reason": "Can strain the injured area and delay bone healing",
      "duration": "6-8 weeks",
      "priority": "critical"
    },
    {
      "activity": "Contact sports or activities with fall risk",
      "reason": "Risk of re-injury or additional fractures",
      "duration": "Until cleared by doctor",
      "priority": "critical"
    },
    {
      "activity": "Driving",
      "reason": "May not be able to react quickly in emergencies",
      "duration": "2-3 weeks or until cast is removed",
      "priority": "high"
    }
  ]
}
```

### Formatted Text Output

```
ACTIVITIES TO AVOID

⚠️  CRITICAL - MUST AVOID:
1. Heavy lifting over 10 pounds
   Why: Can strain the injured area and delay bone healing
   Duration: 6-8 weeks

2. Contact sports or activities with fall risk
   Why: Risk of re-injury or additional fractures
   Duration: Until cleared by doctor

🔴 HIGH PRIORITY - STRONGLY AVOID:
1. Driving
   Why: May not be able to react quickly in emergencies
   Duration: 2-3 weeks or until cast is removed

🟡 MEDIUM PRIORITY - ADVISABLE TO AVOID:
1. Swimming
   Why: Cast must stay dry to prevent complications
   Duration: Until cast is removed
```

## Integration Points

### Lifestyle Recommender Lambda

The activity avoidance module is designed to integrate with the lifestyle recommender Lambda:

```typescript
import { generateActivityAvoidanceRecommendations } from '../shared/activity-avoidance';

// In lifestyle recommender handler
const activityRecommendations = await generateActivityAvoidanceRecommendations({
  diagnosis: request.diagnosis,
  patientAge: request.patientAge,
  patientGender: request.patientGender
});

// Include in complete lifestyle recommendations
const lifestyleRecommendations = {
  diet: dietRecommendations,
  activitiesToAvoid: activityRecommendations.activitiesToAvoid,
  dailyLifeModifications: dailyLifeRecommendations,
  recoveryTips: recoveryRecommendations
};
```

### Patient App Display

```typescript
// Display recommendations in patient app
function displayActivityRecommendations(recommendations: ActivityAvoidanceRecommendations) {
  const formatted = formatActivityAvoidanceRecommendations(recommendations);
  
  // Show in UI
  return (
    <div className="activity-recommendations">
      <h2>Activities to Avoid</h2>
      <pre>{formatted}</pre>
    </div>
  );
}
```

## Testing

### Test Script

Run the test script to verify functionality:

```bash
npx ts-node lambda/shared/test-activity-avoidance.ts
```

### Test Cases

The test script includes:
1. Fractured bone (orthopedic condition)
2. Hypertension (cardiac condition)
3. Pneumonia (respiratory condition)

Each test validates:
- Recommendation generation
- Structure and field presence
- Priority distribution
- Proper sorting
- Formatted output

## Performance

- **Generation Time**: Typically 2-5 seconds (depends on Gemini API)
- **Retry Logic**: Automatic retry with exponential backoff for rate limits
- **Timeout**: 30 seconds default timeout
- **Token Usage**: ~2000 tokens per request

## Error Handling

The module handles various error scenarios:

1. **AI Service Errors**: Retries with exponential backoff
2. **Validation Errors**: Throws descriptive error messages
3. **Network Errors**: Propagates with context
4. **Timeout Errors**: Fails after 30 seconds

## Dependencies

- `./gemini-client`: Google Gemini AI integration
- `@google/generative-ai`: Google Generative AI SDK

## Environment Variables

Requires `GEMINI_API_KEY` environment variable to be set.

## Best Practices

1. **Cache Results**: Consider caching recommendations for the same diagnosis
2. **Error Handling**: Always wrap calls in try-catch blocks
3. **User Feedback**: Show loading states during generation
4. **Retry Logic**: Implement retry for transient failures
5. **Logging**: Log generation failures for monitoring

## Future Enhancements

Potential improvements:
- Support for multiple diagnoses
- Personalization based on patient history
- Integration with patient activity tracking
- Multilingual support
- Offline fallback recommendations

## Related Modules

- `diet-recommender.ts`: Diet recommendations
- `recovery-recommender.ts`: Recovery tips and daily life modifications
- `gemini-client.ts`: AI service integration
- `lifestyle-recommender/index.ts`: Main lifestyle recommender Lambda

## Support

For issues or questions, refer to:
- Design document: `.kiro/specs/doctor-dashboard-patient-management/design.md`
- Requirements: `.kiro/specs/doctor-dashboard-patient-management/requirements.md`
- Task list: `.kiro/specs/doctor-dashboard-patient-management/tasks.md`

# Diet Recommender Module

## Overview

The Diet Recommender module generates AI-powered, personalized diet recommendations based on a patient's diagnosis and profile. It uses Google Gemini AI to create specific, actionable dietary guidance that considers patient allergies, age, gender, and medical condition.

## Requirements Addressed

- **Requirement 16.1**: Generate diet recommendations specific to diagnosed disease
- **Requirement 16.2**: Include foods to consume and foods to avoid
- **Requirement 16.3**: Specify portion sizes or frequency where medically relevant
- **Requirement 16.4**: Consider common dietary restrictions and allergies

## Features

### Core Capabilities

1. **Personalized Recommendations**: Generates diet advice tailored to specific diagnoses
2. **Allergy Safety**: Automatically excludes allergens from recommendations
3. **Portion Guidance**: Provides specific portion sizes where medically relevant
4. **Frequency Guidance**: Specifies how often foods should be consumed
5. **Clear Language**: Uses non-technical, actionable language
6. **Structured Output**: Returns well-organized data structure

### Data Structure

```typescript
interface FoodRecommendation {
  food: string;              // Name of the food item
  portionSize?: string;      // e.g., "1 cup", "100g", "2 servings"
  frequency?: string;        // e.g., "daily", "twice daily", "3 times per week"
  reason?: string;           // Health benefit or reason to avoid
}

interface DietRecommendations {
  foodsToConsume: FoodRecommendation[];    // At least 5 items
  foodsToAvoid: FoodRecommendation[];      // At least 5 items
  generalGuidance: string[];               // 3-5 general guidelines
}
```

## Usage

### Basic Usage

```typescript
import { generateDietRecommendations } from './diet-recommender';

const recommendations = await generateDietRecommendations({
  diagnosis: 'Type 2 Diabetes',
  patientAge: 45,
  patientGender: 'male'
});

console.log(recommendations.foodsToConsume);
console.log(recommendations.foodsToAvoid);
console.log(recommendations.generalGuidance);
```

### With Allergies

```typescript
const recommendations = await generateDietRecommendations({
  diagnosis: 'Hypertension',
  patientAge: 55,
  patientGender: 'female',
  allergies: ['peanuts', 'shellfish', 'dairy']
});

// Allergies are automatically excluded from foodsToConsume
// and included in foodsToAvoid with reasons
```

### Formatted Output

```typescript
import { formatDietRecommendations } from './diet-recommender';

const formatted = formatDietRecommendations(recommendations);
console.log(formatted);

// Output:
// DIET RECOMMENDATIONS
//
// FOODS TO CONSUME:
// 1. Leafy greens
//    Portion: 2 cups
//    Frequency: daily
//    Benefit: Rich in fiber and nutrients
// ...
```

## Integration with Lifestyle Recommender

The diet recommender is integrated into the lifestyle recommender Lambda:

```typescript
import { generateDietRecommendations } from '../shared/diet-recommender';

const dietRecommendations = await generateDietRecommendations({
  diagnosis,
  patientAge: age,
  patientGender: gender,
  allergies
});

// Include in lifestyle recommendations
const lifestyleRecommendations = {
  diet: dietRecommendations,
  activitiesToAvoid: [...],
  dailyLifeModifications: [...],
  recoveryTips: [...]
};
```

## Validation

The module includes comprehensive validation:

### Structure Validation
- Ensures `foodsToConsume` has at least 5 items
- Ensures `foodsToAvoid` has at least 5 items
- Ensures `generalGuidance` has at least 3 items
- Validates all required fields are present

### Allergy Safety Validation
- Checks that no allergens appear in `foodsToConsume`
- Throws error if allergen is found in recommendations
- Case-insensitive matching for safety

### Example Validation Error

```typescript
// If AI recommends peanuts for a patient allergic to peanuts:
throw new Error(
  'Validation failed: Recommended food "Peanut butter" contains allergen "peanuts"'
);
```

## Error Handling

The module handles various error scenarios:

1. **AI Service Errors**: Retries with exponential backoff
2. **Invalid JSON**: Parses and validates AI response
3. **Missing Fields**: Validates required fields are present
4. **Allergy Violations**: Prevents allergen recommendations
5. **Insufficient Items**: Ensures minimum recommendation counts

## Testing

### Manual Testing

Run the test script:

```bash
npx ts-node lambda/shared/test-diet-recommender.ts
```

This tests:
- Basic recommendations without allergies
- Recommendations with multiple allergies
- Different diagnoses
- Allergy exclusion validation
- Portion size and frequency inclusion

### Expected Output

```
✓ Successfully generated recommendations
  - Foods to consume: 5+ items
  - Foods to avoid: 5+ items
  - General guidance: 3+ items
  - Items with portion sizes: 3+
  - Items with frequency: 3+
  - Peanuts in avoid list: ✓
  - Peanuts NOT in consume list: ✓
```

## AI Prompt Design

The module uses carefully crafted prompts to ensure quality:

### System Prompt
- Defines role as medical nutrition expert
- Specifies exact JSON structure required
- Emphasizes allergy safety
- Requests specific, actionable recommendations

### User Prompt
- Includes diagnosis, age, gender
- Highlights allergies with CRITICAL warning
- Requests JSON format output

### Allergy Warning
```
CRITICAL: Patient has the following allergies: peanuts, shellfish
DO NOT recommend any of these foods or foods containing these ingredients.
ENSURE these allergens appear in the foodsToAvoid list.
```

## Performance

- **Response Time**: Typically 3-8 seconds
- **Token Usage**: ~1500-2000 tokens per request
- **Retry Logic**: Up to 3 attempts with exponential backoff
- **Timeout**: 30 seconds default

## Best Practices

1. **Always Include Allergies**: Pass patient allergies to ensure safety
2. **Handle Errors**: Wrap calls in try-catch blocks
3. **Validate Output**: Trust but verify AI recommendations
4. **Log Results**: Log for debugging and monitoring
5. **Cache When Possible**: Consider caching for same diagnosis/profile

## Example Output

```json
{
  "foodsToConsume": [
    {
      "food": "Leafy green vegetables (spinach, kale)",
      "portionSize": "2 cups",
      "frequency": "daily",
      "reason": "Rich in fiber, vitamins, and minerals"
    },
    {
      "food": "Whole grains (brown rice, quinoa)",
      "portionSize": "1/2 cup cooked",
      "frequency": "twice daily"
    }
  ],
  "foodsToAvoid": [
    {
      "food": "Sugary beverages",
      "reason": "Causes rapid blood sugar spikes"
    },
    {
      "food": "Processed meats",
      "reason": "High in sodium and unhealthy fats"
    }
  ],
  "generalGuidance": [
    "Eat meals at regular times to maintain stable blood sugar",
    "Stay hydrated with 8-10 glasses of water daily",
    "Monitor portion sizes to avoid overeating"
  ]
}
```

## Future Enhancements

Potential improvements:
- Support for specific dietary preferences (vegetarian, vegan)
- Integration with nutrition databases for detailed nutritional info
- Meal planning suggestions
- Recipe recommendations
- Cultural/regional food preferences
- Interaction checking with medications

## Related Modules

- `gemini-client.ts`: AI service integration
- `lifestyle-recommender/index.ts`: Main lifestyle recommendations Lambda
- `patient-db.ts`: Patient profile and allergy data

## Support

For issues or questions:
1. Check the test script output
2. Review error logs for validation failures
3. Verify GEMINI_API_KEY is set
4. Ensure patient data is complete and valid

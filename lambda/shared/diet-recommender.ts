// Diet Recommender Module
// Generates AI-powered diet recommendations based on diagnosis and patient profile
// Requirements: 16.1, 16.2, 16.3, 16.4

import { callGeminiJson } from './gemini-client';

/**
 * Represents a single food recommendation with details
 */
export interface FoodRecommendation {
  food: string;
  portionSize?: string;
  frequency?: string;
  reason?: string;
}

/**
 * Complete diet recommendations structure
 */
export interface DietRecommendations {
  foodsToConsume: FoodRecommendation[];
  foodsToAvoid: FoodRecommendation[];
  generalGuidance: string[];
}

/**
 * Input parameters for generating diet recommendations
 */
export interface DietRecommendationInput {
  diagnosis: string;
  patientAge: number;
  patientGender: string;
  allergies?: string[];
}

/**
 * Generate personalized diet recommendations using AI
 * 
 * @param input - Patient information and diagnosis
 * @returns Structured diet recommendations with foods to consume and avoid
 * 
 * Requirements:
 * - 16.1: Generate diet recommendations specific to diagnosed disease
 * - 16.2: Include foods to consume and foods to avoid
 * - 16.3: Specify portion sizes or frequency where medically relevant
 * - 16.4: Consider common dietary restrictions and allergies
 */
export async function generateDietRecommendations(
  input: DietRecommendationInput
): Promise<DietRecommendations> {
  const { diagnosis, patientAge, patientGender, allergies = [] } = input;

  const systemPrompt = `You are a medical nutrition expert. Generate personalized diet recommendations for a patient based on their diagnosis and profile.

IMPORTANT: Return ONLY valid JSON without any markdown formatting, code blocks, or additional text.

The response must include:
1. foodsToConsume: Array of at least 5 food recommendations with:
   - food: Name of the food item
   - portionSize: Specific portion guidance (e.g., "1 cup", "100g", "2 servings")
   - frequency: How often to consume (e.g., "daily", "twice daily", "3 times per week")
   - reason: Brief explanation of health benefit (optional)

2. foodsToAvoid: Array of at least 5 foods to avoid with:
   - food: Name of the food item
   - reason: Why it should be avoided

3. generalGuidance: Array of 3-5 general dietary guidelines

CRITICAL REQUIREMENTS:
- DO NOT recommend any foods that match the patient's allergies
- If a patient is allergic to a food, it MUST appear in foodsToAvoid
- Provide specific, actionable recommendations
- Use clear, non-technical language
- Include portion sizes where medically relevant
- Consider age and gender in recommendations`;

  const allergyWarning = allergies.length > 0 
    ? `\n\nCRITICAL: Patient has the following allergies: ${allergies.join(', ')}
DO NOT recommend any of these foods or foods containing these ingredients.
ENSURE these allergens appear in the foodsToAvoid list.`
    : '';

  const userPrompt = `Generate diet recommendations for:
- Diagnosis: ${diagnosis}
- Patient Age: ${patientAge}
- Patient Gender: ${patientGender}${allergyWarning}

Provide specific, actionable diet recommendations in JSON format.`;

  try {
    const response = await callGeminiJson<DietRecommendations>(
      systemPrompt,
      userPrompt,
      ['foodsToConsume', 'foodsToAvoid', 'generalGuidance'],
      { maxTokens: 2000, temperature: 0.7 }
    );

    // Validate structure
    validateDietRecommendations(response, allergies);

    return response;
  } catch (error) {
    console.error('Error generating diet recommendations:', error);
    throw new Error('Failed to generate diet recommendations');
  }
}

/**
 * Validate diet recommendations structure and content
 * 
 * @param recommendations - The generated recommendations
 * @param allergies - Patient allergies to check against
 * @throws Error if validation fails
 */
function validateDietRecommendations(
  recommendations: DietRecommendations,
  allergies: string[]
): void {
  // Validate foodsToConsume
  if (!Array.isArray(recommendations.foodsToConsume) || recommendations.foodsToConsume.length < 5) {
    throw new Error('foodsToConsume must contain at least 5 items');
  }

  // Validate each food to consume has required fields
  for (const food of recommendations.foodsToConsume) {
    if (!food.food || typeof food.food !== 'string') {
      throw new Error('Each food recommendation must have a food name');
    }
  }

  // Validate foodsToAvoid
  if (!Array.isArray(recommendations.foodsToAvoid) || recommendations.foodsToAvoid.length < 5) {
    throw new Error('foodsToAvoid must contain at least 5 items');
  }

  // Validate each food to avoid has required fields
  for (const food of recommendations.foodsToAvoid) {
    if (!food.food || typeof food.food !== 'string') {
      throw new Error('Each food to avoid must have a food name');
    }
  }

  // Validate generalGuidance
  if (!Array.isArray(recommendations.generalGuidance) || recommendations.generalGuidance.length < 3) {
    throw new Error('generalGuidance must contain at least 3 items');
  }

  // Check that allergies are not in foodsToConsume
  if (allergies.length > 0) {
    const allergyLower = allergies.map(a => a.toLowerCase());
    
    for (const food of recommendations.foodsToConsume) {
      const foodLower = food.food.toLowerCase();
      
      for (const allergy of allergyLower) {
        if (foodLower.includes(allergy)) {
          throw new Error(
            `Validation failed: Recommended food "${food.food}" contains allergen "${allergy}"`
          );
        }
      }
    }
  }
}

/**
 * Format diet recommendations as plain text for display
 * 
 * @param recommendations - The diet recommendations to format
 * @returns Formatted string representation
 */
export function formatDietRecommendations(recommendations: DietRecommendations): string {
  let output = 'DIET RECOMMENDATIONS\n\n';

  // Foods to Consume
  output += 'FOODS TO CONSUME:\n';
  recommendations.foodsToConsume.forEach((food, index) => {
    output += `${index + 1}. ${food.food}\n`;
    if (food.portionSize) {
      output += `   Portion: ${food.portionSize}\n`;
    }
    if (food.frequency) {
      output += `   Frequency: ${food.frequency}\n`;
    }
    if (food.reason) {
      output += `   Benefit: ${food.reason}\n`;
    }
    output += '\n';
  });

  // Foods to Avoid
  output += '\nFOODS TO AVOID:\n';
  recommendations.foodsToAvoid.forEach((food, index) => {
    output += `${index + 1}. ${food.food}\n`;
    if (food.reason) {
      output += `   Reason: ${food.reason}\n`;
    }
    output += '\n';
  });

  // General Guidance
  output += '\nGENERAL DIETARY GUIDANCE:\n';
  recommendations.generalGuidance.forEach((guidance, index) => {
    output += `${index + 1}. ${guidance}\n`;
  });

  return output;
}

// Usage example for diet recommender module
// This file demonstrates how to use the diet recommender in your Lambda functions

import { 
  generateDietRecommendations, 
  formatDietRecommendations,
  DietRecommendations,
  DietRecommendationInput 
} from './diet-recommender';

/**
 * Example 1: Generate diet recommendations for a diabetic patient
 */
async function example1_BasicUsage() {
  console.log('Example 1: Basic diet recommendations for diabetes');
  
  const input: DietRecommendationInput = {
    diagnosis: 'Type 2 Diabetes',
    patientAge: 45,
    patientGender: 'male'
  };

  const recommendations = await generateDietRecommendations(input);
  
  console.log('Foods to consume:', recommendations.foodsToConsume.length);
  console.log('Foods to avoid:', recommendations.foodsToAvoid.length);
  console.log('General guidance:', recommendations.generalGuidance.length);
  
  // Access specific recommendations
  console.log('\nFirst food to consume:');
  console.log('  Food:', recommendations.foodsToConsume[0].food);
  console.log('  Portion:', recommendations.foodsToConsume[0].portionSize);
  console.log('  Frequency:', recommendations.foodsToConsume[0].frequency);
}

/**
 * Example 2: Generate diet recommendations with allergies
 */
async function example2_WithAllergies() {
  console.log('Example 2: Diet recommendations with allergies');
  
  const input: DietRecommendationInput = {
    diagnosis: 'Hypertension',
    patientAge: 55,
    patientGender: 'female',
    allergies: ['peanuts', 'shellfish', 'dairy']
  };

  const recommendations = await generateDietRecommendations(input);
  
  // The module automatically ensures allergies are not in foodsToConsume
  // and validates that allergies appear in foodsToAvoid
  
  console.log('Generated recommendations safely exclude all allergens');
  console.log('Foods to avoid includes allergens:', 
    recommendations.foodsToAvoid.filter(f => 
      f.food.toLowerCase().includes('peanut') ||
      f.food.toLowerCase().includes('shellfish') ||
      f.food.toLowerCase().includes('dairy')
    ).length > 0
  );
}

/**
 * Example 3: Format recommendations for display
 */
async function example3_FormattedOutput() {
  console.log('Example 3: Formatted output for display');
  
  const input: DietRecommendationInput = {
    diagnosis: 'High Cholesterol',
    patientAge: 50,
    patientGender: 'male'
  };

  const recommendations = await generateDietRecommendations(input);
  
  // Format as plain text for display or printing
  const formatted = formatDietRecommendations(recommendations);
  console.log(formatted);
}

/**
 * Example 4: Use in Lambda handler
 */
async function example4_LambdaIntegration() {
  console.log('Example 4: Integration in Lambda handler');
  
  // Simulated Lambda event data
  const patientData = {
    patientId: 'patient-123',
    diagnosis: 'Type 2 Diabetes',
    age: 45,
    gender: 'male',
    allergies: ['gluten']
  };

  try {
    const recommendations = await generateDietRecommendations({
      diagnosis: patientData.diagnosis,
      patientAge: patientData.age,
      patientGender: patientData.gender,
      allergies: patientData.allergies
    });

    // Store in DynamoDB or return to client
    const response = {
      patientId: patientData.patientId,
      diet: recommendations,
      generatedAt: new Date().toISOString()
    };

    console.log('Successfully generated and ready to store:', response);
    
    return response;
  } catch (error) {
    console.error('Failed to generate diet recommendations:', error);
    throw error;
  }
}

/**
 * Example 5: Access specific recommendation details
 */
async function example5_AccessDetails() {
  console.log('Example 5: Accessing specific recommendation details');
  
  const recommendations = await generateDietRecommendations({
    diagnosis: 'Hypertension',
    patientAge: 60,
    patientGender: 'female'
  });

  // Iterate through foods to consume
  console.log('\nFoods to consume with portions:');
  recommendations.foodsToConsume
    .filter(f => f.portionSize)
    .forEach(food => {
      console.log(`- ${food.food}: ${food.portionSize} (${food.frequency || 'as needed'})`);
    });

  // Iterate through foods to avoid
  console.log('\nFoods to avoid with reasons:');
  recommendations.foodsToAvoid
    .filter(f => f.reason)
    .forEach(food => {
      console.log(`- ${food.food}: ${food.reason}`);
    });

  // Display general guidance
  console.log('\nGeneral dietary guidance:');
  recommendations.generalGuidance.forEach((guidance, i) => {
    console.log(`${i + 1}. ${guidance}`);
  });
}

// Export examples for testing
export {
  example1_BasicUsage,
  example2_WithAllergies,
  example3_FormattedOutput,
  example4_LambdaIntegration,
  example5_AccessDetails
};

// Test script for diet recommender module
// Run with: npx ts-node lambda/shared/test-diet-recommender.ts

import { generateDietRecommendations, formatDietRecommendations } from './diet-recommender';

async function testDietRecommender() {
  console.log('=== Testing Diet Recommender Module ===\n');

  // Test 1: Basic diet recommendations without allergies
  console.log('Test 1: Diabetes diet recommendations (no allergies)');
  console.log('---------------------------------------------------');
  try {
    const result1 = await generateDietRecommendations({
      diagnosis: 'Type 2 Diabetes',
      patientAge: 45,
      patientGender: 'male'
    });

    console.log('✓ Successfully generated recommendations');
    console.log(`  - Foods to consume: ${result1.foodsToConsume.length} items`);
    console.log(`  - Foods to avoid: ${result1.foodsToAvoid.length} items`);
    console.log(`  - General guidance: ${result1.generalGuidance.length} items`);
    
    // Check for portion sizes and frequency
    const withPortions = result1.foodsToConsume.filter(f => f.portionSize).length;
    const withFrequency = result1.foodsToConsume.filter(f => f.frequency).length;
    console.log(`  - Items with portion sizes: ${withPortions}`);
    console.log(`  - Items with frequency: ${withFrequency}`);
    
    console.log('\nFormatted output:');
    console.log(formatDietRecommendations(result1));
  } catch (error) {
    console.error('✗ Test 1 failed:', error);
  }

  // Test 2: Diet recommendations with allergies
  console.log('\n\nTest 2: Hypertension diet recommendations (with peanut allergy)');
  console.log('----------------------------------------------------------------');
  try {
    const result2 = await generateDietRecommendations({
      diagnosis: 'Hypertension',
      patientAge: 55,
      patientGender: 'female',
      allergies: ['peanuts', 'shellfish']
    });

    console.log('✓ Successfully generated recommendations');
    console.log(`  - Foods to consume: ${result2.foodsToConsume.length} items`);
    console.log(`  - Foods to avoid: ${result2.foodsToAvoid.length} items`);
    
    // Check that allergies are in avoid list
    const avoidList = result2.foodsToAvoid.map(f => f.food.toLowerCase()).join(' ');
    const hasPeanuts = avoidList.includes('peanut');
    const hasShellfish = avoidList.includes('shellfish') || avoidList.includes('shrimp') || avoidList.includes('crab');
    
    console.log(`  - Peanuts in avoid list: ${hasPeanuts ? '✓' : '✗'}`);
    console.log(`  - Shellfish in avoid list: ${hasShellfish ? '✓' : '✗'}`);
    
    // Check that allergies are NOT in consume list
    const consumeList = result2.foodsToConsume.map(f => f.food.toLowerCase()).join(' ');
    const consumeHasPeanuts = consumeList.includes('peanut');
    const consumeHasShellfish = consumeList.includes('shellfish') || consumeList.includes('shrimp') || consumeList.includes('crab');
    
    console.log(`  - Peanuts NOT in consume list: ${!consumeHasPeanuts ? '✓' : '✗'}`);
    console.log(`  - Shellfish NOT in consume list: ${!consumeHasShellfish ? '✓' : '✗'}`);
    
    console.log('\nSample foods to consume:');
    result2.foodsToConsume.slice(0, 3).forEach(food => {
      console.log(`  - ${food.food}`);
      if (food.portionSize) console.log(`    Portion: ${food.portionSize}`);
      if (food.frequency) console.log(`    Frequency: ${food.frequency}`);
    });
    
    console.log('\nSample foods to avoid:');
    result2.foodsToAvoid.slice(0, 3).forEach(food => {
      console.log(`  - ${food.food}`);
      if (food.reason) console.log(`    Reason: ${food.reason}`);
    });
  } catch (error) {
    console.error('✗ Test 2 failed:', error);
  }

  // Test 3: Different diagnosis
  console.log('\n\nTest 3: High cholesterol diet recommendations');
  console.log('----------------------------------------------');
  try {
    const result3 = await generateDietRecommendations({
      diagnosis: 'High Cholesterol',
      patientAge: 50,
      patientGender: 'male',
      allergies: ['dairy']
    });

    console.log('✓ Successfully generated recommendations');
    console.log(`  - Foods to consume: ${result3.foodsToConsume.length} items`);
    console.log(`  - Foods to avoid: ${result3.foodsToAvoid.length} items`);
    console.log(`  - General guidance: ${result3.generalGuidance.length} items`);
    
    console.log('\nGeneral guidance:');
    result3.generalGuidance.forEach((guidance, i) => {
      console.log(`  ${i + 1}. ${guidance}`);
    });
  } catch (error) {
    console.error('✗ Test 3 failed:', error);
  }

  console.log('\n=== All Tests Complete ===');
}

// Run tests
testDietRecommender().catch(console.error);

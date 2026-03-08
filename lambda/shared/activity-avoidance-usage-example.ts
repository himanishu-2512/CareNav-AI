// Activity Avoidance Usage Example
// Demonstrates how to use the activity avoidance recommender module

import { 
  generateActivityAvoidanceRecommendations,
  formatActivityAvoidanceRecommendations,
  ActivityAvoidanceInput,
  ActivityAvoidanceRecommendations
} from './activity-avoidance';

/**
 * Example 1: Generate activity avoidance recommendations for a patient with a fracture
 */
async function example1_FracturedBone() {
  console.log('Example 1: Fractured Bone\n');

  const input: ActivityAvoidanceInput = {
    diagnosis: 'Fractured left tibia (shin bone)',
    patientAge: 28,
    patientGender: 'male'
  };

  try {
    const recommendations = await generateActivityAvoidanceRecommendations(input);
    
    console.log('Structured Data:');
    console.log(JSON.stringify(recommendations, null, 2));
    
    console.log('\n\nFormatted for Display:');
    console.log(formatActivityAvoidanceRecommendations(recommendations));
    
    // Access individual recommendations
    console.log('\n\nCritical Activities to Avoid:');
    const critical = recommendations.activitiesToAvoid.filter(a => a.priority === 'critical');
    critical.forEach(activity => {
      console.log(`- ${activity.activity}: ${activity.reason} (${activity.duration})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example 2: Generate recommendations for a cardiac patient
 */
async function example2_HeartCondition() {
  console.log('\n\nExample 2: Heart Condition\n');

  const input: ActivityAvoidanceInput = {
    diagnosis: 'Acute myocardial infarction (heart attack)',
    patientAge: 62,
    patientGender: 'female'
  };

  try {
    const recommendations = await generateActivityAvoidanceRecommendations(input);
    
    console.log('Formatted Output:');
    console.log(formatActivityAvoidanceRecommendations(recommendations));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example 3: Integration with treatment episode
 */
async function example3_IntegrationWithTreatment() {
  console.log('\n\nExample 3: Integration with Treatment Episode\n');

  // Simulated treatment episode data
  const treatmentEpisode = {
    episodeId: 'episode-123',
    patientId: 'patient-456',
    diagnosis: 'Herniated lumbar disc (L4-L5)',
    patientAge: 45,
    patientGender: 'male'
  };

  try {
    // Generate recommendations as part of treatment
    const recommendations = await generateActivityAvoidanceRecommendations({
      diagnosis: treatmentEpisode.diagnosis,
      patientAge: treatmentEpisode.patientAge,
      patientGender: treatmentEpisode.patientGender
    });

    // Store recommendations with treatment episode
    const treatmentData = {
      ...treatmentEpisode,
      activityRecommendations: recommendations,
      recommendationsGeneratedAt: new Date().toISOString()
    };

    console.log('Treatment Episode with Recommendations:');
    console.log(JSON.stringify(treatmentData, null, 2));
    
    // Display to patient
    console.log('\n\nPatient-Facing Display:');
    console.log(formatActivityAvoidanceRecommendations(recommendations));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example 4: Filtering recommendations by priority
 */
async function example4_FilterByPriority() {
  console.log('\n\nExample 4: Filter by Priority\n');

  const input: ActivityAvoidanceInput = {
    diagnosis: 'Severe asthma exacerbation',
    patientAge: 35,
    patientGender: 'female'
  };

  try {
    const recommendations = await generateActivityAvoidanceRecommendations(input);
    
    // Show only critical activities
    console.log('CRITICAL ACTIVITIES ONLY:');
    const critical = recommendations.activitiesToAvoid.filter(a => a.priority === 'critical');
    critical.forEach((activity, index) => {
      console.log(`${index + 1}. ${activity.activity}`);
      console.log(`   Reason: ${activity.reason}`);
      console.log(`   Duration: ${activity.duration}\n`);
    });
    
    // Count by priority
    const priorityCounts = {
      critical: recommendations.activitiesToAvoid.filter(a => a.priority === 'critical').length,
      high: recommendations.activitiesToAvoid.filter(a => a.priority === 'high').length,
      medium: recommendations.activitiesToAvoid.filter(a => a.priority === 'medium').length
    };
    
    console.log('\nPriority Distribution:');
    console.log(`Critical: ${priorityCounts.critical}`);
    console.log(`High: ${priorityCounts.high}`);
    console.log(`Medium: ${priorityCounts.medium}`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example 5: Error handling
 */
async function example5_ErrorHandling() {
  console.log('\n\nExample 5: Error Handling\n');

  const input: ActivityAvoidanceInput = {
    diagnosis: 'Common cold',
    patientAge: 30,
    patientGender: 'male'
  };

  try {
    const recommendations = await generateActivityAvoidanceRecommendations(input);
    console.log('Recommendations generated successfully');
    console.log(`Total activities: ${recommendations.activitiesToAvoid.length}`);
    
  } catch (error) {
    console.error('Failed to generate recommendations:', error);
    
    // Provide fallback or retry logic
    console.log('\nRetrying with adjusted parameters...');
    // Implement retry logic here
  }
}

// Run examples
async function runAllExamples() {
  console.log('Activity Avoidance Recommender - Usage Examples');
  console.log('='.repeat(60));
  
  await example1_FracturedBone();
  await example2_HeartCondition();
  await example3_IntegrationWithTreatment();
  await example4_FilterByPriority();
  await example5_ErrorHandling();
  
  console.log('\n' + '='.repeat(60));
  console.log('All examples completed!');
}

// Uncomment to run:
// runAllExamples().catch(console.error);

export {
  example1_FracturedBone,
  example2_HeartCondition,
  example3_IntegrationWithTreatment,
  example4_FilterByPriority,
  example5_ErrorHandling
};

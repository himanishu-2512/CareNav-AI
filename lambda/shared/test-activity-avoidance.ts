// Test script for activity avoidance recommendations
// Run with: npx ts-node lambda/shared/test-activity-avoidance.ts

import { 
  generateActivityAvoidanceRecommendations,
  formatActivityAvoidanceRecommendations,
  ActivityAvoidanceInput
} from './activity-avoidance';

async function testActivityAvoidance() {
  console.log('Testing Activity Avoidance Recommendations Module\n');
  console.log('='.repeat(60));

  // Test case 1: Fractured bone
  console.log('\n\nTest Case 1: Fractured Arm');
  console.log('-'.repeat(60));
  
  const input1: ActivityAvoidanceInput = {
    diagnosis: 'Fractured right radius (forearm bone)',
    patientAge: 35,
    patientGender: 'male'
  };

  try {
    const recommendations1 = await generateActivityAvoidanceRecommendations(input1);
    console.log('\nGenerated Recommendations:');
    console.log(JSON.stringify(recommendations1, null, 2));
    
    console.log('\n\nFormatted Output:');
    console.log(formatActivityAvoidanceRecommendations(recommendations1));
    
    // Validate structure
    console.log('\nValidation:');
    console.log(`✓ Total activities: ${recommendations1.activitiesToAvoid.length}`);
    
    const criticalCount = recommendations1.activitiesToAvoid.filter(a => a.priority === 'critical').length;
    const highCount = recommendations1.activitiesToAvoid.filter(a => a.priority === 'high').length;
    const mediumCount = recommendations1.activitiesToAvoid.filter(a => a.priority === 'medium').length;
    
    console.log(`✓ Critical priority: ${criticalCount}`);
    console.log(`✓ High priority: ${highCount}`);
    console.log(`✓ Medium priority: ${mediumCount}`);
    
    // Check sorting
    let properlyOrdered = true;
    for (let i = 0; i < recommendations1.activitiesToAvoid.length - 1; i++) {
      const current = recommendations1.activitiesToAvoid[i];
      const next = recommendations1.activitiesToAvoid[i + 1];
      const priorityOrder = { critical: 0, high: 1, medium: 2 };
      
      if (priorityOrder[current.priority] > priorityOrder[next.priority]) {
        properlyOrdered = false;
        break;
      }
    }
    console.log(`✓ Properly sorted by priority: ${properlyOrdered ? 'Yes' : 'No'}`);
    
  } catch (error) {
    console.error('❌ Test Case 1 Failed:', error);
  }

  // Test case 2: Heart condition
  console.log('\n\n' + '='.repeat(60));
  console.log('\n\nTest Case 2: Hypertension (High Blood Pressure)');
  console.log('-'.repeat(60));
  
  const input2: ActivityAvoidanceInput = {
    diagnosis: 'Hypertension (high blood pressure)',
    patientAge: 58,
    patientGender: 'female'
  };

  try {
    const recommendations2 = await generateActivityAvoidanceRecommendations(input2);
    console.log('\nGenerated Recommendations:');
    console.log(JSON.stringify(recommendations2, null, 2));
    
    console.log('\n\nFormatted Output:');
    console.log(formatActivityAvoidanceRecommendations(recommendations2));
    
    // Validate structure
    console.log('\nValidation:');
    console.log(`✓ Total activities: ${recommendations2.activitiesToAvoid.length}`);
    
    const criticalCount = recommendations2.activitiesToAvoid.filter(a => a.priority === 'critical').length;
    const highCount = recommendations2.activitiesToAvoid.filter(a => a.priority === 'high').length;
    const mediumCount = recommendations2.activitiesToAvoid.filter(a => a.priority === 'medium').length;
    
    console.log(`✓ Critical priority: ${criticalCount}`);
    console.log(`✓ High priority: ${highCount}`);
    console.log(`✓ Medium priority: ${mediumCount}`);
    
  } catch (error) {
    console.error('❌ Test Case 2 Failed:', error);
  }

  // Test case 3: Respiratory condition
  console.log('\n\n' + '='.repeat(60));
  console.log('\n\nTest Case 3: Pneumonia');
  console.log('-'.repeat(60));
  
  const input3: ActivityAvoidanceInput = {
    diagnosis: 'Bacterial pneumonia',
    patientAge: 42,
    patientGender: 'male'
  };

  try {
    const recommendations3 = await generateActivityAvoidanceRecommendations(input3);
    console.log('\nGenerated Recommendations:');
    console.log(JSON.stringify(recommendations3, null, 2));
    
    console.log('\n\nFormatted Output:');
    console.log(formatActivityAvoidanceRecommendations(recommendations3));
    
    // Validate all required fields are present
    console.log('\nValidation:');
    const allHaveRequiredFields = recommendations3.activitiesToAvoid.every(a => 
      a.activity && a.reason && a.duration && a.priority
    );
    console.log(`✓ All activities have required fields: ${allHaveRequiredFields ? 'Yes' : 'No'}`);
    
  } catch (error) {
    console.error('❌ Test Case 3 Failed:', error);
  }

  console.log('\n\n' + '='.repeat(60));
  console.log('\nAll tests completed!');
}

// Run tests
testActivityAvoidance().catch(console.error);

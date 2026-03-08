// Test script for recovery recommender module
// Run with: npx ts-node lambda/shared/test-recovery-recommender.ts

import { 
  generateRecoveryRecommendations,
  formatRecoveryRecommendations,
  RecoveryRecommendationInput
} from './recovery-recommender';

async function testRecoveryRecommender() {
  console.log('Testing Recovery Recommender Module\n');
  console.log('═'.repeat(60));

  // Test case 1: Type 2 Diabetes
  console.log('\nTest Case 1: Type 2 Diabetes');
  console.log('─'.repeat(60));
  
  const diabetesInput: RecoveryRecommendationInput = {
    diagnosis: 'Type 2 Diabetes Mellitus',
    patientAge: 55,
    patientGender: 'male'
  };

  try {
    const diabetesRecommendations = await generateRecoveryRecommendations(diabetesInput);
    
    console.log('\n✅ Successfully generated recommendations');
    console.log(`   Daily Life Modifications: ${diabetesRecommendations.dailyLifeModifications.length}`);
    console.log(`   Recovery Tips: ${diabetesRecommendations.recoveryTips.length}`);
    
    // Validate category distribution
    const sleepMods = diabetesRecommendations.dailyLifeModifications.filter(m => m.category === 'sleep').length;
    const stressMods = diabetesRecommendations.dailyLifeModifications.filter(m => m.category === 'stress_management').length;
    const activityMods = diabetesRecommendations.dailyLifeModifications.filter(m => m.category === 'physical_activity').length;
    
    console.log(`\n   Category Distribution:`);
    console.log(`   - Sleep: ${sleepMods}`);
    console.log(`   - Stress Management: ${stressMods}`);
    console.log(`   - Physical Activity: ${activityMods}`);
    
    // Validate tip category distribution
    const warningTips = diabetesRecommendations.recoveryTips.filter(t => t.category === 'warning_signs').length;
    const timelineTips = diabetesRecommendations.recoveryTips.filter(t => t.category === 'timeline').length;
    const monitoringTips = diabetesRecommendations.recoveryTips.filter(t => t.category === 'monitoring').length;
    const followUpTips = diabetesRecommendations.recoveryTips.filter(t => t.category === 'follow_up').length;
    
    console.log(`\n   Recovery Tip Distribution:`);
    console.log(`   - Warning Signs: ${warningTips}`);
    console.log(`   - Timeline: ${timelineTips}`);
    console.log(`   - Monitoring: ${monitoringTips}`);
    console.log(`   - Follow-up: ${followUpTips}`);
    
    // Display formatted output
    console.log('\n' + '═'.repeat(60));
    console.log('FORMATTED OUTPUT:');
    console.log('═'.repeat(60));
    console.log(formatRecoveryRecommendations(diabetesRecommendations));
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  }

  // Test case 2: Hypertension
  console.log('\n' + '═'.repeat(60));
  console.log('\nTest Case 2: Hypertension');
  console.log('─'.repeat(60));
  
  const hypertensionInput: RecoveryRecommendationInput = {
    diagnosis: 'Essential Hypertension (High Blood Pressure)',
    patientAge: 48,
    patientGender: 'female'
  };

  try {
    const hypertensionRecommendations = await generateRecoveryRecommendations(hypertensionInput);
    
    console.log('\n✅ Successfully generated recommendations');
    console.log(`   Daily Life Modifications: ${hypertensionRecommendations.dailyLifeModifications.length}`);
    console.log(`   Recovery Tips: ${hypertensionRecommendations.recoveryTips.length}`);
    
    // Show first few modifications
    console.log('\n   Sample Daily Life Modifications:');
    hypertensionRecommendations.dailyLifeModifications.slice(0, 3).forEach((mod, i) => {
      console.log(`   ${i + 1}. ${mod.modification} (${mod.category}, ${mod.expectedImpact} impact)`);
      console.log(`      ${mod.specificGuidance}`);
    });
    
    // Show first few recovery tips
    console.log('\n   Sample Recovery Tips:');
    hypertensionRecommendations.recoveryTips.slice(0, 3).forEach((tip, i) => {
      console.log(`   ${i + 1}. [${tip.category}] ${tip.tip}`);
      console.log(`      ${tip.description}`);
    });
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  }

  // Test case 3: Acute Bronchitis
  console.log('\n' + '═'.repeat(60));
  console.log('\nTest Case 3: Acute Bronchitis');
  console.log('─'.repeat(60));
  
  const bronchitisInput: RecoveryRecommendationInput = {
    diagnosis: 'Acute Bronchitis',
    patientAge: 32,
    patientGender: 'male'
  };

  try {
    const bronchitisRecommendations = await generateRecoveryRecommendations(bronchitisInput);
    
    console.log('\n✅ Successfully generated recommendations');
    console.log(`   Daily Life Modifications: ${bronchitisRecommendations.dailyLifeModifications.length}`);
    console.log(`   Recovery Tips: ${bronchitisRecommendations.recoveryTips.length}`);
    
    // Verify sorting by impact and difficulty
    console.log('\n   Verifying sorting (by impact, then difficulty):');
    bronchitisRecommendations.dailyLifeModifications.slice(0, 5).forEach((mod, i) => {
      console.log(`   ${i + 1}. ${mod.modification}`);
      console.log(`      Impact: ${mod.expectedImpact}, Difficulty: ${mod.difficulty}`);
    });
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  }

  console.log('\n' + '═'.repeat(60));
  console.log('✅ All tests completed successfully!');
  console.log('═'.repeat(60));
}

// Run tests
testRecoveryRecommender().catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});

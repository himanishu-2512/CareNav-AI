// Recovery Recommender Usage Example
// This file demonstrates how to use the recovery recommender module

import { 
  generateRecoveryRecommendations,
  formatRecoveryRecommendations,
  RecoveryRecommendationInput,
  RecoveryRecommendations
} from './recovery-recommender';

/**
 * Example 1: Generate recovery recommendations for a patient
 */
async function example1_BasicUsage() {
  console.log('Example 1: Basic Usage\n');

  const input: RecoveryRecommendationInput = {
    diagnosis: 'Type 2 Diabetes Mellitus',
    patientAge: 55,
    patientGender: 'male'
  };

  try {
    const recommendations = await generateRecoveryRecommendations(input);
    
    console.log('Generated recommendations:');
    console.log(`- ${recommendations.dailyLifeModifications.length} daily life modifications`);
    console.log(`- ${recommendations.recoveryTips.length} recovery tips`);
    
    // Access specific modifications
    console.log('\nHigh impact modifications:');
    recommendations.dailyLifeModifications
      .filter(m => m.expectedImpact === 'high')
      .forEach(mod => {
        console.log(`  • ${mod.modification}: ${mod.specificGuidance}`);
      });
    
    // Access warning signs
    console.log('\nWarning signs:');
    recommendations.recoveryTips
      .filter(t => t.category === 'warning_signs')
      .forEach(tip => {
        console.log(`  ⚠️  ${tip.tip}: ${tip.description}`);
      });
    
  } catch (error) {
    console.error('Error generating recommendations:', error);
  }
}

/**
 * Example 2: Format recommendations for display
 */
async function example2_FormattedOutput() {
  console.log('\nExample 2: Formatted Output\n');

  const input: RecoveryRecommendationInput = {
    diagnosis: 'Essential Hypertension',
    patientAge: 48,
    patientGender: 'female'
  };

  try {
    const recommendations = await generateRecoveryRecommendations(input);
    
    // Get formatted text output
    const formattedText = formatRecoveryRecommendations(recommendations);
    
    console.log(formattedText);
    
    // This formatted text can be:
    // - Displayed in the patient app
    // - Sent via email
    // - Printed as a PDF
    // - Stored in the database
    
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example 3: Filter and categorize recommendations
 */
async function example3_FilteringRecommendations() {
  console.log('\nExample 3: Filtering Recommendations\n');

  const input: RecoveryRecommendationInput = {
    diagnosis: 'Acute Bronchitis',
    patientAge: 32,
    patientGender: 'male'
  };

  try {
    const recommendations = await generateRecoveryRecommendations(input);
    
    // Get only sleep-related modifications
    const sleepModifications = recommendations.dailyLifeModifications
      .filter(m => m.category === 'sleep');
    
    console.log('Sleep Modifications:');
    sleepModifications.forEach(mod => {
      console.log(`  • ${mod.modification}`);
      console.log(`    ${mod.specificGuidance}`);
      console.log(`    Impact: ${mod.expectedImpact}, Difficulty: ${mod.difficulty}\n`);
    });
    
    // Get only easy-to-implement modifications
    const easyModifications = recommendations.dailyLifeModifications
      .filter(m => m.difficulty === 'easy');
    
    console.log('Easy to Implement:');
    easyModifications.forEach(mod => {
      console.log(`  • ${mod.modification} (${mod.category})`);
    });
    
    // Get timeline milestones
    const timelineMilestones = recommendations.recoveryTips
      .filter(t => t.category === 'timeline');
    
    console.log('\nRecovery Timeline:');
    timelineMilestones.forEach(tip => {
      console.log(`  📅 ${tip.tip}`);
      console.log(`     ${tip.description}\n`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example 4: Integration with treatment episode
 */
async function example4_TreatmentIntegration() {
  console.log('\nExample 4: Treatment Episode Integration\n');

  // Simulated patient and episode data
  const patientId = 'patient-123';
  const episodeId = 'episode-456';
  const diagnosis = 'Gastroesophageal Reflux Disease (GERD)';
  
  const input: RecoveryRecommendationInput = {
    diagnosis: diagnosis,
    patientAge: 42,
    patientGender: 'female'
  };

  try {
    // Generate recommendations
    const recommendations = await generateRecoveryRecommendations(input);
    
    // Structure for saving to database
    const recommendationRecord = {
      recommendationId: `rec-${Date.now()}`,
      patientId: patientId,
      episodeId: episodeId,
      diagnosis: diagnosis,
      dailyLifeModifications: recommendations.dailyLifeModifications,
      recoveryTips: recommendations.recoveryTips,
      generatedAt: new Date().toISOString(),
      syncedToPatientApp: false
    };
    
    console.log('Recommendation record ready for database:');
    console.log(JSON.stringify(recommendationRecord, null, 2));
    
    // In a real Lambda handler, you would:
    // 1. Save to DynamoDB
    // 2. Sync to patient app
    // 3. Add to chat thread as a message
    // 4. Send notification to patient
    
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example 5: Handling errors
 */
async function example5_ErrorHandling() {
  console.log('\nExample 5: Error Handling\n');

  const input: RecoveryRecommendationInput = {
    diagnosis: 'Migraine Headache',
    patientAge: 35,
    patientGender: 'female'
  };

  try {
    const recommendations = await generateRecoveryRecommendations(input);
    console.log('✅ Recommendations generated successfully');
    
  } catch (error: any) {
    // Handle different types of errors
    if (error.message.includes('GEMINI_API_KEY')) {
      console.error('❌ API key not configured');
      // Notify admin, use fallback recommendations
    } else if (error.message.includes('timeout')) {
      console.error('❌ AI service timeout');
      // Retry with exponential backoff
    } else if (error.message.includes('validation')) {
      console.error('❌ Validation failed:', error.message);
      // Log for investigation, regenerate
    } else {
      console.error('❌ Unexpected error:', error.message);
      // Log error, return generic recommendations
    }
  }
}

/**
 * Example 6: Customizing recommendations by patient profile
 */
async function example6_PersonalizedRecommendations() {
  console.log('\nExample 6: Personalized Recommendations\n');

  // Young patient
  const youngPatient: RecoveryRecommendationInput = {
    diagnosis: 'Anxiety Disorder',
    patientAge: 25,
    patientGender: 'male'
  };

  // Elderly patient
  const elderlyPatient: RecoveryRecommendationInput = {
    diagnosis: 'Anxiety Disorder',
    patientAge: 72,
    patientGender: 'female'
  };

  try {
    const youngRecommendations = await generateRecoveryRecommendations(youngPatient);
    const elderlyRecommendations = await generateRecoveryRecommendations(elderlyPatient);
    
    console.log('Young patient - Physical activity recommendations:');
    youngRecommendations.dailyLifeModifications
      .filter(m => m.category === 'physical_activity')
      .forEach(mod => console.log(`  • ${mod.specificGuidance}`));
    
    console.log('\nElderly patient - Physical activity recommendations:');
    elderlyRecommendations.dailyLifeModifications
      .filter(m => m.category === 'physical_activity')
      .forEach(mod => console.log(`  • ${mod.specificGuidance}`));
    
    // Note: AI should provide age-appropriate recommendations
    // Young patient: More vigorous activities
    // Elderly patient: Gentler, safer activities
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run examples
async function runAllExamples() {
  await example1_BasicUsage();
  await example2_FormattedOutput();
  await example3_FilteringRecommendations();
  await example4_TreatmentIntegration();
  await example5_ErrorHandling();
  await example6_PersonalizedRecommendations();
}

// Uncomment to run:
// runAllExamples().catch(console.error);

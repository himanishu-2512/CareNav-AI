// Test script for treatment completion summary functionality
import {
  generateTreatmentCompletionSummary,
  storeTreatmentCompletionSummary,
  getTreatmentCompletionSummary,
  getPatientCompletionSummaries,
  completeAndSummarizeTreatment
} from './adherence-calculator';

async function testCompletionSummary() {
  console.log('Testing Treatment Completion Summary Functionality\n');

  // Test data - using existing patient and treatment plan from previous tests
  const patientId = 'test-patient-001';
  const treatmentPlanId = 'test-treatment-001';

  try {
    console.log('1. Generating completion summary...');
    const completionSummary = await generateTreatmentCompletionSummary(
      patientId,
      treatmentPlanId
    );
    console.log('✓ Completion summary generated:');
    console.log(JSON.stringify(completionSummary, null, 2));
    console.log();

    console.log('2. Storing completion summary in DynamoDB...');
    await storeTreatmentCompletionSummary(completionSummary);
    console.log('✓ Completion summary stored successfully');
    console.log();

    console.log('3. Retrieving completion summary from DynamoDB...');
    const retrievedSummary = await getTreatmentCompletionSummary(
      patientId,
      treatmentPlanId
    );
    console.log('✓ Completion summary retrieved:');
    console.log(JSON.stringify(retrievedSummary, null, 2));
    console.log();

    console.log('4. Getting all completion summaries for patient...');
    const allSummaries = await getPatientCompletionSummaries(patientId);
    console.log(`✓ Found ${allSummaries.length} completion summaries for patient`);
    console.log();

    console.log('5. Testing convenience function (completeAndSummarizeTreatment)...');
    const quickSummary = await completeAndSummarizeTreatment(
      patientId,
      treatmentPlanId
    );
    console.log('✓ Treatment completed and summarized:');
    console.log(`   Total Adherence Rate: ${quickSummary.totalAdherenceRate}%`);
    console.log(`   Treatment Duration: ${quickSummary.treatmentDuration}`);
    console.log(`   Total Doses: ${quickSummary.totalScheduledDoses} scheduled, ${quickSummary.totalTakenDoses} taken`);
    console.log();

    console.log('6. Verifying medicine-level details...');
    quickSummary.medicineCompletionDetails.forEach((medicine, index) => {
      console.log(`   Medicine ${index + 1}: ${medicine.medicineName}`);
      console.log(`     - Dosage: ${medicine.dosage}`);
      console.log(`     - Adherence: ${medicine.adherenceRate}%`);
      console.log(`     - Doses: ${medicine.takenDoses}/${medicine.scheduledDoses} taken`);
      console.log(`     - Period: ${medicine.startDate} to ${medicine.stopDate}`);
    });
    console.log();

    console.log('✅ All tests passed successfully!');
    console.log('\nSummary of Implementation:');
    console.log('- ✓ Calculate total adherence rate for completed treatments');
    console.log('- ✓ Store completion summary in DynamoDB');
    console.log('- ✓ Retrieve completion summaries');
    console.log('- ✓ Track medicine-level adherence details');
    console.log('- ✓ Calculate treatment duration');
    console.log('- ✓ Track total scheduled vs taken doses');

  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run the test
testCompletionSummary()
  .then(() => {
    console.log('\n✅ Test script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test script failed:', error);
    process.exit(1);
  });

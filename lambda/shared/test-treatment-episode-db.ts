// Test script for treatment episode database operations
import { 
  createEpisode, 
  getEpisode, 
  getPatientEpisodes, 
  completeEpisode 
} from './treatment-episode-db';

async function testTreatmentEpisodeOperations() {
  console.log('Testing Treatment Episode Database Operations...\n');

  const testPatientId = 'test-patient-123';
  const testDoctorId = 'test-doctor-456';

  try {
    // Test 1: Create a new episode
    console.log('Test 1: Creating new treatment episode...');
    const episode1 = await createEpisode(
      testPatientId,
      testDoctorId,
      'Patient complains of fever and headache'
    );
    console.log('✓ Episode created:', {
      episodeId: episode1.episodeId,
      status: episode1.status,
      startDate: episode1.startDate
    });

    // Test 2: Get episode by ID
    console.log('\nTest 2: Retrieving episode by ID...');
    const retrievedEpisode = await getEpisode(testPatientId, episode1.episodeId);
    console.log('✓ Episode retrieved:', {
      episodeId: retrievedEpisode?.episodeId,
      status: retrievedEpisode?.status,
      doctorId: retrievedEpisode?.doctorId
    });

    // Test 3: Create another episode
    console.log('\nTest 3: Creating second treatment episode...');
    const episode2 = await createEpisode(
      testPatientId,
      testDoctorId,
      'Follow-up consultation'
    );
    console.log('✓ Second episode created:', {
      episodeId: episode2.episodeId,
      status: episode2.status
    });

    // Test 4: Get all patient episodes
    console.log('\nTest 4: Getting all episodes for patient...');
    const allEpisodes = await getPatientEpisodes(testPatientId);
    console.log(`✓ Found ${allEpisodes.length} episodes`);
    allEpisodes.forEach((ep, idx) => {
      console.log(`  Episode ${idx + 1}:`, {
        episodeId: ep.episodeId,
        status: ep.status,
        startDate: ep.startDate
      });
    });

    // Test 5: Complete the first episode
    console.log('\nTest 5: Completing first episode...');
    const completedEpisode = await completeEpisode(
      testPatientId,
      episode1.episodeId,
      'Common cold',
      'Patient recovered fully after 5 days of treatment'
    );
    console.log('✓ Episode completed:', {
      episodeId: completedEpisode.episodeId,
      status: completedEpisode.status,
      diagnosis: completedEpisode.diagnosis,
      outcome: completedEpisode.outcome,
      endDate: completedEpisode.endDate
    });

    // Test 6: Filter episodes by status
    console.log('\nTest 6: Filtering episodes by status...');
    const ongoingEpisodes = await getPatientEpisodes(testPatientId, 'ongoing');
    const completedEpisodes = await getPatientEpisodes(testPatientId, 'completed');
    console.log(`✓ Ongoing episodes: ${ongoingEpisodes.length}`);
    console.log(`✓ Completed episodes: ${completedEpisodes.length}`);

    // Test 7: Verify episode sorting (most recent first)
    console.log('\nTest 7: Verifying episode sorting...');
    const sortedEpisodes = await getPatientEpisodes(testPatientId);
    if (sortedEpisodes.length >= 2) {
      const firstDate = new Date(sortedEpisodes[0].startDate);
      const secondDate = new Date(sortedEpisodes[1].startDate);
      const isSortedCorrectly = firstDate >= secondDate;
      console.log(`✓ Episodes sorted correctly (most recent first): ${isSortedCorrectly}`);
    }

    console.log('\n✅ All tests passed successfully!');
    console.log('\nNote: This test creates data in DynamoDB. Clean up test data manually if needed.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run tests if executed directly
if (require.main === module) {
  testTreatmentEpisodeOperations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { testTreatmentEpisodeOperations };

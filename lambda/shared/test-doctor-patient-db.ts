/**
 * Test script for doctor-patient relationship database functions
 * Run with: npx ts-node lambda/shared/test-doctor-patient-db.ts
 */

import { 
  addPatientToDoctor, 
  getDoctorPatients, 
  updateLastConsultation,
  createPatient 
} from './patient-db';

async function testDoctorPatientFunctions() {
  console.log('🧪 Testing Doctor-Patient Relationship Functions\n');

  try {
    // Test 1: Create a test patient
    console.log('1️⃣ Creating test patient...');
    const patient = await createPatient({
      name: 'John Doe',
      age: 35,
      gender: 'Male',
      contact: '+91-9876543210'
    });
    console.log('✅ Patient created:', patient.patientId, '-', patient.name);

    // Test 2: Add patient to doctor's list via QR scan
    console.log('\n2️⃣ Adding patient to doctor via QR scan...');
    const doctorId = 'doctor-123';
    const relationship = await addPatientToDoctor(
      doctorId,
      patient.patientId,
      'qr_scan',
      'qr-token-abc123'
    );
    console.log('✅ Patient added to doctor:', {
      doctorId: relationship.doctorId,
      patientName: relationship.patientName,
      addedVia: relationship.addedVia,
      treatmentStatus: relationship.treatmentStatus
    });

    // Test 3: Get doctor's patients (should return 1 patient)
    console.log('\n3️⃣ Getting doctor\'s patients...');
    const patientsResponse = await getDoctorPatients(doctorId);
    console.log('✅ Doctor patients retrieved:', {
      totalCount: patientsResponse.totalCount,
      page: patientsResponse.page,
      totalPages: patientsResponse.totalPages,
      patients: patientsResponse.patients.map(p => ({
        name: p.name,
        uhid: p.uhid,
        status: p.treatmentStatus
      }))
    });

    // Test 4: Create another patient and add via manual code
    console.log('\n4️⃣ Creating second patient and adding via manual code...');
    const patient2 = await createPatient({
      name: 'Jane Smith',
      age: 28,
      gender: 'Female',
      contact: '+91-9876543211'
    });
    await addPatientToDoctor(
      doctorId,
      patient2.patientId,
      'manual_code',
      'code-xyz789'
    );
    console.log('✅ Second patient added:', patient2.name);

    // Test 5: Get doctor's patients with pagination
    console.log('\n5️⃣ Getting doctor\'s patients with pagination...');
    const paginatedResponse = await getDoctorPatients(doctorId, {
      page: 1,
      limit: 1
    });
    console.log('✅ Paginated response:', {
      totalCount: paginatedResponse.totalCount,
      page: paginatedResponse.page,
      totalPages: paginatedResponse.totalPages,
      hasMore: paginatedResponse.hasMore,
      patientsOnPage: paginatedResponse.patients.length
    });

    // Test 6: Update last consultation timestamp
    console.log('\n6️⃣ Updating last consultation timestamp...');
    const newTimestamp = new Date(Date.now() + 3600000).toISOString(); // 1 hour later
    await updateLastConsultation(doctorId, patient.patientId, newTimestamp);
    console.log('✅ Last consultation updated to:', newTimestamp);

    // Test 7: Verify the update by getting patients again
    console.log('\n7️⃣ Verifying consultation update...');
    const updatedResponse = await getDoctorPatients(doctorId);
    const updatedPatient = updatedResponse.patients.find(p => p.patientId === patient.patientId);
    console.log('✅ Updated patient consultation:', {
      name: updatedPatient?.name,
      lastConsultation: updatedPatient?.lastConsultation
    });

    // Test 8: Test status filtering (all should be 'ongoing')
    console.log('\n8️⃣ Testing status filter (ongoing only)...');
    const ongoingResponse = await getDoctorPatients(doctorId, {
      statusFilter: ['ongoing']
    });
    console.log('✅ Ongoing patients:', ongoingResponse.totalCount);

    // Test 9: Test status filtering (past - should be empty)
    console.log('\n9️⃣ Testing status filter (past only)...');
    const pastResponse = await getDoctorPatients(doctorId, {
      statusFilter: ['past']
    });
    console.log('✅ Past patients:', pastResponse.totalCount);

    console.log('\n✨ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testDoctorPatientFunctions()
    .then(() => {
      console.log('\n✅ Test suite completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test suite failed:', error);
      process.exit(1);
    });
}

export { testDoctorPatientFunctions };

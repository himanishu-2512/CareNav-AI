// Practical usage example for medication schedule generator
// Shows integration with prescription system and patient app

import {
  generateMedicationSchedules,
  sortSchedulesByTime,
  updateSchedulesRemainingDuration,
  markDoseAsTaken,
  getActiveMedications,
  getMedicationsDueNow,
  calculateAdherenceRate,
  MedicationSchedule
} from './medication-schedule';
import { MedicationEntry } from './prescription-parser';

console.log('=== Medication Schedule Usage Example ===\n');

// Scenario: Doctor prescribes medications to a patient
console.log('Scenario: Doctor Prescribes Medications');
console.log('========================================\n');

const prescriptionMedications: MedicationEntry[] = [
  {
    medicineName: 'Azithromycin',
    dosage: '500mg',
    frequency: 'once daily',
    duration: 5,
    foodTiming: 'before food',
    specialInstructions: 'Take 1 hour before meals'
  },
  {
    medicineName: 'Cetirizine',
    dosage: '10mg',
    frequency: 'once daily',
    duration: 14,
    foodTiming: 'anytime',
    specialInstructions: 'Take at bedtime for best results'
  },
  {
    medicineName: 'Paracetamol',
    dosage: '650mg',
    frequency: 'as needed',
    duration: 7,
    specialInstructions: 'For fever or pain. Maximum 4 doses per day'
  }
];

console.log('Doctor prescribes:');
prescriptionMedications.forEach((med, i) => {
  console.log(`${i + 1}. ${med.medicineName} ${med.dosage} - ${med.frequency} for ${med.duration} days`);
});
console.log('');

// Step 1: Generate schedules when prescription is created
console.log('Step 1: Generate Medication Schedules');
console.log('--------------------------------------');

const scheduleResult = generateMedicationSchedules(prescriptionMedications);

if (!scheduleResult.success) {
  console.error(`Failed to generate schedules: ${scheduleResult.error}`);
  process.exit(1);
}

const schedules = scheduleResult.schedules!;
console.log(`✓ Generated ${schedules.length} medication schedules`);
console.log('✓ Schedules synced to patient app\n');

// Step 2: Display schedules in patient app (sorted by time)
console.log('Step 2: Patient App Display (Day 1)');
console.log('------------------------------------');

const sortedSchedules = sortSchedulesByTime(schedules);
const activeMeds = getActiveMedications(sortedSchedules);

console.log('MY MEDICATIONS\n');

activeMeds.forEach(schedule => {
  console.log(`📋 ${schedule.medicationName} - ${schedule.dosage}`);
  console.log(`   ${schedule.frequency}`);
  
  if (!schedule.isAsNeeded && schedule.dailyDoses.length > 0) {
    console.log(`   Today's schedule:`);
    schedule.dailyDoses.forEach(dose => {
      const icon = dose.taken ? '✓' : '○';
      console.log(`     ${icon} ${dose.time}`);
    });
  } else {
    console.log(`   ⚡ Take as needed`);
  }
  
  if (schedule.foodTiming && schedule.foodTiming !== 'anytime') {
    console.log(`   🍽️  Take ${schedule.foodTiming}`);
  }
  
  if (schedule.specialInstructions) {
    console.log(`   ℹ️  ${schedule.specialInstructions}`);
  }
  
  console.log(`   📅 ${schedule.remainingDays} days remaining`);
  console.log('');
});

// Step 3: Patient takes morning dose
console.log('Step 3: Patient Takes Morning Dose (9:00 AM)');
console.log('---------------------------------------------');

let azithromycinSchedule = schedules.find(s => s.medicationName === 'Azithromycin')!;
const morningDoseTime = azithromycinSchedule.dailyDoses[0].time;

console.log(`Patient marks ${azithromycinSchedule.medicationName} ${morningDoseTime} as taken`);

azithromycinSchedule = markDoseAsTaken(azithromycinSchedule, morningDoseTime);

console.log(`✓ Dose recorded at ${new Date().toLocaleTimeString()}`);
console.log(`✓ Adherence rate: ${calculateAdherenceRate(azithromycinSchedule)}%\n`);

// Step 4: Check medications due now (evening)
console.log('Step 4: Evening Reminder (9:00 PM)');
console.log('-----------------------------------');

// Simulate evening time
const eveningTime = new Date();
eveningTime.setHours(21, 0, 0, 0);

const dueNow = getMedicationsDueNow(schedules, eveningTime);

if (dueNow.length > 0) {
  console.log('🔔 MEDICATION REMINDER\n');
  console.log('Time to take your medication:\n');
  
  dueNow.forEach(schedule => {
    console.log(`• ${schedule.medicationName} - ${schedule.dosage}`);
    console.log(`  Dose time: ${schedule.nextDoseTime}`);
    if (schedule.foodTiming && schedule.foodTiming !== 'anytime') {
      console.log(`  Take ${schedule.foodTiming}`);
    }
    console.log('');
  });
} else {
  console.log('No medications due at this time\n');
}

// Step 5: Midnight update (next day)
console.log('Step 5: Midnight Update (Day 2)');
console.log('--------------------------------');

// Simulate next day
const nextDay = new Date();
nextDay.setDate(nextDay.getDate() + 1);
nextDay.setHours(0, 0, 0, 0);

console.log(`Running midnight update at ${nextDay.toLocaleString()}`);

const updatedSchedules = updateSchedulesRemainingDuration(schedules, nextDay);

console.log('✓ Remaining days updated');
console.log('✓ Daily doses reset for new day');
console.log('✓ Medication statuses recalculated\n');

updatedSchedules.forEach(schedule => {
  console.log(`  ${schedule.medicationName}: ${schedule.remainingDays} days remaining (${schedule.status})`);
});
console.log('');

// Step 6: Weekly adherence report
console.log('Step 6: Weekly Adherence Report');
console.log('--------------------------------');

// Simulate some doses taken over the week
const weeklySchedules = updatedSchedules.map(schedule => {
  if (schedule.isAsNeeded) {
    return schedule;
  }
  
  // Simulate taking some doses
  let updated = schedule;
  const dosesToTake = Math.floor(schedule.dailyDoses.length * 0.8); // 80% adherence
  
  for (let i = 0; i < dosesToTake; i++) {
    if (updated.dailyDoses[i]) {
      updated = markDoseAsTaken(updated, updated.dailyDoses[i].time);
    }
  }
  
  return updated;
});

console.log('ADHERENCE REPORT\n');

weeklySchedules.forEach(schedule => {
  const adherence = calculateAdherenceRate(schedule);
  const status = adherence >= 80 ? '✓ Good' : 
                 adherence >= 60 ? '⚠ Fair' : 
                 '✗ Poor';
  
  console.log(`${schedule.medicationName}`);
  console.log(`  Adherence: ${adherence}% ${status}`);
  
  if (!schedule.isAsNeeded) {
    const taken = schedule.dailyDoses.filter(d => d.taken).length;
    const total = schedule.dailyDoses.length;
    console.log(`  Today: ${taken}/${total} doses taken`);
  }
  
  console.log('');
});

// Step 7: Complete medication course
console.log('Step 7: Medication Course Completion');
console.log('-------------------------------------');

// Simulate 5 days passing for Azithromycin
const completionDate = new Date();
completionDate.setDate(completionDate.getDate() + 5);

const finalSchedules = updateSchedulesRemainingDuration(updatedSchedules, completionDate);

const completedMeds = finalSchedules.filter(s => s.status === 'completed');
const stillActive = finalSchedules.filter(s => s.status === 'active');

console.log(`Date: ${completionDate.toLocaleDateString()}\n`);

if (completedMeds.length > 0) {
  console.log('✓ COMPLETED MEDICATIONS:\n');
  completedMeds.forEach(schedule => {
    console.log(`  ${schedule.medicationName} - Course completed`);
  });
  console.log('');
}

if (stillActive.length > 0) {
  console.log('📋 ACTIVE MEDICATIONS:\n');
  stillActive.forEach(schedule => {
    console.log(`  ${schedule.medicationName} - ${schedule.remainingDays} days remaining`);
  });
  console.log('');
}

// Step 8: Integration with prescription handler
console.log('Step 8: Prescription Handler Integration');
console.log('----------------------------------------');

console.log(`
// In prescription-handler Lambda:

export async function createPrescriptionHandler(event) {
  const { patientId, medications } = JSON.parse(event.body);
  
  // 1. Create prescription record
  const prescription = await createPrescription(patientId, medications);
  
  // 2. Generate medication schedules
  const scheduleResult = generateMedicationSchedules(medications);
  
  if (scheduleResult.success) {
    // 3. Save schedules to database
    await saveMedicationSchedules(patientId, scheduleResult.schedules);
    
    // 4. Sync to patient app
    await syncSchedulesToPatientApp(patientId, scheduleResult.schedules);
    
    // 5. Send initial reminder
    const dueToday = scheduleResult.schedules.filter(s => 
      !s.isAsNeeded && s.status === 'active'
    );
    
    if (dueToday.length > 0) {
      await sendMedicationReminder(patientId, dueToday);
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        prescriptionId: prescription.prescriptionId,
        schedulesGenerated: scheduleResult.schedules.length
      })
    };
  }
}
`);

console.log('\n=== Example Complete ===');
console.log('\nKey Features Demonstrated:');
console.log('✓ Schedule generation from prescription');
console.log('✓ Patient app display with sorting');
console.log('✓ Dose tracking (taken/skipped)');
console.log('✓ Medication reminders');
console.log('✓ Midnight updates');
console.log('✓ Adherence tracking');
console.log('✓ Course completion');
console.log('✓ API integration patterns');

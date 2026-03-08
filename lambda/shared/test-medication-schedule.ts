// Test script for medication schedule generator
// Demonstrates schedule generation, updates, and sorting

import {
  generateMedicationSchedules,
  updateSchedulesRemainingDuration,
  sortSchedulesByTime,
  markDoseAsTaken,
  markDoseAsSkipped,
  getActiveMedications,
  getMedicationsDueNow,
  calculateAdherenceRate,
  MedicationSchedule
} from './medication-schedule';
import { MedicationEntry } from './prescription-parser';

console.log('=== Medication Schedule Generator Test ===\n');

// Test 1: Generate schedules from prescription medications
console.log('Test 1: Generate Medication Schedules');
console.log('--------------------------------------');

const medications: MedicationEntry[] = [
  {
    medicineName: 'Amoxicillin',
    dosage: '500mg',
    frequency: 'three times daily',
    duration: 7,
    foodTiming: 'after food',
    specialInstructions: 'Complete the full course'
  },
  {
    medicineName: 'Ibuprofen',
    dosage: '400mg',
    frequency: 'every 8 hours',
    duration: 5,
    foodTiming: 'with food',
    specialInstructions: 'Take with plenty of water'
  },
  {
    medicineName: 'Paracetamol',
    dosage: '500mg',
    frequency: 'as needed',
    duration: 10,
    specialInstructions: 'Maximum 4 doses per day'
  },
  {
    medicineName: 'Vitamin D',
    dosage: '1000 IU',
    frequency: 'once daily',
    duration: 30,
    foodTiming: 'with food'
  }
];

const startDate = new Date('2024-01-15T09:00:00Z');
const result = generateMedicationSchedules(medications, startDate);

if (result.success && result.schedules) {
  console.log(`✓ Successfully generated ${result.schedules.length} medication schedules\n`);
  
  result.schedules.forEach((schedule, index) => {
    console.log(`${index + 1}. ${schedule.medicationName} (${schedule.dosage})`);
    console.log(`   Frequency: ${schedule.frequency}`);
    console.log(`   Duration: ${schedule.durationDays} days (${schedule.remainingDays} remaining)`);
    console.log(`   Start: ${new Date(schedule.startDate).toLocaleDateString()}`);
    console.log(`   Stop: ${new Date(schedule.stopDate).toLocaleDateString()}`);
    console.log(`   Status: ${schedule.status}`);
    console.log(`   As Needed: ${schedule.isAsNeeded ? 'Yes' : 'No'}`);
    
    if (schedule.foodTiming) {
      console.log(`   Food Timing: ${schedule.foodTiming}`);
    }
    
    if (schedule.specialInstructions) {
      console.log(`   Instructions: ${schedule.specialInstructions}`);
    }
    
    if (schedule.dailyDoses.length > 0) {
      console.log(`   Daily Doses: ${schedule.dailyDoses.map(d => d.time).join(', ')}`);
    } else {
      console.log(`   Daily Doses: As needed (no fixed schedule)`);
    }
    
    if (schedule.nextDoseTime) {
      console.log(`   Next Dose: ${schedule.nextDoseTime}`);
    }
    
    console.log('');
  });
} else {
  console.log(`✗ Failed to generate schedules: ${result.error}\n`);
}

// Test 2: Sort schedules by time
console.log('\nTest 2: Sort Schedules by Next Dose Time');
console.log('------------------------------------------');

if (result.success && result.schedules) {
  const sortedSchedules = sortSchedulesByTime(result.schedules);
  
  console.log('Medications sorted by next dose time:');
  sortedSchedules.forEach((schedule, index) => {
    const doseInfo = schedule.isAsNeeded 
      ? 'As needed' 
      : schedule.nextDoseTime || 'No upcoming dose';
    console.log(`${index + 1}. ${schedule.medicationName} - Next dose: ${doseInfo}`);
  });
  console.log('');
}

// Test 3: Mark doses as taken
console.log('\nTest 3: Mark Doses as Taken');
console.log('----------------------------');

if (result.success && result.schedules) {
  let amoxicillinSchedule = result.schedules.find(s => s.medicationName === 'Amoxicillin');
  
  if (amoxicillinSchedule) {
    console.log(`Before: ${amoxicillinSchedule.medicationName}`);
    console.log(`  Doses: ${amoxicillinSchedule.dailyDoses.map(d => `${d.time} (taken: ${d.taken})`).join(', ')}`);
    console.log(`  Next dose: ${amoxicillinSchedule.nextDoseTime}`);
    
    // Mark first dose as taken
    const firstDoseTime = amoxicillinSchedule.dailyDoses[0].time;
    amoxicillinSchedule = markDoseAsTaken(amoxicillinSchedule, firstDoseTime);
    
    console.log(`\nAfter marking ${firstDoseTime} as taken:`);
    console.log(`  Doses: ${amoxicillinSchedule.dailyDoses.map(d => `${d.time} (taken: ${d.taken})`).join(', ')}`);
    console.log(`  Next dose: ${amoxicillinSchedule.nextDoseTime}`);
    console.log(`  Adherence rate: ${calculateAdherenceRate(amoxicillinSchedule)}%`);
    console.log('');
  }
}

// Test 4: Mark doses as skipped
console.log('\nTest 4: Mark Doses as Skipped');
console.log('------------------------------');

if (result.success && result.schedules) {
  let ibuprofenSchedule = result.schedules.find(s => s.medicationName === 'Ibuprofen');
  
  if (ibuprofenSchedule) {
    console.log(`Before: ${ibuprofenSchedule.medicationName}`);
    console.log(`  Doses: ${ibuprofenSchedule.dailyDoses.map(d => `${d.time} (skipped: ${d.skipped})`).join(', ')}`);
    
    // Mark second dose as skipped
    const secondDoseTime = ibuprofenSchedule.dailyDoses[1]?.time;
    if (secondDoseTime) {
      ibuprofenSchedule = markDoseAsSkipped(ibuprofenSchedule, secondDoseTime, 'Forgot to take');
      
      console.log(`\nAfter marking ${secondDoseTime} as skipped:`);
      console.log(`  Doses: ${ibuprofenSchedule.dailyDoses.map(d => {
        if (d.skipped) return `${d.time} (skipped: ${d.skippedReason})`;
        return `${d.time} (skipped: ${d.skipped})`;
      }).join(', ')}`);
      console.log(`  Adherence rate: ${calculateAdherenceRate(ibuprofenSchedule)}%`);
      console.log('');
    }
  }
}

// Test 5: Update remaining duration (simulate midnight update)
console.log('\nTest 5: Update Remaining Duration (Midnight Update)');
console.log('----------------------------------------------------');

if (result.success && result.schedules) {
  console.log('Original schedules:');
  result.schedules.forEach(schedule => {
    console.log(`  ${schedule.medicationName}: ${schedule.remainingDays} days remaining`);
  });
  
  // Simulate 3 days passing
  const futureDate = new Date(startDate);
  futureDate.setDate(futureDate.getDate() + 3);
  
  const updatedSchedules = updateSchedulesRemainingDuration(result.schedules, futureDate);
  
  console.log(`\nAfter 3 days (${futureDate.toLocaleDateString()}):`);
  updatedSchedules.forEach(schedule => {
    console.log(`  ${schedule.medicationName}: ${schedule.remainingDays} days remaining (status: ${schedule.status})`);
  });
  console.log('');
}

// Test 6: Get active medications
console.log('\nTest 6: Get Active Medications');
console.log('--------------------------------');

if (result.success && result.schedules) {
  const activeMeds = getActiveMedications(result.schedules);
  console.log(`Active medications: ${activeMeds.length} of ${result.schedules.length}`);
  activeMeds.forEach(schedule => {
    console.log(`  - ${schedule.medicationName} (${schedule.remainingDays} days remaining)`);
  });
  console.log('');
}

// Test 7: Get medications due now
console.log('\nTest 7: Get Medications Due Now');
console.log('--------------------------------');

if (result.success && result.schedules) {
  // Set current time to 9:00 AM (when first doses are due)
  const currentTime = new Date('2024-01-15T09:00:00Z');
  const dueNow = getMedicationsDueNow(result.schedules, currentTime);
  
  console.log(`Current time: ${currentTime.toLocaleTimeString()}`);
  console.log(`Medications due now (within 30 minutes): ${dueNow.length}`);
  dueNow.forEach(schedule => {
    console.log(`  - ${schedule.medicationName} at ${schedule.nextDoseTime}`);
  });
  console.log('');
}

// Test 8: Error handling
console.log('\nTest 8: Error Handling');
console.log('----------------------');

// Test with invalid medications
const invalidResult1 = generateMedicationSchedules([]);
console.log(`Empty medications array: ${invalidResult1.success ? '✓ Success' : '✗ ' + invalidResult1.error}`);

const invalidResult2 = generateMedicationSchedules([
  {
    medicineName: 'Test Med',
    dosage: '100mg',
    frequency: 'invalid frequency pattern',
    duration: 5
  }
]);
console.log(`Invalid frequency: ${invalidResult2.success ? '✓ Success' : '✗ ' + invalidResult2.error}`);

const invalidResult3 = generateMedicationSchedules([
  {
    medicineName: 'Test Med',
    dosage: '100mg',
    frequency: 'once daily',
    duration: -5
  }
]);
console.log(`Negative duration: ${invalidResult3.success ? '✓ Success' : '✗ ' + invalidResult3.error}`);

console.log('');

// Test 9: Display complete schedule for patient app
console.log('\nTest 9: Complete Medication Schedule Display');
console.log('---------------------------------------------');

if (result.success && result.schedules) {
  const sortedSchedules = sortSchedulesByTime(result.schedules);
  
  console.log('MEDICATION SCHEDULE');
  console.log('===================\n');
  
  const activeMeds = sortedSchedules.filter(s => s.status === 'active');
  const completedMeds = sortedSchedules.filter(s => s.status === 'completed');
  
  if (activeMeds.length > 0) {
    console.log('ACTIVE MEDICATIONS:\n');
    
    activeMeds.forEach(schedule => {
      console.log(`${schedule.medicationName} - ${schedule.dosage}`);
      console.log(`  ${schedule.frequency}`);
      
      if (!schedule.isAsNeeded && schedule.dailyDoses.length > 0) {
        console.log(`  Today's doses:`);
        schedule.dailyDoses.forEach(dose => {
          const status = dose.taken ? '✓ Taken' : dose.skipped ? '⊘ Skipped' : '○ Pending';
          console.log(`    ${dose.time} - ${status}`);
        });
      } else if (schedule.isAsNeeded) {
        console.log(`  Take as needed`);
      }
      
      if (schedule.foodTiming) {
        console.log(`  Take ${schedule.foodTiming}`);
      }
      
      if (schedule.specialInstructions) {
        console.log(`  Note: ${schedule.specialInstructions}`);
      }
      
      console.log(`  ${schedule.remainingDays} days remaining`);
      console.log('');
    });
  }
  
  if (completedMeds.length > 0) {
    console.log('COMPLETED MEDICATIONS:\n');
    completedMeds.forEach(schedule => {
      console.log(`  ${schedule.medicationName} - ${schedule.dosage} (Completed)`);
    });
    console.log('');
  }
}

console.log('=== All Tests Complete ===');

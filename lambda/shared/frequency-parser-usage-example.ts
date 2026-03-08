// Practical usage examples for frequency-parser-v2.ts
// Demonstrates integration with prescription and medication schedule systems

import { parseFrequency, calculateStopDate, getTimeOfDay } from './frequency-parser-v2';

// Example 1: Creating a medication schedule from prescription data
console.log('=== Example 1: Creating Medication Schedule ===\n');

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  durationDays: number;
}

interface MedicationSchedule {
  medicationName: string;
  dosage: string;
  type: 'scheduled' | 'as-needed';
  times?: Array<{ time: string; timeOfDay: string }>;
  startDate: string;
  stopDate: string;
  durationDays: number;
}

function createMedicationSchedule(
  medication: Medication,
  startDate: Date
): MedicationSchedule | { error: string } {
  const parseResult = parseFrequency(medication.frequency);
  
  if (!parseResult.success) {
    return { error: `Cannot parse frequency "${medication.frequency}": ${parseResult.error}` };
  }
  
  const stopDate = calculateStopDate(startDate, medication.durationDays);
  
  if (parseResult.isAsNeeded) {
    return {
      medicationName: medication.name,
      dosage: medication.dosage,
      type: 'as-needed',
      startDate: startDate.toISOString(),
      stopDate,
      durationDays: medication.durationDays
    };
  }
  
  const timesWithCategory = parseResult.times!.map(time => ({
    time,
    timeOfDay: getTimeOfDay(time)
  }));
  
  return {
    medicationName: medication.name,
    dosage: medication.dosage,
    type: 'scheduled',
    times: timesWithCategory,
    startDate: startDate.toISOString(),
    stopDate,
    durationDays: medication.durationDays
  };
}

// Example prescription
const prescriptionMedications: Medication[] = [
  {
    name: 'Amoxicillin',
    dosage: '500mg',
    frequency: 'three times daily',
    durationDays: 7
  },
  {
    name: 'Ibuprofen',
    dosage: '400mg',
    frequency: 'every 6 hours',
    durationDays: 5
  },
  {
    name: 'Acetaminophen',
    dosage: '500mg',
    frequency: 'as needed',
    durationDays: 14
  }
];

const startDate = new Date('2024-01-15T09:00:00Z');

prescriptionMedications.forEach(med => {
  const schedule = createMedicationSchedule(med, startDate);
  
  if ('error' in schedule) {
    console.log(`❌ ${med.name}: ${schedule.error}`);
  } else {
    console.log(`✅ ${schedule.medicationName} (${schedule.dosage})`);
    console.log(`   Type: ${schedule.type}`);
    if (schedule.times) {
      console.log(`   Schedule:`);
      schedule.times.forEach(t => {
        console.log(`     - ${t.time} (${t.timeOfDay})`);
      });
    } else {
      console.log(`   Take as needed when symptoms occur`);
    }
    console.log(`   Duration: ${schedule.durationDays} days`);
    console.log(`   Start: ${new Date(schedule.startDate).toLocaleDateString()}`);
    console.log(`   Stop: ${new Date(schedule.stopDate).toLocaleDateString()}`);
    console.log('');
  }
});

// Example 2: Validating prescription frequencies before saving
console.log('=== Example 2: Prescription Validation ===\n');

interface PrescriptionEntry {
  medication: string;
  frequency: string;
}

function validatePrescriptionFrequencies(
  entries: PrescriptionEntry[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  entries.forEach((entry, index) => {
    const result = parseFrequency(entry.frequency);
    if (!result.success) {
      errors.push(`Medication ${index + 1} (${entry.medication}): ${result.error}`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}

const prescriptionToValidate: PrescriptionEntry[] = [
  { medication: 'Aspirin', frequency: 'once daily' },
  { medication: 'Vitamin D', frequency: 'every 5 hours' }, // Invalid
  { medication: 'Pain reliever', frequency: 'as needed' },
  { medication: 'Antibiotic', frequency: 'xyz' } // Invalid
];

const validation = validatePrescriptionFrequencies(prescriptionToValidate);

if (validation.valid) {
  console.log('✅ All prescription frequencies are valid');
} else {
  console.log('❌ Prescription validation failed:\n');
  validation.errors.forEach(error => console.log(`   ${error}`));
}

// Example 3: Generating daily dose reminders
console.log('\n=== Example 3: Daily Dose Reminders ===\n');

interface DoseReminder {
  time: string;
  medications: Array<{
    name: string;
    dosage: string;
  }>;
}

function generateDailyReminders(schedules: MedicationSchedule[]): DoseReminder[] {
  const reminderMap = new Map<string, Array<{ name: string; dosage: string }>>();
  
  schedules.forEach(schedule => {
    if (schedule.type === 'scheduled' && schedule.times) {
      schedule.times.forEach(({ time }) => {
        if (!reminderMap.has(time)) {
          reminderMap.set(time, []);
        }
        reminderMap.get(time)!.push({
          name: schedule.medicationName,
          dosage: schedule.dosage
        });
      });
    }
  });
  
  // Sort by time
  const reminders: DoseReminder[] = Array.from(reminderMap.entries())
    .map(([time, medications]) => ({ time, medications }))
    .sort((a, b) => a.time.localeCompare(b.time));
  
  return reminders;
}

// Create schedules for multiple medications
const medications: Medication[] = [
  { name: 'Medication A', dosage: '100mg', frequency: 'twice daily', durationDays: 7 },
  { name: 'Medication B', dosage: '50mg', frequency: 'three times daily', durationDays: 7 },
  { name: 'Medication C', dosage: '200mg', frequency: 'once daily', durationDays: 7 }
];

const schedules = medications
  .map(med => createMedicationSchedule(med, startDate))
  .filter((s): s is MedicationSchedule => !('error' in s));

const reminders = generateDailyReminders(schedules);

console.log('Daily medication reminders:');
reminders.forEach(reminder => {
  const timeOfDay = getTimeOfDay(reminder.time);
  console.log(`\n⏰ ${reminder.time} (${timeOfDay})`);
  reminder.medications.forEach(med => {
    console.log(`   💊 ${med.name} - ${med.dosage}`);
  });
});

// Example 4: Handling edge cases and errors gracefully
console.log('\n\n=== Example 4: Error Handling Patterns ===\n');

function parseMedicationFrequencyWithFallback(
  frequency: string,
  fallbackFrequency: string = 'once daily'
): { times: string[]; isAsNeeded: boolean; usedFallback: boolean } {
  const result = parseFrequency(frequency);
  
  if (result.success) {
    return {
      times: result.times || [],
      isAsNeeded: result.isAsNeeded || false,
      usedFallback: false
    };
  }
  
  console.warn(`Invalid frequency "${frequency}", using fallback "${fallbackFrequency}"`);
  const fallbackResult = parseFrequency(fallbackFrequency);
  
  return {
    times: fallbackResult.times || [],
    isAsNeeded: fallbackResult.isAsNeeded || false,
    usedFallback: true
  };
}

const testFrequencies = [
  'twice daily',
  'every 5 hours', // Invalid
  'as needed',
  'xyz123' // Invalid
];

testFrequencies.forEach(freq => {
  const result = parseMedicationFrequencyWithFallback(freq);
  console.log(`Frequency: "${freq}"`);
  console.log(`  Result: ${result.isAsNeeded ? 'AS NEEDED' : result.times.join(', ')}`);
  console.log(`  Used fallback: ${result.usedFallback ? 'Yes' : 'No'}`);
  console.log('');
});

// Example 5: Calculating remaining doses
console.log('=== Example 5: Remaining Doses Calculation ===\n');

function calculateRemainingDoses(
  schedule: MedicationSchedule,
  currentDate: Date
): number | 'as-needed' {
  if (schedule.type === 'as-needed') {
    return 'as-needed';
  }
  
  const start = new Date(schedule.startDate);
  const stop = new Date(schedule.stopDate);
  const current = currentDate;
  
  if (current >= stop) {
    return 0; // Treatment completed
  }
  
  if (current < start) {
    // Not started yet - calculate total doses
    const totalDays = Math.ceil((stop.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return totalDays * (schedule.times?.length || 0);
  }
  
  // In progress - calculate remaining doses
  const remainingDays = Math.ceil((stop.getTime() - current.getTime()) / (1000 * 60 * 60 * 24));
  return remainingDays * (schedule.times?.length || 0);
}

const exampleSchedule = createMedicationSchedule(
  { name: 'Example Med', dosage: '100mg', frequency: 'three times daily', durationDays: 7 },
  new Date('2024-01-15')
) as MedicationSchedule;

const testDates = [
  new Date('2024-01-14'), // Before start
  new Date('2024-01-16'), // Day 2
  new Date('2024-01-20'), // Day 6
  new Date('2024-01-23')  // After end
];

testDates.forEach(date => {
  const remaining = calculateRemainingDoses(exampleSchedule, date);
  console.log(`Date: ${date.toLocaleDateString()}`);
  console.log(`  Remaining doses: ${remaining}`);
});

console.log('\n=== Examples Complete ===');

# Medication Schedule Generator

## Overview

The medication schedule generator creates timed medication schedules from prescription data. It integrates with the frequency parser to convert frequency specifications into specific dose times, calculates remaining duration, and provides daily midnight update logic.

**Requirements Validated:**
- Requirement 13.1: Generate timed schedule based on frequency and duration
- Requirement 13.2: Calculate specific times for each dose based on prescribed frequency
- Requirement 13.5: Update remaining duration daily at midnight

## Features

- ✅ Generate schedules from prescription medications
- ✅ Calculate specific dose times based on frequency
- ✅ Track remaining duration and medication status
- ✅ Support for "as needed" medications
- ✅ Daily dose tracking (taken/skipped)
- ✅ Chronological sorting by next dose time
- ✅ Adherence rate calculation
- ✅ Midnight update logic for remaining duration
- ✅ Integration with frequency parser

## Data Structures

### MedicationSchedule

```typescript
interface MedicationSchedule {
  medicationName: string;
  dosage: string;
  frequency: string;
  startDate: string; // ISO timestamp
  stopDate: string; // ISO timestamp
  durationDays: number;
  remainingDays: number;
  isAsNeeded: boolean;
  foodTiming?: 'before food' | 'after food' | 'with food' | 'anytime';
  specialInstructions?: string;
  dailyDoses: ScheduledDose[];
  nextDoseTime?: string; // HH:MM format
  status: 'active' | 'completed' | 'discontinued';
}
```

### ScheduledDose

```typescript
interface ScheduledDose {
  time: string; // HH:MM format
  taken: boolean;
  takenAt?: string; // ISO timestamp
  skipped: boolean;
  skippedReason?: string;
}
```

## Core Functions

### generateMedicationSchedules()

Generate medication schedules from prescription medications.

```typescript
import { generateMedicationSchedules } from './medication-schedule';
import { MedicationEntry } from './prescription-parser';

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
    foodTiming: 'with food'
  }
];

const result = generateMedicationSchedules(medications);

if (result.success) {
  console.log(`Generated ${result.schedules.length} schedules`);
  result.schedules.forEach(schedule => {
    console.log(`${schedule.medicationName}: ${schedule.dailyDoses.length} doses per day`);
    console.log(`Next dose: ${schedule.nextDoseTime}`);
    console.log(`Remaining: ${schedule.remainingDays} days`);
  });
} else {
  console.error(`Error: ${result.error}`);
}
```

### sortSchedulesByTime()

Sort medication schedules chronologically by next dose time.

```typescript
import { sortSchedulesByTime } from './medication-schedule';

const sortedSchedules = sortSchedulesByTime(schedules);

// Schedules are now ordered by:
// 1. Active medications before completed
// 2. Scheduled medications before as-needed
// 3. Earliest next dose time first
```

### updateSchedulesRemainingDuration()

Update remaining duration for all schedules (called daily at midnight).

```typescript
import { updateSchedulesRemainingDuration } from './medication-schedule';

// Called by a scheduled job at midnight
const updatedSchedules = updateSchedulesRemainingDuration(schedules);

// Each schedule now has:
// - Updated remainingDays
// - Recalculated status (active/completed)
// - Fresh dailyDoses for the new day
// - Updated nextDoseTime
```

### markDoseAsTaken()

Mark a specific dose as taken.

```typescript
import { markDoseAsTaken } from './medication-schedule';

const updatedSchedule = markDoseAsTaken(
  schedule,
  '09:00', // dose time
  new Date() // when taken (optional, defaults to now)
);

// The dose is now marked as taken
// nextDoseTime is updated to the next pending dose
```

### markDoseAsSkipped()

Mark a specific dose as skipped with optional reason.

```typescript
import { markDoseAsSkipped } from './medication-schedule';

const updatedSchedule = markDoseAsSkipped(
  schedule,
  '14:00', // dose time
  'Forgot to take' // reason (optional)
);
```

### getActiveMedications()

Get only active medications (not completed or discontinued).

```typescript
import { getActiveMedications } from './medication-schedule';

const activeMeds = getActiveMedications(schedules);
console.log(`${activeMeds.length} active medications`);
```

### getMedicationsDueNow()

Get medications with doses due within the next 30 minutes.

```typescript
import { getMedicationsDueNow } from './medication-schedule';

const dueNow = getMedicationsDueNow(schedules);

if (dueNow.length > 0) {
  console.log('Time to take medication:');
  dueNow.forEach(schedule => {
    console.log(`- ${schedule.medicationName} at ${schedule.nextDoseTime}`);
  });
}
```

### calculateAdherenceRate()

Calculate adherence rate for a medication schedule.

```typescript
import { calculateAdherenceRate } from './medication-schedule';

const adherenceRate = calculateAdherenceRate(schedule);
console.log(`Adherence: ${adherenceRate}%`);

// Returns percentage of doses taken vs total doses
// As-needed medications always return 100%
```

## Integration with Frequency Parser

The medication schedule generator integrates seamlessly with the frequency parser:

```typescript
// Frequency parser converts these patterns:
'once daily'        → ['09:00']
'twice daily'       → ['09:00', '21:00']
'three times daily' → ['09:00', '14:00', '21:00']
'every 8 hours'     → ['06:00', '14:00', '22:00']
'as needed'         → [] (no fixed schedule)

// Schedule generator uses these times to create daily doses
```

## Patient App Display Example

```typescript
import {
  generateMedicationSchedules,
  sortSchedulesByTime,
  getActiveMedications
} from './medication-schedule';

// Generate schedules from prescription
const result = generateMedicationSchedules(prescriptionMedications);

if (result.success) {
  // Sort by next dose time
  const sortedSchedules = sortSchedulesByTime(result.schedules);
  
  // Get only active medications
  const activeMeds = getActiveMedications(sortedSchedules);
  
  // Display in patient app
  activeMeds.forEach(schedule => {
    console.log(`${schedule.medicationName} - ${schedule.dosage}`);
    console.log(`${schedule.frequency}`);
    
    if (!schedule.isAsNeeded) {
      console.log('Today\'s doses:');
      schedule.dailyDoses.forEach(dose => {
        const status = dose.taken ? '✓ Taken' : 
                      dose.skipped ? '⊘ Skipped' : 
                      '○ Pending';
        console.log(`  ${dose.time} - ${status}`);
      });
    } else {
      console.log('Take as needed');
    }
    
    if (schedule.foodTiming) {
      console.log(`Take ${schedule.foodTiming}`);
    }
    
    console.log(`${schedule.remainingDays} days remaining\n`);
  });
}
```

## Midnight Update Job

```typescript
import { updateSchedulesRemainingDuration } from './medication-schedule';
import { getPatientMedicationSchedules, savePatientMedicationSchedules } from './treatment-db';

// Lambda function triggered daily at midnight
export async function midnightUpdateHandler() {
  // Get all patients with active medications
  const patients = await getPatientsWithActiveMedications();
  
  for (const patient of patients) {
    // Get current schedules
    const schedules = await getPatientMedicationSchedules(patient.patientId);
    
    // Update remaining duration and reset daily doses
    const updatedSchedules = updateSchedulesRemainingDuration(schedules);
    
    // Save updated schedules
    await savePatientMedicationSchedules(patient.patientId, updatedSchedules);
    
    // Send notifications for medications due today
    const dueToday = updatedSchedules.filter(s => 
      !s.isAsNeeded && s.status === 'active'
    );
    
    if (dueToday.length > 0) {
      await sendMedicationReminder(patient.patientId, dueToday);
    }
  }
}
```

## Error Handling

The schedule generator provides comprehensive error handling:

```typescript
// Empty medications array
const result1 = generateMedicationSchedules([]);
// Error: "At least one medication is required"

// Invalid frequency
const result2 = generateMedicationSchedules([{
  medicineName: 'Test',
  dosage: '100mg',
  frequency: 'invalid pattern',
  duration: 5
}]);
// Error: "Medication 1 (Test): Unrecognized frequency pattern..."

// Negative duration
const result3 = generateMedicationSchedules([{
  medicineName: 'Test',
  dosage: '100mg',
  frequency: 'once daily',
  duration: -5
}]);
// Error: "Medication 1 (Test): Duration must be positive"
```

## Testing

Run the test script to see all features in action:

```bash
npx ts-node lambda/shared/test-medication-schedule.ts
```

The test script demonstrates:
1. Schedule generation from prescriptions
2. Sorting by next dose time
3. Marking doses as taken/skipped
4. Updating remaining duration
5. Getting active medications
6. Getting medications due now
7. Error handling
8. Complete patient app display

## API Integration

### Prescription Handler Integration

```typescript
// In prescription-handler Lambda
import { generateMedicationSchedules } from '../shared/medication-schedule';

// After creating prescription
const scheduleResult = generateMedicationSchedules(
  prescription.medications,
  new Date()
);

if (scheduleResult.success) {
  // Save schedules to database
  await saveMedicationSchedules(patientId, scheduleResult.schedules);
  
  // Sync to patient app
  await syncSchedulesToPatientApp(patientId, scheduleResult.schedules);
}
```

### Treatment Planner Integration

```typescript
// In treatment-planner Lambda
import { 
  markDoseAsTaken,
  calculateAdherenceRate 
} from '../shared/medication-schedule';

// When patient marks dose as taken
export async function markDoseHandler(event) {
  const { patientId, medicationName, doseTime } = JSON.parse(event.body);
  
  // Get current schedule
  const schedule = await getMedicationSchedule(patientId, medicationName);
  
  // Mark dose as taken
  const updatedSchedule = markDoseAsTaken(schedule, doseTime);
  
  // Calculate adherence
  const adherence = calculateAdherenceRate(updatedSchedule);
  
  // Save and return
  await saveMedicationSchedule(patientId, updatedSchedule);
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      adherence,
      nextDoseTime: updatedSchedule.nextDoseTime
    })
  };
}
```

## Best Practices

1. **Always validate input**: Use the frequency parser's validation before generating schedules
2. **Handle timezones**: Store all times in UTC, convert to local time in the UI
3. **Update daily**: Run the midnight update job to keep remaining days accurate
4. **Track adherence**: Use adherence rates to identify patients who need support
5. **Send reminders**: Use `getMedicationsDueNow()` to send timely reminders
6. **Sort for display**: Always sort schedules by time for better UX
7. **Handle as-needed**: Display as-needed medications separately from scheduled ones

## Performance Considerations

- Schedule generation is O(n) where n is the number of medications
- Sorting is O(n log n) but typically n is small (< 20 medications)
- Midnight updates should be batched to avoid Lambda timeouts
- Consider caching schedules in the patient app for offline access

## Future Enhancements

- [ ] Support for custom dose times (e.g., "take at 7am, 3pm, 11pm")
- [ ] Medication interaction warnings
- [ ] Refill reminders based on remaining duration
- [ ] Historical adherence tracking over time
- [ ] Integration with pharmacy systems
- [ ] Support for dose adjustments (tapering)

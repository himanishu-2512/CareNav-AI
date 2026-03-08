// Medication Schedule Generator
// Generates timed medication schedules from frequency and duration
// Requirements: 13.1, 13.2, 13.5

import { parseFrequency, calculateStopDate } from './frequency-parser-v2';
import { MedicationEntry } from './prescription-parser';

/**
 * Scheduled dose for a medication
 */
export interface ScheduledDose {
  time: string; // HH:MM format
  taken: boolean;
  takenAt?: string; // ISO timestamp when dose was taken
  skipped: boolean;
  skippedReason?: string;
}

/**
 * Medication schedule with timing and duration information
 */
export interface MedicationSchedule {
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
  dailyDoses: ScheduledDose[]; // Doses for today
  nextDoseTime?: string; // Next upcoming dose time
  status: 'active' | 'completed' | 'discontinued';
}

/**
 * Result of schedule generation
 */
export interface ScheduleGenerationResult {
  success: boolean;
  schedules?: MedicationSchedule[];
  error?: string;
}

/**
 * Generate medication schedules from prescription medications
 * Requirement 13.1: Generate timed schedule based on frequency and duration
 * Requirement 13.2: Calculate specific times for each dose based on prescribed frequency
 * 
 * @param medications - Array of medication entries from prescription
 * @param startDate - Start date for the medications (defaults to now)
 * @returns ScheduleGenerationResult with schedules or error
 */
export function generateMedicationSchedules(
  medications: MedicationEntry[],
  startDate?: Date | string
): ScheduleGenerationResult {
  if (!medications || !Array.isArray(medications)) {
    return {
      success: false,
      error: 'Medications must be a non-empty array'
    };
  }

  if (medications.length === 0) {
    return {
      success: false,
      error: 'At least one medication is required'
    };
  }

  const start = startDate ? (typeof startDate === 'string' ? new Date(startDate) : startDate) : new Date();
  
  if (isNaN(start.getTime())) {
    return {
      success: false,
      error: 'Invalid start date'
    };
  }

  const schedules: MedicationSchedule[] = [];
  const errors: string[] = [];

  for (let i = 0; i < medications.length; i++) {
    const med = medications[i];
    const scheduleResult = generateSingleMedicationSchedule(med, start);
    
    if (!scheduleResult.success) {
      errors.push(`Medication ${i + 1} (${med.medicineName}): ${scheduleResult.error}`);
    } else if (scheduleResult.schedule) {
      schedules.push(scheduleResult.schedule);
    }
  }

  if (errors.length > 0) {
    return {
      success: false,
      error: errors.join('; ')
    };
  }

  return {
    success: true,
    schedules
  };
}

/**
 * Generate schedule for a single medication
 */
function generateSingleMedicationSchedule(
  medication: MedicationEntry,
  startDate: Date
): { success: boolean; schedule?: MedicationSchedule; error?: string } {
  // Parse frequency to get dose times
  const frequencyResult = parseFrequency(medication.frequency);
  
  if (!frequencyResult.success) {
    return {
      success: false,
      error: frequencyResult.error
    };
  }

  // Calculate stop date
  let stopDate: string;
  try {
    stopDate = calculateStopDate(startDate, medication.duration);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate stop date'
    };
  }

  // Calculate remaining days
  const now = new Date();
  const stop = new Date(stopDate);
  const remainingDays = Math.max(0, Math.ceil((stop.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  // Generate daily doses for today
  const dailyDoses = generateDailyDoses(frequencyResult.times || [], now);

  // Find next dose time
  const nextDoseTime = findNextDoseTime(dailyDoses, now);

  // Determine status
  const status = determineStatus(now, stop, remainingDays);

  const schedule: MedicationSchedule = {
    medicationName: medication.medicineName,
    dosage: medication.dosage,
    frequency: medication.frequency,
    startDate: startDate.toISOString(),
    stopDate,
    durationDays: medication.duration,
    remainingDays,
    isAsNeeded: frequencyResult.isAsNeeded || false,
    foodTiming: medication.foodTiming,
    specialInstructions: medication.specialInstructions,
    dailyDoses,
    nextDoseTime,
    status
  };

  return {
    success: true,
    schedule
  };
}

/**
 * Generate daily doses for today based on dose times
 */
function generateDailyDoses(times: string[], currentDate: Date): ScheduledDose[] {
  return times.map(time => ({
    time,
    taken: false,
    skipped: false
  }));
}

/**
 * Find the next upcoming dose time
 */
function findNextDoseTime(doses: ScheduledDose[], currentDate: Date): string | undefined {
  const currentTime = formatCurrentTime(currentDate);
  
  // Find the next dose that hasn't been taken
  for (const dose of doses) {
    if (!dose.taken && !dose.skipped && dose.time >= currentTime) {
      return dose.time;
    }
  }

  // If no dose found today, return the first dose of tomorrow
  if (doses.length > 0) {
    return doses[0].time;
  }

  return undefined;
}

/**
 * Format current time as HH:MM
 */
function formatCurrentTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Determine medication status based on dates
 */
function determineStatus(currentDate: Date, stopDate: Date, remainingDays: number): 'active' | 'completed' | 'discontinued' {
  if (remainingDays <= 0 || currentDate >= stopDate) {
    return 'completed';
  }
  return 'active';
}

/**
 * Update medication schedules with remaining duration
 * Requirement 13.5: Update remaining duration daily at midnight
 * 
 * @param schedules - Array of medication schedules to update
 * @param currentDate - Current date (defaults to now)
 * @returns Updated schedules with recalculated remaining days
 */
export function updateSchedulesRemainingDuration(
  schedules: MedicationSchedule[],
  currentDate?: Date
): MedicationSchedule[] {
  const now = currentDate || new Date();

  return schedules.map(schedule => {
    const stopDate = new Date(schedule.stopDate);
    const remainingDays = Math.max(0, Math.ceil((stopDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const status = determineStatus(now, stopDate, remainingDays);

    // Reset daily doses for the new day
    const dailyDoses = generateDailyDoses(
      schedule.isAsNeeded ? [] : extractTimesFromSchedule(schedule),
      now
    );

    const nextDoseTime = findNextDoseTime(dailyDoses, now);

    return {
      ...schedule,
      remainingDays,
      status,
      dailyDoses,
      nextDoseTime
    };
  });
}

/**
 * Extract dose times from a schedule (for regenerating daily doses)
 */
function extractTimesFromSchedule(schedule: MedicationSchedule): string[] {
  // Parse frequency again to get times
  const frequencyResult = parseFrequency(schedule.frequency);
  return frequencyResult.times || [];
}

/**
 * Sort medication schedules chronologically by next dose time
 * Requirement 13.4: Organize medications chronologically by scheduled time
 * 
 * @param schedules - Array of medication schedules
 * @returns Sorted schedules with earliest dose times first
 */
export function sortSchedulesByTime(schedules: MedicationSchedule[]): MedicationSchedule[] {
  return [...schedules].sort((a, b) => {
    // As-needed medications go to the end
    if (a.isAsNeeded && !b.isAsNeeded) return 1;
    if (!a.isAsNeeded && b.isAsNeeded) return -1;
    if (a.isAsNeeded && b.isAsNeeded) return 0;

    // Completed medications go to the end
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;

    // Sort by next dose time
    if (!a.nextDoseTime && b.nextDoseTime) return 1;
    if (a.nextDoseTime && !b.nextDoseTime) return -1;
    if (!a.nextDoseTime && !b.nextDoseTime) return 0;

    return a.nextDoseTime!.localeCompare(b.nextDoseTime!);
  });
}

/**
 * Mark a dose as taken
 * 
 * @param schedule - Medication schedule
 * @param doseTime - Time of the dose to mark as taken
 * @param takenAt - Timestamp when dose was taken (defaults to now)
 * @returns Updated schedule
 */
export function markDoseAsTaken(
  schedule: MedicationSchedule,
  doseTime: string,
  takenAt?: Date | string
): MedicationSchedule {
  const timestamp = takenAt 
    ? (typeof takenAt === 'string' ? takenAt : takenAt.toISOString())
    : new Date().toISOString();

  const updatedDoses = schedule.dailyDoses.map(dose => {
    if (dose.time === doseTime) {
      return {
        ...dose,
        taken: true,
        takenAt: timestamp,
        skipped: false,
        skippedReason: undefined
      };
    }
    return dose;
  });

  const nextDoseTime = findNextDoseTime(updatedDoses, new Date());

  return {
    ...schedule,
    dailyDoses: updatedDoses,
    nextDoseTime
  };
}

/**
 * Mark a dose as skipped
 * 
 * @param schedule - Medication schedule
 * @param doseTime - Time of the dose to mark as skipped
 * @param reason - Reason for skipping (optional)
 * @returns Updated schedule
 */
export function markDoseAsSkipped(
  schedule: MedicationSchedule,
  doseTime: string,
  reason?: string
): MedicationSchedule {
  const updatedDoses = schedule.dailyDoses.map(dose => {
    if (dose.time === doseTime) {
      return {
        ...dose,
        taken: false,
        takenAt: undefined,
        skipped: true,
        skippedReason: reason
      };
    }
    return dose;
  });

  const nextDoseTime = findNextDoseTime(updatedDoses, new Date());

  return {
    ...schedule,
    dailyDoses: updatedDoses,
    nextDoseTime
  };
}

/**
 * Get all active medications (not completed or discontinued)
 * 
 * @param schedules - Array of medication schedules
 * @returns Active schedules only
 */
export function getActiveMedications(schedules: MedicationSchedule[]): MedicationSchedule[] {
  return schedules.filter(schedule => schedule.status === 'active');
}

/**
 * Get medications due now (within next 30 minutes)
 * 
 * @param schedules - Array of medication schedules
 * @param currentDate - Current date (defaults to now)
 * @returns Schedules with doses due now
 */
export function getMedicationsDueNow(
  schedules: MedicationSchedule[],
  currentDate?: Date
): MedicationSchedule[] {
  const now = currentDate || new Date();
  const currentTime = formatCurrentTime(now);
  
  // Calculate time 30 minutes from now
  const futureTime = new Date(now.getTime() + 30 * 60 * 1000);
  const futureTimeStr = formatCurrentTime(futureTime);

  return schedules.filter(schedule => {
    if (schedule.isAsNeeded || schedule.status !== 'active') {
      return false;
    }

    return schedule.dailyDoses.some(dose => 
      !dose.taken && 
      !dose.skipped && 
      dose.time >= currentTime && 
      dose.time <= futureTimeStr
    );
  });
}

/**
 * Calculate adherence rate for a medication schedule
 * 
 * @param schedule - Medication schedule
 * @returns Adherence rate as percentage (0-100)
 */
export function calculateAdherenceRate(schedule: MedicationSchedule): number {
  if (schedule.isAsNeeded || schedule.dailyDoses.length === 0) {
    return 100; // As-needed medications don't have adherence tracking
  }

  const totalDoses = schedule.dailyDoses.length;
  const takenDoses = schedule.dailyDoses.filter(dose => dose.taken).length;

  return Math.round((takenDoses / totalDoses) * 100);
}

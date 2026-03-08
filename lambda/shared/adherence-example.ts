// Example usage of adherence calculator
// This file demonstrates how to use the adherence calculation functions

import {
  calculatePatientAdherence,
  calculateMedicineAdherence,
  generateAdherenceTrends,
  identifyLowAdherencePatients,
  getMissedDoses
} from './adherence-calculator';

/**
 * Example 1: Calculate overall adherence for a patient
 */
export async function exampleCalculatePatientAdherence() {
  const patientId = 'patient-123';
  
  const adherence = await calculatePatientAdherence(patientId);
  
  console.log('Patient Adherence Report:');
  console.log(`Patient ID: ${adherence.patientId}`);
  console.log(`Overall Adherence: ${adherence.overallAdherence}%`);
  console.log(`Total Scheduled: ${adherence.totalScheduled}`);
  console.log(`Total Taken: ${adherence.totalTaken}`);
  console.log(`Total Missed: ${adherence.totalMissed}`);
  console.log(`Low Adherence Warning: ${adherence.isLowAdherence ? 'YES' : 'NO'}`);
  
  console.log('\nMedicine Breakdown:');
  adherence.medicineAdherence.forEach(med => {
    console.log(`  - ${med.medicineName} (${med.dosage}): ${med.adherencePercentage}%`);
    console.log(`    Scheduled: ${med.scheduled}, Taken: ${med.taken}, Missed: ${med.missed}`);
    console.log(`    Status: ${med.isActive ? 'Active' : 'Completed'}`);
  });
  
  return adherence;
}

/**
 * Example 2: Calculate adherence for a specific medicine
 */
export async function exampleCalculateMedicineAdherence() {
  const patientId = 'patient-123';
  const medicineId = 'med-1';
  
  const medicineAdherence = await calculateMedicineAdherence(patientId, medicineId);
  
  if (!medicineAdherence) {
    console.log('Medicine not found');
    return null;
  }
  
  console.log('Medicine Adherence Report:');
  console.log(`Medicine: ${medicineAdherence.medicineName} (${medicineAdherence.dosage})`);
  console.log(`Adherence: ${medicineAdherence.adherencePercentage}%`);
  console.log(`Scheduled: ${medicineAdherence.scheduled}`);
  console.log(`Taken: ${medicineAdherence.taken}`);
  console.log(`Missed: ${medicineAdherence.missed}`);
  console.log(`Period: ${medicineAdherence.startDate} to ${medicineAdherence.stopDate}`);
  
  return medicineAdherence;
}

/**
 * Example 3: Generate daily adherence trends
 */
export async function exampleGenerateDailyTrends() {
  const patientId = 'patient-123';
  const startDate = '2024-01-01';
  const endDate = '2024-01-07';
  
  const trends = await generateAdherenceTrends(patientId, 'daily', startDate, endDate);
  
  console.log('Daily Adherence Trends:');
  console.log('Date       | Adherence | Scheduled | Taken | Missed');
  console.log('-----------|-----------|-----------|-------|-------');
  
  trends.forEach(trend => {
    console.log(
      `${trend.date} | ${String(trend.adherencePercentage).padStart(8)}% | ` +
      `${String(trend.scheduled).padStart(9)} | ${String(trend.taken).padStart(5)} | ` +
      `${String(trend.missed).padStart(6)}`
    );
  });
  
  return trends;
}

/**
 * Example 4: Generate weekly adherence trends
 */
export async function exampleGenerateWeeklyTrends() {
  const patientId = 'patient-123';
  const startDate = '2024-01-01';
  const endDate = '2024-01-28';
  
  const trends = await generateAdherenceTrends(patientId, 'weekly', startDate, endDate);
  
  console.log('Weekly Adherence Trends:');
  console.log('Week Start | Adherence | Scheduled | Taken | Missed');
  console.log('-----------|-----------|-----------|-------|-------');
  
  trends.forEach(trend => {
    console.log(
      `${trend.date} | ${String(trend.adherencePercentage).padStart(8)}% | ` +
      `${String(trend.scheduled).padStart(9)} | ${String(trend.taken).padStart(5)} | ` +
      `${String(trend.missed).padStart(6)}`
    );
  });
  
  return trends;
}

/**
 * Example 5: Identify patients with low adherence
 */
export async function exampleIdentifyLowAdherencePatients() {
  const patientIds = ['patient-1', 'patient-2', 'patient-3', 'patient-4', 'patient-5'];
  
  console.log('Checking adherence for patients:', patientIds.join(', '));
  
  const lowAdherencePatients = await identifyLowAdherencePatients(patientIds);
  
  console.log(`\nPatients with low adherence (< 80%): ${lowAdherencePatients.length}`);
  
  if (lowAdherencePatients.length > 0) {
    console.log('Low adherence patients:');
    lowAdherencePatients.forEach(patientId => {
      console.log(`  - ${patientId}`);
    });
  } else {
    console.log('All patients have good adherence!');
  }
  
  return lowAdherencePatients;
}

/**
 * Example 6: Get missed doses for a patient
 */
export async function exampleGetMissedDoses() {
  const patientId = 'patient-123';
  
  // Get all missed doses
  const allMissedDoses = await getMissedDoses(patientId);
  
  console.log(`Total missed doses: ${allMissedDoses.length}`);
  
  if (allMissedDoses.length > 0) {
    console.log('\nMissed Doses:');
    console.log('Date       | Time  | Medicine         | Dosage | Status');
    console.log('-----------|-------|------------------|--------|-------');
    
    allMissedDoses.forEach(dose => {
      console.log(
        `${dose.scheduledDate} | ${dose.scheduledTime} | ` +
        `${dose.medicineName.padEnd(16)} | ${dose.dosage.padEnd(6)} | ${dose.status}`
      );
    });
  }
  
  // Get missed doses in a specific date range
  const startDate = '2024-01-01';
  const endDate = '2024-01-31';
  const missedDosesInRange = await getMissedDoses(patientId, startDate, endDate);
  
  console.log(`\nMissed doses between ${startDate} and ${endDate}: ${missedDosesInRange.length}`);
  
  return {
    allMissedDoses,
    missedDosesInRange
  };
}

/**
 * Example 7: Complete adherence dashboard data
 */
export async function exampleAdherenceDashboard(patientId: string) {
  console.log('=== Adherence Dashboard ===\n');
  
  // 1. Overall adherence
  const adherence = await calculatePatientAdherence(patientId);
  console.log(`Overall Adherence: ${adherence.overallAdherence}%`);
  
  if (adherence.isLowAdherence) {
    console.log('⚠️  WARNING: Low adherence detected!\n');
  } else {
    console.log('✓ Good adherence\n');
  }
  
  // 2. Medicine breakdown
  console.log('Medicine Adherence:');
  adherence.medicineAdherence.forEach(med => {
    const status = med.isActive ? '(Active)' : '(Completed)';
    const indicator = med.adherencePercentage < 80 ? '⚠️ ' : '✓ ';
    console.log(
      `${indicator}${med.medicineName}: ${med.adherencePercentage}% ${status}`
    );
  });
  console.log();
  
  // 3. Recent trends (last 7 days)
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const trends = await generateAdherenceTrends(patientId, 'daily', startDate, endDate);
  
  console.log('Recent Trends (Last 7 Days):');
  const avgAdherence = trends.reduce((sum, t) => sum + t.adherencePercentage, 0) / trends.length;
  console.log(`Average: ${Math.round(avgAdherence)}%`);
  
  // 4. Missed doses
  const missedDoses = await getMissedDoses(patientId, startDate, endDate);
  console.log(`\nMissed Doses (Last 7 Days): ${missedDoses.length}`);
  
  return {
    adherence,
    trends,
    missedDoses
  };
}

/**
 * Example 8: Batch processing for multiple patients
 */
export async function exampleBatchAdherenceReport(patientIds: string[]) {
  console.log('=== Batch Adherence Report ===\n');
  console.log(`Processing ${patientIds.length} patients...\n`);
  
  const results = [];
  
  for (const patientId of patientIds) {
    const adherence = await calculatePatientAdherence(patientId);
    results.push({
      patientId,
      adherence: adherence.overallAdherence,
      isLowAdherence: adherence.isLowAdherence,
      totalScheduled: adherence.totalScheduled,
      totalTaken: adherence.totalTaken
    });
  }
  
  // Sort by adherence (lowest first)
  results.sort((a, b) => a.adherence - b.adherence);
  
  console.log('Patient ID    | Adherence | Scheduled | Taken | Status');
  console.log('--------------|-----------|-----------|-------|--------');
  
  results.forEach(result => {
    const status = result.isLowAdherence ? '⚠️  LOW' : '✓ Good';
    console.log(
      `${result.patientId.padEnd(13)} | ${String(result.adherence).padStart(8)}% | ` +
      `${String(result.totalScheduled).padStart(9)} | ${String(result.totalTaken).padStart(5)} | ${status}`
    );
  });
  
  const lowAdherenceCount = results.filter(r => r.isLowAdherence).length;
  console.log(`\nSummary: ${lowAdherenceCount}/${results.length} patients with low adherence`);
  
  return results;
}

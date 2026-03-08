# Adherence Calculator Module

## Overview

The adherence calculator module provides comprehensive medication adherence tracking functionality for the CareNav AI system. It calculates adherence metrics, identifies low-adherence patients, and generates adherence trends over time.

## Features

- **Overall Patient Adherence**: Calculate adherence percentage across all medications
- **Medicine-Specific Adherence**: Calculate adherence for individual medicines
- **Low Adherence Detection**: Identify patients with adherence < 80%
- **Adherence Trends**: Generate daily or weekly adherence trends
- **Missed Dose Tracking**: Query missed doses with date filtering

## Core Functions

### calculatePatientAdherence

Calculates overall adherence metrics for a patient across all their medications.

```typescript
import { calculatePatientAdherence } from './adherence-calculator';

const adherence = await calculatePatientAdherence('patient-123');

console.log(adherence);
// {
//   patientId: 'patient-123',
//   overallAdherence: 85,
//   medicineAdherence: [
//     {
//       medicineId: 'med-1',
//       medicineName: 'Aspirin',
//       dosage: '75mg',
//       adherencePercentage: 90,
//       scheduled: 10,
//       taken: 9,
//       missed: 1,
//       startDate: '2024-01-01T00:00:00.000Z',
//       stopDate: '2024-01-31T00:00:00.000Z',
//       isActive: true
//     }
//   ],
//   totalScheduled: 10,
//   totalTaken: 9,
//   totalMissed: 1,
//   isLowAdherence: false,
//   lastCalculated: '2024-01-15T10:30:00.000Z'
// }
```

### calculateMedicineAdherence

Calculates adherence metrics for a specific medicine.

```typescript
import { calculateMedicineAdherence } from './adherence-calculator';

const medicineAdherence = await calculateMedicineAdherence('patient-123', 'med-1');

console.log(medicineAdherence);
// {
//   medicineId: 'med-1',
//   medicineName: 'Aspirin',
//   dosage: '75mg',
//   adherencePercentage: 90,
//   scheduled: 10,
//   taken: 9,
//   missed: 1,
//   startDate: '2024-01-01T00:00:00.000Z',
//   stopDate: '2024-01-31T00:00:00.000Z',
//   isActive: true
// }
```

### generateAdherenceTrends

Generates adherence trends over time (daily or weekly).

```typescript
import { generateAdherenceTrends } from './adherence-calculator';

// Daily trends for the last 7 days
const dailyTrends = await generateAdherenceTrends(
  'patient-123',
  'daily',
  '2024-01-08',
  '2024-01-14'
);

console.log(dailyTrends);
// [
//   {
//     date: '2024-01-08',
//     adherencePercentage: 100,
//     scheduled: 3,
//     taken: 3,
//     missed: 0
//   },
//   {
//     date: '2024-01-09',
//     adherencePercentage: 67,
//     scheduled: 3,
//     taken: 2,
//     missed: 1
//   },
//   // ... more days
// ]

// Weekly trends for the last 4 weeks
const weeklyTrends = await generateAdherenceTrends(
  'patient-123',
  'weekly',
  '2024-01-01',
  '2024-01-28'
);

console.log(weeklyTrends);
// [
//   {
//     date: '2024-01-01', // Week start (Monday)
//     adherencePercentage: 85,
//     scheduled: 21,
//     taken: 18,
//     missed: 3
//   },
//   // ... more weeks
// ]
```

### identifyLowAdherencePatients

Identifies patients with adherence below 80%.

```typescript
import { identifyLowAdherencePatients } from './adherence-calculator';

const patientIds = ['patient-1', 'patient-2', 'patient-3'];
const lowAdherencePatients = await identifyLowAdherencePatients(patientIds);

console.log(lowAdherencePatients);
// ['patient-2'] // Only patient-2 has adherence < 80%
```

### getMissedDoses

Retrieves missed doses for a patient with optional date filtering.

```typescript
import { getMissedDoses } from './adherence-calculator';

// Get all missed doses
const allMissedDoses = await getMissedDoses('patient-123');

// Get missed doses within a date range
const missedDosesInRange = await getMissedDoses(
  'patient-123',
  '2024-01-01',
  '2024-01-31'
);

console.log(missedDosesInRange);
// [
//   {
//     patientId: 'patient-123',
//     medicineId: 'med-1',
//     medicineName: 'Aspirin',
//     dosage: '75mg',
//     scheduledDate: '2024-01-05',
//     scheduledTime: '08:00',
//     status: 'missed',
//     takenAt: null,
//     createdAt: '2024-01-05T08:00:00.000Z'
//   },
//   // ... more missed doses
// ]
```

## Data Types

### PatientAdherence

```typescript
interface PatientAdherence {
  patientId: string;
  overallAdherence: number; // 0-100
  medicineAdherence: MedicineAdherence[];
  totalScheduled: number;
  totalTaken: number;
  totalMissed: number;
  isLowAdherence: boolean; // true if < 80%
  lastCalculated: string; // ISO timestamp
}
```

### MedicineAdherence

```typescript
interface MedicineAdherence {
  medicineId: string;
  medicineName: string;
  dosage: string;
  adherencePercentage: number; // 0-100
  scheduled: number;
  taken: number;
  missed: number;
  startDate: string; // ISO timestamp
  stopDate: string; // ISO timestamp
  isActive: boolean;
}
```

### AdherenceTrend

```typescript
interface AdherenceTrend {
  date: string; // YYYY-MM-DD
  adherencePercentage: number; // 0-100
  scheduled: number;
  taken: number;
  missed: number;
}
```

## Adherence Calculation Formula

```
Adherence Percentage = (Doses Taken / Doses Scheduled) × 100
```

- **Doses Scheduled**: Total number of dose records created (including taken, missed, and due)
- **Doses Taken**: Number of doses with status = 'taken'
- **Low Adherence Threshold**: < 80%

## Usage in Lambda Functions

### Example: Adherence Dashboard Endpoint

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { calculatePatientAdherence, getMissedDoses } from '../shared/adherence-calculator';
import { successResponse, errorResponse } from '../shared/response';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const patientId = event.pathParameters?.patientId;

  if (!patientId) {
    return errorResponse('patientId is required', 400);
  }

  try {
    // Calculate adherence
    const adherence = await calculatePatientAdherence(patientId);

    // Get missed doses
    const missedDoses = await getMissedDoses(patientId);

    return successResponse({
      adherence,
      missedDoses,
      warning: adherence.isLowAdherence ? 'Low adherence detected' : null
    });
  } catch (error: any) {
    console.error('Error calculating adherence:', error);
    return errorResponse(error.message, 500);
  }
}
```

## Requirements Mapping

This module implements the following requirements:

- **Requirement 9.2**: Calculate adherence percentage as (doses taken / doses scheduled) × 100
- **Requirement 9.3**: Flag patients with adherence < 80%
- **Requirement 9.5**: Show adherence trends over time (daily, weekly)

## Performance Considerations

- **Caching**: Consider caching adherence calculations for frequently accessed patients
- **Batch Processing**: Use `identifyLowAdherencePatients` for bulk patient analysis
- **Date Filtering**: Use date range filters in `getMissedDoses` to reduce data transfer
- **DynamoDB Queries**: All queries use efficient KeyConditionExpression with partition and sort keys

## Testing

Unit tests are provided in `adherence-calculator.test.ts` covering:

- Overall adherence calculation
- Medicine-specific adherence
- Low adherence detection
- Daily and weekly trend generation
- Missed dose retrieval with date filtering

## Future Enhancements

- **Predictive Analytics**: Predict future adherence based on historical trends
- **Adherence Alerts**: Automated notifications for declining adherence
- **Comparative Analysis**: Compare patient adherence against population averages
- **Adherence Scoring**: Multi-factor adherence scoring beyond simple percentage

# Prescription Handler Lambda

## Overview

The Prescription Handler Lambda manages medication prescriptions for the Doctor Dashboard Patient Management feature. It allows doctors to prescribe medications directly in the app, with automatic synchronization to the patient's medication list and retry logic for failed syncs.

## Features

- **Prescription Creation**: Create prescriptions with multiple medications
- **Automatic Synchronization**: Sync prescriptions to patient app with treatment plan generation
- **Retry Logic**: Automatic retry (3 attempts, 5-second intervals) for failed syncs
- **Chat Integration**: Automatically adds prescription messages to treatment episode chat threads
- **Audit Logging**: Logs all prescription creation events for compliance
- **Validation**: Comprehensive validation of medication entries

## API Endpoints

### POST /api/prescription/create

Create a new prescription for a patient.

**Request Body:**
```json
{
  "episodeId": "uuid",
  "patientId": "uuid",
  "doctorId": "uuid",
  "doctorName": "Dr. John Smith",
  "medications": [
    {
      "medicineName": "Amoxicillin",
      "dosage": "500mg",
      "frequency": "three times daily",
      "duration": 7,
      "specialInstructions": "Take with food",
      "foodTiming": "after food"
    },
    {
      "medicineName": "Ibuprofen",
      "dosage": "400mg",
      "frequency": "twice daily",
      "duration": 5,
      "foodTiming": "after food"
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "prescriptionId": "uuid",
  "episodeId": "uuid",
  "patientId": "uuid",
  "doctorId": "uuid",
  "medications": [...],
  "syncStatus": "synced",
  "scheduleGenerated": true,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Validation Rules:**
- All required fields must be present: `episodeId`, `patientId`, `doctorId`, `doctorName`, `medications`
- `medications` must be a non-empty array
- Each medication must have: `medicineName`, `dosage`, `frequency`, `duration`
- `duration` must be a positive number (days)
- Only the doctor specified in `doctorId` can create the prescription (authorization check)

### GET /api/prescription/{prescriptionId}

Retrieve prescription details.

**Query Parameters:**
- `patientId` (required): Patient ID for DynamoDB query

**Response (200 OK):**
```json
{
  "prescriptionId": "uuid",
  "episodeId": "uuid",
  "patientId": "uuid",
  "doctorId": "uuid",
  "doctorName": "Dr. John Smith",
  "medications": [...],
  "syncStatus": "synced",
  "syncAttempts": 1,
  "lastSyncAttempt": "2024-01-15T10:30:05Z",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:05Z"
}
```

### POST /api/prescription/sync

Manually trigger prescription synchronization to patient app.

**Request Body:**
```json
{
  "prescriptionId": "uuid",
  "patientId": "uuid"
}
```

**Response (200 OK):**
```json
{
  "prescriptionId": "uuid",
  "syncStatus": "synced",
  "syncAttempts": 2,
  "scheduleGenerated": true
}
```

**Response (200 OK - Failed):**
```json
{
  "prescriptionId": "uuid",
  "syncStatus": "failed",
  "syncAttempts": 3,
  "scheduleGenerated": false,
  "error": "Failed to sync after maximum retry attempts"
}
```

## Synchronization Process

### Automatic Sync on Creation

When a prescription is created, the handler automatically attempts to sync it to the patient app:

1. **Parse Medications**: Convert medication entries to treatment plan format
2. **Generate Schedule**: Use frequency parser to calculate dose times
3. **Calculate Dates**: Determine start and stop dates based on duration
4. **Create Treatment Plan**: Store treatment plan in DynamoDB
5. **Update Status**: Mark prescription as synced or pending

### Retry Logic

If synchronization fails, the system implements retry logic:

- **Maximum Attempts**: 3 attempts
- **Retry Interval**: 5 seconds between attempts
- **Status Tracking**: Updates `syncStatus`, `syncAttempts`, and `lastSyncAttempt`
- **Failure Handling**: After 3 failed attempts, marks prescription as `failed`

### Manual Sync

Doctors can manually trigger synchronization using the `/api/prescription/sync` endpoint:

- Useful for retrying failed syncs
- Follows the same retry logic (3 attempts, 5-second intervals)
- Returns detailed sync status and error information

## Data Model

### Prescription Object

```typescript
interface PrescriptionData {
  prescriptionId: string;
  episodeId: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  medications: MedicationEntry[];
  syncStatus: 'pending' | 'synced' | 'failed';
  syncAttempts: number;
  lastSyncAttempt?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Medication Entry

```typescript
interface MedicationEntry {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: number; // days
  specialInstructions?: string;
  foodTiming?: 'before food' | 'after food' | 'with food' | 'anytime';
}
```

### DynamoDB Storage

**Primary Key:**
- `PK`: `PATIENT#{patientId}`
- `SK`: `PRESCRIPTION#{prescriptionId}`

**Attributes:**
- All prescription fields
- Sync status tracking
- Timestamps

## Integration Points

### Treatment Handler

- Adds prescription messages to chat threads via `addMessage()`
- Links prescriptions to treatment episodes

### Treatment Planner

- Creates treatment plans from prescriptions
- Generates medication schedules with dose times
- Manages patient medication list

### Frequency Parser

- Parses frequency strings (e.g., "three times daily")
- Generates specific dose times (e.g., ["08:00", "14:00", "20:00"])
- Calculates stop dates based on duration

### Audit Log

- Logs all prescription creation events
- Tracks doctor access to patient data
- Includes IP address and user agent for security

## Error Handling

### Validation Errors (400)

- Missing required fields
- Invalid medication entries
- Invalid duration values
- Empty medications array

### Authorization Errors (403)

- Doctor attempting to create prescription for another doctor
- Unauthorized access to prescription data

### Not Found Errors (404)

- Prescription not found
- Invalid prescription ID

### Server Errors (500)

- DynamoDB operation failures
- Sync failures after all retries
- Unexpected errors

## Testing

### Test Script

A test script is provided to verify functionality:

```bash
cd lambda/prescription-handler
ts-node test-handler.ts
```

### Test Cases

1. **Create Prescription**: Test prescription creation with multiple medications
2. **Get Prescription**: Test prescription retrieval
3. **Sync Prescription**: Test manual synchronization
4. **Validation**: Test field validation and error handling
5. **Authorization**: Test doctor authorization checks
6. **Retry Logic**: Test sync retry mechanism

## Environment Variables

- `AWS_REGION`: AWS region (default: ap-south-1)
- `TABLE_NAME`: DynamoDB table name (default: CareNavAI)

## Dependencies

- `@aws-sdk/client-dynamodb`: DynamoDB client
- `@aws-sdk/lib-dynamodb`: DynamoDB document client
- `uuid`: UUID generation
- `../shared/response`: Response utilities
- `../shared/frequency-parser`: Frequency parsing
- `../shared/chat-message-db`: Chat message operations
- `../shared/audit-log`: Audit logging

## Requirements Validation

This implementation satisfies the following requirements:

- **Requirement 11.1**: Prescription Module provides "Prescribe Medication" functionality
- **Requirement 11.3**: Validates medication name, dosage, frequency, and duration
- **Requirement 11.4**: Validates all required fields before submission
- **Requirement 11.5**: Saves prescription within 1 second
- **Requirement 11.6**: Supports multiple medications in a single prescription
- **Requirement 12.1**: Transmits prescription to patient app
- **Requirement 12.2**: Includes all required fields in transmission
- **Requirement 12.3**: Implements retry logic (3 attempts, 5-second intervals)
- **Requirement 12.4**: Logs errors and notifies doctor on failure

## Future Enhancements

- **Email Notifications**: Send email to doctor on sync failure
- **Webhook Support**: Notify external systems of prescription events
- **Prescription Templates**: Save and reuse common prescription patterns
- **Drug Interaction Checking**: Validate medications against patient history
- **Prescription Printing**: Generate printable prescription documents
- **E-Prescription**: Digital signature and verification for pharmacies

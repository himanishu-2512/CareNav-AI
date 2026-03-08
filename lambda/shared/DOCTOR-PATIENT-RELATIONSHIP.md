# Doctor-Patient Relationship Database Module

## Overview

This module extends `lambda/shared/patient-db.ts` with doctor-patient relationship management functions. It implements the DynamoDB operations for tracking which patients are associated with which doctors, supporting the Doctor Dashboard Patient Management feature.

## Implementation Details

### DynamoDB Pattern

The module uses the following DynamoDB single-table design pattern:

```
PK: DOCTOR#{doctorId}
SK: PATIENT#{patientId}
```

**Attributes:**
- `doctorId`: Doctor's user ID
- `patientId`: Patient's ID
- `uhid`: Unique Health ID (currently using patientId)
- `patientName`: Patient's full name
- `addedAt`: ISO timestamp when patient was added to doctor's list
- `addedVia`: How the patient was added ('qr_scan' | 'manual_code')
- `lastConsultation`: ISO timestamp of the most recent consultation
- `treatmentStatus`: Current treatment status ('ongoing' | 'past')
- `accessGrantedBy`: QR token ID or unique code used for access

### Functions Implemented

#### 1. `addPatientToDoctor()`

Adds a patient to a doctor's patient roster.

**Parameters:**
- `doctorId` (string): Doctor's user ID
- `patientId` (string): Patient's ID
- `addedVia` ('qr_scan' | 'manual_code'): How the patient was added
- `accessGrantedBy` (string): QR token ID or unique code

**Returns:** `DoctorPatientRelationship` object

**Behavior:**
- Fetches patient details to populate the relationship
- Creates a new doctor-patient relationship record
- Sets initial `lastConsultation` to current timestamp
- Sets initial `treatmentStatus` to 'ongoing'
- Throws error if patient doesn't exist

**Example:**
```typescript
const relationship = await addPatientToDoctor(
  'doctor-123',
  'patient-456',
  'qr_scan',
  'qr-token-abc123'
);
```

#### 2. `getDoctorPatients()`

Retrieves all patients for a doctor with optional filtering and pagination.

**Parameters:**
- `doctorId` (string): Doctor's user ID
- `options` (optional object):
  - `statusFilter`: Array of statuses to filter by (['ongoing'] | ['past'] | ['ongoing', 'past'])
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 20)

**Returns:** `DoctorPatientsResponse` object containing:
- `patients`: Array of `PatientListItem` objects
- `totalCount`: Total number of patients (after filtering)
- `page`: Current page number
- `totalPages`: Total number of pages
- `hasMore`: Boolean indicating if more pages exist

**Behavior:**
- Queries all patients for the doctor
- Applies status filter if provided
- Sorts by last consultation date (most recent first)
- Paginates results (20 per page by default)
- Returns empty array if no patients found

**Example:**
```typescript
// Get all patients
const response = await getDoctorPatients('doctor-123');

// Get only ongoing patients with pagination
const ongoingResponse = await getDoctorPatients('doctor-123', {
  statusFilter: ['ongoing'],
  page: 1,
  limit: 20
});
```

#### 3. `updateLastConsultation()`

Updates the last consultation timestamp for a doctor-patient relationship.

**Parameters:**
- `doctorId` (string): Doctor's user ID
- `patientId` (string): Patient's ID
- `timestamp` (string, optional): ISO timestamp (defaults to current time)

**Returns:** `void`

**Behavior:**
- Updates the `lastConsultation` field in the relationship record
- Uses current timestamp if none provided
- Does not validate if relationship exists (DynamoDB will create if missing)

**Example:**
```typescript
// Update to current time
await updateLastConsultation('doctor-123', 'patient-456');

// Update to specific time
await updateLastConsultation(
  'doctor-123', 
  'patient-456', 
  '2024-01-15T10:30:00Z'
);
```

## Type Definitions

New types added to `lambda/shared/types.ts`:

### `DoctorPatientRelationship`
Complete relationship record stored in DynamoDB.

### `PatientListItem`
Simplified patient information for list display.

### `DoctorPatientsResponse`
Paginated response structure for patient list queries.

## DynamoDB Key Helper

Added to `DynamoDBKeys` in `types.ts`:

```typescript
doctorPatient: (doctorId: string, patientId: string) => ({
  PK: `DOCTOR#${doctorId}`,
  SK: `PATIENT#${patientId}`
})
```

## Testing

A test script is provided at `lambda/shared/test-doctor-patient-db.ts` that demonstrates:

1. Creating test patients
2. Adding patients to doctor via QR scan
3. Adding patients via manual code
4. Retrieving doctor's patient list
5. Pagination functionality
6. Status filtering
7. Updating last consultation timestamp

**Run tests:**
```bash
npx ts-node lambda/shared/test-doctor-patient-db.ts
```

## Requirements Satisfied

This implementation satisfies the following requirements from the spec:

- **Requirement 1.1**: Doctor dashboard displays patient list
- **Requirement 4.5**: Add patient to doctor's list on QR authentication success
- **Requirement 5.4**: Add patient to doctor's list on manual code authentication success
- **Requirement 20.2**: Track access method (QR token or code) for audit purposes

## Next Steps

The following tasks build on this foundation:

- **Task 1.2**: Property-based tests for doctor-patient operations
- **Task 2.1**: QR authentication Lambda handler (will use `addPatientToDoctor`)
- **Task 3.1**: Doctor handler Lambda (will use `getDoctorPatients`)
- **Task 1.7**: Access audit logging module (will track when doctors access patient data)

## Notes

- Currently using `patientId` as `uhid` - this may need to be updated if a separate UHID system is implemented
- The `treatmentStatus` field is initialized to 'ongoing' and will need to be updated when treatments are completed (Task 1.3)
- Pagination is done in-memory after fetching all results - for large patient lists, consider using DynamoDB's pagination features
- No GSI is required for this access pattern since we're querying by doctor ID (partition key)

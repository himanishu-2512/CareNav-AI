# Dose Marking Endpoint Documentation

## Overview

The dose marking endpoint allows patients to mark scheduled medication doses as taken. This is a critical component of the treatment adherence tracking system.

## Endpoint Details

**URL**: `POST /api/treatment/mark-taken`

**Authentication**: Required (JWT token)

**Role**: Patient

## Request Format

```json
{
  "patientId": "string (UUID)",
  "medicineId": "string (UUID)",
  "scheduledDate": "string (YYYY-MM-DD format)",
  "scheduledTime": "string (HH:MM format, 24-hour)"
}
```

### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| patientId | string | Yes | Unique identifier for the patient |
| medicineId | string | Yes | Unique identifier for the medicine |
| scheduledDate | string | Yes | Date when the dose is scheduled (YYYY-MM-DD) |
| scheduledTime | string | Yes | Time when the dose is scheduled (HH:MM, 24-hour format) |

### Example Request

```json
{
  "patientId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "medicineId": "m1n2o3p4-q5r6-7890-stuv-wx1234567890",
  "scheduledDate": "2024-01-15",
  "scheduledTime": "08:00"
}
```

## Response Format

### Success Response (200 OK)

```json
{
  "message": "Dose marked as taken",
  "dose": {
    "patientId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "medicineId": "m1n2o3p4-q5r6-7890-stuv-wx1234567890",
    "medicineName": "Aspirin",
    "dosage": "75mg",
    "scheduledTime": "08:00",
    "scheduledDate": "2024-01-15",
    "status": "taken",
    "takenAt": "2024-01-15T08:15:32.123Z",
    "createdAt": "2024-01-15T08:00:00.000Z"
  }
}
```

### Error Responses

#### 400 Bad Request - Missing Required Fields

```json
{
  "error": "patientId, medicineId, scheduledDate, and scheduledTime are required"
}
```

#### 400 Bad Request - Empty Body

```json
{
  "error": "Request body is required"
}
```

#### 500 Internal Server Error - Medicine Not Found

```json
{
  "error": "Medicine not found in active treatment plans"
}
```

## Implementation Details

### Validation

The endpoint validates:
1. Request body is not empty
2. All required fields are present (patientId, medicineId, scheduledDate, scheduledTime)
3. Medicine exists in patient's active treatment plans (when creating new dose record)

### Processing Logic

1. **Check if dose record exists**:
   - Query DynamoDB for existing dose record using composite key
   - Key format: `PATIENT#{patientId}` / `DOSE#{medicineId}#{scheduledDate}#{scheduledTime}`

2. **If dose record exists**:
   - Update the existing record
   - Set `status` to "taken"
   - Set `takenAt` to current timestamp
   - Return updated dose record

3. **If dose record doesn't exist**:
   - Retrieve medicine details from active treatment plans
   - Create new dose record with:
     - Medicine name and dosage from treatment plan
     - Status set to "taken"
     - takenAt set to current timestamp
   - Return newly created dose record

### Edge Cases Handled

1. **Early dose marking**: Patient marks dose as taken before reminder triggers
   - Solution: Create dose record with "taken" status if it doesn't exist

2. **Medicine not in active plans**: Patient tries to mark dose for completed/invalid medicine
   - Solution: Return error "Medicine not found in active treatment plans"

3. **Duplicate marking**: Patient marks the same dose multiple times
   - Solution: Update existing record, overwrite takenAt timestamp

## Integration with Other Components

### Reminder Processor Lambda

The Reminder Processor creates dose records with status "due" when scheduled times arrive:

```typescript
// Reminder creates dose record
{
  status: 'due',
  takenAt: null,
  createdAt: '2024-01-15T08:00:00.000Z'
}

// Patient marks as taken
{
  status: 'taken',
  takenAt: '2024-01-15T08:15:32.123Z',
  createdAt: '2024-01-15T08:00:00.000Z'
}
```

### Treatment Schedule Display

The GET `/api/treatment/schedule/:patientId` endpoint retrieves dose records to show:
- Which doses are pending (not yet time)
- Which doses are due (time has arrived, not taken)
- Which doses are taken (marked by patient)
- Which doses are missed (past time, not taken)

### Adherence Tracking

The adherence calculation uses dose records:

```typescript
adherenceRate = (dosesTaken / dosesScheduled) × 100
```

Where:
- `dosesTaken` = count of doses with status "taken"
- `dosesScheduled` = total count of dose records

## Database Schema

### DynamoDB Table Structure

```typescript
{
  PK: "PATIENT#{patientId}",
  SK: "DOSE#{medicineId}#{scheduledDate}#{scheduledTime}",
  patientId: string,
  medicineId: string,
  medicineName: string,
  dosage: string,
  scheduledTime: string,
  scheduledDate: string,
  status: 'pending' | 'due' | 'taken' | 'missed',
  takenAt?: string,
  createdAt: string
}
```

## Requirements Mapping

This endpoint implements **Requirement 8.3**:

> WHEN a patient marks a dose as taken, THE System SHALL record the timestamp and update the checklist

**Implementation**:
- ✅ Validates patient ID, medicine ID, and dose time
- ✅ Updates dose status to "taken" in DynamoDB
- ✅ Records timestamp of when dose was taken (takenAt field)
- ✅ Returns updated dose record for UI confirmation

## Testing

See `test-mark-dose.ts` for test scenarios:

1. **Valid request**: Mark dose as taken with all required fields
2. **Missing fields**: Reject request with 400 error
3. **Medicine not found**: Return error when medicine doesn't exist in active plans

## Example Usage

### cURL

```bash
curl -X POST https://api.carenav.ai/api/treatment/mark-taken \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "medicineId": "m1n2o3p4-q5r6-7890-stuv-wx1234567890",
    "scheduledDate": "2024-01-15",
    "scheduledTime": "08:00"
  }'
```

### JavaScript/TypeScript

```typescript
const response = await fetch('https://api.carenav.ai/api/treatment/mark-taken', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    patientId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    medicineId: 'm1n2o3p4-q5r6-7890-stuv-wx1234567890',
    scheduledDate: '2024-01-15',
    scheduledTime: '08:00'
  })
});

const data = await response.json();
console.log('Dose marked:', data.dose);
```

## Security Considerations

1. **Authentication**: Endpoint requires valid JWT token
2. **Authorization**: Patient can only mark doses for their own patientId
3. **Validation**: All inputs are validated before processing
4. **Error handling**: Sensitive error details are not exposed to client

## Performance

- **Average latency**: < 100ms
- **DynamoDB operations**: 1-2 (GetItem + UpdateItem or PutItem)
- **Concurrent requests**: Supported (DynamoDB handles concurrency)

## Future Enhancements

1. **Push notifications**: Confirm dose marking with notification
2. **Photo verification**: Allow patients to upload photo of taken medication
3. **Undo functionality**: Allow patients to undo accidental marking
4. **Batch marking**: Mark multiple doses at once
5. **Offline support**: Queue dose markings when offline, sync when online

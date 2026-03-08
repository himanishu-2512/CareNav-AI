# Adherence Dashboard Endpoint

## Overview

The adherence dashboard endpoint provides comprehensive medication adherence metrics for doctors to monitor patient compliance with treatment plans. This endpoint is restricted to users with the `doctor` role.

## Endpoint

```
GET /api/adherence/:patientId
```

## Authentication

- **Required**: Yes (JWT token in Authorization header)
- **Role Required**: `doctor`
- **Authorization Header**: `Bearer <jwt-token>`

## Request Parameters

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| patientId | string | Yes | Unique identifier of the patient |

### Query Parameters

None

## Response Format

### Success Response (200 OK)

```json
{
  "patient": {
    "patientId": "string",
    "name": "string",
    "age": number,
    "gender": "string"
  },
  "adherence": {
    "overall": number,              // Overall adherence percentage (0-100)
    "isLowAdherence": boolean,      // True if adherence < 80%
    "warningLevel": "good" | "warning" | "critical",
    "totalScheduled": number,       // Total doses scheduled
    "totalTaken": number,           // Total doses taken
    "totalMissed": number,          // Total doses missed
    "lastCalculated": "ISO-8601"    // Timestamp of calculation
  },
  "medicines": [
    {
      "medicineId": "string",
      "medicineName": "string",
      "dosage": "string",
      "adherencePercentage": number,
      "scheduled": number,
      "taken": number,
      "missed": number,
      "isActive": boolean,
      "startDate": "ISO-8601",
      "stopDate": "ISO-8601",
      "warningLevel": "good" | "warning" | "critical"
    }
  ],
  "trends": {
    "daily": [
      {
        "date": "YYYY-MM-DD",
        "adherencePercentage": number,
        "scheduled": number,
        "taken": number,
        "missed": number
      }
    ],
    "weekly": [
      {
        "date": "YYYY-MM-DD",        // Week start date (Monday)
        "adherencePercentage": number,
        "scheduled": number,
        "taken": number,
        "missed": number
      }
    ]
  },
  "missedDoses": [
    {
      "medicineId": "string",
      "medicineName": "string",
      "dosage": "string",
      "scheduledDate": "YYYY-MM-DD",
      "scheduledTime": "HH:MM",
      "status": "missed" | "due"
    }
  ],
  "summary": {
    "hasLowAdherence": boolean,
    "lowAdherenceMedicines": ["string"],
    "recentMissedCount": number,
    "recommendations": ["string"]
  }
}
```

### Warning Levels

- **good**: Adherence ≥ 80%
- **warning**: Adherence 60-79%
- **critical**: Adherence < 60%

### Error Responses

#### 400 Bad Request
```json
{
  "error": "patientId is required"
}
```

#### 403 Forbidden
```json
{
  "error": "Access denied. Doctor role required."
}
```

#### 404 Not Found
```json
{
  "error": "Patient not found"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Failed to calculate adherence: <error message>"
}
```

## Example Usage

### Request

```bash
curl -X GET \
  https://api.carenav.ai/api/adherence/test-patient-001 \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json'
```

### Response

```json
{
  "patient": {
    "patientId": "test-patient-001",
    "name": "Rajesh Kumar",
    "age": 45,
    "gender": "Male"
  },
  "adherence": {
    "overall": 75,
    "isLowAdherence": true,
    "warningLevel": "warning",
    "totalScheduled": 60,
    "totalTaken": 45,
    "totalMissed": 15,
    "lastCalculated": "2024-01-15T10:30:00.000Z"
  },
  "medicines": [
    {
      "medicineId": "med-001",
      "medicineName": "Aspirin",
      "dosage": "75mg",
      "adherencePercentage": 85,
      "scheduled": 30,
      "taken": 26,
      "missed": 4,
      "isActive": true,
      "startDate": "2024-01-01T00:00:00.000Z",
      "stopDate": "2024-01-31T00:00:00.000Z",
      "warningLevel": "good"
    },
    {
      "medicineId": "med-002",
      "medicineName": "Metformin",
      "dosage": "500mg",
      "adherencePercentage": 63,
      "scheduled": 30,
      "taken": 19,
      "missed": 11,
      "isActive": true,
      "startDate": "2024-01-01T00:00:00.000Z",
      "stopDate": "2024-01-31T00:00:00.000Z",
      "warningLevel": "warning"
    }
  ],
  "trends": {
    "daily": [
      {
        "date": "2024-01-14",
        "adherencePercentage": 100,
        "scheduled": 2,
        "taken": 2,
        "missed": 0
      },
      {
        "date": "2024-01-15",
        "adherencePercentage": 50,
        "scheduled": 2,
        "taken": 1,
        "missed": 1
      }
    ],
    "weekly": [
      {
        "date": "2024-01-08",
        "adherencePercentage": 78,
        "scheduled": 14,
        "taken": 11,
        "missed": 3
      }
    ]
  },
  "missedDoses": [
    {
      "medicineId": "med-002",
      "medicineName": "Metformin",
      "dosage": "500mg",
      "scheduledDate": "2024-01-15",
      "scheduledTime": "08:00",
      "status": "missed"
    }
  ],
  "summary": {
    "hasLowAdherence": true,
    "lowAdherenceMedicines": ["Metformin"],
    "recentMissedCount": 1,
    "recommendations": [
      "Patient has low overall adherence (<80%). Consider follow-up consultation.",
      "Patient has missed doses recently. Consider reminder system review."
    ]
  }
}
```

## Features

### 1. Overall Adherence Calculation
- Calculates adherence as: (doses taken / doses scheduled) × 100
- Flags patients with adherence < 80% as low adherence
- Provides warning levels: good, warning, critical

### 2. Per-Medicine Adherence
- Individual adherence metrics for each medicine
- Shows scheduled, taken, and missed doses
- Indicates active vs completed medicines
- Warning level for each medicine

### 3. Adherence Trends
- **Daily trends**: Last 30 days of adherence data
- **Weekly trends**: Last 12 weeks of adherence data
- Shows adherence percentage and dose counts for each period

### 4. Missed Doses Details
- Lists all missed doses in the last 30 days
- Includes medicine name, dosage, date, and time
- Helps identify patterns in non-compliance

### 5. Clinical Recommendations
- Automated recommendations based on adherence patterns
- Identifies critical adherence issues
- Suggests follow-up actions for doctors

## Implementation Details

### Adherence Calculation Logic

The endpoint uses the `adherence-calculator` module to:

1. Query all treatment plans for the patient
2. Retrieve all dose records from DynamoDB
3. Calculate adherence for each medicine
4. Generate overall adherence metrics
5. Create daily and weekly trend data
6. Identify missed doses

### Role-Based Access Control

The endpoint checks the user's role from the JWT token context:

```typescript
const userRole = event.requestContext?.authorizer?.role;
if (userRole !== 'doctor') {
  return errorResponse('Access denied. Doctor role required.', 403);
}
```

### Performance Considerations

- Adherence calculations are performed on-demand
- Results are not cached (real-time data)
- Typical response time: 500-1000ms
- Scales with number of treatment plans and doses

## Testing

Run the test script to verify the endpoint:

```bash
cd lambda/treatment-planner
npx ts-node test-adherence-endpoint.ts
```

The test script covers:
1. Valid doctor request for patient adherence
2. Non-doctor role access denial
3. Missing patient ID validation
4. Non-existent patient handling

## Requirements Validation

This endpoint satisfies the following requirements:

- **Requirement 9.1**: Display list of patients with adherence metrics
- **Requirement 9.2**: Calculate adherence percentage as (doses taken / doses scheduled) × 100
- **Requirement 9.3**: Flag patients with adherence < 80%
- **Requirement 9.6**: Show which specific doses were missed and when

## Related Modules

- `lambda/shared/adherence-calculator.ts` - Core adherence calculation logic
- `lambda/shared/treatment-db.ts` - Treatment plan and dose data access
- `lambda/shared/patient-db.ts` - Patient information retrieval
- `lambda/treatment-planner/index.ts` - Main Lambda handler

## Future Enhancements

1. **Caching**: Cache adherence calculations for frequently accessed patients
2. **Batch Processing**: Support querying multiple patients at once
3. **Export**: Generate PDF reports of adherence data
4. **Alerts**: Automated alerts for critical adherence issues
5. **Trends Analysis**: ML-based prediction of adherence patterns
6. **Comparison**: Compare patient adherence against population averages

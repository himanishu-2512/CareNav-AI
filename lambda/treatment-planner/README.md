# Treatment Planner Lambda

## Overview

The Treatment Planner Lambda handles the creation of treatment plans with automated medication reminders. It converts doctor prescriptions into patient-friendly schedules and configures EventBridge rules for automated dose reminders.

## Endpoints

### POST /api/treatment/create

Creates a new treatment plan with multiple prescriptions.

**Request Body:**
```json
{
  "patientId": "uuid",
  "doctorId": "uuid",
  "prescriptions": [
    {
      "medicineName": "Amoxicillin",
      "dosage": "500mg",
      "frequency": "three times daily",
      "duration": "7 days",
      "specialInstructions": "Take with food"
    }
  ]
}
```

**Response:**
```json
{
  "treatmentPlanId": "uuid",
  "schedules": [
    {
      "medicineId": "uuid",
      "medicineName": "Amoxicillin",
      "dosage": "500mg",
      "frequency": "three times daily",
      "times": ["08:00", "14:00", "20:00"],
      "startDate": "2024-01-15T00:00:00.000Z",
      "stopDate": "2024-01-22T00:00:00.000Z",
      "specialInstructions": "Take with food",
      "foodTiming": "with food"
    }
  ],
  "message": "Treatment plan created successfully"
}
```

### GET /api/treatment/schedule/{patientId}

Retrieves the active treatment schedule for a patient.

**Response:**
```json
{
  "activeMedicines": [
    {
      "medicineId": "uuid",
      "medicineName": "Amoxicillin",
      "dosage": "500mg",
      "todayDoses": [
        {
          "time": "08:00",
          "timeOfDay": "morning",
          "status": "taken",
          "takenAt": "2024-01-15T08:05:00.000Z"
        },
        {
          "time": "14:00",
          "timeOfDay": "afternoon",
          "status": "due",
          "takenAt": null
        }
      ],
      "stopDate": "2024-01-22T00:00:00.000Z",
      "specialInstructions": "Take with food",
      "foodTiming": "with food"
    }
  ],
  "groupedByTimeOfDay": {
    "morning": [...],
    "afternoon": [...],
    "evening": [...],
    "night": [...]
  },
  "date": "2024-01-15"
}
```

### POST /api/treatment/mark-taken

Marks a dose as taken.

**Request Body:**
```json
{
  "patientId": "uuid",
  "medicineId": "uuid",
  "scheduledDate": "2024-01-15",
  "scheduledTime": "08:00"
}
```

**Response:**
```json
{
  "message": "Dose marked as taken",
  "dose": {
    "patientId": "uuid",
    "medicineId": "uuid",
    "medicineName": "Amoxicillin",
    "dosage": "500mg",
    "scheduledTime": "08:00",
    "scheduledDate": "2024-01-15",
    "status": "taken",
    "takenAt": "2024-01-15T08:05:00.000Z"
  }
}
```

## Features

### 1. Frequency Parsing

Converts natural language frequency strings to specific dose times:

- "once daily" → ["08:00"]
- "twice daily" → ["08:00", "20:00"]
- "three times daily" → ["08:00", "14:00", "20:00"]
- "every 6 hours" → ["06:00", "12:00", "18:00", "00:00"]
- "every 8 hours" → ["08:00", "16:00", "00:00"]

### 2. AI-Enhanced Schedule Generation

Uses Amazon Bedrock to generate patient-friendly schedules with:
- Specific dose times
- Food timing recommendations (before/after/with food)
- Clear special instructions

Falls back to rule-based frequency parsing if Bedrock is unavailable.

### 3. EventBridge Integration

For each dose time, creates an EventBridge scheduled rule:
- Cron expression: `cron(minute hour * * ? *)`
- Target: Reminder Processor Lambda
- Payload: Medicine details and stop date

### 4. Automatic Stop Date Calculation

Parses duration strings and calculates stop dates:
- "7 days" → 7 days from start
- "2 weeks" → 14 days from start
- "1 month" → 30 days from start

### 5. Dose Tracking

Tracks each scheduled dose with status:
- `pending`: Not yet time for dose
- `due`: Reminder triggered, waiting for patient
- `taken`: Patient marked as taken
- `missed`: Past scheduled time, not taken

## Environment Variables

- `DYNAMODB_TABLE`: DynamoDB table name
- `AWS_REGION`: AWS region (default: ap-south-1)
- `REMINDER_LAMBDA_ARN`: ARN of Reminder Processor Lambda

## IAM Permissions Required

- `dynamodb:PutItem`, `dynamodb:GetItem`, `dynamodb:Query`, `dynamodb:UpdateItem`
- `bedrock:InvokeModel`
- `events:PutRule`, `events:PutTargets`, `events:DisableRule`
- `lambda:InvokeFunction` (for Reminder Lambda)

## Error Handling

- Validates all required fields (medicine name, dosage, frequency, duration)
- Falls back to frequency parser if Bedrock fails
- Logs EventBridge rule creation failures
- Returns user-friendly error messages

## Related Modules

- `lambda/shared/treatment-db.ts`: DynamoDB operations
- `lambda/shared/frequency-parser.ts`: Frequency parsing logic
- `lambda/shared/bedrock-prompts.ts`: AI prompt templates
- `lambda/reminder-processor/index.ts`: EventBridge reminder handler

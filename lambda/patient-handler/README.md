# Patient Registration Handler

Lambda function for handling patient registration in CareNav AI.

## Endpoint

**POST** `/api/patients/register`

## Authentication

Requires JWT token in Authorization header.

## Request Body

```json
{
  "name": "string (required, non-empty)",
  "age": "number (required, 0-150)",
  "gender": "string (required, non-empty)",
  "contact": "string (required, non-empty)"
}
```

## Response

### Success (201 Created)

```json
{
  "patientId": "uuid",
  "name": "Patient Name",
  "age": 45,
  "gender": "Male",
  "contact": "+91-9876543210",
  "message": "Patient registered successfully",
  "privacyNotice": "DEMO DATA ONLY - Do not enter real medical information...",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

### Error Responses

**400 Bad Request** - Missing or invalid fields
```json
{
  "error": "Missing required fields",
  "details": {
    "missingFields": ["name", "age"]
  }
}
```

**500 Internal Server Error** - Server error
```json
{
  "error": "Failed to register patient",
  "details": {
    "error": "Error message"
  }
}
```

## Implementation Details

### Data Model

Patient data is stored in DynamoDB with the following structure:

- **PK**: `PATIENT#{patientId}`
- **SK**: `PROFILE`
- **patientId**: UUID v4
- **name**: String
- **age**: Number
- **gender**: String
- **contact**: String
- **createdAt**: ISO 8601 timestamp
- **updatedAt**: ISO 8601 timestamp

### Validation

The handler validates:
- All required fields are present
- Name is a non-empty string
- Age is a number between 0 and 150
- Gender is a non-empty string
- Contact is a non-empty string

### Privacy Notice

Every successful registration response includes a privacy notice reminding users that this is a demo system and should not be used with real medical information, as per Requirement 1.3.

## Requirements Satisfied

- **1.1**: Display fields for name, age, gender, and contact information
- **1.2**: Validate that all required fields contain non-empty values
- **1.3**: Display privacy notice stating that only demo data should be entered
- **12.1**: Store user data in DynamoDB

## Dependencies

- `@aws-sdk/client-dynamodb`: DynamoDB client
- `@aws-sdk/lib-dynamodb`: DynamoDB Document client
- `uuid`: UUID generation

## Environment Variables

- `DYNAMODB_TABLE`: DynamoDB table name
- `AWS_REGION`: AWS region (default: ap-south-1)

## Local Development

```bash
# Install dependencies
cd lambda/patient-handler
npm install

# Build
npm run build

# Run tests (when implemented)
npm test
```

## Deployment

This Lambda function is deployed as part of the CareNav API Stack via AWS CDK.

```bash
# Deploy the stack
cdk deploy CareNavApiStack
```

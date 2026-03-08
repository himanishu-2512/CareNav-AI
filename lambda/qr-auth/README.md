# QR Authentication Lambda

This Lambda function handles QR code and manual unique code validation for doctor-patient access control in the CareNav AI system.

## Overview

The QR Authentication Lambda provides secure patient data access for doctors through two methods:
1. **QR Code Scanning**: Doctors scan a patient's QR code using their device camera
2. **Manual Code Entry**: Doctors manually enter a unique alphanumeric code when QR scanning is unavailable

## Endpoints

### POST /api/qr/validate

Validates a QR code and grants doctor access to patient data.

**Request Body:**
```json
{
  "qrData": "CARENAV:TOKEN:abc123xyz",
  "doctorId": "doctor-uuid"
}
```

**Success Response (200):**
```json
{
  "valid": true,
  "patientId": "patient-uuid",
  "uhid": "patient-uuid"
}
```

**Error Response (200):**
```json
{
  "valid": false,
  "error": "QR code has expired. Please generate a new one."
}
```

**Validation Errors (400):**
```json
{
  "error": {
    "code": "MISSING_FIELDS",
    "message": "qrData and doctorId are required",
    "details": {
      "qrData": "Required field"
    }
  }
}
```

### POST /api/qr/validate-code

Validates a manually entered unique code and grants doctor access to patient data.

**Request Body:**
```json
{
  "uniqueCode": "ABC123XYZ",
  "doctorId": "doctor-uuid"
}
```

**Success Response (200):**
```json
{
  "valid": true,
  "patientId": "patient-uuid",
  "uhid": "patient-uuid"
}
```

**Error Response (200):**
```json
{
  "valid": false,
  "error": "Invalid unique code format. Code must contain only alphanumeric characters."
}
```

## Features

### QR Code Validation
- Extracts token ID from QR data format: `CARENAV:TOKEN:{tokenId}`
- Validates token existence and expiration
- Checks token hasn't expired (24-hour validity)
- Returns patient details on successful validation

### Manual Code Validation
- Validates alphanumeric format (letters and numbers only)
- Uses unique code as token ID for validation
- Same validation logic as QR codes
- Provides clear error messages for invalid formats

### Doctor Authorization
- Adds patient to doctor's roster on successful validation
- Creates doctor-patient relationship record
- Tracks access method (QR scan vs manual code)
- Handles duplicate additions gracefully

### Audit Logging
- Logs all access attempts (successful and failed)
- Captures doctor ID, patient ID, access type, and method
- Records IP address and user agent for security
- Implements 30-day TTL for automatic log cleanup

### Security Features
- Validates QR token expiration (24 hours)
- Enforces alphanumeric-only format for manual codes
- Updates token with scan information (doctor ID, timestamp)
- Comprehensive error handling with descriptive messages

## QR Data Format

QR codes contain a structured token string:
```
CARENAV:TOKEN:{tokenId}
```

Where:
- `CARENAV`: System identifier
- `TOKEN`: Data type identifier
- `{tokenId}`: Unique token UUID

## Unique Code Format

Manual unique codes must be:
- Alphanumeric only (letters A-Z, a-z, numbers 0-9)
- No special characters, spaces, or symbols
- Typically 8-12 characters long
- Case-insensitive validation

## Error Handling

### QR Code Errors
- **Invalid format**: QR data doesn't match expected pattern
- **Token not found**: Token doesn't exist in database
- **Token expired**: Token is older than 24 hours
- **Patient not found**: Patient ID in token doesn't exist

### Manual Code Errors
- **Invalid format**: Code contains non-alphanumeric characters
- **Token not found**: Code doesn't match any token
- **Token expired**: Token is older than 24 hours
- **Patient not found**: Patient ID in token doesn't exist

### System Errors
- **Missing body**: Request body is empty
- **Missing fields**: Required fields not provided
- **Internal error**: Database or system error

## Integration Points

### Database Operations
- **qr-db.ts**: QR token validation and updates
- **patient-db.ts**: Patient retrieval and doctor-patient relationships
- **audit-log.ts**: Access logging for security audit trail

### Data Flow
1. Doctor scans QR code or enters unique code
2. Lambda validates token format and existence
3. Lambda checks token expiration
4. Lambda retrieves patient details
5. Lambda adds patient to doctor's roster
6. Lambda updates token with scan information
7. Lambda logs access event for audit
8. Lambda returns patient details to frontend

## Performance

- **Response Time**: < 2 seconds (per requirements 4.4, 5.3)
- **Validation**: Immediate token format validation
- **Database Queries**: Optimized single-item gets
- **Concurrent Access**: Supports multiple doctors scanning simultaneously

## Testing

### Unit Tests
- QR code format validation
- Unique code alphanumeric validation
- Token expiration checking
- Error message accuracy
- Authorization flow

### Integration Tests
- End-to-end QR scanning flow
- End-to-end manual code entry flow
- Doctor-patient relationship creation
- Audit log creation
- Error handling scenarios

## Requirements Validation

This Lambda handler validates the following requirements:

- **Requirement 4.3**: Activate device camera for QR scanning (frontend integration)
- **Requirement 4.4**: Authenticate patient within 2 seconds on valid QR scan
- **Requirement 5.1**: Display text input for manual code entry (frontend integration)
- **Requirement 5.3**: Authenticate patient within 2 seconds on valid code submission
- **Requirement 20.1**: Verify doctor authorization to access patient data

## Environment Variables

- `DYNAMODB_TABLE`: DynamoDB table name (default: 'carenav-patients')

## Dependencies

- `@aws-sdk/lib-dynamodb`: DynamoDB operations
- `uuid`: Token ID generation (used in qr-db.ts)
- `../shared/qr-db`: QR token database operations
- `../shared/patient-db`: Patient and relationship operations
- `../shared/audit-log`: Access logging operations

## Deployment

This Lambda is deployed as part of the CareNav AI backend stack:
- Runtime: Node.js 20.x
- Memory: 256 MB
- Timeout: 10 seconds
- IAM Permissions: DynamoDB read/write access

## Future Enhancements

- Rate limiting for brute force protection
- Multi-factor authentication for sensitive patients
- Biometric verification integration
- Real-time notification to patient on doctor access
- Geolocation tracking for access logs
- Token revocation API for security incidents

# Doctor Handler Lambda

This Lambda function handles doctor-facing patient management operations, including patient list retrieval, search, and adding patients to a doctor's roster.

## Endpoints

### GET /api/doctor/patients

List all patients for the authenticated doctor with optional filtering and pagination.

**Authentication:** Required (JWT token with doctorId)

**Query Parameters:**
- `page` (optional): Page number (default: 1, min: 1)
- `limit` (optional): Items per page (default: 20, min: 1, max: 100)
- `status` (optional): Filter by treatment status, comma-separated values: `ongoing`, `past`
  - Example: `status=ongoing` or `status=ongoing,past`

**Response:**
```json
{
  "patients": [
    {
      "patientId": "uuid",
      "uhid": "uuid",
      "name": "John Doe",
      "lastConsultation": "2024-01-15T10:30:00Z",
      "treatmentStatus": "ongoing"
    }
  ],
  "totalCount": 45,
  "page": 1,
  "totalPages": 3,
  "hasMore": true
}
```

**Example Requests:**
```bash
# Get first page of all patients
GET /api/doctor/patients

# Get second page with 10 patients per page
GET /api/doctor/patients?page=2&limit=10

# Get only ongoing treatments
GET /api/doctor/patients?status=ongoing

# Get only past treatments
GET /api/doctor/patients?status=past

# Get all treatments (explicit)
GET /api/doctor/patients?status=ongoing,past
```

### GET /api/doctor/patients/search

Search patients by name or UHID (case-insensitive matching).

**Authentication:** Required (JWT token with doctorId)

**Query Parameters:**
- `q` (required): Search query string
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, min: 1, max: 100)
- `status` (optional): Filter by treatment status (same as above)

**Response:**
```json
{
  "patients": [
    {
      "patientId": "uuid",
      "uhid": "uuid",
      "name": "John Doe",
      "lastConsultation": "2024-01-15T10:30:00Z",
      "treatmentStatus": "ongoing"
    }
  ],
  "totalCount": 3,
  "page": 1,
  "totalPages": 1,
  "hasMore": false,
  "searchQuery": "john"
}
```

**Example Requests:**
```bash
# Search by name
GET /api/doctor/patients/search?q=john

# Search by UHID
GET /api/doctor/patients/search?q=abc-123

# Search with status filter
GET /api/doctor/patients/search?q=doe&status=ongoing

# Search with pagination
GET /api/doctor/patients/search?q=smith&page=2&limit=10
```

### POST /api/doctor/patients/add

Add a patient to the doctor's patient list via QR code or manual code authentication.

**Authentication:** Required (JWT token with doctorId)

**Request Body:**
```json
{
  "patientId": "uuid",
  "addedVia": "qr_scan",
  "accessGrantedBy": "qr-token-id-or-unique-code"
}
```

**Fields:**
- `patientId` (required): Patient's unique identifier
- `addedVia` (required): How the patient was added - must be `"qr_scan"` or `"manual_code"`
- `accessGrantedBy` (required): QR token ID or unique code used for authentication

**Response:**
```json
{
  "message": "Patient added successfully",
  "patientId": "uuid",
  "patientName": "John Doe",
  "uhid": "uuid",
  "addedAt": "2024-01-15T10:30:00Z",
  "treatmentStatus": "ongoing"
}
```

**Example Request:**
```bash
POST /api/doctor/patients/add
Content-Type: application/json

{
  "patientId": "550e8400-e29b-41d4-a716-446655440000",
  "addedVia": "qr_scan",
  "accessGrantedBy": "qr-token-abc123"
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": {
    "additionalInfo": "value"
  }
}
```

**Common Error Codes:**
- `400`: Bad Request - Invalid parameters or missing required fields
- `401`: Unauthorized - Missing or invalid JWT token
- `404`: Not Found - Patient not found
- `500`: Internal Server Error - Unexpected error

## Features

### Pagination
- Default page size: 20 patients per page (as per requirements)
- Configurable page size (1-100)
- Returns total count, total pages, and hasMore flag
- Consistent pagination across list and search endpoints

### Search
- Case-insensitive matching on patient name and UHID
- Searches across all patients in doctor's roster
- Supports combining search with status filters
- Returns matching count and search query in response

### Status Filtering
- Filter by treatment status: `ongoing`, `past`, or both
- Can be combined with search functionality
- Validates status values before querying

### Sorting
- Patients are always sorted by last consultation date (most recent first)
- Sorting is applied before pagination

### Authorization
- Extracts doctorId from JWT token authorizer context
- All operations are scoped to the authenticated doctor
- Returns 401 if doctorId is not found in token

## Database Operations

This Lambda uses the following database functions from `patient-db.ts`:

- `getDoctorPatients()`: Retrieves paginated patient list with filtering
- `addPatientToDoctor()`: Creates doctor-patient relationship

## Requirements Validation

This implementation satisfies the following requirements:

- **Requirement 1.1**: Doctor dashboard displays patient list ✓
- **Requirement 1.2**: Display patient name, UHID, last consultation date ✓
- **Requirement 1.5**: Paginate results with 20 patients per page ✓
- **Requirement 2.1**: Provide search input field for patient lookup ✓
- **Requirement 4.1**: Provide "Add Patient" button ✓

## Testing

To test this Lambda locally, use the test script:

```bash
# Test patient list retrieval
curl -X GET "http://localhost:3000/api/doctor/patients" \
  -H "Authorization: Bearer <jwt-token>"

# Test search
curl -X GET "http://localhost:3000/api/doctor/patients/search?q=john" \
  -H "Authorization: Bearer <jwt-token>"

# Test add patient
curl -X POST "http://localhost:3000/api/doctor/patients/add" \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "550e8400-e29b-41d4-a716-446655440000",
    "addedVia": "qr_scan",
    "accessGrantedBy": "qr-token-abc123"
  }'
```

## Deployment

This Lambda is deployed as part of the CDK stack in `lib/lambda-stack.ts`. It requires:

- DynamoDB table access for doctor-patient relationships
- JWT authorizer configured on API Gateway
- Environment variables:
  - `TABLE_NAME`: DynamoDB table name

## Next Steps

After implementing this Lambda:
1. Add unit tests for each endpoint handler
2. Add property-based tests for search and pagination logic
3. Update CDK stack to include this Lambda and API routes
4. Implement frontend components to consume these endpoints

# Treatment Handler Lambda

Lambda function for managing treatment episodes as chat conversations between doctors and patients.

## Overview

The Treatment Handler Lambda provides API endpoints for:
- Creating new treatment episodes
- Retrieving episode details with chat messages
- Adding messages to treatment chat threads
- Completing treatment episodes with diagnosis and outcome
- Listing all episodes for a patient

Each treatment episode represents a single consultation or treatment session organized as a chat thread, allowing doctors and patients to communicate within the context of that specific treatment.

## Endpoints

### 1. Create Treatment Episode

**POST** `/api/treatment/episode/create`

Creates a new treatment episode for a patient.

**Request Body:**
```json
{
  "patientId": "patient-uuid",
  "doctorId": "doctor-uuid",
  "initialSymptoms": "Patient reports headache and fever" // Optional
}
```

**Response (201):**
```json
{
  "episodeId": "episode-uuid",
  "patientId": "patient-uuid",
  "doctorId": "doctor-uuid",
  "startDate": "2024-01-15T10:30:00Z",
  "status": "ongoing",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Authorization:**
- Requires valid JWT token
- Doctor can only create episodes for themselves
- Creates audit log entry

**Notes:**
- If `initialSymptoms` provided, automatically adds a system message to the chat
- Episode starts with status "ongoing"
- Generates unique episode ID

### 2. Get Episode Details

**GET** `/api/treatment/episode/{episodeId}?patientId={patientId}`

Retrieves episode details along with all chat messages.

**Query Parameters:**
- `patientId` (required): Patient's ID for DynamoDB query

**Response (200):**
```json
{
  "episode": {
    "episodeId": "episode-uuid",
    "patientId": "patient-uuid",
    "doctorId": "doctor-uuid",
    "startDate": "2024-01-15T10:30:00Z",
    "status": "ongoing",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "messages": [
    {
      "messageId": "message-uuid",
      "episodeId": "episode-uuid",
      "sender": "doctor",
      "senderName": "Dr. Smith",
      "content": "How are you feeling today?",
      "type": "text",
      "createdAt": "2024-01-15T10:31:00Z"
    }
  ]
}
```

**Authorization:**
- Requires valid JWT token
- Messages sorted chronologically (oldest first)

**Error Responses:**
- 400: Invalid episode ID or missing patientId
- 404: Episode not found

### 3. Add Message to Chat

**POST** `/api/treatment/episode/{episodeId}/message`

Adds a message to the treatment chat thread.

**Request Body:**
```json
{
  "content": "I'm feeling much better today",
  "senderName": "John Doe",
  "type": "text", // Optional: "text" | "prescription" | "document" | "recommendation"
  "metadata": { // Optional
    "prescriptionId": "prescription-uuid",
    "documentId": "document-uuid"
  }
}
```

**Response (201):**
```json
{
  "messageId": "message-uuid",
  "episodeId": "episode-uuid",
  "sender": "patient",
  "senderName": "John Doe",
  "content": "I'm feeling much better today",
  "type": "text",
  "createdAt": "2024-01-15T10:35:00Z"
}
```

**Authorization:**
- Requires valid JWT token
- Sender determined by user role (doctor/patient)
- Supports different message types for prescriptions, documents, recommendations

**Message Types:**
- `text`: Regular text message
- `prescription`: Prescription notification
- `document`: Document upload notification
- `recommendation`: AI-generated recommendation

### 4. Complete Treatment Episode

**POST** `/api/treatment/episode/{episodeId}/complete`

Marks a treatment episode as complete with final diagnosis and outcome.

**Request Body:**
```json
{
  "patientId": "patient-uuid",
  "diagnosis": "Viral fever with mild dehydration",
  "outcome": "Patient recovered fully. Advised rest and hydration."
}
```

**Response (200):**
```json
{
  "episodeId": "episode-uuid",
  "patientId": "patient-uuid",
  "doctorId": "doctor-uuid",
  "startDate": "2024-01-15T10:30:00Z",
  "endDate": "2024-01-16T14:00:00Z",
  "status": "completed",
  "diagnosis": "Viral fever with mild dehydration",
  "outcome": "Patient recovered fully. Advised rest and hydration.",
  "updatedAt": "2024-01-16T14:00:00Z"
}
```

**Authorization:**
- Requires valid JWT token
- Only doctors can complete episodes
- Automatically adds completion message to chat

**Notes:**
- Updates status from "ongoing" to "completed"
- Sets endDate to current timestamp
- Preserves all chat messages and data
- Episode moves to treatment history

### 5. Get Patient Episodes

**GET** `/api/treatment/patient/{patientId}/episodes?status={status}`

Retrieves all treatment episodes for a patient.

**Query Parameters:**
- `status` (optional): Filter by status ("ongoing" | "completed")

**Response (200):**
```json
{
  "patientId": "patient-uuid",
  "episodes": [
    {
      "episodeId": "episode-uuid",
      "patientId": "patient-uuid",
      "doctorId": "doctor-uuid",
      "startDate": "2024-01-15T10:30:00Z",
      "endDate": "2024-01-16T14:00:00Z",
      "status": "completed",
      "diagnosis": "Viral fever",
      "outcome": "Recovered",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-16T14:00:00Z"
    }
  ],
  "totalCount": 1,
  "statusFilter": "completed"
}
```

**Authorization:**
- Requires valid JWT token
- Episodes sorted by start date (most recent first)

**Notes:**
- Returns all episodes if no status filter provided
- Useful for displaying treatment history
- Supports filtering by ongoing/completed status

## Data Models

### Treatment Episode
```typescript
interface TreatmentEpisode {
  episodeId: string;
  patientId: string;
  doctorId: string;
  startDate: string; // ISO timestamp
  endDate?: string; // ISO timestamp (set when completed)
  status: 'ongoing' | 'completed';
  diagnosis?: string; // Set when completed
  outcome?: string; // Set when completed
  createdAt: string;
  updatedAt: string;
}
```

### Chat Message
```typescript
interface ChatMessage {
  messageId: string;
  episodeId: string;
  sender: 'doctor' | 'patient' | 'system';
  senderName: string;
  content: string;
  type: 'text' | 'prescription' | 'document' | 'recommendation';
  metadata?: Record<string, any>;
  createdAt: string;
}
```

## DynamoDB Schema

### Treatment Episode
```
PK: PATIENT#{patientId}
SK: EPISODE#{episodeId}
GSI1PK: PATIENT#{patientId}
GSI1SK: EPISODE#{startDate}
```

### Chat Message
```
PK: EPISODE#{episodeId}
SK: MESSAGE#{timestamp}#{messageId}
```

Messages are automatically sorted chronologically by the SK (sort key).

## Integration Points

### Database Modules
- `treatment-episode-db.ts`: Episode CRUD operations
- `chat-message-db.ts`: Message operations
- `audit-log.ts`: Access logging

### Related Lambdas
- `doctor-handler`: Patient list management
- `prescription-handler`: Prescription creation (adds messages to chat)
- `lifestyle-recommender`: AI recommendations (adds messages to chat)

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": {
    "field": "Additional context"
  }
}
```

**Common Error Codes:**
- 400: Bad Request (validation errors)
- 401: Unauthorized (missing/invalid token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found (episode/patient not found)
- 500: Internal Server Error

## Security

- All endpoints require JWT authentication
- Authorization checks based on user role
- Audit logging for all episode access
- Input validation on all requests
- Sanitized error messages (no sensitive data)

## Testing

See `test-handler.ts` for comprehensive test scripts covering:
- Episode creation
- Message addition
- Episode completion
- Patient episode listing
- Error handling scenarios

## Environment Variables

- `DYNAMODB_TABLE`: DynamoDB table name (set by CDK)
- `AWS_REGION`: AWS region (set by Lambda runtime)

## Deployment

Deployed via CDK in `lib/lambda-stack.ts`:
- Runtime: Node.js 20.x
- Memory: 512 MB
- Timeout: 30 seconds
- IAM permissions: DynamoDB read/write

## Requirements Validation

This Lambda handler implements:
- **Requirement 9.1**: Start new treatment button and episode creation
- **Requirement 9.2**: New chat thread for each treatment
- **Requirement 21.1**: Complete treatment button
- **Requirement 21.2**: Treatment outcome and final notes capture

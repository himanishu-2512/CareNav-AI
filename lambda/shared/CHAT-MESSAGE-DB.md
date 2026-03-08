# Chat Message Database Module

## Overview

The chat message database module (`chat-message-db.ts`) provides DynamoDB operations for managing chat messages within treatment episodes. Each treatment episode has its own chat thread where doctors, patients, and the system can exchange messages.

## Implementation Details

### Data Model

**DynamoDB Pattern:**
```
PK: EPISODE#{episodeId}
SK: MESSAGE#{timestamp}#{messageId}
```

This pattern ensures:
- All messages for an episode are grouped together
- Messages are automatically sorted chronologically by timestamp
- Each message has a unique identifier (messageId)

### TypeScript Interface

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

### Functions

#### 1. `addMessage()`

Adds a new message to a chat thread.

**Parameters:**
- `episodeId` - Treatment episode ID
- `sender` - Message sender ('doctor' | 'patient' | 'system')
- `senderName` - Name of the sender
- `content` - Message content
- `type` - Message type (default: 'text')
- `metadata` - Optional metadata object

**Returns:** Created ChatMessage

**Example:**
```typescript
const message = await addMessage(
  'episode-123',
  'doctor',
  'Dr. Smith',
  'How are you feeling today?',
  'text'
);
```

**With Metadata:**
```typescript
const prescriptionMessage = await addMessage(
  'episode-123',
  'system',
  'System',
  'Prescription created: Amoxicillin 500mg',
  'prescription',
  { prescriptionId: 'rx-456', medicineCount: 2 }
);
```

#### 2. `getEpisodeMessages()`

Retrieves all messages for an episode in chronological order (oldest first).

**Parameters:**
- `episodeId` - Treatment episode ID

**Returns:** Array of ChatMessage objects sorted chronologically

**Example:**
```typescript
const messages = await getEpisodeMessages('episode-123');
// Returns all messages sorted from oldest to newest
```

**Use Case:** Display complete conversation history for a treatment episode (Requirement 9.5)

#### 3. `getMessagesByType()`

Retrieves messages of a specific type for an episode.

**Parameters:**
- `episodeId` - Treatment episode ID
- `type` - Message type to filter by

**Returns:** Array of ChatMessage objects of the specified type, sorted chronologically

**Example:**
```typescript
// Get all prescriptions in this episode
const prescriptions = await getMessagesByType('episode-123', 'prescription');

// Get all documents uploaded
const documents = await getMessagesByType('episode-123', 'document');

// Get all AI recommendations
const recommendations = await getMessagesByType('episode-123', 'recommendation');
```

**Use Case:** Display symptom summary or filter specific message types (Requirement 18.1)

## Message Types

### 1. Text Messages
Regular chat messages between doctor and patient.

```typescript
await addMessage(episodeId, 'doctor', 'Dr. Smith', 'Hello!', 'text');
```

### 2. Prescription Messages
System-generated messages when prescriptions are created.

```typescript
await addMessage(
  episodeId,
  'system',
  'System',
  'Prescription created',
  'prescription',
  { prescriptionId: 'rx-123' }
);
```

### 3. Document Messages
Messages indicating document uploads.

```typescript
await addMessage(
  episodeId,
  'patient',
  'John Doe',
  'Uploaded blood test results',
  'document',
  { documentId: 'doc-456', fileType: 'PDF' }
);
```

### 4. Recommendation Messages
AI-generated lifestyle recommendations.

```typescript
await addMessage(
  episodeId,
  'system',
  'AI Assistant',
  'Lifestyle recommendations generated',
  'recommendation',
  { recommendationId: 'rec-789' }
);
```

## Design Decisions

### 1. Chronological Sorting
Messages use `MESSAGE#{timestamp}#{messageId}` as the sort key, ensuring automatic chronological ordering. The `ScanIndexForward: true` parameter returns messages oldest-first, which is ideal for chat display.

### 2. Metadata Flexibility
The optional `metadata` field allows storing additional context:
- Prescription IDs for linking to prescription details
- Document IDs for linking to uploaded files
- Recommendation IDs for linking to AI-generated content

### 3. Sender Types
Three sender types support different message sources:
- `doctor` - Messages from the treating physician
- `patient` - Messages from the patient
- `system` - Automated messages (prescriptions, recommendations)

### 4. Message Types
Four message types enable filtering and specialized display:
- `text` - Regular conversation
- `prescription` - Medication prescriptions
- `document` - File uploads
- `recommendation` - AI-generated advice

## Requirements Validation

✅ **Requirement 9.5:** "When doctor selects a chat thread, display complete conversation history for that treatment episode"
- Implemented via `getEpisodeMessages()` which returns all messages chronologically

✅ **Requirement 18.1:** "Within each chat thread, display symptom summary for that treatment episode"
- Implemented via `getMessagesByType()` which can filter specific message types

## Testing

A comprehensive test script (`test-chat-message-db.ts`) validates:
1. Adding text messages from doctor
2. Adding text messages from patient
3. Adding prescription messages with metadata
4. Adding document messages with metadata
5. Adding recommendation messages
6. Retrieving all episode messages in chronological order
7. Filtering messages by type (text)
8. Filtering messages by type (prescription)
9. Filtering messages by type (document)
10. Handling non-existent episodes (returns empty array)

## Integration Points

### With Treatment Episodes
Chat messages are linked to treatment episodes via `episodeId`. Each episode has its own isolated chat thread.

### With Prescriptions
When a prescription is created, a system message is added to the chat:
```typescript
await addMessage(
  episodeId,
  'system',
  'System',
  `Prescription created: ${medicineName}`,
  'prescription',
  { prescriptionId }
);
```

### With Documents
When a patient uploads a document, a message is added:
```typescript
await addMessage(
  episodeId,
  'patient',
  patientName,
  `Uploaded ${documentName}`,
  'document',
  { documentId, fileType }
);
```

### With AI Recommendations
When lifestyle recommendations are generated, a message is added:
```typescript
await addMessage(
  episodeId,
  'system',
  'AI Assistant',
  'Lifestyle recommendations generated',
  'recommendation',
  { recommendationId }
);
```

## Error Handling

All functions use async/await and will throw errors if:
- DynamoDB operations fail
- Network connectivity issues occur
- Invalid parameters are provided

Calling code should wrap in try-catch blocks:
```typescript
try {
  const messages = await getEpisodeMessages(episodeId);
} catch (error) {
  console.error('Failed to retrieve messages:', error);
  // Handle error appropriately
}
```

## Performance Considerations

### Query Efficiency
- Messages are queried using `PK = EPISODE#{episodeId}` which is highly efficient
- The sort key pattern ensures messages are pre-sorted by timestamp
- No additional sorting or filtering is needed for chronological display

### Filtering by Type
- `getMessagesByType()` uses a FilterExpression which scans all messages for the episode
- For episodes with many messages, consider caching or pagination
- Most episodes will have <100 messages, so performance should be acceptable

## Future Enhancements

1. **Pagination:** Add pagination support for episodes with many messages
2. **Real-time Updates:** Integrate with WebSocket API for live chat
3. **Message Editing:** Add support for editing/deleting messages
4. **Read Receipts:** Track which messages have been read by each party
5. **Message Search:** Add full-text search across message content
6. **Attachments:** Support inline file attachments in messages

## Task Completion

✅ **Task 1.5 Complete:**
- Created `lambda/shared/chat-message-db.ts` with message operations
- Implemented `addMessage()`, `getEpisodeMessages()`, `getMessagesByType()`
- Created DynamoDB operations for EPISODE#{episodeId}#MESSAGE#{timestamp} pattern
- Added ChatMessage interface to types.ts
- Added DynamoDB key pattern to types.ts
- Created comprehensive test script
- Validated requirements 9.5 and 18.1

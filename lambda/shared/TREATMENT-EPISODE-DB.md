# Treatment Episode Database Module

## Overview

The `treatment-episode-db.ts` module provides database operations for managing treatment episodes in the Doctor Dashboard Patient Management feature. Each treatment episode represents a single consultation or treatment session between a doctor and patient, organized as a separate chat conversation.

## Data Model

### TreatmentEpisode Interface

```typescript
interface TreatmentEpisode {
  episodeId: string;        // Unique episode identifier (UUID)
  patientId: string;        // Patient's ID
  doctorId: string;         // Doctor's user ID
  startDate: string;        // ISO timestamp when episode started
  endDate?: string;         // ISO timestamp when episode completed (optional)
  status: 'ongoing' | 'completed';  // Episode status
  diagnosis?: string;       // Final diagnosis (set on completion)
  outcome?: string;         // Treatment outcome (set on completion)
  createdAt: string;        // ISO timestamp of creation
  updatedAt: string;        // ISO timestamp of last update
}
```

### DynamoDB Storage Pattern

**Primary Keys:**
- `PK`: `PATIENT#{patientId}`
- `SK`: `EPISODE#{episodeId}`

**GSI1 (Patient-Episode Index):**
- `GSI1PK`: `PATIENT#{patientId}`
- `GSI1SK`: `EPISODE#{startDate}`
- Purpose: Query all episodes for a patient sorted by date

This pattern enables:
- Direct episode lookup by patient and episode ID
- Efficient querying of all episodes for a patient
- Chronological sorting by start date

## Functions

### createEpisode()

Creates a new treatment episode for a patient.

**Signature:**
```typescript
async function createEpisode(
  patientId: string,
  doctorId: string,
  initialSymptoms?: string
): Promise<TreatmentEpisode>
```

**Parameters:**
- `patientId` - Patient's ID
- `doctorId` - Doctor's user ID
- `initialSymptoms` - Optional initial symptoms description

**Returns:** Created treatment episode with generated UUID

**Behavior:**
- Generates unique episode ID using UUID v4
- Sets status to 'ongoing'
- Sets startDate to current timestamp
- Creates GSI1 attributes for patient-episode queries
- Stores in DynamoDB with composite key pattern

**Example:**
```typescript
const episode = await createEpisode(
  'patient-123',
  'doctor-456',
  'Patient complains of fever and headache'
);
// Returns: { episodeId: 'uuid', status: 'ongoing', startDate: '2024-01-15T10:30:00Z', ... }
```

**Requirements Validated:**
- Requirement 9.2: Create new chat thread when doctor clicks "Start New Treatment"
- Requirement 9.3: Chat thread associated with unique treatment episode identifier

---

### getEpisode()

Retrieves a treatment episode by ID.

**Signature:**
```typescript
async function getEpisode(
  patientId: string,
  episodeId: string
): Promise<TreatmentEpisode | null>
```

**Parameters:**
- `patientId` - Patient's ID
- `episodeId` - Episode ID

**Returns:** Treatment episode or null if not found

**Behavior:**
- Uses GetCommand for direct key lookup
- Removes DynamoDB internal keys (PK, SK, GSI1PK, GSI1SK) from response
- Returns null if episode doesn't exist

**Example:**
```typescript
const episode = await getEpisode('patient-123', 'episode-uuid');
if (episode) {
  console.log('Episode status:', episode.status);
}
```

---

### getPatientEpisodes()

Retrieves all treatment episodes for a patient with optional status filtering.

**Signature:**
```typescript
async function getPatientEpisodes(
  patientId: string,
  statusFilter?: 'ongoing' | 'completed'
): Promise<TreatmentEpisode[]>
```

**Parameters:**
- `patientId` - Patient's ID
- `statusFilter` - Optional status filter ('ongoing' | 'completed')

**Returns:** Array of treatment episodes sorted by start date (most recent first)

**Behavior:**
- Queries all episodes with PK = `PATIENT#{patientId}` and SK begins with `EPISODE#`
- Applies status filter if provided
- Sorts episodes by startDate in descending order (most recent first)
- Returns empty array if no episodes found

**Example:**
```typescript
// Get all episodes
const allEpisodes = await getPatientEpisodes('patient-123');

// Get only ongoing episodes
const ongoingEpisodes = await getPatientEpisodes('patient-123', 'ongoing');

// Get only completed episodes
const completedEpisodes = await getPatientEpisodes('patient-123', 'completed');
```

**Requirements Validated:**
- Requirement 7.1: Display all treatment episodes in treatment history
- Requirement 7.2: Categorize episodes as "ongoing" or "past" based on status
- Requirement 7.3: Provide filter controls for treatment status

---

### completeEpisode()

Marks a treatment episode as completed and records diagnosis and outcome.

**Signature:**
```typescript
async function completeEpisode(
  patientId: string,
  episodeId: string,
  diagnosis: string,
  outcome: string
): Promise<TreatmentEpisode>
```

**Parameters:**
- `patientId` - Patient's ID
- `episodeId` - Episode ID
- `diagnosis` - Final diagnosis
- `outcome` - Treatment outcome description

**Returns:** Updated treatment episode

**Behavior:**
- Updates status to 'completed'
- Sets endDate to current timestamp
- Records diagnosis and outcome
- Updates updatedAt timestamp
- Fetches and returns the updated episode
- Throws error if episode not found after update

**Example:**
```typescript
const completedEpisode = await completeEpisode(
  'patient-123',
  'episode-uuid',
  'Common cold',
  'Patient recovered fully after 5 days of treatment'
);
// Returns: { status: 'completed', endDate: '2024-01-20T10:30:00Z', diagnosis: 'Common cold', ... }
```

**Requirements Validated:**
- Requirement 21.3: Update treatment status to "past" within 1 second when doctor confirms completion
- Requirement 21.4: Move completed episode to patient's treatment history
- Requirement 21.5: Preserve all data in archived episode

## Error Handling

All functions handle errors gracefully:

- **DynamoDB errors**: Propagated to caller for handling
- **Not found**: `getEpisode()` returns null, `completeEpisode()` throws error
- **Invalid parameters**: TypeScript type checking prevents invalid inputs

## Testing

Run the test suite:

```bash
# Set AWS credentials and region
export AWS_REGION=ap-south-1
export DYNAMODB_TABLE=carenav-patients

# Run tests
npx ts-node lambda/shared/test-treatment-episode-db.ts
```

The test suite validates:
1. Episode creation with unique IDs
2. Episode retrieval by ID
3. Multiple episodes for same patient
4. Episode completion with diagnosis and outcome
5. Status filtering (ongoing vs completed)
6. Chronological sorting (most recent first)

## Integration

### With Doctor Handler Lambda

```typescript
import { createEpisode, getPatientEpisodes } from './shared/treatment-episode-db';

// Create new episode when doctor starts treatment
const episode = await createEpisode(patientId, doctorId, initialSymptoms);

// Get patient's treatment history
const episodes = await getPatientEpisodes(patientId);
```

### With Treatment Handler Lambda

```typescript
import { getEpisode, completeEpisode } from './shared/treatment-episode-db';

// Get episode details for chat thread
const episode = await getEpisode(patientId, episodeId);

// Complete episode when doctor finishes treatment
const completed = await completeEpisode(
  patientId,
  episodeId,
  diagnosis,
  outcome
);
```

### With Patient Profile Component

```typescript
// Fetch treatment history with filtering
const ongoingEpisodes = await getPatientEpisodes(patientId, 'ongoing');
const pastEpisodes = await getPatientEpisodes(patientId, 'completed');
```

## Performance Considerations

- **Direct lookups**: `getEpisode()` uses GetCommand for O(1) lookup
- **Patient queries**: `getPatientEpisodes()` uses QueryCommand with efficient key condition
- **Sorting**: In-memory sorting after query (acceptable for typical episode counts)
- **Filtering**: Applied in-memory after query (consider GSI if filtering becomes bottleneck)

## Future Enhancements

Potential improvements for future iterations:

1. **GSI2 for doctor-episode queries**: Enable doctors to see all their episodes across patients
2. **Pagination**: Add pagination support for patients with many episodes
3. **Episode search**: Add search by diagnosis or date range
4. **Episode statistics**: Add aggregation functions for episode metrics
5. **Soft delete**: Add deletion support with soft delete pattern

## Related Modules

- `types.ts` - Type definitions for TreatmentEpisode
- `patient-db.ts` - Patient and doctor-patient relationship operations
- `chat-message-db.ts` - Chat message operations for episodes
- `dynamodb-client.ts` - Shared DynamoDB client configuration

## Requirements Traceability

This module implements the following requirements:

- **Requirement 9.2**: Create new chat thread when doctor clicks "Start New Treatment"
- **Requirement 9.3**: Chat thread associated with unique treatment episode identifier
- **Requirement 7.1**: Display all treatment episodes in treatment history
- **Requirement 7.2**: Categorize episodes as "ongoing" or "past"
- **Requirement 7.3**: Provide filter controls for treatment status
- **Requirement 21.3**: Update treatment status to "past" within 1 second
- **Requirement 21.4**: Move completed episode to treatment history
- **Requirement 21.5**: Preserve all data in archived episode

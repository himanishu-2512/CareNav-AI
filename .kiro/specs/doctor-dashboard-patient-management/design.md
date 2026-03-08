# Design Document: Doctor Dashboard Patient Management

## Overview

The Doctor Dashboard Patient Management feature enables doctors to manage their patient roster through a comprehensive web interface. The system provides secure patient data access via QR code or unique code authentication, organizes treatment consultations as separate chat threads, supports medication prescription with automatic synchronization to patient apps, and generates AI-powered lifestyle recommendations.

This feature extends the existing CareNav AI healthcare workflow system by adding doctor-facing capabilities that complement the existing patient-facing features. The design leverages the existing AWS infrastructure (DynamoDB, Lambda, API Gateway) and integrates with the current authentication system while adding new doctor-patient relationship management.

Key capabilities include:
- Patient list management with search and filtering
- QR code-based patient authentication and access control
- Treatment episode management as chat conversations
- Prescription creation with automatic schedule generation
- AI-powered lifestyle recommendations based on diagnosis
- Secure patient data access with audit logging

## Architecture

### System Components

The feature consists of three main layers:

1. **Frontend Layer (React + TypeScript)**
   - Doctor Dashboard UI component
   - Patient Profile viewer
   - Treatment Chat interface
   - Prescription creation form
   - QR code scanner integration

2. **API Layer (AWS API Gateway + Lambda)**
   - Doctor Handler Lambda: Patient list, search, filtering
   - QR Authentication Lambda: QR code validation and access control
   - Treatment Handler Lambda: Chat thread management, episode creation
   - Prescription Handler Lambda: Medication prescription and synchronization
   - Lifestyle Recommender Lambda: AI-generated recommendations

3. **Data Layer (DynamoDB)**
   - Doctor-Patient relationships
   - Treatment episodes and chat messages
   - Prescriptions and medication schedules
   - Access audit logs
   - QR authentication tokens

### Technology Stack

- **Frontend**: React 18, TypeScript, TailwindCSS, React Router
- **Backend**: AWS Lambda (Node.js 20.x), TypeScript
- **Database**: DynamoDB (single-table design)
- **API**: AWS API Gateway REST API with JWT authorization
- **AI**: Google Gemini API (existing integration)
- **QR Code**: html5-qrcode library for scanning, qrcode library for generation
- **Authentication**: JWT tokens with existing authorizer Lambda

### Integration Points

- **Existing Patient System**: Extends patient-db.ts with doctor relationship tracking
- **Existing Auth System**: Uses existing JWT authorizer for doctor authentication
- **Existing Treatment System**: Integrates with treatment-planner Lambda for prescriptions
- **Existing AI System**: Uses gemini-client.ts for lifestyle recommendations

## Components and Interfaces

### Frontend Components

#### DoctorDashboard Component
```typescript
interface DoctorDashboardProps {
  doctorId: string;
}

interface PatientListItem {
  patientId: string;
  uhid: string;
  name: string;
  lastConsultation: string;
  treatmentStatus: 'ongoing' | 'past';
  unreadMessages: number;
}

interface DoctorDashboardState {
  patients: PatientListItem[];
  searchQuery: string;
  statusFilter: ('ongoing' | 'past')[];
  currentPage: number;
  totalPages: number;
  loading: boolean;
}
```

#### QRScanner Component
```typescript
interface QRScannerProps {
  onScanSuccess: (patientId: string) => void;
  onScanError: (error: string) => void;
  doctorId: string;
}

interface QRScanResult {
  qrData: string;
  timestamp: string;
}
```

#### PatientProfile Component
```typescript
interface PatientProfileProps {
  patientId: string;
  doctorId: string;
}

interface PatientProfileData {
  demographics: PatientDemographics;
  treatmentHistory: TreatmentEpisode[];
  currentSymptoms: SymptomSummary[];
  documents: DocumentReference[];
}

interface PatientDemographics {
  name: string;
  age: number;
  uhid: string;
  gender: string;
  contact: string;
  email: string;
}
```

#### TreatmentChat Component
```typescript
interface TreatmentChatProps {
  episodeId: string;
  patientId: string;
  doctorId: string;
}

interface ChatMessage {
  messageId: string;
  sender: 'doctor' | 'patient' | 'system';
  content: string;
  timestamp: string;
  type: 'text' | 'prescription' | 'document' | 'recommendation';
}

interface TreatmentEpisode {
  episodeId: string;
  patientId: string;
  doctorId: string;
  startDate: string;
  endDate?: string;
  status: 'ongoing' | 'completed';
  diagnosis?: string;
  outcome?: string;
  messages: ChatMessage[];
}
```

#### PrescriptionForm Component
```typescript
interface PrescriptionFormProps {
  episodeId: string;
  patientId: string;
  onSubmit: (prescription: PrescriptionData) => Promise<void>;
}

interface PrescriptionData {
  medications: MedicationEntry[];
}

interface MedicationEntry {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: number; // days
  specialInstructions?: string;
  foodTiming?: 'before food' | 'after food' | 'with food' | 'anytime';
}
```

### Backend Lambda Handlers

#### Doctor Handler Lambda
```typescript
// Endpoints:
// GET /api/doctor/patients - List all patients for doctor
// GET /api/doctor/patients/search?q={query} - Search patients
// GET /api/doctor/patients?status={ongoing|past} - Filter by status
// POST /api/doctor/patients/add - Add patient via QR/code

interface DoctorPatientsRequest {
  doctorId: string;
  page?: number;
  limit?: number;
  searchQuery?: string;
  statusFilter?: ('ongoing' | 'past')[];
}

interface DoctorPatientsResponse {
  patients: PatientListItem[];
  totalCount: number;
  page: number;
  totalPages: number;
}
```

#### QR Authentication Lambda
```typescript
// Endpoints:
// POST /api/qr/validate - Validate QR code and grant access
// POST /api/qr/validate-code - Validate manual unique code
// POST /api/qr/generate - Generate QR code for patient (patient-facing)

interface QRValidateRequest {
  qrData: string;
  doctorId: string;
}

interface QRValidateResponse {
  valid: boolean;
  patientId?: string;
  uhid?: string;
  error?: string;
}

interface UniqueCodeValidateRequest {
  uniqueCode: string;
  doctorId: string;
}
```

#### Treatment Handler Lambda
```typescript
// Endpoints:
// POST /api/treatment/episode/create - Create new treatment episode
// GET /api/treatment/episode/{episodeId} - Get episode details
// POST /api/treatment/episode/{episodeId}/message - Add message to chat
// POST /api/treatment/episode/{episodeId}/complete - Mark episode complete
// GET /api/treatment/patient/{patientId}/episodes - Get all episodes for patient

interface CreateEpisodeRequest {
  patientId: string;
  doctorId: string;
  initialSymptoms?: string;
}

interface CreateEpisodeResponse {
  episodeId: string;
  createdAt: string;
}

interface AddMessageRequest {
  episodeId: string;
  sender: 'doctor' | 'patient';
  content: string;
  type: 'text' | 'prescription' | 'document';
}
```

#### Prescription Handler Lambda
```typescript
// Endpoints:
// POST /api/prescription/create - Create prescription
// GET /api/prescription/{prescriptionId} - Get prescription details
// POST /api/prescription/sync - Sync prescription to patient app

interface CreatePrescriptionRequest {
  episodeId: string;
  patientId: string;
  doctorId: string;
  medications: MedicationEntry[];
}

interface CreatePrescriptionResponse {
  prescriptionId: string;
  syncStatus: 'pending' | 'synced' | 'failed';
  scheduleGenerated: boolean;
}
```

#### Lifestyle Recommender Lambda
```typescript
// Endpoints:
// POST /api/lifestyle/generate - Generate recommendations

interface GenerateRecommendationsRequest {
  patientId: string;
  diagnosis: string;
  patientAge: number;
  patientGender: string;
}

interface GenerateRecommendationsResponse {
  recommendationId: string;
  diet: string[];
  activitiesToAvoid: ActivityRecommendation[];
  dailyLifeModifications: string[];
  recoveryTips: RecoveryTip[];
  generatedAt: string;
}

interface ActivityRecommendation {
  activity: string;
  reason: string;
  duration: string;
  priority: 'critical' | 'high' | 'medium';
}

interface RecoveryTip {
  tip: string;
  category: 'monitoring' | 'warning_signs' | 'timeline' | 'follow_up';
  description: string;
}
```

## Data Models

### DynamoDB Single-Table Design

The feature extends the existing single-table design with new entity types:

#### Doctor-Patient Relationship
```
PK: DOCTOR#{doctorId}
SK: PATIENT#{patientId}
Attributes:
  - uhid: string
  - patientName: string
  - addedAt: string (ISO timestamp)
  - addedVia: 'qr_scan' | 'manual_code'
  - lastConsultation: string (ISO timestamp)
  - treatmentStatus: 'ongoing' | 'past'
  - accessGrantedBy: string (QR token ID or code)
```

#### Treatment Episode
```
PK: PATIENT#{patientId}
SK: EPISODE#{episodeId}
Attributes:
  - episodeId: string (UUID)
  - doctorId: string
  - startDate: string (ISO timestamp)
  - endDate?: string (ISO timestamp)
  - status: 'ongoing' | 'completed'
  - diagnosis?: string
  - outcome?: string
  - createdAt: string
  - updatedAt: string
```

#### Chat Message
```
PK: EPISODE#{episodeId}
SK: MESSAGE#{timestamp}#{messageId}
Attributes:
  - messageId: string (UUID)
  - episodeId: string
  - sender: 'doctor' | 'patient' | 'system'
  - senderName: string
  - content: string
  - type: 'text' | 'prescription' | 'document' | 'recommendation'
  - metadata?: object (prescription ID, document ID, etc.)
  - createdAt: string
```

#### Prescription (extends existing)
```
PK: PATIENT#{patientId}
SK: PRESCRIPTION#{prescriptionId}
Attributes:
  - prescriptionId: string (UUID)
  - episodeId: string
  - doctorId: string
  - doctorName: string
  - medications: MedicationEntry[]
  - syncStatus: 'pending' | 'synced' | 'failed'
  - syncAttempts: number
  - lastSyncAttempt?: string
  - createdAt: string
```

#### Lifestyle Recommendations
```
PK: PATIENT#{patientId}
SK: RECOMMENDATIONS#{episodeId}
Attributes:
  - recommendationId: string (UUID)
  - episodeId: string
  - diagnosis: string
  - diet: string[]
  - activitiesToAvoid: ActivityRecommendation[]
  - dailyLifeModifications: string[]
  - recoveryTips: RecoveryTip[]
  - generatedAt: string
  - syncedToPatientApp: boolean
```

#### Access Audit Log
```
PK: AUDIT#{doctorId}
SK: ACCESS#{timestamp}#{patientId}
Attributes:
  - doctorId: string
  - patientId: string
  - accessType: 'qr_scan' | 'manual_code' | 'view_profile' | 'view_episode'
  - accessMethod: string (QR token or code)
  - ipAddress?: string
  - userAgent?: string
  - timestamp: string
  - TTL: number (30 days retention)
```

### GSI Indexes

#### GSI1: Patient-Episode Index
```
GSI1PK: PATIENT#{patientId}
GSI1SK: EPISODE#{startDate}
Purpose: Query all episodes for a patient sorted by date
```

#### GSI2: Doctor-Episode Index
```
GSI2PK: DOCTOR#{doctorId}
GSI2SK: EPISODE#{startDate}
Purpose: Query all episodes managed by a doctor
```

### Frequency Parser Specifications

The frequency parser converts natural language frequency specifications into structured time intervals:

**Supported Formats:**
- "once daily" → 1 dose at 9:00 AM
- "twice daily" → 2 doses at 9:00 AM, 9:00 PM
- "three times daily" → 3 doses at 9:00 AM, 2:00 PM, 9:00 PM
- "four times daily" → 4 doses at 9:00 AM, 1:00 PM, 5:00 PM, 9:00 PM
- "every N hours" → Doses at N-hour intervals starting at 9:00 AM
- "as needed" → No scheduled times, patient-initiated

**Parser Algorithm:**
1. Normalize input string (lowercase, trim whitespace)
2. Match against known patterns using regex
3. Calculate dose times based on frequency
4. Return structured schedule with times array

**Error Handling:**
- Invalid frequency → Return error with suggestion
- Ambiguous specification → Request clarification
- Custom patterns → Parse or request manual time entry

### Prescription Pretty Printer

The prescription pretty printer formats prescription data for display:

**Output Format:**
```
PRESCRIPTION
Date: {date}
Doctor: {doctorName}
Patient: {patientName} (UHID: {uhid})

MEDICATIONS:
1. {medicineName}
   Dosage: {dosage}
   Frequency: {frequency}
   Duration: {duration} days
   Timing: {foodTiming}
   Instructions: {specialInstructions}

2. ...

Prescription ID: {prescriptionId}
Valid for: 30 days from date of issue
```

**Formatting Rules:**
- Medications numbered sequentially
- All fields aligned for readability
- Special instructions highlighted
- Prescription ID at bottom for verification
- Medical shop can scan prescription ID for validation


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Patient List Display Completeness

*For any* patient in the doctor's patient list, the displayed patient item must include the patient name, UHID, and last consultation date.

**Validates: Requirements 1.2**

### Property 2: Patient List Sorting

*For any* list of patients, the patient list must be displayed in descending order by last consultation date (most recent first).

**Validates: Requirements 1.4**

### Property 3: Patient List Pagination

*For any* patient list with more than 20 patients, the dashboard must paginate the results with exactly 20 patients per page.

**Validates: Requirements 1.5**

### Property 4: Search Matching Correctness

*For any* search query and patient list, the search results must include all patients whose name or UHID contains the search query (case-insensitive), and must not include any patients that don't match.

**Validates: Requirements 2.2, 2.4**

### Property 5: Status Filter Correctness

*For any* patient list and status filter selection, the filtered results must include only patients matching the selected status(es) and must include all patients with that status.

**Validates: Requirements 3.2, 3.3**

### Property 6: Filter State Persistence

*For any* filter configuration, if the user navigates away and returns to the dashboard within the same session, the filter state must be preserved.

**Validates: Requirements 3.5**

### Property 7: QR Authentication Success

*For any* valid QR code or unique code, successful authentication must result in the patient being added to the doctor's patient list and the patient profile being displayed.

**Validates: Requirements 4.5, 5.4**

### Property 8: QR Authentication Failure Handling

*For any* invalid QR code or unique code, the authentication must fail with a descriptive error message and allow retry.

**Validates: Requirements 4.6, 5.5**

### Property 9: Unique Code Validation

*For any* input string, the unique code validator must accept only alphanumeric characters and reject any string containing non-alphanumeric characters.

**Validates: Requirements 5.2**

### Property 10: Patient Demographics Completeness

*For any* patient profile, the displayed demographics must include all required fields: full name, age (calculated from date of birth), UHID, gender, and contact information (phone and email).

**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

### Property 11: Treatment Episode Display Completeness

*For any* patient with treatment episodes, the patient profile must display all episodes with their start date, diagnosis, and treatment outcome (if completed).

**Validates: Requirements 7.1, 7.5**

### Property 12: Treatment Episode Categorization

*For any* treatment episode, the system must correctly categorize it as "ongoing" if it has no end date, or "past" if it has an end date.

**Validates: Requirements 7.2**

### Property 13: Treatment Episode Filtering

*For any* treatment episode list and filter selection, the filtered results must show only episodes matching the selected status and must include all episodes with that status.

**Validates: Requirements 7.4**

### Property 14: Symptom Display Completeness

*For any* symptom in the symptom summary, the display must include the symptom description, severity, and duration.

**Validates: Requirements 8.3**

### Property 15: Symptom Sorting by Severity

*For any* list of symptoms, the symptom summary must display them in order of severity from highest to lowest (severe > moderate > mild).

**Validates: Requirements 8.4**

### Property 16: Chat Thread Uniqueness

*For any* newly created treatment episode, the associated chat thread must have a unique treatment episode identifier that differs from all other episodes.

**Validates: Requirements 9.3**

### Property 17: Chat Thread Chronological Ordering

*For any* patient with multiple chat threads, the threads must be displayed in chronological order by start date.

**Validates: Requirements 9.4**

### Property 18: Chat Thread Message Completeness

*For any* chat thread, selecting the thread must display all messages in the conversation history for that treatment episode.

**Validates: Requirements 9.5**

### Property 19: Document Display Completeness

*For any* document in a chat thread, the display must include the document name, upload date, and file type.

**Validates: Requirements 10.3**

### Property 20: Document Format Support

*For any* document with file type PDF, JPEG, PNG, or DICOM, the chat thread must support opening and viewing the document.

**Validates: Requirements 10.5**

### Property 21: Prescription Required Fields Validation

*For any* prescription submission, the system must reject submissions that are missing any required field (medication name, dosage, frequency, or duration) and must accept submissions with all required fields.

**Validates: Requirements 11.3, 11.4**

### Property 22: Multiple Medication Support

*For any* treatment episode, the prescription module must support adding multiple medications, and all added medications must be saved and associated with the episode.

**Validates: Requirements 11.6**

### Property 23: Prescription Transmission Completeness

*For any* saved prescription, the transmission to the patient app must include all required fields: medication name, dosage, frequency, duration, and prescribing doctor information.

**Validates: Requirements 12.2**

### Property 24: Prescription Transmission Retry Logic

*For any* failed prescription transmission, the system must retry up to 3 times, and if all retries fail, must log the error and notify the doctor.

**Validates: Requirements 12.3, 12.4**

### Property 25: Medication Schedule Generation

*For any* prescription transmitted to the patient app, the medication schedule must generate specific dose times based on the prescribed frequency and duration.

**Validates: Requirements 13.1, 13.2**

### Property 26: Medication Schedule Display Completeness

*For any* medication in the schedule, the display must include medication name, dosage, time to take, and remaining duration.

**Validates: Requirements 13.3**

### Property 27: Medication Schedule Chronological Ordering

*For any* medication schedule with multiple medications, the medications must be organized chronologically by scheduled time.

**Validates: Requirements 13.4**

### Property 28: Prescription Document Completeness

*For any* prescription document displayed to the patient, it must include patient name, UHID, doctor name, date, all prescribed medications with dosages, and a unique prescription identifier.

**Validates: Requirements 14.3, 14.4**

### Property 29: Lifestyle Recommendations Category Completeness

*For any* generated lifestyle recommendations, the output must include all four categories: diet, activities to avoid, daily life modifications, and recovery tips, with at least 3 specific recommendations in each category.

**Validates: Requirements 15.3, 15.4**

### Property 30: Lifestyle Recommendations Personalization

*For any* two patients with different diagnoses or demographics, the generated lifestyle recommendations must differ in content.

**Validates: Requirements 15.2**

### Property 31: Diet Recommendations Structure

*For any* generated diet recommendations, the output must include both foods to consume and foods to avoid.

**Validates: Requirements 16.2**

### Property 32: Diet Recommendations Allergy Consideration

*For any* patient with recorded allergies, the diet recommendations must not include any foods that match the patient's allergy list.

**Validates: Requirements 16.4**

### Property 33: Activity Avoidance Completeness

*For any* activity avoidance recommendation, it must include the activity description, reason for avoidance, and duration to avoid.

**Validates: Requirements 17.2, 17.3**

### Property 34: Activity Avoidance Prioritization

*For any* list of activity avoidance recommendations, critical priority items must appear before high priority items, which must appear before medium priority items.

**Validates: Requirements 17.4**

### Property 35: Daily Life Modifications Content

*For any* generated daily life modifications, the recommendations must include sleep schedule adjustments, stress management techniques, and physical activity guidelines.

**Validates: Requirements 18.2**

### Property 36: Recovery Tips Completeness

*For any* generated recovery tips, the output must include warning signs requiring immediate medical attention, expected recovery timeline milestones, self-monitoring guidance, and follow-up appointment scheduling guidance.

**Validates: Requirements 19.2, 19.3, 19.4, 19.5**

### Property 37: Access Authorization Verification

*For any* doctor attempting to access patient data, the system must verify authorization before granting access, and must deny access if authorization is not present.

**Validates: Requirements 20.1**

### Property 38: Access Audit Logging

*For any* doctor-patient access event (adding patient, viewing profile, viewing episode), the system must create an audit log entry with doctor ID, patient ID, and timestamp.

**Validates: Requirements 20.2**

### Property 39: Session Expiration Enforcement

*For any* doctor session that has been inactive for 30 minutes or more, the system must require re-authentication before allowing access to patient data.

**Validates: Requirements 20.5**

### Property 40: Treatment Completion Status Update

*For any* treatment episode marked as complete, the system must update the treatment status to "past" and move the episode to the patient's treatment history.

**Validates: Requirements 21.3, 21.4**

### Property 41: Treatment Completion Data Preservation

*For any* completed treatment episode, all chat thread messages, prescriptions, and documents must remain accessible in the archived episode.

**Validates: Requirements 21.5**

### Property 42: Prescription Parser Error Handling

*For any* malformed prescription data, the prescription parser must return a descriptive error message rather than throwing an exception or producing invalid output.

**Validates: Requirements 22.2**

### Property 43: Prescription Round-Trip Property

*For any* valid prescription object, parsing then printing then parsing must produce an equivalent object (parse(print(parse(data))) ≡ parse(data)).

**Validates: Requirements 22.5**

### Property 44: Frequency Parser Format Support

*For any* frequency specification in the supported formats ("once daily", "twice daily", "three times daily", "every N hours", "as needed"), the frequency parser must successfully parse it into time intervals.

**Validates: Requirements 23.1, 23.2**

### Property 45: Frequency Parser Error Handling

*For any* invalid or ambiguous frequency specification, the frequency parser must return a descriptive error message.

**Validates: Requirements 23.3**

### Property 46: Frequency Parser Minimum Dose Generation

*For any* valid frequency specification (excluding "as needed"), the frequency parser must generate at least one scheduled dose time per day.

**Validates: Requirements 23.5**

## Error Handling

### Frontend Error Handling

**Network Errors:**
- Display user-friendly error messages for API failures
- Implement retry logic with exponential backoff for transient failures
- Show offline indicator when network is unavailable
- Cache critical data locally for offline viewing

**Validation Errors:**
- Display inline validation errors on form fields
- Prevent form submission until all validation passes
- Provide clear guidance on how to fix validation errors
- Highlight invalid fields with visual indicators

**QR Scanning Errors:**
- Handle camera permission denied gracefully
- Provide fallback to manual code entry
- Display clear error messages for invalid QR codes
- Allow retry without page refresh

**Session Errors:**
- Detect session expiration before API calls
- Redirect to login with return URL preservation
- Display session timeout warning before expiration
- Auto-refresh token when possible

### Backend Error Handling

**Authentication Errors:**
- Return 401 for invalid or expired tokens
- Return 403 for insufficient permissions
- Log all authentication failures for security monitoring
- Rate limit authentication attempts to prevent brute force

**Validation Errors:**
- Return 400 with detailed field-level error messages
- Validate all inputs before database operations
- Sanitize inputs to prevent injection attacks
- Return consistent error response format

**Database Errors:**
- Implement retry logic for transient DynamoDB errors
- Use conditional writes to prevent race conditions
- Handle throttling with exponential backoff
- Log all database errors for monitoring

**External Service Errors:**
- Implement circuit breaker for AI service calls
- Provide fallback responses when AI is unavailable
- Retry failed S3 operations with exponential backoff
- Handle Textract/Transcribe service limits gracefully

**Prescription Synchronization Errors:**
- Retry failed transmissions up to 3 times
- Log all sync failures with prescription details
- Notify doctor of sync failures via UI notification
- Queue failed syncs for manual retry

### Error Response Format

All API errors follow a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Specific field error",
      "suggestion": "How to fix the error"
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "uuid"
  }
}
```

### Logging and Monitoring

**Error Logging:**
- Log all errors with full context (user ID, request ID, stack trace)
- Use structured logging for easy querying
- Set appropriate log levels (ERROR, WARN, INFO, DEBUG)
- Include correlation IDs for distributed tracing

**Monitoring Alerts:**
- Alert on high error rates (>5% of requests)
- Alert on authentication failures spike
- Alert on prescription sync failures
- Alert on AI service unavailability

## Testing Strategy

### Dual Testing Approach

This feature requires both unit testing and property-based testing for comprehensive coverage:

**Unit Tests:**
- Specific examples demonstrating correct behavior
- Edge cases (empty lists, null values, boundary conditions)
- Error conditions and error message validation
- Integration points between components
- UI component rendering and interaction

**Property-Based Tests:**
- Universal properties that hold for all inputs
- Comprehensive input coverage through randomization
- Minimum 100 iterations per property test
- Each property test references its design document property

### Property-Based Testing Configuration

**Testing Library:** fast-check (JavaScript/TypeScript property-based testing library)

**Configuration:**
- Minimum 100 iterations per property test
- Seed-based reproducibility for failed tests
- Shrinking enabled to find minimal failing examples
- Timeout: 30 seconds per property test

**Property Test Tagging:**
Each property test must include a comment tag referencing the design property:

```typescript
// Feature: doctor-dashboard-patient-management, Property 1: Patient List Display Completeness
test('patient list items include name, UHID, and last consultation date', () => {
  fc.assert(
    fc.property(fc.array(patientGenerator()), (patients) => {
      const rendered = renderPatientList(patients);
      return patients.every(patient => 
        rendered.includes(patient.name) &&
        rendered.includes(patient.uhid) &&
        rendered.includes(patient.lastConsultation)
      );
    }),
    { numRuns: 100 }
  );
});
```

### Unit Testing Focus Areas

**Frontend Components:**
- Component rendering with various props
- User interaction handling (clicks, form submissions)
- State management and updates
- Conditional rendering based on data
- Error state display
- Loading state display

**Backend Lambda Functions:**
- Request validation and error responses
- Database operations (create, read, update, delete)
- Authorization checks
- Data transformation and formatting
- External service integration
- Retry logic and error handling

**Utility Functions:**
- Frequency parser with various input formats
- Prescription parser and pretty printer
- Date/time calculations
- Search and filter algorithms
- Sorting and pagination logic

### Property-Based Testing Focus Areas

**Data Integrity Properties:**
- Round-trip properties (parse → print → parse)
- Sorting and ordering properties
- Filtering and search correctness
- Data completeness properties

**Business Logic Properties:**
- Validation rules across all inputs
- Authorization checks for all access patterns
- Audit logging for all access events
- Prescription synchronization for all prescriptions

**UI Behavior Properties:**
- Display completeness for all data types
- Pagination for all list sizes
- Search matching for all query types
- Filter correctness for all filter combinations

### Test Data Generators

**Property-based tests require generators for:**
- Patient data (name, age, UHID, contact info)
- Treatment episodes (with various statuses and dates)
- Prescriptions (with various medications and frequencies)
- Symptoms (with various severities and durations)
- Chat messages (with various types and senders)
- QR codes and unique codes (valid and invalid)
- Search queries (various lengths and characters)
- Date ranges (past, present, future)

### Integration Testing

**API Integration Tests:**
- End-to-end flows (login → add patient → create episode → prescribe)
- Authentication and authorization flows
- QR code scanning and validation
- Prescription synchronization
- Lifestyle recommendation generation

**Database Integration Tests:**
- Single-table design access patterns
- GSI query performance
- Conditional writes and optimistic locking
- TTL-based cleanup

### Performance Testing

**Load Testing:**
- Patient list rendering with 1000+ patients
- Search performance with large datasets
- Pagination performance
- Concurrent doctor access to same patient

**Response Time Testing:**
- API response times under load
- AI recommendation generation time
- Document viewer loading time
- Prescription synchronization time

### Security Testing

**Authentication Testing:**
- Token validation and expiration
- Session management and timeout
- Authorization checks for all endpoints
- Rate limiting effectiveness

**Input Validation Testing:**
- SQL injection prevention (N/A for DynamoDB)
- XSS prevention in user inputs
- CSRF protection
- Input sanitization

**Data Access Testing:**
- Doctor can only access authorized patients
- Audit logs capture all access
- Encryption in transit and at rest
- PII handling compliance

### Test Coverage Goals

- Unit test coverage: >80% of code
- Property test coverage: 100% of correctness properties
- Integration test coverage: All critical user flows
- Edge case coverage: All identified edge cases
- Error path coverage: All error handling paths

### Continuous Testing

**Pre-commit:**
- Run unit tests
- Run linting and type checking
- Run fast property tests (10 iterations)

**CI/CD Pipeline:**
- Run full unit test suite
- Run full property test suite (100 iterations)
- Run integration tests
- Run security scans
- Generate coverage reports

**Post-deployment:**
- Run smoke tests
- Monitor error rates
- Check performance metrics
- Validate audit logs

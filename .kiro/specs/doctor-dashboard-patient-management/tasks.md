# Implementation Plan: Doctor Dashboard Patient Management

## Overview

This implementation plan breaks down the Doctor Dashboard Patient Management feature into discrete coding tasks. The feature enables doctors to manage their patient roster, access medical histories, conduct treatment consultations, prescribe medications, and provide AI-generated lifestyle recommendations. Each task builds incrementally on previous work, with property-based tests integrated throughout to validate correctness properties.

The implementation follows this sequence:
1. Backend data layer and database operations
2. Backend Lambda handlers and API endpoints
3. Frontend components and UI
4. Integration and end-to-end wiring

## Tasks

- [x] 1. Set up data layer and database operations
  - [x] 1.1 Create doctor-patient relationship database module
    - Extend `lambda/shared/patient-db.ts` with doctor-patient relationship functions
    - Implement `addPatientToDoctor()`, `getDoctorPatients()`, `updateLastConsultation()`
    - Create DynamoDB operations for DOCTOR#{doctorId}#PATIENT#{patientId} pattern
    - _Requirements: 1.1, 4.5, 5.4, 20.2_
  
  - [ ]* 1.2 Write property test for doctor-patient relationship operations
    - **Property 7: QR Authentication Success**
    - **Validates: Requirements 4.5, 5.4**
  
  - [x] 1.3 Create treatment episode database module
    - Create `lambda/shared/treatment-episode-db.ts` with episode CRUD operations
    - Implement `createEpisode()`, `getEpisode()`, `getPatientEpisodes()`, `completeEpisode()`
    - Create DynamoDB operations for PATIENT#{patientId}#EPISODE#{episodeId} pattern
    - Set up GSI1 for patient-episode queries
    - _Requirements: 9.2, 9.3, 21.3_
  
  - [ ]* 1.4 Write property test for treatment episode operations
    - **Property 16: Chat Thread Uniqueness**
    - **Property 40: Treatment Completion Status Update**
    - **Validates: Requirements 9.3, 21.3**
  
  - [x] 1.5 Create chat message database module
    - Create `lambda/shared/chat-message-db.ts` with message operations
    - Implement `addMessage()`, `getEpisodeMessages()`, `getMessagesByType()`
    - Create DynamoDB operations for EPISODE#{episodeId}#MESSAGE#{timestamp} pattern
    - _Requirements: 9.5, 18.1_
  
  - [ ]* 1.6 Write property test for chat message operations
    - **Property 18: Chat Thread Message Completeness**
    - **Validates: Requirements 9.5**
  
  - [x] 1.7 Create access audit logging module
    - Create `lambda/shared/audit-log.ts` with audit logging functions
    - Implement `logAccess()`, `getAuditLogs()` with TTL support
    - Create DynamoDB operations for AUDIT#{doctorId}#ACCESS#{timestamp} pattern
    - _Requirements: 20.2_
  
  - [ ]* 1.8 Write property test for audit logging
    - **Property 38: Access Audit Logging**
    - **Validates: Requirements 20.2**

- [x] 2. Implement QR authentication and patient access control
  - [x] 2.1 Create QR authentication Lambda handler
    - Create `lambda/qr-auth/index.ts` with QR validation endpoints
    - Implement POST /api/qr/validate for QR code validation
    - Implement POST /api/qr/validate-code for manual code entry
    - Add doctor authorization checks and audit logging
    - _Requirements: 4.3, 4.4, 5.1, 5.3, 20.1_
  
  - [ ]* 2.2 Write unit tests for QR authentication
    - Test valid QR code validation
    - Test invalid QR code error handling
    - Test manual code validation
    - Test authorization checks
    - _Requirements: 4.6, 5.5_
  
  - [ ]* 2.3 Write property test for QR authentication
    - **Property 8: QR Authentication Failure Handling**
    - **Property 9: Unique Code Validation**
    - **Validates: Requirements 4.6, 5.2, 5.5**
  
  - [x] 2.4 Create QR code generation utility
    - Create `lambda/shared/qr-generator.ts` for patient QR code generation
    - Implement QR code data structure with patient ID and expiration
    - Add unique code generation function (alphanumeric, 8 characters)
    - _Requirements: 4.4, 5.2_

- [x] 3. Implement doctor handler Lambda for patient list management
  - [x] 3.1 Create doctor handler Lambda
    - Create `lambda/doctor-handler/index.ts` with patient list endpoints
    - Implement GET /api/doctor/patients for patient list retrieval
    - Implement GET /api/doctor/patients/search for patient search
    - Implement POST /api/doctor/patients/add for adding patients
    - Add pagination support (20 patients per page)
    - _Requirements: 1.1, 1.2, 1.5, 2.1, 4.1_
  
  - [ ]* 3.2 Write unit tests for doctor handler
    - Test patient list retrieval
    - Test pagination logic
    - Test search functionality
    - Test add patient flow
    - _Requirements: 1.5, 2.2_
  
  - [ ]* 3.3 Write property test for patient list operations
    - **Property 1: Patient List Display Completeness**
    - **Property 2: Patient List Sorting**
    - **Property 3: Patient List Pagination**
    - **Validates: Requirements 1.2, 1.4, 1.5**
  
  - [x] 3.4 Implement patient search and filtering logic
    - Create `lambda/shared/patient-search.ts` with search algorithms
    - Implement case-insensitive name and UHID matching
    - Implement status filtering (ongoing/past)
    - Add debounced search with 500ms response time
    - _Requirements: 2.2, 2.3, 2.4, 3.1, 3.2_
  
  - [ ]* 3.5 Write property test for search and filtering
    - **Property 4: Search Matching Correctness**
    - **Property 5: Status Filter Correctness**
    - **Validates: Requirements 2.2, 2.4, 3.2, 3.3**

- [x] 4. Checkpoint - Ensure backend data layer and doctor handler tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement treatment episode handler Lambda
  - [x] 5.1 Create treatment handler Lambda
    - Create `lambda/treatment-handler/index.ts` with episode endpoints
    - Implement POST /api/treatment/episode/create for new episodes
    - Implement GET /api/treatment/episode/{episodeId} for episode details
    - Implement POST /api/treatment/episode/{episodeId}/message for adding messages
    - Implement POST /api/treatment/episode/{episodeId}/complete for completion
    - Implement GET /api/treatment/patient/{patientId}/episodes for patient episodes
    - _Requirements: 9.1, 9.2, 21.1, 21.2_
  
  - [ ]* 5.2 Write unit tests for treatment handler
    - Test episode creation
    - Test message addition
    - Test episode completion
    - Test episode retrieval
    - _Requirements: 9.3, 21.3_
  
  - [ ]* 5.3 Write property test for treatment episode management
    - **Property 11: Treatment Episode Display Completeness**
    - **Property 12: Treatment Episode Categorization**
    - **Property 17: Chat Thread Chronological Ordering**
    - **Property 41: Treatment Completion Data Preservation**
    - **Validates: Requirements 7.1, 7.2, 7.5, 9.4, 21.5**

- [x] 6. Implement prescription handler Lambda
  - [x] 6.1 Create prescription handler Lambda
    - Create `lambda/prescription-handler/index.ts` with prescription endpoints
    - Implement POST /api/prescription/create for prescription creation
    - Implement GET /api/prescription/{prescriptionId} for retrieval
    - Implement POST /api/prescription/sync for patient app synchronization
    - Add retry logic (3 attempts with 5-second intervals)
    - _Requirements: 11.1, 11.5, 12.1, 12.3_
  
  - [ ]* 6.2 Write unit tests for prescription handler
    - Test prescription creation
    - Test prescription retrieval
    - Test sync retry logic
    - Test sync failure notification
    - _Requirements: 11.4, 12.4_
  
  - [ ]* 6.3 Write property test for prescription operations
    - **Property 21: Prescription Required Fields Validation**
    - **Property 22: Multiple Medication Support**
    - **Property 23: Prescription Transmission Completeness**
    - **Property 24: Prescription Transmission Retry Logic**
    - **Validates: Requirements 11.3, 11.4, 11.6, 12.2, 12.3, 12.4**
  
  - [x] 6.4 Implement frequency parser utility
    - Create `lambda/shared/frequency-parser-v2.ts` for prescription frequencies
    - Support "once daily", "twice daily", "three times daily", "every N hours", "as needed"
    - Generate specific dose times based on frequency
    - Add error handling for invalid frequencies
    - _Requirements: 23.1, 23.2, 23.3_
  
  - [ ]* 6.5 Write property test for frequency parser
    - **Property 44: Frequency Parser Format Support**
    - **Property 45: Frequency Parser Error Handling**
    - **Property 46: Frequency Parser Minimum Dose Generation**
    - **Validates: Requirements 23.1, 23.2, 23.3, 23.5**
  
  - [x] 6.6 Implement prescription parser and pretty printer
    - Create `lambda/shared/prescription-parser.ts` for parsing prescription data
    - Create `lambda/shared/prescription-printer.ts` for formatting prescriptions
    - Implement medical prescription standard formatting
    - Add validation and error handling
    - _Requirements: 22.1, 22.2, 22.4_
  
  - [ ]* 6.7 Write property test for prescription parser
    - **Property 42: Prescription Parser Error Handling**
    - **Property 43: Prescription Round-Trip Property**
    - **Validates: Requirements 22.2, 22.5**
  
  - [x] 6.8 Implement medication schedule generator
    - Create `lambda/shared/medication-schedule.ts` for schedule generation
    - Generate timed schedules from frequency and duration
    - Calculate specific dose times and remaining duration
    - Add daily midnight update logic
    - _Requirements: 13.1, 13.2, 13.5_
  
  - [ ]* 6.9 Write property test for medication schedule
    - **Property 25: Medication Schedule Generation**
    - **Property 26: Medication Schedule Display Completeness**
    - **Property 27: Medication Schedule Chronological Ordering**
    - **Validates: Requirements 13.1, 13.2, 13.3, 13.4**

- [x] 7. Implement lifestyle recommender Lambda
  - [x] 7.1 Create lifestyle recommender Lambda
    - Create `lambda/lifestyle-recommender/index.ts` with recommendation endpoint
    - Implement POST /api/lifestyle/generate for AI recommendations
    - Integrate with existing Gemini client for AI generation
    - Generate recommendations in 4 categories: diet, activities to avoid, daily life, recovery
    - Add patient app synchronization
    - _Requirements: 15.1, 15.2, 15.3_
  
  - [ ]* 7.2 Write unit tests for lifestyle recommender
    - Test recommendation generation
    - Test category completeness
    - Test patient app sync
    - Test AI service error handling
    - _Requirements: 15.4, 15.5_
  
  - [ ]* 7.3 Write property test for lifestyle recommendations
    - **Property 29: Lifestyle Recommendations Category Completeness**
    - **Property 30: Lifestyle Recommendations Personalization**
    - **Validates: Requirements 15.2, 15.3, 15.4**
  
  - [x] 7.4 Implement diet recommendations generator
    - Create `lambda/shared/diet-recommender.ts` for diet-specific logic
    - Generate foods to consume and foods to avoid
    - Consider patient allergies from profile
    - Add portion size and frequency guidance
    - _Requirements: 16.1, 16.2, 16.3, 16.4_
  
  - [ ]* 7.5 Write property test for diet recommendations
    - **Property 31: Diet Recommendations Structure**
    - **Property 32: Diet Recommendations Allergy Consideration**
    - **Validates: Requirements 16.2, 16.4**
  
  - [x] 7.6 Implement activity avoidance recommendations
    - Create `lambda/shared/activity-recommender.ts` for activity guidance
    - Generate activity list with reasons and durations
    - Prioritize by criticality (critical > high > medium)
    - Use clear, non-technical language
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_
  
  - [ ]* 7.7 Write property test for activity recommendations
    - **Property 33: Activity Avoidance Completeness**
    - **Property 34: Activity Avoidance Prioritization**
    - **Validates: Requirements 17.2, 17.3, 17.4**
  
  - [x] 7.8 Implement daily life and recovery recommendations
    - Create `lambda/shared/recovery-recommender.ts` for recovery guidance
    - Generate sleep, stress management, and physical activity guidelines
    - Add warning signs and recovery timeline milestones
    - Include self-monitoring and follow-up guidance
    - _Requirements: 18.1, 18.2, 18.3, 19.1, 19.2, 19.3, 19.4, 19.5_
  
  - [ ]* 7.9 Write property test for recovery recommendations
    - **Property 35: Daily Life Modifications Content**
    - **Property 36: Recovery Tips Completeness**
    - **Validates: Requirements 18.2, 19.2, 19.3, 19.4, 19.5**

- [x] 8. Checkpoint - Ensure all backend Lambda handlers and tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Update CDK infrastructure for new Lambda functions
  - [x] 9.1 Add new Lambda functions to CDK stack
    - Update `lib/lambda-stack.ts` to include doctor-handler, qr-auth, treatment-handler, prescription-handler, lifestyle-recommender
    - Configure Lambda environment variables and IAM permissions
    - Add DynamoDB table permissions for new access patterns
    - _Requirements: 1.1, 4.1, 9.1, 11.1, 15.1_
  
  - [x] 9.2 Add new API Gateway routes
    - Update `lib/api-stack.ts` with new endpoints
    - Configure routes for /api/doctor/*, /api/qr/*, /api/treatment/*, /api/prescription/*, /api/lifestyle/*
    - Add JWT authorizer to all doctor-facing endpoints
    - _Requirements: 1.1, 4.1, 9.1, 11.1, 15.1_
  
  - [x] 9.3 Update DynamoDB table with new GSI indexes
    - Add GSI1 for patient-episode queries (GSI1PK: PATIENT#{patientId}, GSI1SK: EPISODE#{startDate})
    - Add GSI2 for doctor-episode queries (GSI2PK: DOCTOR#{doctorId}, GSI2SK: EPISODE#{startDate})
    - Configure TTL attribute for audit logs (30 days retention)
    - _Requirements: 7.1, 20.2_

- [x] 10. Implement frontend Doctor Dashboard component
  - [x] 10.1 Create DoctorDashboard component
    - Create `frontend/src/components/DoctorDashboard.tsx` with patient list UI
    - Implement patient list display with name, UHID, last consultation date
    - Add pagination controls (20 patients per page)
    - Add loading and error states
    - _Requirements: 1.1, 1.2, 1.4, 1.5_
  
  - [ ]* 10.2 Write unit tests for DoctorDashboard component
    - Test patient list rendering
    - Test pagination controls
    - Test loading states
    - Test error handling
    - _Requirements: 1.2, 1.5_
  
  - [x] 10.3 Implement patient search functionality
    - Add search input field to DoctorDashboard
    - Implement debounced search (500ms delay)
    - Add case-insensitive matching for name and UHID
    - Display "No patients found" message when empty
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [x] 10.4 Implement treatment status filtering
    - Add filter controls for "ongoing" and "past" statuses
    - Implement filter logic with state persistence
    - Update patient list based on selected filters
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 11. Implement QR scanner and patient addition
  - [x] 11.1 Create QRScanner component
    - Create `frontend/src/components/QRScanner.tsx` with camera integration
    - Integrate html5-qrcode library for QR scanning
    - Add "Add Patient" button to DoctorDashboard
    - Implement QR scan success and error callbacks
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [ ]* 11.2 Write unit tests for QRScanner component
    - Test camera activation
    - Test QR scan success handling
    - Test QR scan error handling
    - Test camera permission denied
    - _Requirements: 4.6_
  
  - [x] 11.3 Create manual code entry component
    - Create `frontend/src/components/ManualCodeEntry.tsx` for code input
    - Add alphanumeric validation
    - Implement code submission and validation
    - Display validation errors
    - _Requirements: 5.1, 5.2, 5.3, 5.5_
  
  - [x] 11.4 Integrate QR authentication with backend
    - Connect QRScanner to /api/qr/validate endpoint
    - Connect ManualCodeEntry to /api/qr/validate-code endpoint
    - Handle authentication success (add patient to list, show profile)
    - Handle authentication errors with retry
    - _Requirements: 4.5, 5.4_

- [x] 12. Implement PatientProfile component
  - [x] 12.1 Create PatientProfile component
    - Create `frontend/src/components/PatientProfile.tsx` with demographics display
    - Display patient name, age, UHID, gender, contact info
    - Add treatment history section with filtering
    - Add current symptoms section
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 8.1_
  
  - [ ]* 12.2 Write unit tests for PatientProfile component
    - Test demographics rendering
    - Test treatment history display
    - Test symptoms display
    - Test empty states
    - _Requirements: 6.1, 8.5_
  
  - [x] 12.3 Implement treatment history filtering
    - Add filter controls for ongoing/past/all treatments
    - Implement filter logic with 300ms update time
    - Display treatment episodes with start date, diagnosis, outcome
    - _Requirements: 7.2, 7.3, 7.4, 7.5_
  
  - [ ]* 12.4 Write property test for treatment history filtering
    - **Property 13: Treatment Episode Filtering**
    - **Validates: Requirements 7.4**
  
  - [x] 12.5 Implement symptoms display
    - Display symptom summary with description, severity, duration
    - Sort symptoms by severity (severe > moderate > mild)
    - Display "No current symptoms reported" when empty
    - _Requirements: 8.2, 8.3, 8.4, 8.5_
  
  - [ ]* 12.6 Write property test for symptom display
    - **Property 14: Symptom Display Completeness**
    - **Property 15: Symptom Sorting by Severity**
    - **Validates: Requirements 8.3, 8.4**

- [x] 13. Implement TreatmentChat component
  - [x] 13.1 Create TreatmentChat component
    - Create `frontend/src/components/TreatmentChat.tsx` with chat interface
    - Display chat messages with sender, content, timestamp
    - Add "Start New Treatment" button to PatientProfile
    - Implement message sending functionality
    - _Requirements: 9.1, 9.2, 9.4, 9.5_
  
  - [ ]* 13.2 Write unit tests for TreatmentChat component
    - Test message rendering
    - Test new treatment creation
    - Test message sending
    - Test chat thread selection
    - _Requirements: 9.3, 9.5_
  
  - [x] 13.3 Implement symptom and document display in chat
    - Display symptom summary within chat thread
    - Display uploaded documents with name, date, file type
    - Implement document viewer for PDF, JPEG, PNG, DICOM
    - Add document click handler with 2-second load time
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ]* 13.4 Write property test for document display
    - **Property 19: Document Display Completeness**
    - **Property 20: Document Format Support**
    - **Validates: Requirements 10.3, 10.5**
  
  - [x] 13.5 Implement treatment completion
    - Add "Complete Treatment" button to chat thread
    - Create completion dialog for outcome and notes
    - Update treatment status to "past" on completion
    - Move completed episode to treatment history
    - _Requirements: 21.1, 21.2, 21.3, 21.4_

- [x] 14. Implement PrescriptionForm component
  - [x] 14.1 Create PrescriptionForm component
    - Create `frontend/src/components/PrescriptionForm.tsx` with medication entry
    - Add "Prescribe Medication" button to chat thread
    - Implement form fields: medication name, dosage, frequency, duration, instructions
    - Add validation for required fields
    - Support multiple medications in single prescription
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.6_
  
  - [ ]* 14.2 Write unit tests for PrescriptionForm component
    - Test form rendering
    - Test field validation
    - Test multiple medication support
    - Test form submission
    - _Requirements: 11.3, 11.4_
  
  - [x] 14.3 Integrate prescription creation with backend
    - Connect form to /api/prescription/create endpoint
    - Display prescription in chat as message
    - Show sync status notification
    - Handle sync failures with retry option
    - _Requirements: 11.5, 12.1, 12.4, 12.5_
  
  - [x] 14.4 Implement prescription display for patient app
    - Create prescription view component for patient-facing app
    - Display formatted prescription with all details
    - Add full-screen mode for medical shop viewing
    - Include unique prescription identifier
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_
  
  - [ ]* 14.5 Write property test for prescription display
    - **Property 28: Prescription Document Completeness**
    - **Validates: Requirements 14.3, 14.4**
  
  - [x] 14.6 Implement medication schedule display
    - Create medication schedule component for patient app
    - Display medications with name, dosage, time, remaining duration
    - Sort medications chronologically by scheduled time
    - Update remaining duration daily at midnight
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 15. Checkpoint - Ensure all frontend components and tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. Implement session management and security
  - [x] 16.1 Add session timeout handling
    - Implement 30-minute inactivity timeout
    - Add session expiration detection before API calls
    - Display timeout warning before expiration
    - Redirect to login with return URL preservation
    - _Requirements: 20.5_
  
  - [ ]* 16.2 Write property test for session management
    - **Property 39: Session Expiration Enforcement**
    - **Validates: Requirements 20.5**
  
  - [x] 16.3 Implement authorization checks
    - Add doctor authorization verification to all endpoints
    - Verify doctor has access to requested patient data
    - Return 403 for insufficient permissions
    - _Requirements: 20.1_
  
  - [ ]* 16.4 Write property test for authorization
    - **Property 37: Access Authorization Verification**
    - **Validates: Requirements 20.1**
  
  - [x] 16.5 Add data encryption verification
    - Verify TLS 1.3 for data in transit
    - Verify AES-256 encryption for data at rest (DynamoDB)
    - Add security headers to API responses
    - _Requirements: 20.3, 20.4_

- [x] 17. Integration and end-to-end wiring
  - [x] 17.1 Wire doctor dashboard to backend APIs
    - Connect DoctorDashboard to /api/doctor/patients endpoints
    - Connect search to /api/doctor/patients/search
    - Connect filters to status query parameters
    - Add error handling and retry logic
    - _Requirements: 1.1, 2.1, 3.1_
  
  - [x] 17.2 Wire patient profile to backend APIs
    - Connect PatientProfile to patient data endpoints
    - Connect treatment history to /api/treatment/patient/{patientId}/episodes
    - Connect symptoms to existing symptom endpoints
    - _Requirements: 6.1, 7.1, 8.1_
  
  - [x] 17.3 Wire treatment chat to backend APIs
    - Connect TreatmentChat to /api/treatment/episode endpoints
    - Connect message sending to /api/treatment/episode/{episodeId}/message
    - Connect episode creation to /api/treatment/episode/create
    - Connect completion to /api/treatment/episode/{episodeId}/complete
    - _Requirements: 9.1, 9.2, 21.1_
  
  - [x] 17.4 Wire prescription flow to backend APIs
    - Connect PrescriptionForm to /api/prescription/create
    - Connect prescription sync to /api/prescription/sync
    - Connect medication schedule to patient app
    - Add sync status polling and notifications
    - _Requirements: 11.5, 12.1, 13.1_
  
  - [x] 17.5 Wire lifestyle recommendations to backend APIs
    - Connect recommendation generation to /api/lifestyle/generate
    - Trigger generation on diagnosis completion
    - Display recommendations in patient app
    - Add recommendation sync to patient app
    - _Requirements: 15.1, 15.5_
  
  - [ ]* 17.6 Write integration tests for end-to-end flows
    - Test complete flow: login → add patient → create episode → prescribe → complete
    - Test QR authentication flow
    - Test prescription synchronization flow
    - Test lifestyle recommendation generation flow
    - _Requirements: 4.5, 11.5, 12.1, 15.1_

- [x] 18. Add error handling and edge cases
  - [x] 18.1 Implement frontend error handling
    - Add network error handling with retry logic
    - Add validation error display on forms
    - Add QR scanning error handling with fallback
    - Add session error handling with re-authentication
    - _Requirements: 4.6, 5.5, 11.4_
  
  - [x] 18.2 Implement backend error handling
    - Add authentication error responses (401, 403)
    - Add validation error responses (400) with field details
    - Add database error retry logic with exponential backoff
    - Add external service error handling with circuit breaker
    - _Requirements: 12.3, 12.4, 15.1_
  
  - [x] 18.3 Add logging and monitoring
    - Add structured error logging with context
    - Add correlation IDs for distributed tracing
    - Configure CloudWatch alarms for error rates
    - Add monitoring for prescription sync failures
    - _Requirements: 12.4, 20.2_

- [x] 19. Final checkpoint - Ensure all tests pass and feature is complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The implementation builds incrementally: data layer → backend APIs → frontend UI → integration
- All code uses TypeScript for type safety and consistency with existing codebase
- The feature integrates with existing authentication, patient management, and AI systems

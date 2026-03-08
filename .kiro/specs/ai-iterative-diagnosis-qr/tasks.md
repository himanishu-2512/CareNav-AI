# Implementation Plan: AI-Powered Iterative Diagnosis and QR Code Functionality

## Overview

This implementation plan breaks down the ai-iterative-diagnosis-qr feature into discrete coding tasks. The feature adds intelligent, iterative symptom analysis with AI-powered disease identification and secure QR code-based patient data sharing. All tasks build incrementally, with testing integrated throughout to validate functionality early.

## Tasks

- [x] 1. Set up shared types and DynamoDB schema extensions
  - Create TypeScript interfaces for DiagnosisSession, DiseaseCandidate, QuestionRound, TargetedQuestion, QuestionAnswer in lambda/shared/types.ts
  - Create TypeScript interfaces for QRCodeToken, QRCodeResponse, QRValidationRequest, QRValidationResponse in lambda/shared/types.ts
  - Create TypeScript interfaces for PatientSummary, DiagnosisSessionSummary, ReportWithAnalysis, ComprehensiveAnalysis, RedFlag in lambda/shared/types.ts
  - Add DynamoDB helper functions for diagnosis session operations in lambda/shared/diagnosis-db.ts
  - Add DynamoDB helper functions for QR token operations in lambda/shared/qr-db.ts
  - _Requirements: 1.1, 1.2, 6.1, 12.1, 12.5_

- [ ] 2. Implement Bedrock prompts for iterative diagnosis
  - [x] 2.1 Create disease analysis prompt in lambda/shared/bedrock-prompts.ts
    - Add system prompt and user prompt template for initial symptom analysis
    - Include JSON schema validation for disease candidate response
    - Add function to format symptoms into prompt
    - _Requirements: 2.1, 2.2, 16.1, 16.2, 16.8_
  
  - [x] 2.2 Create targeted question generation prompt in lambda/shared/bedrock-prompts.ts
    - Add system prompt and user prompt template for question generation
    - Include JSON schema validation for question array response
    - Add function to format disease candidates and question history into prompt
    - Ensure prompt explicitly forbids disease names in questionText
    - _Requirements: 3.1, 3.2, 3.6, 4.1, 16.3, 16.8_
  
  - [x] 2.3 Create disease refinement prompt in lambda/shared/bedrock-prompts.ts
    - Add system prompt and user prompt template for probability refinement
    - Include JSON schema validation for refined disease list response
    - Add function to format current diseases, questions, and answers into prompt
    - _Requirements: 2.5, 2.6, 16.4, 16.8_
  
  - [x] 2.4 Create comprehensive patient analysis prompt in lambda/shared/bedrock-prompts.ts
    - Add system prompt and user prompt template for patient summary generation
    - Include JSON schema validation for comprehensive analysis response
    - Add function to format all patient data into prompt
    - _Requirements: 8.10, 8.11, 16.5, 16.8_

- [ ] 3. Implement core diagnosis engine logic
  - [x] 3.1 Create confidence score calculator in lambda/shared/confidence-calculator.ts
    - Implement function to calculate confidence score from disease probability distribution
    - Use highest probability and distribution spread to determine confidence
    - Ensure score is between 0.0 and 1.0
    - Ensure score is monotonically non-decreasing
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [ ]* 3.2 Write property test for confidence score calculator
    - **Property 6: Monotonic Confidence**
    - **Property 13: Confidence Score Bounds**
    - **Validates: Requirements 5.1, 5.2**
  
  - [x] 3.3 Create disease name filter in lambda/shared/disease-filter.ts
    - Implement function to scan question text for disease names
    - Remove or flag questions containing disease names
    - Support case-insensitive matching
    - _Requirements: 3.6, 4.1, 4.2_
  
  - [ ]* 3.4 Write property test for disease name isolation
    - **Property 1: Disease Name Isolation**
    - **Validates: Requirements 3.6, 4.1, 4.2, 4.3**

- [ ] 4. Implement iterative diagnosis Lambda function
  - [x] 4.1 Create diagnosis Lambda handler in lambda/iterative-diagnosis/index.ts
    - Set up Lambda handler with API Gateway event parsing
    - Implement routing for /diagnosis/start and /diagnosis/continue endpoints
    - Add error handling and response formatting
    - _Requirements: 1.1, 13.1, 13.2_
  
  - [ ] 4.2 Implement startDiagnosisSession function
    - Validate initial symptoms (bodyPart, duration, severity required)
    - Generate unique sessionId using UUID
    - Invoke Bedrock with disease analysis prompt
    - Parse and validate Bedrock response
    - Store diagnosis session in DynamoDB
    - Generate first set of targeted questions
    - Filter disease names from questions
    - Return sessionId, currentRound, questions, status, message
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 3.1, 3.6, 13.1_
  
  - [ ] 4.3 Implement continueDiagnosisSession function
    - Validate sessionId and retrieve session from DynamoDB
    - Check session status is 'active' (return 409 if completed)
    - Validate answers match previous questions
    - Invoke Bedrock with disease refinement prompt
    - Calculate new confidence score
    - Remove diseases with probability < 0.05
    - Increment currentRound
    - Check termination conditions (confidence >= 0.8 OR rounds >= 5)
    - If continuing: generate next questions and filter disease names
    - If completed: store final analysis in patient history
    - Update session in DynamoDB
    - Return appropriate response based on status
    - _Requirements: 1.6, 1.7, 1.8, 1.9, 2.5, 2.6, 2.7, 5.2, 5.4, 5.5, 13.2, 13.8_
  
  - [ ]* 4.4 Write property test for session convergence
    - **Property 2: Session Convergence**
    - **Validates: Requirements 1.7, 1.8, 5.4**
  
  - [ ]* 4.5 Write property test for disease list monotonic decrease
    - **Property 8: Disease List Monotonic Decrease**
    - **Validates: Requirements 2.6, 2.7**
  
  - [ ]* 4.6 Write unit tests for diagnosis Lambda
    - Test startDiagnosisSession with valid symptoms
    - Test continueDiagnosisSession with valid answers
    - Test session completion at confidence threshold
    - Test session completion at max rounds
    - Test error handling for invalid sessionId
    - Test error handling for completed session
    - _Requirements: 1.1, 1.7, 1.8, 13.8_

- [ ] 5. Checkpoint - Ensure diagnosis engine tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement QR code generation and encryption
  - [ ] 6.1 Create QR encryption module in lambda/shared/qr-encryption.ts
    - Implement AES-256 encryption function for QR token payload
    - Implement AES-256 decryption function for QR token validation
    - Use AWS Secrets Manager to retrieve encryption key
    - Implement base64 encoding/decoding
    - _Requirements: 6.3, 6.4, 6.5, 7.1, 7.2, 15.1_
  
  - [ ]* 6.2 Write property test for QR token round trip
    - **Property 4: QR Token Round Trip**
    - **Validates: Requirements 6.3, 6.4, 7.2, 7.4**
  
  - [ ] 6.3 Create QR code image generator in lambda/shared/qr-generator.ts
    - Implement function to generate QR code PNG from qrData string
    - Set error correction level to H
    - Set width to 300 pixels and margin to 2
    - Return base64-encoded PNG image
    - _Requirements: 6.6, 6.7, 6.10_
  
  - [ ] 6.4 Create QR code generator Lambda in lambda/qr-generator/index.ts
    - Set up Lambda handler for GET /qr/generate/:patientId
    - Validate patientId exists in database
    - Generate unique tokenId using UUID
    - Calculate expiresAt as current time + 24 hours
    - Create token payload with tokenId, patientId, issuedAt, expiresAt
    - Encrypt payload and encode as base64
    - Generate QR code image from encrypted token
    - Store token in DynamoDB with TTL set to expiresAt + 1 hour
    - Update patient history with lastQRGenerated timestamp
    - Return qrCodeImage, qrData, expiresAt, expiresIn (86400)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.8, 6.9, 6.10, 6.11, 13.3_
  
  - [ ]* 6.5 Write property test for QR token expiry calculation
    - **Property 15: QR Token Expiry Calculation**
    - **Validates: Requirements 6.2, 6.11**
  
  - [ ]* 6.6 Write property test for QR token uniqueness
    - **Property 14: QR Token Uniqueness**
    - **Validates: Requirements 6.1**
  
  - [ ]* 6.7 Write unit tests for QR generator Lambda
    - Test QR generation with valid patientId
    - Test QR generation with invalid patientId (404)
    - Test token expiry calculation
    - Test QR image generation
    - Test DynamoDB storage with TTL
    - _Requirements: 6.1, 6.2, 6.6, 13.7_

- [ ] 7. Implement QR code validation
  - [ ] 7.1 Create QR validator Lambda in lambda/qr-validator/index.ts
    - Set up Lambda handler for POST /qr/validate
    - Parse qrData and doctorId from request body
    - Decode base64 qrData string
    - Decrypt payload using AES-256 decryption
    - Handle decryption errors (return valid: false, error: "Invalid QR code format")
    - Extract tokenId, patientId, expiresAt from decrypted payload
    - Query DynamoDB for token with PK "QR_TOKEN#{tokenId}"
    - Handle token not found (return valid: false, error: "Invalid QR code")
    - Check current time against expiresAt
    - Handle expired token (return valid: false, error: "QR code has expired")
    - Verify patientId matches token record
    - Handle integrity check failure (return valid: false, error: "Token integrity check failed")
    - Update token record with scannedBy and scannedAt
    - Update patient history with lastQRScanned and lastScannedBy
    - Return valid: true, patientId, expiresAt
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10, 13.4_
  
  - [ ]* 7.2 Write property test for QR token expiry
    - **Property 3: QR Token Expiry**
    - **Validates: Requirements 7.7, 11.3**
  
  - [ ]* 7.3 Write unit tests for QR validator Lambda
    - Test validation with valid token
    - Test validation with expired token
    - Test validation with invalid format
    - Test validation with non-existent token
    - Test validation with tampered token
    - Test scan event recording
    - _Requirements: 7.3, 7.6, 7.7, 7.8, 11.3, 11.4_

- [ ] 8. Checkpoint - Ensure QR code system tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement red flag identification logic
  - [ ] 9.1 Create red flag detector in lambda/shared/red-flag-detector.ts
    - Implement function to identify high-probability diseases (> 0.7) as high_risk red flags
    - Implement function to extract red flags from report summaries
    - Implement function to categorize red flags by type (allergy, chronic_condition, high_risk, medication_interaction)
    - Implement function to assign severity (critical, high, medium)
    - Implement function to sort red flags by severity
    - _Requirements: 9.1, 9.2, 9.4, 9.5, 9.8_
  
  - [ ]* 9.2 Write property test for red flag severity ordering
    - **Property 16: Red Flag Severity Ordering**
    - **Validates: Requirements 9.8**
  
  - [ ]* 9.3 Write property test for red flag data completeness
    - **Property 17: Red Flag Data Completeness**
    - **Validates: Requirements 9.2, 9.4, 9.5, 9.6, 9.7**
  
  - [ ]* 9.4 Write unit tests for red flag detector
    - Test high-probability disease identification
    - Test report red flag extraction
    - Test red flag categorization
    - Test severity assignment
    - Test sorting by severity
    - _Requirements: 9.1, 9.2, 9.4, 9.5, 9.8_

- [ ] 10. Implement patient summary generation
  - [ ] 10.1 Create patient summary Lambda in lambda/patient-summary/index.ts
    - Set up Lambda handler for GET /patient/summary/:patientId
    - Verify JWT authentication and doctor role
    - Verify valid QR scan event exists for doctor and patient
    - Handle authorization failures (403)
    - Query patient profile from DynamoDB
    - Handle patient not found (404)
    - Query all diagnosis sessions for patient
    - Process each diagnosis session into DiagnosisSessionSummary
    - Extract keyFindings from each session
    - Query all symptoms for patient
    - Query all reports for patient
    - Generate pre-signed S3 URLs for each report (1 hour expiry)
    - Handle missing S3 files gracefully (mark as unavailable, continue processing)
    - Invoke Bedrock to generate AI insights for each report
    - Query all treatments for patient
    - Identify red flags from diagnosis sessions using red-flag-detector
    - Identify red flags from reports using red-flag-detector
    - Sort red flags by severity
    - Invoke Bedrock with comprehensive analysis prompt
    - Assemble complete PatientSummary object
    - Add generatedAt timestamp
    - Return PatientSummary
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10, 8.11, 8.12, 9.1, 9.3, 9.6, 9.7, 9.8, 11.5, 11.8, 13.5_
  
  - [ ]* 10.2 Write property test for data completeness in summary
    - **Property 5: Data Completeness in Summary**
    - **Validates: Requirements 8.3, 8.7, 8.11, 8.12**
  
  - [ ]* 10.3 Write property test for high probability disease red flags
    - **Property 18: High Probability Disease Red Flags**
    - **Validates: Requirements 9.1**
  
  - [ ]* 10.4 Write unit tests for patient summary Lambda
    - Test summary generation with complete patient data
    - Test summary generation with missing reports (graceful handling)
    - Test summary generation with no diagnosis sessions
    - Test authorization check (valid QR scan required)
    - Test patient not found (404)
    - Test forbidden access without QR scan (403)
    - Test red flag identification and sorting
    - _Requirements: 8.1, 8.3, 11.5, 11.7, 11.8, 13.5, 13.7, 13.10_

- [ ] 11. Implement error handling and retry logic
  - [ ] 11.1 Create Bedrock retry wrapper in lambda/shared/bedrock-client.ts
    - Implement exponential backoff retry logic (3 attempts)
    - Handle throttling errors specifically
    - Handle service unavailable errors
    - Log all retry attempts to CloudWatch
    - Return 503 error after all retries fail
    - _Requirements: 2.8, 2.9, 11.1, 11.2_
  
  - [ ] 11.2 Add response validation to Bedrock client
    - Implement JSON schema validation for each prompt type
    - Handle invalid JSON responses
    - Log invalid responses to CloudWatch
    - Retry on validation failure
    - _Requirements: 2.9, 16.6, 16.7_
  
  - [ ]* 11.3 Write unit tests for Bedrock retry logic
    - Test successful call on first attempt
    - Test retry on throttling error
    - Test retry on service unavailable
    - Test failure after 3 retries
    - Test exponential backoff timing
    - _Requirements: 2.8, 2.9, 11.1, 11.2_

- [ ] 12. Implement session state management
  - [ ] 12.1 Add session resume functionality to diagnosis Lambda
    - Implement endpoint to retrieve active sessions for patient
    - Implement endpoint to resume session from last round
    - Preserve questionHistory and possibleDiseases on resume
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [ ] 12.2 Add session expiry logic
    - Implement function to check session updatedAt timestamp
    - Mark sessions as expired if inactive > 7 days
    - _Requirements: 10.4, 20.2_
  
  - [ ]* 12.3 Write property test for session state persistence
    - **Property 19: Session State Persistence**
    - **Property 23: Session Resume State Preservation**
    - **Validates: Requirements 12.1, 12.2, 10.2, 10.3**
  
  - [ ]* 12.4 Write unit tests for session management
    - Test session resume with active session
    - Test session expiry after 7 days
    - Test multiple concurrent sessions for same patient
    - Test state preservation on resume
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 13. Checkpoint - Ensure backend integration tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Update CDK infrastructure
  - [ ] 14.1 Add new Lambda functions to CDK stack in lib/lambda-stack.ts
    - Add iterative-diagnosis Lambda with appropriate memory (1024MB) and timeout (30s)
    - Add qr-generator Lambda with appropriate memory (512MB) and timeout (10s)
    - Add qr-validator Lambda with appropriate memory (256MB) and timeout (5s)
    - Add patient-summary Lambda with appropriate memory (1024MB) and timeout (30s)
    - Configure environment variables for all Lambdas
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_
  
  - [ ] 14.2 Add API Gateway routes in lib/api-stack.ts
    - Add POST /api/diagnosis/start route to iterative-diagnosis Lambda
    - Add POST /api/diagnosis/continue route to iterative-diagnosis Lambda
    - Add GET /api/qr/generate/:patientId route to qr-generator Lambda
    - Add POST /api/qr/validate route to qr-validator Lambda
    - Add GET /api/patient/summary/:patientId route to patient-summary Lambda
    - Configure authorizer for all routes
    - Add rate limiting for QR validation endpoint (10 req/min)
    - _Requirements: 15.5, 15.6, 15.7, 15.8_
  
  - [ ] 14.3 Add IAM permissions
    - Grant iterative-diagnosis Lambda permissions for DynamoDB (read/write patients table), Bedrock (invoke model)
    - Grant qr-generator Lambda permissions for DynamoDB (read/write patients table), Secrets Manager (read encryption key)
    - Grant qr-validator Lambda permissions for DynamoDB (read/write patients table), Secrets Manager (read encryption key)
    - Grant patient-summary Lambda permissions for DynamoDB (read patients table), S3 (read reports bucket, generate presigned URLs), Bedrock (invoke model)
    - _Requirements: 15.1, 15.2, 15.3_
  
  - [ ] 14.4 Add DynamoDB TTL configuration
    - Enable TTL on patients table for QR token cleanup
    - Set TTL attribute to "TTL" field
    - _Requirements: 6.9, 20.1_
  
  - [ ] 14.5 Add CloudWatch log groups and alarms
    - Create log groups for all new Lambda functions
    - Add alarm for diagnosis Lambda errors (> 5 in 5 minutes)
    - Add alarm for QR validation failures (> 10 in 1 minute)
    - Add alarm for Bedrock throttling (> 3 in 5 minutes)
    - Add alarm for patient summary generation latency (> 8 seconds)
    - _Requirements: 19.1, 19.2, 19.5_

- [ ] 15. Implement frontend patient diagnosis interface
  - [ ] 15.1 Create IterativeDiagnosis component in frontend/src/components/IterativeDiagnosis.tsx
    - Create form for initial symptom input (bodyPart, duration, severity, associatedFactors, timing, character)
    - Add loading indicator during API calls
    - Display questions returned from API
    - Implement question rendering based on questionType (yes_no, text, multiple_choice, scale)
    - Collect answers and submit to continue endpoint
    - Display completion message when session completes
    - Handle errors gracefully with user-friendly messages
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7_
  
  - [ ] 15.2 Add diagnosis session to patient dashboard
    - Add "Start Diagnosis" button to patient dashboard
    - Display active diagnosis sessions with resume option
    - Show session history (completed sessions without disease info)
    - _Requirements: 10.2, 17.1_
  
  - [ ]* 15.3 Write integration tests for diagnosis flow
    - Test complete diagnosis flow from start to completion
    - Test session resume functionality
    - Test error handling for API failures
    - _Requirements: 1.1, 1.6, 1.7, 1.8, 10.2_

- [ ] 16. Implement frontend QR code display
  - [ ] 16.1 Create QRCodeDisplay component in frontend/src/components/QRCodeDisplay.tsx
    - Call QR generation API on component mount
    - Display QR code image from base64 response
    - Display expiration time
    - Add "Generate New QR Code" button
    - Handle expired QR codes (show regenerate button)
    - Add loading and error states
    - _Requirements: 17.8, 17.9, 17.10_
  
  - [ ] 16.2 Add QR code section to patient dashboard
    - Display QRCodeDisplay component in patient dashboard
    - Show QR code prominently for easy scanning
    - Add instructions for doctor to scan
    - _Requirements: 17.8_
  
  - [ ]* 16.3 Write integration tests for QR display
    - Test QR generation on mount
    - Test QR regeneration on expiry
    - Test error handling
    - _Requirements: 6.1, 6.2, 17.9, 17.10_

- [ ] 17. Implement frontend doctor QR scanner and patient summary
  - [ ] 17.1 Create QRScanner component in frontend/src/components/QRScanner.tsx
    - Use html5-qrcode library to activate camera
    - Scan QR code and extract qrData
    - Call QR validation API with qrData and doctorId
    - Handle validation success (navigate to patient summary)
    - Handle validation errors (display error message)
    - Add manual QR data input option (fallback)
    - _Requirements: 18.1, 18.2, 18.3_
  
  - [ ] 17.2 Create PatientSummaryView component in frontend/src/components/PatientSummaryView.tsx
    - Display patient profile information
    - Display red flags prominently at top with severity indicators
    - Display all diagnosis sessions with disease candidates and probabilities
    - Display AI comprehensive analysis with recommendations
    - Display all medical reports with clickable PDF links
    - Display treatment history if available
    - Add loading and error states
    - Implement responsive design for mobile and desktop
    - _Requirements: 18.4, 18.5, 18.6, 18.7, 18.8, 18.9, 18.10_
  
  - [ ] 17.3 Add QR scanner to doctor dashboard
    - Add "Scan Patient QR Code" button to doctor dashboard
    - Navigate to QRScanner component on click
    - Store scanned patient summaries in recent access list
    - _Requirements: 18.1_
  
  - [ ]* 17.4 Write integration tests for doctor flow
    - Test QR scanning and validation
    - Test patient summary display
    - Test report PDF link opening
    - Test error handling for invalid QR codes
    - _Requirements: 18.1, 18.2, 18.3, 18.4_

- [ ] 18. Implement monitoring and logging
  - [ ] 18.1 Add structured logging to all Lambda functions
    - Log function invocations with timestamp and request details
    - Log errors with stack traces and context
    - Log Bedrock invocations with model, token count, latency
    - Log DynamoDB operations with operation type, table, latency
    - Log S3 operations with operation type, bucket, key, latency
    - Log diagnosis session creation with patientId and sessionId
    - Log QR scan events with doctorId, patientId, timestamp
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7, 19.8_
  
  - [ ] 18.2 Create CloudWatch dashboard
    - Add widgets for Lambda invocation counts
    - Add widgets for Lambda error rates
    - Add widgets for Lambda latency (p50, p95, p99)
    - Add widgets for Bedrock invocation counts and latency
    - Add widgets for DynamoDB read/write capacity
    - Add widgets for QR scan events
    - _Requirements: 19.1, 19.5, 19.6_

- [ ] 19. Implement data retention and cleanup
  - [ ] 19.1 Add session expiry cleanup job
    - Create Lambda function to scan for expired sessions (inactive > 7 days)
    - Mark expired sessions with status 'expired'
    - Schedule Lambda to run daily using EventBridge
    - _Requirements: 10.4, 20.2_
  
  - [ ] 19.2 Add patient data deletion handler
    - Implement function to delete all patient data on account deletion
    - Delete diagnosis sessions, QR tokens, patient history
    - Archive medical reports in S3 with archived status
    - _Requirements: 20.3, 20.4_
  
  - [ ]* 19.3 Write unit tests for cleanup logic
    - Test session expiry detection
    - Test patient data deletion
    - Test report archival
    - _Requirements: 20.2, 20.3, 20.4_

- [ ] 20. Final checkpoint and end-to-end testing
  - [ ] 20.1 Perform end-to-end testing
    - Test complete patient flow: symptom input → questions → completion → QR generation
    - Test complete doctor flow: QR scan → validation → patient summary view
    - Test error scenarios: expired QR, invalid QR, missing data
    - Test performance: measure latency for all operations
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_
  
  - [ ] 20.2 Verify all property-based tests pass
    - Run all property tests with 100+ random inputs
    - Verify no counterexamples found
    - Document any edge cases discovered
  
  - [ ] 20.3 Verify security requirements
    - Verify QR token encryption working correctly
    - Verify DynamoDB and S3 encryption at rest
    - Verify TLS 1.2+ for all API calls
    - Verify JWT authentication on all endpoints
    - Verify rate limiting on QR validation endpoint
    - Verify audit logging for all patient data access
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8, 15.9_
  
  - [ ] 20.4 Create deployment documentation
    - Document environment variables required
    - Document AWS Secrets Manager setup for encryption key
    - Document Bedrock model access requirements
    - Document DynamoDB TTL configuration
    - Document API Gateway rate limiting configuration
  
  - [ ] 20.5 Final checkpoint
    - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based and unit tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout implementation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- All code uses TypeScript as specified in the design document
- Implementation builds on existing CareNav infrastructure (DynamoDB table, S3 bucket, API Gateway)
- Bedrock integration uses amazon.nova-pro-v1:0 model as specified in design

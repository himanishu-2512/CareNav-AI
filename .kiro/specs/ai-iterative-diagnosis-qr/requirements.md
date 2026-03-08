# Requirements Document: AI-Powered Iterative Diagnosis and QR Code Functionality

## Introduction

This document specifies the requirements for enhancing the CareNav AI system with intelligent, iterative symptom analysis and QR code-based patient data sharing. The system analyzes patient symptoms to determine possible diseases, asks progressively targeted questions to narrow down the diagnosis, and stores all findings in patient history without revealing diagnosis to the patient. Doctors can scan a QR code displayed in the patient's account to access complete symptom history, uploaded reports, and AI-generated analysis.

The feature maintains the system's core principle of not providing diagnosis to patients while enabling doctors to access comprehensive, AI-analyzed patient data through a secure, convenient QR code interface.

## Glossary

- **System**: The CareNav AI platform including frontend, backend APIs, and AI services
- **Diagnosis_Engine**: The iterative diagnosis component that analyzes symptoms and generates questions
- **QR_Generator**: The component that creates secure QR codes for patient data access
- **QR_Validator**: The component that validates scanned QR codes and authorizes access
- **Summary_Generator**: The component that compiles comprehensive patient data for doctor view
- **Bedrock**: Amazon Bedrock AI service using Nova Pro model
- **Patient**: End user who inputs symptoms and generates QR codes
- **Doctor**: Healthcare provider who scans QR codes and views patient summaries
- **Diagnosis_Session**: A complete iterative diagnosis workflow from initial symptoms to completion
- **Disease_Candidate**: A possible disease with probability score identified by the AI
- **Targeted_Question**: A question generated to differentiate between disease candidates
- **QR_Token**: An encrypted, time-limited token that grants access to patient data
- **Confidence_Score**: A numerical value (0.0 to 1.0) indicating diagnostic certainty
- **Red_Flag**: A critical health indicator requiring immediate attention

## Requirements

### Requirement 1: Iterative Diagnosis Session Management

**User Story:** As a patient, I want to provide my symptoms and answer targeted questions, so that the system can analyze my condition without revealing possible diseases to me.

#### Acceptance Criteria

1. WHEN a patient submits initial symptoms with bodyPart, duration, and severity, THE Diagnosis_Engine SHALL create a new diagnosis session with status 'active'
2. WHEN a diagnosis session is created, THE Diagnosis_Engine SHALL generate a unique sessionId and store it in DynamoDB
3. WHEN initial symptoms are analyzed, THE Diagnosis_Engine SHALL identify 5 to 10 possible disease candidates with probability scores
4. WHEN disease candidates are identified, THE Diagnosis_Engine SHALL ensure probability scores sum to approximately 1.0
5. WHEN a diagnosis session is active, THE System SHALL set currentRound to 1
6. WHEN a patient submits answers to questions, THE Diagnosis_Engine SHALL increment currentRound by 1
7. WHEN currentRound reaches 5, THE Diagnosis_Engine SHALL mark the session status as 'completed'
8. WHEN confidenceScore reaches 0.8 or higher, THE Diagnosis_Engine SHALL mark the session status as 'completed'
9. WHEN a session is marked 'completed', THE System SHALL store the final analysis in patient history
10. WHEN a session is completed, THE System SHALL display a completion message to the patient without revealing disease names

### Requirement 2: AI-Powered Disease Analysis

**User Story:** As a system, I want to analyze patient symptoms using AI to identify possible diseases, so that I can generate targeted questions for diagnosis refinement.

#### Acceptance Criteria

1. WHEN initial symptoms are provided, THE Diagnosis_Engine SHALL invoke Bedrock with the symptom analysis prompt
2. WHEN Bedrock returns disease analysis, THE Diagnosis_Engine SHALL parse the JSON response containing possibleDiseases array
3. WHEN disease candidates are identified, THE Diagnosis_Engine SHALL store supportingSymptoms for each disease
4. WHEN disease candidates are identified, THE Diagnosis_Engine SHALL store missingSymptoms for each disease
5. WHEN patient answers are received, THE Diagnosis_Engine SHALL invoke Bedrock to refine disease probabilities
6. WHEN disease probabilities are refined, THE Diagnosis_Engine SHALL remove diseases with probability less than 0.05
7. WHEN disease probabilities are updated, THE Diagnosis_Engine SHALL ensure the list size decreases or stays the same
8. WHEN Bedrock is unavailable, THE System SHALL return error code 503 with retry message
9. WHEN Bedrock returns invalid JSON, THE System SHALL log the error and retry up to 3 times with exponential backoff

### Requirement 3: Targeted Question Generation

**User Story:** As a system, I want to generate targeted questions based on disease candidates, so that I can efficiently narrow down the diagnosis.

#### Acceptance Criteria

1. WHEN disease candidates exist, THE Diagnosis_Engine SHALL invoke Bedrock to generate 3 to 5 targeted questions
2. WHEN questions are generated, THE Diagnosis_Engine SHALL ensure each question has a unique questionId
3. WHEN questions are generated, THE Diagnosis_Engine SHALL assign questionType as one of: yes_no, text, multiple_choice, or scale
4. WHEN questions are generated, THE Diagnosis_Engine SHALL assign importance level as high, medium, or low
5. WHEN questions are generated, THE Diagnosis_Engine SHALL specify targetDiseases that each question helps differentiate
6. WHEN questions are returned to patient, THE System SHALL filter out all disease names from questionText
7. WHEN questions are displayed, THE System SHALL present them in order of importance (high first)
8. WHEN a question type is multiple_choice, THE System SHALL include an options array with at least 2 choices

### Requirement 4: Disease Information Isolation

**User Story:** As a patient, I want my diagnosis information to be analyzed without being shown to me, so that I don't self-diagnose or experience unnecessary anxiety.

#### Acceptance Criteria

1. WHEN questions are generated for patients, THE System SHALL exclude all disease names from the questionText field
2. WHEN API responses are sent to patient interface, THE System SHALL exclude the possibleDiseases field
3. WHEN a diagnosis session is completed, THE System SHALL display a generic completion message without disease information
4. WHEN patient views their dashboard, THE System SHALL not display disease candidates or probabilities
5. WHEN diagnosis data is stored, THE System SHALL mark it as doctor-only access in the data model

### Requirement 5: Confidence Score Calculation

**User Story:** As a system, I want to calculate diagnostic confidence based on disease probabilities, so that I can determine when sufficient information has been gathered.

#### Acceptance Criteria

1. WHEN disease probabilities are calculated, THE Diagnosis_Engine SHALL compute a confidenceScore between 0.0 and 1.0
2. WHEN a new round of answers is processed, THE Diagnosis_Engine SHALL ensure confidenceScore is greater than or equal to the previous round's score
3. WHEN confidenceScore is calculated, THE Diagnosis_Engine SHALL base it on the highest disease probability and probability distribution
4. WHEN confidenceScore reaches 0.8, THE Diagnosis_Engine SHALL mark the session as ready for completion
5. WHEN confidenceScore is below 0.8 and currentRound is less than 5, THE Diagnosis_Engine SHALL continue generating questions

### Requirement 6: QR Code Generation

**User Story:** As a patient, I want to generate a QR code from my account, so that my doctor can scan it to access my complete medical information.

#### Acceptance Criteria

1. WHEN a patient requests QR code generation, THE QR_Generator SHALL create a unique tokenId using UUID
2. WHEN a QR token is created, THE QR_Generator SHALL set expiresAt to 24 hours from creation time
3. WHEN a QR token is created, THE QR_Generator SHALL encrypt the payload using AES-256 encryption
4. WHEN a QR token payload is encrypted, THE QR_Generator SHALL include tokenId, patientId, issuedAt, and expiresAt fields
5. WHEN a QR token is encrypted, THE QR_Generator SHALL encode it as base64 string for the qrData field
6. WHEN qrData is generated, THE QR_Generator SHALL create a PNG image with error correction level H
7. WHEN a QR code image is generated, THE QR_Generator SHALL set width to 300 pixels and margin to 2
8. WHEN a QR token is created, THE QR_Generator SHALL store it in DynamoDB with PK "QR_TOKEN#{tokenId}"
9. WHEN a QR token is stored, THE QR_Generator SHALL set DynamoDB TTL to expiresAt plus 1 hour for automatic cleanup
10. WHEN a QR code is generated, THE QR_Generator SHALL return qrCodeImage as base64-encoded PNG
11. WHEN a QR code is generated, THE QR_Generator SHALL return expiresIn as 86400 seconds

### Requirement 7: QR Code Validation

**User Story:** As a doctor, I want to scan a patient's QR code, so that I can access their complete medical information securely.

#### Acceptance Criteria

1. WHEN a doctor scans a QR code, THE QR_Validator SHALL decode the base64 qrData string
2. WHEN qrData is decoded, THE QR_Validator SHALL decrypt the payload using AES-256 decryption
3. WHEN decryption fails, THE QR_Validator SHALL return valid as false with error "Invalid QR code format"
4. WHEN a token is decrypted, THE QR_Validator SHALL extract tokenId, patientId, and expiresAt from the payload
5. WHEN tokenId is extracted, THE QR_Validator SHALL query DynamoDB with PK "QR_TOKEN#{tokenId}"
6. WHEN a token is not found in DynamoDB, THE QR_Validator SHALL return valid as false with error "Invalid QR code"
7. WHEN current time is greater than expiresAt, THE QR_Validator SHALL return valid as false with error "QR code has expired"
8. WHEN a token passes all validation checks, THE QR_Validator SHALL return valid as true with patientId
9. WHEN a token is successfully validated, THE QR_Validator SHALL update the token record with scannedBy doctorId and scannedAt timestamp
10. WHEN a token is successfully validated, THE QR_Validator SHALL update patient history with lastQRScanned timestamp

### Requirement 8: Patient Summary Generation

**User Story:** As a doctor, I want to view a comprehensive patient summary after scanning their QR code, so that I can make informed clinical decisions.

#### Acceptance Criteria

1. WHEN a doctor requests patient summary, THE Summary_Generator SHALL query DynamoDB for patient profile with PK "PATIENT#{patientId}"
2. WHEN patient profile is retrieved, THE Summary_Generator SHALL query all diagnosis sessions with SK beginning with "DIAGNOSIS_SESSION#"
3. WHEN diagnosis sessions are retrieved, THE Summary_Generator SHALL include sessionId, date, initialSymptoms, finalDiseases, totalRounds, and confidenceScore for each
4. WHEN diagnosis sessions are processed, THE Summary_Generator SHALL extract keyFindings from each session
5. WHEN patient data is aggregated, THE Summary_Generator SHALL query all symptoms with SK beginning with "SYMPTOM#"
6. WHEN patient data is aggregated, THE Summary_Generator SHALL query all reports with SK beginning with "REPORT#"
7. WHEN reports are retrieved, THE Summary_Generator SHALL generate pre-signed S3 URLs valid for 1 hour
8. WHEN reports are processed, THE Summary_Generator SHALL invoke Bedrock to generate AI insights for each report
9. WHEN patient data is aggregated, THE Summary_Generator SHALL query all treatments with SK beginning with "TREATMENT#"
10. WHEN all data is collected, THE Summary_Generator SHALL invoke Bedrock to generate comprehensive analysis
11. WHEN comprehensive analysis is generated, THE Summary_Generator SHALL include overallHealthStatus, chronicConditions, recentSymptomPatterns, reportTrends, recommendations, and criticalAlerts
12. WHEN patient summary is complete, THE Summary_Generator SHALL return generatedAt timestamp

### Requirement 9: Red Flag Identification

**User Story:** As a doctor, I want critical health indicators to be highlighted in the patient summary, so that I can prioritize urgent issues.

#### Acceptance Criteria

1. WHEN diagnosis sessions contain disease candidates with probability greater than 0.7, THE Summary_Generator SHALL identify them as high_risk red flags
2. WHEN high_risk diseases are identified, THE Summary_Generator SHALL create red flag entries with type 'high_risk' and severity 'high'
3. WHEN medical reports contain red flag indicators, THE Summary_Generator SHALL extract them from report summaries
4. WHEN red flags are extracted from reports, THE Summary_Generator SHALL categorize them by type: allergy, chronic_condition, high_risk, or medication_interaction
5. WHEN red flags are identified, THE Summary_Generator SHALL assign severity as critical, high, or medium
6. WHEN red flags are collected, THE Summary_Generator SHALL include source field indicating which data identified the flag
7. WHEN red flags are collected, THE Summary_Generator SHALL include detectedAt timestamp
8. WHEN patient summary is generated, THE Summary_Generator SHALL sort red flags by severity with critical first

### Requirement 10: Session State Management

**User Story:** As a patient, I want to be able to resume an incomplete diagnosis session, so that I don't lose my progress if I need to stop mid-way.

#### Acceptance Criteria

1. WHEN a patient abandons a diagnosis session, THE System SHALL keep the session status as 'active' in DynamoDB
2. WHEN a patient returns to an active session, THE System SHALL retrieve the last round number and question history
3. WHEN a patient resumes a session, THE System SHALL continue from the last unanswered question set
4. WHEN a session has been active for more than 7 days, THE System SHALL mark it as expired
5. WHEN a patient starts a new session while an active session exists, THE System SHALL allow multiple concurrent sessions

### Requirement 11: Error Handling and Recovery

**User Story:** As a user, I want the system to handle errors gracefully, so that I can understand what went wrong and how to proceed.

#### Acceptance Criteria

1. WHEN Bedrock API returns a throttling error, THE System SHALL retry the request up to 3 times with exponential backoff
2. WHEN all Bedrock retry attempts fail, THE System SHALL return HTTP status 503 with message "AI service temporarily unavailable"
3. WHEN a QR code has expired, THE System SHALL return validation response with descriptive error message
4. WHEN a QR code format is invalid, THE System SHALL return validation response with error "Invalid QR code format"
5. WHEN an S3 report PDF is not found, THE Summary_Generator SHALL mark the report as unavailable and continue processing
6. WHEN DynamoDB query fails, THE System SHALL log the error to CloudWatch and return HTTP status 500
7. WHEN patient data is not found, THE System SHALL return HTTP status 404 with message "Patient not found"
8. WHEN a doctor attempts to access patient summary without valid QR scan, THE System SHALL return HTTP status 403 with message "Forbidden"

### Requirement 12: Data Persistence and Storage

**User Story:** As a system, I want to persist all diagnosis data reliably, so that patient history is preserved for future doctor access.

#### Acceptance Criteria

1. WHEN a diagnosis session is created, THE System SHALL store it in DynamoDB with PK "PATIENT#{patientId}" and SK "DIAGNOSIS_SESSION#{sessionId}"
2. WHEN a diagnosis session is updated, THE System SHALL update the updatedAt timestamp
3. WHEN a diagnosis session stores disease candidates, THE System SHALL include diseaseName, probability, supportingSymptoms, and missingSymptoms for each
4. WHEN a diagnosis session stores question rounds, THE System SHALL include roundNumber, questions, answers, diseasesBeforeRound, diseasesAfterRound, and timestamp
5. WHEN a QR token is stored, THE System SHALL use composite key with PK "QR_TOKEN#{tokenId}" and SK "METADATA"
6. WHEN a QR token is stored, THE System SHALL set TTL field for DynamoDB automatic cleanup
7. WHEN patient history is updated, THE System SHALL increment totalDiagnosisSessions counter
8. WHEN patient history is updated, THE System SHALL update lastDiagnosisDate with current timestamp

### Requirement 13: API Response Format and Status Codes

**User Story:** As a frontend developer, I want consistent API response formats and status codes, so that I can handle responses predictably.

#### Acceptance Criteria

1. WHEN a diagnosis session starts successfully, THE System SHALL return HTTP status 200 with sessionId, currentRound, questions, status, and message
2. WHEN a diagnosis session continues successfully, THE System SHALL return HTTP status 200 with sessionId, currentRound, confidenceScore, questions (if continuing), status, and message
3. WHEN a QR code is generated successfully, THE System SHALL return HTTP status 200 with qrCodeImage, qrData, expiresAt, and expiresIn
4. WHEN a QR code is validated successfully, THE System SHALL return HTTP status 200 with valid boolean, patientId (if valid), expiresAt (if valid), and error (if invalid)
5. WHEN a patient summary is generated successfully, THE System SHALL return HTTP status 200 with complete PatientSummary object
6. WHEN a request has missing required fields, THE System SHALL return HTTP status 400 with descriptive error message
7. WHEN a requested resource is not found, THE System SHALL return HTTP status 404 with descriptive error message
8. WHEN a session is already completed, THE System SHALL return HTTP status 409 with message "Session already completed"
9. WHEN authentication fails, THE System SHALL return HTTP status 401 with message "Unauthorized"
10. WHEN authorization fails, THE System SHALL return HTTP status 403 with message "Forbidden"

### Requirement 14: Performance and Latency

**User Story:** As a user, I want the system to respond quickly to my requests, so that I have a smooth experience.

#### Acceptance Criteria

1. WHEN a diagnosis session is started, THE System SHALL respond within 3 seconds at 95th percentile
2. WHEN a diagnosis session is continued, THE System SHALL respond within 3 seconds at 95th percentile
3. WHEN a QR code is generated, THE System SHALL respond within 1 second at 99th percentile
4. WHEN a QR code is validated, THE System SHALL respond within 500 milliseconds at 99th percentile
5. WHEN a patient summary is generated, THE System SHALL respond within 5 seconds at 95th percentile

### Requirement 15: Security and Access Control

**User Story:** As a system administrator, I want patient data to be secure and access-controlled, so that privacy is maintained and regulations are met.

#### Acceptance Criteria

1. WHEN QR token payload is created, THE QR_Generator SHALL encrypt it using AES-256 encryption with a secret key from AWS Secrets Manager
2. WHEN data is stored in DynamoDB, THE System SHALL use encryption at rest with AWS KMS
3. WHEN report PDFs are stored in S3, THE System SHALL use server-side encryption
4. WHEN API requests are made, THE System SHALL require TLS 1.2 or higher
5. WHEN a patient requests QR generation, THE System SHALL verify JWT authentication token
6. WHEN a doctor requests patient summary, THE System SHALL verify JWT authentication token with doctor role
7. WHEN a doctor requests patient summary, THE System SHALL verify a valid QR scan event exists for that doctor and patient
8. WHEN QR validation is attempted, THE System SHALL rate limit to 10 requests per minute per IP address
9. WHEN any patient data access occurs, THE System SHALL log the event to CloudWatch with userId, action, and timestamp

### Requirement 16: Bedrock Integration and Prompt Management

**User Story:** As a system, I want to use AI effectively for medical analysis, so that I can provide accurate and helpful information to doctors.

#### Acceptance Criteria

1. WHEN invoking Bedrock for disease analysis, THE System SHALL use the amazon.nova-pro-v1:0 model
2. WHEN invoking Bedrock for disease analysis, THE System SHALL set max_tokens to 2000
3. WHEN invoking Bedrock for question generation, THE System SHALL set max_tokens to 1000
4. WHEN invoking Bedrock for disease refinement, THE System SHALL set max_tokens to 2000
5. WHEN invoking Bedrock for comprehensive analysis, THE System SHALL set max_tokens to 3000
6. WHEN Bedrock returns a response, THE System SHALL validate the response against expected JSON schema
7. WHEN Bedrock response validation fails, THE System SHALL log the invalid response and retry
8. WHEN Bedrock is invoked, THE System SHALL include system prompt and user prompt as specified in design
9. WHEN Bedrock prompts are constructed, THE System SHALL ensure no patient-identifiable information is included beyond medical data

### Requirement 17: Frontend User Interface

**User Story:** As a patient, I want an intuitive interface to provide symptoms and view my QR code, so that I can easily share my information with my doctor.

#### Acceptance Criteria

1. WHEN a patient navigates to diagnosis page, THE System SHALL display a form to input bodyPart, duration, severity, associatedFactors, timing, and character
2. WHEN a patient submits initial symptoms, THE System SHALL display a loading indicator while processing
3. WHEN questions are returned, THE System SHALL display them one at a time or as a group based on UI design
4. WHEN a question type is yes_no, THE System SHALL display Yes and No buttons
5. WHEN a question type is scale, THE System SHALL display a slider or number input from 1 to 10
6. WHEN a question type is multiple_choice, THE System SHALL display radio buttons or dropdown with options
7. WHEN a diagnosis session is completed, THE System SHALL display a success message without disease information
8. WHEN a patient navigates to their dashboard, THE System SHALL display a QR code if one has been generated
9. WHEN a QR code is displayed, THE System SHALL show the expiration time
10. WHEN a QR code has expired, THE System SHALL display a "Generate New QR Code" button

### Requirement 18: Doctor Interface

**User Story:** As a doctor, I want to scan patient QR codes and view comprehensive summaries, so that I can provide informed care.

#### Acceptance Criteria

1. WHEN a doctor navigates to QR scanner page, THE System SHALL activate device camera for scanning
2. WHEN a QR code is scanned successfully, THE System SHALL validate the token and navigate to patient summary
3. WHEN a QR code validation fails, THE System SHALL display an error message with reason
4. WHEN a patient summary is loaded, THE System SHALL display patient profile information
5. WHEN a patient summary is loaded, THE System SHALL display all diagnosis sessions with disease candidates and probabilities
6. WHEN a patient summary is loaded, THE System SHALL display red flags prominently at the top
7. WHEN a patient summary is loaded, THE System SHALL display AI comprehensive analysis with recommendations
8. WHEN a patient summary is loaded, THE System SHALL display all medical reports with clickable PDF links
9. WHEN a doctor clicks a report PDF link, THE System SHALL open the PDF in a new tab or viewer
10. WHEN a patient summary is loaded, THE System SHALL display treatment history if available

### Requirement 19: Monitoring and Logging

**User Story:** As a system administrator, I want comprehensive logging and monitoring, so that I can troubleshoot issues and ensure system health.

#### Acceptance Criteria

1. WHEN any Lambda function is invoked, THE System SHALL log the invocation to CloudWatch with timestamp and request details
2. WHEN an error occurs, THE System SHALL log the error to CloudWatch with stack trace and context
3. WHEN a diagnosis session is created, THE System SHALL log the event with patientId and sessionId
4. WHEN a QR code is scanned, THE System SHALL log the event with doctorId, patientId, and timestamp
5. WHEN Bedrock is invoked, THE System SHALL log the model used, token count, and latency
6. WHEN API Gateway receives requests, THE System SHALL log request method, path, status code, and latency
7. WHEN DynamoDB operations occur, THE System SHALL log operation type, table name, and latency
8. WHEN S3 operations occur, THE System SHALL log operation type, bucket name, key, and latency

### Requirement 20: Data Retention and Cleanup

**User Story:** As a system administrator, I want automatic cleanup of expired data, so that storage costs are optimized and stale data is removed.

#### Acceptance Criteria

1. WHEN a QR token expires, THE System SHALL automatically delete it from DynamoDB using TTL after 1 hour grace period
2. WHEN a diagnosis session is inactive for more than 7 days, THE System SHALL mark it as expired
3. WHEN a patient account is deleted, THE System SHALL delete all associated diagnosis sessions, QR tokens, and patient history
4. WHEN a patient account is deleted, THE System SHALL retain medical reports in S3 with archived status for regulatory compliance
5. WHEN CloudWatch logs are older than 30 days, THE System SHALL archive them to S3 for long-term storage

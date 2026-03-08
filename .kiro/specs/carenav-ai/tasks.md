# Implementation Plan: CareNav AI

## Overview

This implementation plan breaks down the CareNav AI system into discrete, actionable coding tasks. The system is an AI-powered OPD workflow optimization platform built on AWS serverless architecture using TypeScript for backend Lambda functions and React with TypeScript for the frontend.

The implementation follows an incremental approach, building core infrastructure first, then adding AI integration, frontend components, and finally advanced features like automated reminders and report processing.

## Tasks

- [x] 1. Set up project structure and AWS infrastructure foundation
  - Create project directory structure with separate folders for Lambda functions, frontend, and infrastructure code
  - Initialize TypeScript configuration for both backend and frontend
  - Set up AWS CDK project for infrastructure as code
  - Create DynamoDB single-table design with composite keys (PK, SK)
  - Configure S3 bucket for medical reports with encryption at rest
  - Set up API Gateway REST API with CORS configuration
  - Create IAM roles for Lambda execution with least privilege permissions
  - Configure AWS Secrets Manager for environment variables (JWT_SECRET, BEDROCK_MODEL_ID)
  - _Requirements: 12.1, 12.2, 15.1, 15.2, 15.3_

- [x] 2. Implement authentication and session management
  - [x] 2.1 Create User and Session data models for DynamoDB
    - Define TypeScript interfaces for User and Session entities
    - Implement DynamoDB schema with PK/SK patterns for users and sessions
    - Create email secondary index for user lookup
    - _Requirements: 10.1, 10.2, 12.1_

  - [x] 2.2 Implement Auth Lambda handler
    - Create Lambda function for login endpoint with bcrypt password verification
    - Implement JWT token generation with 24-hour expiration
    - Create session storage in DynamoDB with expiration tracking
    - Implement logout endpoint with session invalidation
    - Add error handling for invalid credentials
    - _Requirements: 10.1, 10.2, 10.3, 10.5_

  - [x] 2.3 Create API Gateway Lambda authorizer
    - Implement JWT verification middleware
    - Add session validation against DynamoDB
    - Generate IAM policy for authorized requests
    - Include userId and role in request context
    - _Requirements: 10.1, 10.4, 10.6_

  - [ ]* 2.4 Write unit tests for authentication
    - Test JWT token generation and validation
    - Test session creation and expiration
    - Test invalid credential handling
    - Test role-based access control
    - _Requirements: 10.1, 10.2, 10.4_

- [x] 3. Implement patient registration module
  - [x] 3.1 Create Patient data model and DynamoDB operations
    - Define TypeScript interface for Patient entity
    - Implement DynamoDB put operation for patient registration
    - Add UUID generation for patient IDs
    - _Requirements: 1.1, 1.2, 12.1_

  - [x] 3.2 Create patient registration Lambda function
    - Implement POST /api/patients/register endpoint handler
    - Add validation for required fields (name, age, gender, contact)
    - Store patient data in DynamoDB with timestamps
    - Return patient ID and privacy notice in response
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ]* 3.3 Write unit tests for patient registration
    - Test validation of required fields
    - Test successful registration flow
    - Test duplicate registration handling
    - _Requirements: 1.1, 1.2_

- [x] 4. Implement Amazon Bedrock integration foundation
  - [x] 4.1 Create Bedrock client wrapper module
    - Initialize AWS SDK v3 Bedrock Runtime client
    - Implement Converse API wrapper with error handling
    - Add retry logic with exponential backoff (3 retries)
    - Create response validation against expected JSON schemas
    - Add timeout configuration (5 seconds)
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

  - [x] 4.2 Implement prompt template system
    - Create TypeScript interfaces for prompt templates
    - Implement symptom extraction prompt template
    - Implement follow-up question generation prompt template
    - Implement department recommendation prompt template
    - Implement report summarization prompt template
    - Implement treatment schedule generation prompt template
    - _Requirements: 11.1, 11.2_

  - [ ]* 4.3 Write unit tests for Bedrock integration
    - Test Bedrock client initialization
    - Test retry logic with mock failures
    - Test response validation
    - Test timeout handling
    - _Requirements: 11.3, 11.4, 11.5_

- [x] 5. Checkpoint - Verify infrastructure and authentication
  - Ensure all tests pass, verify AWS resources are deployed correctly, ask the user if questions arise.

- [x] 6. Implement symptom input and extraction module
  - [x] 6.1 Create Symptom data model and DynamoDB operations
    - Define TypeScript interface for Symptom entity with structured fields
    - Implement DynamoDB put and get operations for symptoms
    - Add support for storing raw text and structured symptom data
    - _Requirements: 2.1, 2.2, 2.5, 12.1_

  - [x] 6.2 Create Symptom Processor Lambda function
    - Implement POST /api/symptoms/input endpoint handler
    - Add text input processing (accept up to 2000 characters)
    - Integrate Bedrock for symptom extraction using structured prompt
    - Parse Bedrock response into structured format (bodyPart, duration, severity, associatedFactors)
    - Store symptom data in DynamoDB with patient association
    - Return structured symptoms and symptom ID
    - _Requirements: 2.1, 2.2, 2.4, 2.5, 2.6_

  - [x] 6.3 Add Amazon Transcribe integration for voice input (optional)
    - Implement voice-to-text conversion using Amazon Transcribe
    - Handle audio file upload to temporary S3 bucket
    - Process transcription results and extract text
    - Integrate transcribed text into symptom processing flow
    - _Requirements: 2.3, 2.4_

  - [ ]* 6.4 Write unit tests for symptom processing
    - Test symptom text validation
    - Test Bedrock integration for extraction
    - Test structured data parsing
    - Test DynamoDB storage
    - _Requirements: 2.2, 2.4, 2.5_

- [x] 7. Implement AI follow-up clarification module
  - [x] 7.1 Create follow-up question generation Lambda function
    - Implement POST /api/symptoms/followup endpoint handler
    - Retrieve structured symptoms from DynamoDB
    - Call Bedrock with follow-up generation prompt
    - Parse response to extract 3-5 questions
    - Store questions in DynamoDB linked to symptom record
    - Return questions array with IDs and text
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 7.2 Create follow-up answer submission endpoint
    - Implement POST /api/symptoms/followup/answer endpoint handler
    - Validate question ID and answer
    - Update symptom record in DynamoDB with follow-up answers
    - Return updated symptom summary
    - _Requirements: 3.4, 3.5_

  - [ ]* 7.3 Write unit tests for follow-up questions
    - Test question generation from symptoms
    - Test answer storage and symptom updates
    - Test optional question skipping
    - _Requirements: 3.1, 3.4, 3.5_

- [x] 8. Implement care navigation (non-diagnostic) module
  - [x] 8.1 Create Care Navigation Lambda function
    - Implement POST /api/navigation/recommend endpoint handler
    - Retrieve symptom data and follow-up answers from DynamoDB
    - Call Bedrock with department recommendation prompt
    - Parse response for department, urgency level, and reasoning
    - Add mandatory disclaimer text to response
    - Add emergency services message for emergency urgency
    - Store navigation recommendation in DynamoDB
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.6_

  - [x] 8.2 Implement urgency classification logic
    - Validate urgency level (routine, urgent, emergency)
    - Add emergency services contact information for emergency cases
    - Ensure no disease names appear in reasoning
    - _Requirements: 4.2, 4.3, 4.4, 4.5_

  - [ ]* 8.3 Write unit tests for care navigation
    - Test department recommendation generation
    - Test urgency classification
    - Test disclaimer inclusion
    - Test emergency message display
    - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [x] 9. Checkpoint - Verify patient-facing symptom flow
  - Ensure all tests pass, verify end-to-end symptom input to care navigation works, ask the user if questions arise.

- [x] 10. Implement medical report upload and processing module
  - [x] 10.1 Create Report data model and S3 operations
    - Define TypeScript interface for Report entity
    - Implement S3 upload with patient-specific prefix structure
    - Add file validation (size limit 10MB, formats: PDF, JPEG, PNG)
    - Configure server-side encryption for uploaded files
    - _Requirements: 5.1, 5.2, 5.3, 12.2_

  - [x] 10.2 Create Report Processor Lambda function
    - Implement POST /api/reports/upload endpoint handler
    - Handle file upload to S3 bucket
    - Trigger Amazon Textract for text extraction from documents
    - Call Bedrock with report summarization prompt
    - Parse summary into structured format (keyFindings, dates, diagnoses, medications)
    - Store report metadata and summary in DynamoDB
    - _Requirements: 5.3, 5.4, 5.5, 5.6_

  - [x] 10.3 Implement medical timeline generation
    - Query all patient reports from DynamoDB
    - Sort reports chronologically by date
    - Generate structured medical timeline
    - Return portable summary format
    - _Requirements: 5.7, 5.9_

  - [x] 10.4 Add error handling for OCR failures
    - Implement fallback for Textract failures
    - Display "Manual review needed" message when processing fails
    - Log errors for debugging
    - _Requirements: 5.8, 14.1, 14.2_

  - [ ]* 10.5 Write unit tests for report processing
    - Test file validation
    - Test S3 upload
    - Test Textract integration
    - Test summary generation
    - Test timeline creation
    - _Requirements: 5.1, 5.2, 5.4, 5.5, 5.7_

- [x] 11. Implement red flag highlighting module
  - [x] 11.1 Create red flag detection logic
    - Define list of red flag keywords (allergy, chronic, diabetes, hypertension, etc.)
    - Implement keyword scanning in patient data and reports
    - Extract and highlight detected red flags
    - _Requirements: 6.1, 6.2_

  - [x] 11.2 Integrate red flags into patient summary display
    - Add "Critical Information" section to patient data structure
    - Display red flags with visual emphasis (badges/icons)
    - Order red flags by detection sequence
    - Add automated highlighting disclaimer
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ]* 11.3 Write unit tests for red flag detection
    - Test keyword detection
    - Test multiple red flag handling
    - Test red flag ordering
    - _Requirements: 6.1, 6.2, 6.5_

- [x] 12. Implement doctor treatment planner module
  - [x] 12.1 Create Treatment Plan data model
    - Define TypeScript interfaces for Prescription and Treatment Plan entities
    - Implement DynamoDB operations for treatment plans
    - Add support for multiple prescriptions per plan
    - _Requirements: 7.1, 7.2, 12.1_

  - [x] 12.2 Create Treatment Planner Lambda function
    - Implement POST /api/treatment/create endpoint handler
    - Validate medicine name and dosage are non-empty
    - Call Bedrock with schedule generation prompt
    - Parse frequency to determine specific dose times
    - Calculate stop date based on duration
    - Store treatment plan in DynamoDB
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 12.3 Implement frequency parsing logic
    - Create mapping from frequency strings to time arrays
    - Support "once daily", "twice daily", "three times daily", "every N hours"
    - Generate 24-hour format times (HH:MM)
    - _Requirements: 7.3, 7.4_

  - [x] 12.4 Integrate EventBridge for automated reminders
    - Create EventBridge scheduled rules for each dose time
    - Configure cron expressions from dose times
    - Set Lambda target for reminder processing
    - Pass medicine details in event payload
    - _Requirements: 7.6, 7.7, 7.10_

  - [ ]* 12.5 Write unit tests for treatment planner
    - Test prescription validation
    - Test frequency parsing
    - Test stop date calculation
    - Test schedule generation
    - _Requirements: 7.2, 7.3, 7.4_

- [x] 13. Implement medication reminder processing
  - [x] 13.1 Create Reminder Processor Lambda function
    - Implement EventBridge event handler
    - Check if current date exceeds stop date
    - Mark dose as "due" in DynamoDB
    - Record reminder event with timestamp
    - Disable EventBridge rule when treatment completes
    - _Requirements: 7.7, 7.8, 7.10_

  - [x] 13.2 Create dose tracking data model
    - Define TypeScript interface for Dose entity
    - Implement DynamoDB operations for dose records
    - Support dose status (pending, due, taken, missed)
    - _Requirements: 7.8, 8.3_

  - [ ]* 13.3 Write unit tests for reminder processing
    - Test dose marking logic
    - Test stop date checking
    - Test EventBridge rule disabling
    - _Requirements: 7.7, 7.8, 7.10_

- [x] 14. Checkpoint - Verify treatment planner and reminders
  - Ensure all tests pass, verify EventBridge rules are created correctly, test reminder triggering, ask the user if questions arise.

- [x] 15. Implement patient treatment schedule display
  - [x] 15.1 Create treatment schedule retrieval endpoint
    - Implement GET /api/treatment/schedule/:patientId endpoint handler
    - Query active treatment plans from DynamoDB
    - Filter medicines where current date < stop date
    - Generate today's dose schedule with status
    - Group medicines by time of day
    - _Requirements: 8.1, 8.2, 8.4, 8.5_

  - [x] 15.2 Create dose marking endpoint
    - Implement POST /api/treatment/mark-taken endpoint handler
    - Validate patient ID, medicine ID, and dose time
    - Update dose status to "taken" in DynamoDB
    - Record timestamp of when dose was taken
    - _Requirements: 8.3_

  - [ ]* 15.3 Write unit tests for schedule display
    - Test active medicine filtering
    - Test dose status calculation
    - Test time-of-day grouping
    - Test dose marking
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 16. Implement adherence tracking dashboard
  - [x] 16.1 Create adherence calculation logic
    - Query all dose records for each patient
    - Calculate adherence percentage: (doses taken / doses scheduled) × 100
    - Identify patients with adherence < 80%
    - Generate adherence trends over time (daily, weekly)
    - _Requirements: 9.2, 9.3, 9.5_

  - [x] 16.2 Create adherence dashboard endpoint
    - Implement GET /api/adherence/:patientId endpoint handler (doctor role only)
    - Return list of patients with adherence metrics
    - Include warning indicators for low adherence
    - Show missed dose details
    - _Requirements: 9.1, 9.2, 9.3, 9.6_

  - [x] 16.3 Generate treatment completion summaries
    - Calculate total adherence rate for completed treatments
    - Store completion summary in DynamoDB
    - _Requirements: 9.4_

  - [ ]* 16.4 Write unit tests for adherence tracking
    - Test adherence calculation
    - Test low adherence flagging
    - Test trend generation
    - _Requirements: 9.2, 9.3, 9.5_

- [x] 17. Implement React frontend foundation
  - [x] 17.1 Set up React project with TypeScript and Vite
    - Initialize React 18+ project with TypeScript
    - Configure Vite for fast builds
    - Set up Tailwind CSS for styling
    - Install Axios for HTTP client
    - Configure environment variables for API Gateway URL
    - _Requirements: 15.1, 15.2_

  - [x] 17.2 Create authentication context and components
    - Implement React Context for auth state management
    - Create login component with email/password form
    - Create logout functionality
    - Add JWT token storage in localStorage
    - Implement Axios interceptors for JWT headers
    - _Requirements: 10.1, 10.2, 10.5_

  - [x] 17.3 Create protected route wrapper
    - Implement route protection based on auth state
    - Add role-based access control (patient vs doctor)
    - Redirect to login for unauthenticated users
    - _Requirements: 10.4, 10.6_

- [x] 18. Implement patient-facing frontend components
  - [x] 18.1 Create patient registration component
    - Build registration form with name, age, gender, contact fields
    - Add form validation for required fields
    - Display privacy notice and demo data warning
    - Add placeholder "Scan ID (Demo Only)" button
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 18.2 Create symptom input component
    - Build text input interface with 2000 character limit
    - Add voice input button (optional, can be placeholder)
    - Display structured symptom summary for confirmation
    - Show loading state during AI processing
    - _Requirements: 2.1, 2.2, 2.3, 2.6_

  - [x] 18.3 Create follow-up questions component
    - Display AI-generated questions one at a time or as list
    - Add text input for answers
    - Allow skipping questions
    - Show updated symptom summary after answers
    - _Requirements: 3.2, 3.3, 3.4, 3.5_

  - [x] 18.4 Create care navigation display component
    - Display recommended department prominently
    - Show urgency level with appropriate visual styling
    - Display reasoning based on symptom patterns
    - Show mandatory disclaimer on every screen
    - Display emergency services message for emergency urgency
    - _Requirements: 4.2, 4.3, 4.5, 4.6_

  - [x] 18.5 Create medical report upload component
    - Build file upload interface with drag-and-drop
    - Validate file size (max 10MB) and format (PDF, JPEG, PNG)
    - Display upload progress
    - Show extracted summary and timeline
    - _Requirements: 5.1, 5.2, 5.7, 5.9_

  - [x] 18.6 Create treatment schedule display component
    - Display active medicines grouped by time of day
    - Show today's doses with status indicators
    - Add "Mark as Taken" button for each dose
    - Display special instructions prominently
    - Show completed treatments separately
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 19. Implement doctor-facing frontend components
  - [x] 19.1 Create treatment planner component
    - Build prescription form with medicine name, dosage, frequency, duration fields
    - Add validation for required fields
    - Display generated schedule preview
    - Show confirmation after treatment plan creation
    - _Requirements: 7.1, 7.2, 7.5, 7.9_

  - [x] 19.2 Create patient summary view with red flags
    - Display patient information with critical information section at top
    - Highlight red flags with visual emphasis (red badges)
    - Show medical timeline from uploaded reports
    - Add automated highlighting disclaimer
    - _Requirements: 6.2, 6.3, 6.4, 6.6_

  - [x] 19.3 Create adherence dashboard component
    - Display list of patients with adherence percentages
    - Show warning indicators for adherence < 80%
    - Display adherence trends over time
    - Show missed dose details
    - _Requirements: 9.1, 9.2, 9.3, 9.5, 9.6_

- [ ] 20. Add error handling and user feedback
  - [-] 20.1 Implement global error boundary
    - Create React error boundary component
    - Display user-friendly error messages
    - Log errors to console for debugging
    - _Requirements: 14.1, 14.2_

  - [ ] 20.2 Add loading states and spinners
    - Implement loading indicators for all async operations
    - Add skeleton screens for data fetching
    - Show progress bars for file uploads
    - _Requirements: 13.1_

  - [ ] 20.3 Implement error message display
    - Show specific error messages for different failure types
    - Display "AI service temporarily unavailable" for Bedrock failures
    - Show file validation errors clearly
    - _Requirements: 14.1, 14.3, 14.4, 14.5_

- [ ] 21. Add disclaimers and consent management
  - [ ] 21.1 Create disclaimer components
    - Implement reusable disclaimer component
    - Add "DEMO DATA ONLY" watermark to all data entry screens
    - Display medical advice disclaimer on AI outputs
    - Show emergency services disclaimer for urgent cases
    - _Requirements: 1.3, 4.3, 4.5, 12.3_

  - [ ] 21.2 Add consent checkboxes
    - Create consent form for registration
    - Add checkboxes for demo data acknowledgment
    - Require consent before allowing system use
    - _Requirements: 12.3_

- [ ] 22. Implement logging and monitoring
  - [ ] 22.1 Configure CloudWatch logging for all Lambda functions
    - Add structured logging with timestamps
    - Log all Bedrock API calls with request/response metadata
    - Log errors with stack traces
    - _Requirements: 12.5, 14.2_

  - [ ] 22.2 Set up CloudWatch metrics and alarms
    - Create custom metrics for Lambda duration and errors
    - Set up alarms for error rates > 5%
    - Monitor DynamoDB throttling events
    - Track Bedrock API latency
    - _Requirements: 13.1, 13.2_

- [ ] 23. Implement data privacy and security measures
  - [ ] 23.1 Enable encryption at rest
    - Configure DynamoDB encryption with AWS KMS
    - Enable S3 server-side encryption
    - _Requirements: 12.2_

  - [ ] 23.2 Configure HTTPS and TLS
    - Ensure API Gateway enforces TLS 1.2+
    - Configure CloudFront SSL certificates for frontend
    - _Requirements: 12.2_

  - [ ] 23.3 Implement data retention policy
    - Create S3 lifecycle policy to delete demo data after 30 days
    - Implement account deletion with data cleanup
    - _Requirements: 12.3, 12.4_

- [ ] 24. Checkpoint - End-to-end testing and integration
  - Ensure all tests pass, verify complete patient and doctor workflows, test error handling, ask the user if questions arise.

- [ ] 25. Create demo data and testing utilities
  - [ ] 25.1 Generate synthetic demo data
    - Create sample patients with realistic Indian names
    - Generate sample symptoms and medical histories
    - Create sample prescriptions and treatment plans
    - _Requirements: 12.3_

  - [ ] 25.2 Create data seeding script
    - Implement script to populate DynamoDB with demo data
    - Add sample users (patients and doctors)
    - Create sample sessions for testing
    - _Requirements: 12.3_

- [ ] 26. Deploy infrastructure and application
  - [ ] 26.1 Deploy AWS infrastructure using CDK
    - Run CDK bootstrap for Mumbai region (ap-south-1)
    - Deploy all CDK stacks (API, data, storage, monitoring)
    - Verify all AWS resources are created correctly
    - _Requirements: 15.1, 15.2, 15.5, 15.7_

  - [ ] 26.2 Deploy Lambda functions
    - Build and package all Lambda functions
    - Deploy functions to AWS Lambda
    - Configure environment variables from Secrets Manager
    - _Requirements: 15.1, 15.2_

  - [ ] 26.3 Deploy frontend to AWS Amplify or S3 + CloudFront
    - Build React application for production
    - Deploy to AWS Amplify or upload to S3
    - Configure CloudFront distribution if using S3
    - Set up custom domain (optional)
    - _Requirements: 15.3_

- [ ] 27. Final testing and demo preparation
  - [ ] 27.1 Perform end-to-end testing in deployed environment
    - Test complete patient symptom flow
    - Test doctor treatment planner flow
    - Test report upload and processing
    - Verify automated reminders trigger correctly
    - _Requirements: All requirements_

  - [ ] 27.2 Create demo script and documentation
    - Write step-by-step demo walkthrough
    - Document API endpoints and usage
    - Create README with setup instructions
    - Prepare demo video (optional)
    - _Requirements: 15.4_

  - [ ] 27.3 Performance and scalability verification
    - Test system under concurrent user load
    - Verify response times meet 5-second requirement
    - Check DynamoDB auto-scaling behavior
    - Monitor Lambda cold starts
    - _Requirements: 13.1, 13.2, 13.3_

- [ ] 28. Final checkpoint - Production readiness
  - Ensure all features work correctly, verify all disclaimers are displayed, confirm demo data is loaded, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- The implementation uses TypeScript for both backend (Lambda) and frontend (React)
- AWS Mumbai region (ap-south-1) is the primary deployment target
- All AI processing uses Amazon Bedrock with Claude 3 Sonnet or Haiku models
- The system is designed for hackathon demonstration with synthetic demo data only
- Checkpoints are included at logical breaks to verify progress and catch issues early
- Voice input (Transcribe) and advanced OCR features can be implemented as placeholders if time is limited
- Focus on core patient symptom flow and treatment planner for MVP, then add advanced features

# Requirements Document: CareNav AI

## Product Overview

### Problem Statement

Indian healthcare OPDs face critical workflow inefficiencies:

- **Unstructured Patient Communication**: Patients struggle to articulate symptoms clearly, leading to incomplete intake and misrouted consultations
- **Department Misdirection**: First-time patients waste time in wrong departments due to unclear symptom-to-specialty mapping
- **Time-Consuming Intake**: Manual symptom documentation creates bottlenecks in high-volume OPD settings
- **Poor Medication Adherence**: Complex prescription schedules lead to treatment non-compliance and poor health outcomes
- **Fragmented Medical History**: Patients lack portable, structured summaries of their medical records across providers
- **Delayed Critical Detection**: Important medical red flags (allergies, chronic conditions) buried in unstructured notes

These inefficiencies result in longer wait times, suboptimal care routing, and reduced treatment effectiveness—particularly in Tier-2 and Tier-3 healthcare facilities.

### Target Users

**Primary Users:**
- **Patients**: Individuals seeking OPD consultations who need help structuring symptoms and managing treatment plans
- **Doctors**: Healthcare providers requiring structured patient intake data and efficient prescription communication

**Secondary Users:**
- **Hospital Administration**: OPD managers seeking workflow optimization and reduced patient wait times

### Value Proposition

CareNav AI delivers measurable improvements to healthcare workflows:

- **For Patients**: Reduced intake time, clearer symptom communication, appropriate department routing, simplified medication schedules, portable medical history
- **For Doctors**: Structured patient data, reduced intake burden, efficient prescription-to-schedule conversion, better treatment adherence
- **For Hospitals**: Optimized OPD flow, reduced misdirection, improved patient satisfaction, scalable intake process

**Critical Boundaries**: The system does NOT diagnose diseases, does NOT prescribe or modify medications, and does NOT replace clinical judgment. It functions strictly as a workflow assistant and care navigator.

## Glossary

- **System**: The CareNav AI application
- **Patient**: A user registering symptoms or managing treatment plans
- **Doctor**: A healthcare provider entering treatment plans and viewing patient summaries
- **Symptom_Summary**: Structured extraction of patient-reported symptoms in JSON format
- **Care_Navigation**: Department recommendation based on symptom patterns (not diagnosis)
- **Treatment_Planner**: Module that converts doctor prescriptions into patient schedules with automated reminders
- **Medical_Report**: Uploaded document (PDF/image) containing prior medical information
- **Follow_Up_Question**: AI-generated clarification question based on initial symptom input
- **Department_Recommendation**: Suggested medical specialty without disease diagnosis
- **Medicine_Schedule**: Time-based checklist derived from doctor prescription with EventBridge-triggered reminders
- **Urgency_Level**: Classification of care timing (routine, urgent, emergency)
- **Disclaimer**: Mandatory notice that system does not diagnose or prescribe
- **Demo_Data**: Synthetic patient information for demonstration purposes
- **Session**: Time-bound user interaction with JWT-based authentication
- **Red_Flag**: Critical patient information (allergy, chronic condition) automatically highlighted for doctor awareness
- **Adherence_Rate**: Percentage of scheduled medication doses taken by patient
- **Medical_Timeline**: Chronological structured summary of patient's medical history from uploaded reports
- **EventBridge_Rule**: AWS scheduled event trigger for medication reminders
- **Lambda_Function**: Serverless function processing reminder logic

## Requirements

### Requirement 1: Patient Registration

**User Story:** As a patient, I want to register my basic information, so that the system can personalize my care navigation experience.

#### Acceptance Criteria

1. WHEN a patient accesses the registration form, THE System SHALL display fields for name, age, gender, and contact information
2. WHEN a patient submits registration data, THE System SHALL validate that all required fields contain non-empty values
3. WHEN registration is complete, THE System SHALL display a privacy notice stating that only demo data should be entered
4. WHERE demo ID scanning is enabled, THE System SHALL provide a placeholder button labeled "Scan ID (Demo Only)"
5. WHEN a patient clicks the demo ID scan button, THE System SHALL display a message indicating this is a placeholder feature

### Requirement 2: Symptom Input Module

**User Story:** As a patient, I want to describe my symptoms in natural language, so that I can communicate my health concerns without medical terminology.

#### Acceptance Criteria

1. WHEN a patient accesses the symptom input interface, THE System SHALL provide both text input and voice-to-text options
2. WHEN a patient enters symptom text, THE System SHALL accept input of at least 2000 characters
3. WHEN a patient uses voice input, THE System SHALL convert speech to text using Amazon Transcribe
4. WHEN symptom input is submitted, THE System SHALL send the text to Amazon Bedrock for processing within 5 seconds
5. WHEN Amazon Bedrock returns results, THE System SHALL extract structured symptom data including body part, duration, severity, and associated factors
6. WHEN symptom extraction completes, THE System SHALL display the Symptom_Summary to the patient for confirmation

### Requirement 3: AI Follow-Up Clarification

**User Story:** As a patient, I want the system to ask relevant follow-up questions, so that I can provide complete symptom information.

#### Acceptance Criteria

1. WHEN a Symptom_Summary is generated, THE System SHALL use Amazon Bedrock to generate between 3 and 5 Follow_Up_Questions
2. WHEN Follow_Up_Questions are displayed, THE System SHALL present them one at a time or as a list
3. WHEN a patient answers a Follow_Up_Question, THE System SHALL record the response in structured format
4. WHEN all Follow_Up_Questions are answered, THE System SHALL update the Symptom_Summary with new information
5. IF a patient skips a Follow_Up_Question, THEN THE System SHALL proceed without requiring an answer

### Requirement 4: Care Navigation (Non-Diagnostic)

**User Story:** As a patient, I want department recommendations based on my symptoms, so that I can seek appropriate medical care without self-diagnosing.

#### Acceptance Criteria

1. WHEN a complete Symptom_Summary exists, THE System SHALL generate a Department_Recommendation using Amazon Bedrock
2. WHEN generating Department_Recommendation, THE System SHALL classify Urgency_Level as routine, urgent, or emergency
3. WHEN displaying Department_Recommendation, THE System SHALL show the Disclaimer stating "This is not a diagnosis. Consult a healthcare provider for medical advice."
4. THE System SHALL NOT display disease names or diagnostic conclusions
5. WHEN Urgency_Level is emergency, THE System SHALL display a prominent message to call emergency services
6. WHEN Department_Recommendation is displayed, THE System SHALL include reasoning based on symptom patterns without naming diseases

### Requirement 5: Medical Report Upload and Structured History

**User Story:** As a patient, I want to upload previous medical reports and have them converted into a structured timeline, so that doctors can quickly understand my medical history.

#### Acceptance Criteria

1. WHEN a patient accesses the report upload interface, THE System SHALL accept PDF and image file formats (JPEG, PNG)
2. WHEN a file is uploaded, THE System SHALL validate that file size does not exceed 10MB
3. WHEN a file is uploaded, THE System SHALL store it in Amazon S3 with patient-specific prefix and encryption at rest
4. WHEN a file is stored in S3, THE System SHALL trigger Amazon Textract to extract text from the document
5. WHEN Textract completes extraction, THE System SHALL send extracted text to Amazon Bedrock for structured summarization
6. WHEN Bedrock generates a summary, THE System SHALL extract key findings, dates, diagnoses, and medications into structured format
7. WHEN multiple reports exist, THE System SHALL generate a chronological medical timeline
8. IF Textract or Bedrock processing fails, THEN THE System SHALL store the file and display "Manual review needed" message
9. WHEN displaying medical history, THE System SHALL present it as a portable structured summary suitable for sharing with new providers

### Requirement 6: Red Flag Highlighting Module

**User Story:** As a doctor, I want critical patient information (allergies, chronic conditions, high-risk factors) highlighted automatically, so that I can quickly identify important medical context.

#### Acceptance Criteria

1. WHEN patient data is processed, THE System SHALL scan for predefined red flag keywords including: "allergy", "allergic", "chronic", "diabetes", "hypertension", "heart disease", "asthma", "seizure", "pregnant", "breastfeeding"
2. WHEN a red flag keyword is detected, THE System SHALL highlight it in the patient summary with visual emphasis (red badge or icon)
3. WHEN displaying patient information to doctors, THE System SHALL show red flags in a dedicated "Critical Information" section at the top
4. THE System SHALL NOT make clinical judgments about red flags—it only highlights for doctor awareness
5. WHEN multiple red flags exist, THE System SHALL list them in order of detection
6. THE System SHALL include a disclaimer: "Automated highlighting only—verify all information clinically"

### Requirement 7: Doctor-Guided Treatment Planner

**User Story:** As a doctor, I want to enter prescription details that convert into patient-friendly schedules with automated reminders, so that patients understand and follow treatment plans.

#### Acceptance Criteria

1. WHEN a doctor accesses the treatment planner, THE System SHALL provide fields for medicine name, dosage, frequency, duration, and special instructions
2. WHEN a doctor submits a prescription, THE System SHALL validate that medicine name and dosage are non-empty
3. WHEN prescription data is submitted, THE System SHALL use Amazon Bedrock to generate a Medicine_Schedule with specific times based on frequency
4. WHEN duration is specified, THE System SHALL calculate and display an automatic stop date
5. WHEN a Medicine_Schedule is generated, THE System SHALL create a checklist format for patient tracking
6. WHEN a treatment plan is created, THE System SHALL configure Amazon EventBridge scheduled rules for each dose time
7. WHEN a dose time arrives, THE System SHALL trigger an AWS Lambda function to process the reminder
8. WHEN the Lambda function executes, THE System SHALL record the reminder event in DynamoDB and mark the dose as "due"
9. WHEN special instructions exist, THE System SHALL display them prominently with each scheduled dose
10. WHEN a medicine reaches its stop date, THE System SHALL automatically disable the EventBridge rule for that medicine

### Requirement 8: Treatment Schedule Display and Adherence Tracking

**User Story:** As a patient, I want to view my medicine schedule in a simple format, so that I can follow my treatment plan correctly.

#### Acceptance Criteria

1. WHEN a patient accesses their treatment schedule, THE System SHALL display all active medicines with today's doses highlighted
2. WHEN a dose time arrives, THE System SHALL mark it as due in the interface
3. WHEN a patient marks a dose as taken, THE System SHALL record the timestamp and update the checklist
4. WHEN a medicine reaches its stop date, THE System SHALL move it to completed treatments
5. WHEN displaying the schedule, THE System SHALL group medicines by time of day (morning, afternoon, evening, night)

### Requirement 9: Adherence Tracking Dashboard

**User Story:** As a doctor, I want to view patient medication adherence metrics, so that I can identify non-compliance and intervene appropriately.

#### Acceptance Criteria

1. WHEN a doctor accesses the adherence dashboard, THE System SHALL display a list of patients with active treatment plans
2. FOR each patient, THE System SHALL calculate adherence percentage as (doses taken / doses scheduled) × 100
3. WHEN adherence falls below 80%, THE System SHALL flag the patient with a warning indicator
4. WHEN a treatment course completes, THE System SHALL generate a completion summary showing total adherence rate
5. WHEN displaying adherence data, THE System SHALL show trends over time (daily, weekly)
6. THE System SHALL allow doctors to view which specific doses were missed and when

### Requirement 10: Session Management and Authentication

**User Story:** As a user, I want secure access to my information, so that my health data remains private.

#### Acceptance Criteria

1. WHEN a user attempts to access protected features, THE System SHALL require authentication
2. WHEN a user logs in, THE System SHALL create a Session with expiration time
3. WHILE a Session is active, THE System SHALL allow access to user-specific data
4. WHEN a Session expires, THE System SHALL redirect the user to the login page
5. WHEN a user logs out, THE System SHALL invalidate the Session immediately
6. THE System SHALL implement role-based access where doctors can access treatment planner and patients can access symptom input

### Requirement 11: AI Service Integration with Amazon Bedrock

**User Story:** As a system administrator, I want reliable AI service integration, so that the application functions consistently.

#### Acceptance Criteria

1. WHEN the System needs AI processing, THE System SHALL send requests to Amazon Bedrock using the Converse API
2. WHEN an AI request is sent, THE System SHALL include structured prompts with clear instructions
3. IF an Amazon Bedrock request fails, THEN THE System SHALL retry up to 3 times with exponential backoff
4. IF all Bedrock retries fail, THEN THE System SHALL display a user-friendly error message and log the failure
5. WHEN Bedrock responses are received, THE System SHALL validate the response format before processing
6. THE System SHALL complete AI-dependent operations within 5 seconds for 95% of requests

### Requirement 12: Data Storage and Privacy

**User Story:** As a system administrator, I want secure data storage with privacy controls, so that demo data is properly managed.

#### Acceptance Criteria

1. WHEN user data is stored, THE System SHALL use Amazon DynamoDB or Amazon RDS
2. WHEN storing sensitive fields, THE System SHALL apply encryption at rest using AWS KMS
3. THE System SHALL display a notice on every data entry screen stating "Demo data only - do not enter real medical information"
4. WHEN a user account is deleted, THE System SHALL remove all associated data within 24 hours
5. THE System SHALL log all data access events to Amazon CloudWatch with timestamps and user identifiers
6. THE System SHALL NOT integrate with real Electronic Medical Record systems

### Requirement 13: Performance and Scalability for Bharat Context

**User Story:** As a system administrator, I want the application to perform reliably under load, so that users have a smooth experience.

#### Acceptance Criteria

1. WHEN a user submits a request, THE System SHALL respond within 5 seconds for 95% of operations
2. WHEN multiple users access the system concurrently, THE System SHALL maintain response times without degradation up to 100 concurrent users
3. THE System SHALL implement stateless serverless backend architecture using AWS Lambda to enable automatic scaling
4. WHEN AI service load increases, THE System SHALL queue requests rather than rejecting them
5. THE System SHALL cache frequently accessed data to reduce database queries
6. THE System SHALL be designed for deployment in Indian AWS regions (Mumbai ap-south-1) for optimal latency
7. THE System SHALL support future multilingual extension (Hindi, Tamil, Telugu, Bengali) through modular prompt design
8. THE System SHALL operate efficiently in Tier-2 and Tier-3 hospital environments with standard internet connectivity

### Requirement 14: Error Handling and Reliability

**User Story:** As a user, I want clear error messages when something goes wrong, so that I understand what action to take.

#### Acceptance Criteria

1. WHEN an error occurs, THE System SHALL display a user-friendly message without technical jargon
2. WHEN a critical error occurs, THE System SHALL log detailed error information for debugging
3. IF an AI service is unavailable, THEN THE System SHALL display "AI service temporarily unavailable. Please try again in a few minutes."
4. WHEN a file upload fails, THE System SHALL indicate whether the issue is file size, format, or network
5. THE System SHALL maintain functionality for non-AI features when AI service is degraded

### Requirement 15: Deployment and Configuration

**User Story:** As a developer, I want the application to be easily deployable, so that it can be demonstrated at hackathons.

#### Acceptance Criteria

1. THE System SHALL be containerizable using Docker and deployable to AWS Lambda with API Gateway or Amazon ECS Fargate
2. THE System SHALL use AWS Secrets Manager or environment variables for all configuration including AWS credentials and database connections
3. WHEN deployed to AWS, THE System SHALL use AWS Amplify for frontend hosting or Amazon S3 with Amazon CloudFront CDN
4. THE System SHALL include a README with setup instructions that can be completed in under 30 minutes
5. THE System SHALL provide sample environment configuration files with AWS service endpoints
6. THE System SHALL use AWS CDK or CloudFormation templates for infrastructure-as-code deployment (optional for hackathon)
7. THE System SHALL be deployable in AWS Mumbai region (ap-south-1) for optimal Indian user latency

## Assumptions and Constraints

1. All data used in the system is synthetic demonstration data—no real patient information
2. The system does not integrate with real Electronic Medical Record (EMR) systems or national health registries
3. The system is not intended for actual medical use or clinical decision-making
4. Development must be completable within a hackathon timeframe (24-48 hours)
5. AWS services (Bedrock, Transcribe, Textract, S3, DynamoDB, Lambda, EventBridge, API Gateway) are available and accessible
6. AWS account with appropriate IAM permissions and service quotas is configured
7. Users have modern web browsers with JavaScript enabled
8. Internet connectivity is available for AWS cloud services
9. The system targets Indian healthcare context (OPD workflows, Tier-2/Tier-3 hospitals)
10. Multilingual support (Hindi, Tamil, Telugu, Bengali) is designed for future extension but not required for hackathon MVP
11. Amazon Bedrock Claude 3 Sonnet or Haiku model is available in the deployment region
12. The system operates in AWS Mumbai region (ap-south-1) for optimal latency

## Out of Scope

The following are explicitly excluded from this system:

1. Disease diagnosis or prediction algorithms
2. Medicine recommendation or prescription generation
3. Clinical decision support or treatment recommendations
4. Integration with insurance systems or claims processing
5. Real patient data handling or HIPAA compliance
6. Telemedicine or video consultation features
7. Pharmacy integration or prescription fulfillment
8. Medical device integration or IoT sensor data
9. Real-time vital signs monitoring
10. Integration with national health registries (ABHA, Ayushman Bharat)
11. Electronic Health Record (EHR) system integration
12. Billing or payment processing
13. Appointment scheduling systems
14. Laboratory test ordering or results integration
15. Radiology image analysis or DICOM processing

## Risks and Mitigation

### Risk 1: AI Hallucination and Medical Misinformation
- **Description**: Amazon Bedrock may generate incorrect or misleading medical information that could harm users if acted upon
- **Impact**: High - Could lead to inappropriate care decisions
- **Mitigation**: 
  - Display prominent disclaimers on every AI-generated output
  - Use structured prompts with explicit instructions to avoid diagnosis
  - Validate AI outputs against expected JSON schemas
  - Implement human-in-the-loop review for critical outputs
  - Include emergency services contact information prominently

### Risk 2: Data Misuse and Privacy Violations
- **Description**: Users may enter real medical data despite warnings, creating privacy and compliance risks
- **Impact**: High - Legal and ethical violations
- **Mitigation**: 
  - Display privacy notices on every data entry screen
  - Include "DEMO DATA ONLY" watermarks throughout the interface
  - Implement automatic data retention limits (30 days)
  - Use AWS KMS encryption for data at rest
  - Log all data access events to CloudWatch
  - Do not integrate with real EMR systems

### Risk 3: User Overreliance on AI Recommendations
- **Description**: Users may treat system recommendations as medical advice rather than workflow guidance
- **Impact**: High - Delayed or inappropriate medical care
- **Mitigation**: 
  - Display disclaimers on every output screen: "This is not medical advice"
  - Use language that emphasizes guidance not diagnosis ("symptom patterns suggest" not "you have")
  - For emergency urgency levels, display "CALL EMERGENCY SERVICES IMMEDIATELY"
  - Include doctor review requirement in all workflows
  - Provide clear escalation paths to human healthcare providers

### Risk 4: Technical Feasibility Within Hackathon Timeframe
- **Description**: Complex features may not be completable in 24-48 hours
- **Impact**: Medium - Incomplete demonstration
- **Mitigation**: 
  - Prioritize core features: symptom input, care navigation, treatment planner
  - Use placeholder implementations for advanced features (OCR, voice input)
  - Leverage AWS managed services to reduce custom development
  - Create modular architecture allowing incremental feature addition
  - Prepare fallback demo with synthetic data if live features incomplete

### Risk 5: AWS Service Availability and Quotas
- **Description**: Amazon Bedrock, Textract, or other AWS services may experience downtime or quota limits during hackathon
- **Impact**: Medium - System unavailability
- **Mitigation**: 
  - Implement retry logic with exponential backoff for all AWS SDK calls
  - Provide fallback error messages when services unavailable
  - Request AWS service quota increases before hackathon
  - Design stateless architecture for easy recovery
  - Monitor AWS Service Health Dashboard
  - Cache Bedrock responses for common queries to reduce API calls

### Risk 6: Cost Overruns from AWS Service Usage
- **Description**: High usage of Bedrock, Textract, and Transcribe during testing could exceed budget
- **Impact**: Low - Financial cost
- **Mitigation**: 
  - Set AWS Budgets alerts for service spending
  - Use AWS Free Tier eligible services where possible
  - Implement request throttling and rate limiting
  - Cache AI responses to reduce redundant API calls
  - Use smaller Bedrock models (Haiku) for development, Sonnet for demo
  - Clean up resources immediately after hackathon

### Risk 7: Multilingual Support Complexity
- **Description**: Supporting multiple Indian languages adds significant complexity
- **Impact**: Low - Feature scope creep
- **Mitigation**: 
  - Design for future multilingual support but implement English-only for hackathon MVP
  - Use modular prompt design that can be translated
  - Document multilingual extension approach for future development
  - Demonstrate concept with one translated prompt example

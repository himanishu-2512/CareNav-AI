# Requirements Document

## Introduction

The Doctor Dashboard Patient Management feature enables doctors to manage their patient roster, access patient medical histories, conduct treatment consultations, prescribe medications, and provide AI-generated lifestyle recommendations. The system uses QR code or unique code authentication for secure patient data access and organizes each treatment episode as a separate chat conversation.

## Glossary

- **Doctor_Dashboard**: The main interface where doctors view and manage their patient list
- **Patient_List**: Collection of all patients currently or previously treated by the doctor
- **UHID**: Unique Health ID - a unique identifier assigned to each patient
- **Treatment_Episode**: A single consultation or treatment session represented as a chat thread
- **Patient_Profile**: Comprehensive view of a patient's demographics, history, and treatments
- **QR_Authentication**: Process of scanning a patient's QR code to gain access to their data
- **Unique_Code**: Alphanumeric code that can be manually entered as alternative to QR scanning
- **Treatment_Status**: Classification of treatments as either "ongoing" or "past"
- **Prescription_Module**: Component that allows doctors to prescribe medications
- **Medication_Schedule**: Timed list of medications with dosage and duration information
- **Lifestyle_Recommender**: AI-powered system that generates personalized health recommendations
- **Medical_Shop**: Pharmacy where patients can present prescriptions for medication dispensing
- **Symptom_Summary**: Aggregated view of patient's current symptoms and reason for visit
- **Chat_Thread**: Conversation interface for a specific treatment episode
- **Treatment_History**: Record of all previous and ongoing treatments for a patient
- **Search_Filter**: Functionality to find patients by name, UHID, or treatment status

## Requirements

### Requirement 1: Doctor Dashboard Patient List Display

**User Story:** As a doctor, I want to see a list of all my patients, so that I can quickly access patient information and manage consultations.

#### Acceptance Criteria

1. WHEN the doctor logs into the system, THE Doctor_Dashboard SHALL display the Patient_List
2. FOR EACH patient in the Patient_List, THE Doctor_Dashboard SHALL display the patient name, UHID, and last consultation date
3. THE Doctor_Dashboard SHALL display the chat history for each patient in the Patient_List
4. THE Patient_List SHALL display patients in descending order by last consultation date
5. WHEN the Patient_List contains more than 20 patients, THE Doctor_Dashboard SHALL paginate the results with 20 patients per page

### Requirement 2: Patient Search Functionality

**User Story:** As a doctor, I want to search for patients by name or UHID, so that I can quickly find specific patients in my roster.

#### Acceptance Criteria

1. THE Doctor_Dashboard SHALL provide a search input field for patient lookup
2. WHEN the doctor enters text in the search field, THE Search_Filter SHALL match against patient names and UHID values
3. THE Search_Filter SHALL display matching results within 500 milliseconds of the last keystroke
4. THE Search_Filter SHALL perform case-insensitive matching on patient names
5. WHEN no patients match the search criteria, THE Doctor_Dashboard SHALL display a "No patients found" message

### Requirement 3: Treatment Status Filtering

**User Story:** As a doctor, I want to filter patients by treatment status, so that I can focus on ongoing cases or review past treatments.

#### Acceptance Criteria

1. THE Doctor_Dashboard SHALL provide filter options for "ongoing" and "past" treatment statuses
2. WHEN the doctor selects the "ongoing" filter, THE Doctor_Dashboard SHALL display only patients with active Treatment_Episodes
3. WHEN the doctor selects the "past" filter, THE Doctor_Dashboard SHALL display only patients with completed Treatment_Episodes
4. WHEN the doctor selects both filters, THE Doctor_Dashboard SHALL display all patients
5. THE Doctor_Dashboard SHALL persist the selected filter state during the session

### Requirement 4: Add New Patient via QR Code

**User Story:** As a doctor, I want to add a new patient by scanning their QR code, so that I can quickly gain access to their medical data.

#### Acceptance Criteria

1. THE Doctor_Dashboard SHALL provide an "Add Patient" button
2. WHEN the doctor clicks "Add Patient", THE Doctor_Dashboard SHALL display options for QR code scanning and manual code entry
3. WHEN the doctor selects QR code scanning, THE QR_Authentication SHALL activate the device camera
4. WHEN a valid patient QR code is scanned, THE QR_Authentication SHALL authenticate the patient within 2 seconds
5. WHEN authentication succeeds, THE Doctor_Dashboard SHALL add the patient to the Patient_List and display the Patient_Profile
6. IF the QR code is invalid or unreadable, THEN THE QR_Authentication SHALL display an error message and allow retry

### Requirement 5: Add New Patient via Manual Code Entry

**User Story:** As a doctor, I want to add a new patient by entering their unique code manually, so that I can access patient data when QR scanning is not available.

#### Acceptance Criteria

1. WHEN the doctor selects manual code entry, THE Doctor_Dashboard SHALL display a text input field for the Unique_Code
2. THE Doctor_Dashboard SHALL validate that the Unique_Code contains only alphanumeric characters
3. WHEN the doctor submits a valid Unique_Code, THE QR_Authentication SHALL authenticate the patient within 2 seconds
4. WHEN authentication succeeds, THE Doctor_Dashboard SHALL add the patient to the Patient_List and display the Patient_Profile
5. IF the Unique_Code is invalid, THEN THE QR_Authentication SHALL display an error message specifying the validation failure

### Requirement 6: Patient Profile Demographics Display

**User Story:** As a doctor, I want to view patient demographics, so that I can understand basic patient information before treatment.

#### Acceptance Criteria

1. WHEN the doctor selects a patient from the Patient_List, THE Patient_Profile SHALL display the patient's full name
2. THE Patient_Profile SHALL display the patient's age calculated from date of birth
3. THE Patient_Profile SHALL display the patient's UHID
4. THE Patient_Profile SHALL display the patient's gender
5. THE Patient_Profile SHALL display the patient's contact information including phone number and email address

### Requirement 7: Treatment History Display and Filtering

**User Story:** As a doctor, I want to view and filter a patient's treatment history, so that I can understand their medical background.

#### Acceptance Criteria

1. THE Patient_Profile SHALL display all Treatment_Episodes in the Treatment_History
2. THE Patient_Profile SHALL categorize Treatment_Episodes as "ongoing" or "past" based on Treatment_Status
3. THE Patient_Profile SHALL provide filter controls to show only ongoing treatments, only past treatments, or all treatments
4. WHEN the doctor applies a filter, THE Patient_Profile SHALL update the displayed Treatment_Episodes within 300 milliseconds
5. FOR EACH Treatment_Episode, THE Patient_Profile SHALL display the start date, diagnosis, and treatment outcome if completed

### Requirement 8: Current Symptoms Display

**User Story:** As a doctor, I want to see the patient's current symptoms, so that I can understand the reason for their visit.

#### Acceptance Criteria

1. THE Patient_Profile SHALL display a Symptom_Summary section
2. THE Symptom_Summary SHALL list all symptoms reported by the patient for the current visit
3. FOR EACH symptom, THE Symptom_Summary SHALL display the symptom description, severity, and duration
4. THE Symptom_Summary SHALL display symptoms in order of severity from highest to lowest
5. WHEN the patient has not reported symptoms for the current visit, THE Patient_Profile SHALL display "No current symptoms reported"

### Requirement 9: Treatment Episode Chat Thread Creation

**User Story:** As a doctor, I want each treatment to be a separate chat conversation, so that I can organize consultations clearly.

#### Acceptance Criteria

1. THE Patient_Profile SHALL provide a "Start New Treatment" button
2. WHEN the doctor clicks "Start New Treatment", THE Patient_Profile SHALL create a new Chat_Thread
3. THE Chat_Thread SHALL be associated with a unique Treatment_Episode identifier
4. THE Patient_Profile SHALL display all Chat_Threads for the patient in chronological order
5. WHEN the doctor selects a Chat_Thread, THE Patient_Profile SHALL display the complete conversation history for that Treatment_Episode

### Requirement 10: Symptom and Document Review in Treatment

**User Story:** As a doctor, I want to view symptom summaries and uploaded documents during treatment, so that I can make informed medical decisions.

#### Acceptance Criteria

1. WITHIN each Chat_Thread, THE Patient_Profile SHALL display the Symptom_Summary for that Treatment_Episode
2. THE Chat_Thread SHALL display all documents uploaded by the patient for that Treatment_Episode
3. FOR EACH document, THE Chat_Thread SHALL display the document name, upload date, and file type
4. WHEN the doctor clicks on a document, THE Chat_Thread SHALL open the document in a viewer within 2 seconds
5. THE Chat_Thread SHALL support viewing of PDF, JPEG, PNG, and DICOM file formats

### Requirement 11: Medication Prescription Creation

**User Story:** As a doctor, I want to prescribe medications directly in the app, so that prescriptions are immediately available to the patient.

#### Acceptance Criteria

1. WITHIN each Chat_Thread, THE Prescription_Module SHALL provide a "Prescribe Medication" button
2. WHEN the doctor clicks "Prescribe Medication", THE Prescription_Module SHALL display a medication entry form
3. THE Prescription_Module SHALL require the doctor to specify medication name, dosage, frequency, and duration
4. THE Prescription_Module SHALL validate that all required fields are completed before submission
5. WHEN the doctor submits the prescription, THE Prescription_Module SHALL save the prescription within 1 second
6. THE Prescription_Module SHALL support prescribing multiple medications in a single Treatment_Episode

### Requirement 12: Prescription Synchronization to Patient App

**User Story:** As a doctor, I want prescriptions to automatically appear in the patient's app, so that patients can access their medications immediately.

#### Acceptance Criteria

1. WHEN a prescription is saved, THE Prescription_Module SHALL transmit the prescription to the patient's medication list within 3 seconds
2. THE Prescription_Module SHALL include medication name, dosage, frequency, duration, and prescribing doctor information in the transmission
3. IF the transmission fails, THEN THE Prescription_Module SHALL retry the transmission up to 3 times with 5-second intervals
4. IF all retry attempts fail, THEN THE Prescription_Module SHALL log the error and notify the doctor
5. THE Prescription_Module SHALL confirm successful transmission to the doctor with a notification message

### Requirement 13: Medication Schedule Generation

**User Story:** As a patient, I want to see a medication schedule with timing and duration, so that I can take medications correctly.

#### Acceptance Criteria

1. WHEN a prescription is transmitted to the patient app, THE Medication_Schedule SHALL generate a timed schedule based on frequency and duration
2. THE Medication_Schedule SHALL calculate specific times for each dose based on the prescribed frequency
3. FOR EACH medication, THE Medication_Schedule SHALL display the medication name, dosage, time to take, and remaining duration
4. THE Medication_Schedule SHALL organize medications chronologically by scheduled time
5. THE Medication_Schedule SHALL update the remaining duration daily at midnight

### Requirement 14: Prescription Display for Medical Shop

**User Story:** As a patient, I want to show my prescription to the medical shop, so that I can obtain my medications.

#### Acceptance Criteria

1. THE patient app SHALL provide a "View Prescription" option for each Treatment_Episode
2. WHEN the patient selects "View Prescription", THE patient app SHALL display a formatted prescription document
3. THE prescription document SHALL include patient name, UHID, doctor name, date, and all prescribed medications with dosages
4. THE prescription document SHALL include a unique prescription identifier for verification
5. THE patient app SHALL allow the prescription to be displayed in full-screen mode for easy viewing at the Medical_Shop

### Requirement 15: AI Lifestyle Recommendations Generation

**User Story:** As a patient, I want AI-generated lifestyle recommendations based on my diagnosis, so that I can support my recovery.

#### Acceptance Criteria

1. WHEN a doctor completes a diagnosis in a Treatment_Episode, THE Lifestyle_Recommender SHALL generate personalized recommendations within 10 seconds
2. THE Lifestyle_Recommender SHALL base recommendations on the diagnosed disease and patient demographics
3. THE Lifestyle_Recommender SHALL generate recommendations in the following categories: diet, activities to avoid, daily life modifications, and recovery tips
4. FOR EACH category, THE Lifestyle_Recommender SHALL provide at least 3 specific recommendations
5. THE Lifestyle_Recommender SHALL transmit the recommendations to the patient app within 3 seconds of generation

### Requirement 16: Diet Recommendations

**User Story:** As a patient, I want diet recommendations based on my condition, so that I can eat foods that support my recovery.

#### Acceptance Criteria

1. THE Lifestyle_Recommender SHALL generate diet recommendations specific to the diagnosed disease
2. THE diet recommendations SHALL include foods to consume and foods to avoid
3. THE diet recommendations SHALL specify portion sizes or frequency where medically relevant
4. THE diet recommendations SHALL consider common dietary restrictions and allergies if recorded in the patient profile
5. THE Lifestyle_Recommender SHALL present diet recommendations in clear, actionable language

### Requirement 17: Activity and Avoidance Recommendations

**User Story:** As a patient, I want to know what activities to avoid, so that I do not worsen my condition.

#### Acceptance Criteria

1. THE Lifestyle_Recommender SHALL generate a list of activities to avoid based on the diagnosed disease
2. THE Lifestyle_Recommender SHALL explain the reason for each avoidance recommendation
3. THE Lifestyle_Recommender SHALL specify the duration for which each activity should be avoided
4. THE Lifestyle_Recommender SHALL prioritize critical avoidances at the top of the list
5. THE Lifestyle_Recommender SHALL use clear, non-technical language for activity descriptions

### Requirement 18: Daily Life Modification Recommendations

**User Story:** As a patient, I want daily life modification suggestions, so that I can adjust my routine to support healing.

#### Acceptance Criteria

1. THE Lifestyle_Recommender SHALL generate daily life modification recommendations based on the diagnosed disease
2. THE recommendations SHALL include sleep schedule adjustments, stress management techniques, and physical activity guidelines
3. FOR EACH modification, THE Lifestyle_Recommender SHALL provide specific, measurable guidance
4. THE Lifestyle_Recommender SHALL prioritize modifications by expected impact on recovery
5. THE Lifestyle_Recommender SHALL present modifications in order from easiest to most challenging to implement

### Requirement 19: Recovery Tips and Monitoring

**User Story:** As a patient, I want recovery tips and monitoring guidance, so that I can track my progress and know when to seek additional care.

#### Acceptance Criteria

1. THE Lifestyle_Recommender SHALL generate recovery tips specific to the diagnosed disease
2. THE recovery tips SHALL include warning signs that require immediate medical attention
3. THE recovery tips SHALL specify expected recovery timeline milestones
4. THE Lifestyle_Recommender SHALL provide guidance on self-monitoring techniques for the condition
5. THE recovery tips SHALL include when to schedule follow-up appointments with the doctor

### Requirement 20: Patient Access Control and Security

**User Story:** As a doctor, I want patient data access to be secure and controlled, so that patient privacy is protected.

#### Acceptance Criteria

1. THE QR_Authentication SHALL verify that the doctor has authorization to access the patient's data
2. WHEN a doctor adds a patient, THE system SHALL create an access log entry with doctor ID, patient ID, and timestamp
3. THE system SHALL encrypt all patient data in transit using TLS 1.3 or higher
4. THE system SHALL encrypt all patient data at rest using AES-256 encryption
5. WHEN a doctor's session expires after 30 minutes of inactivity, THE system SHALL require re-authentication before accessing patient data

### Requirement 21: Treatment Episode Completion and Archival

**User Story:** As a doctor, I want to mark treatments as complete, so that they move to the patient's treatment history.

#### Acceptance Criteria

1. WITHIN each Chat_Thread, THE Doctor_Dashboard SHALL provide a "Complete Treatment" button
2. WHEN the doctor clicks "Complete Treatment", THE Doctor_Dashboard SHALL prompt for treatment outcome and final notes
3. WHEN the doctor confirms completion, THE system SHALL update the Treatment_Status to "past" within 1 second
4. THE system SHALL move the completed Treatment_Episode to the patient's Treatment_History
5. THE system SHALL preserve all Chat_Thread messages, prescriptions, and documents in the archived Treatment_Episode

### Requirement 22: Prescription Parser and Pretty Printer

**User Story:** As a developer, I want to parse and format prescription data, so that prescriptions are consistently structured and displayable.

#### Acceptance Criteria

1. WHEN prescription data is received, THE Prescription_Parser SHALL parse it into a structured Prescription object
2. IF the prescription data is malformed, THEN THE Prescription_Parser SHALL return a descriptive error message
3. THE Prescription_Pretty_Printer SHALL format Prescription objects into human-readable prescription documents
4. THE Prescription_Pretty_Printer SHALL format prescriptions according to medical prescription standards
5. FOR ALL valid Prescription objects, parsing then printing then parsing SHALL produce an equivalent object (round-trip property)

### Requirement 23: Medication Frequency Parser

**User Story:** As a developer, I want to parse medication frequency specifications, so that accurate medication schedules can be generated.

#### Acceptance Criteria

1. THE Frequency_Parser SHALL parse frequency specifications including "once daily", "twice daily", "three times daily", "every N hours", and "as needed"
2. THE Frequency_Parser SHALL convert frequency specifications into specific time intervals
3. IF the frequency specification is invalid or ambiguous, THEN THE Frequency_Parser SHALL return an error message
4. THE Frequency_Parser SHALL support custom frequency patterns specified by doctors
5. FOR ALL valid frequency specifications, THE Frequency_Parser SHALL generate at least one scheduled dose time per day


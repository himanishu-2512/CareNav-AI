# AI Iterative Diagnosis and QR Code Types

This document describes the TypeScript types and DynamoDB helper functions implemented for the AI-powered iterative diagnosis and QR code functionality.

## Overview

Task 1 of the AI Iterative Diagnosis QR spec has been completed. This includes:

1. **TypeScript Interfaces** for diagnosis sessions, disease candidates, questions, and answers
2. **TypeScript Interfaces** for QR code tokens, validation, and responses
3. **TypeScript Interfaces** for enhanced patient summaries with AI analysis
4. **DynamoDB Helper Functions** for diagnosis session operations
5. **DynamoDB Helper Functions** for QR token operations

## Files Created/Modified

### Modified Files
- `lambda/shared/types.ts` - Added all new type definitions

### New Files
- `lambda/shared/diagnosis-db.ts` - DynamoDB helper functions for diagnosis sessions
- `lambda/shared/qr-db.ts` - DynamoDB helper functions for QR tokens
- `lambda/shared/verify-diagnosis-types.ts` - Verification script demonstrating type usage

### Test Files
- `lambda/shared/diagnosis-db.test.ts` - Unit tests for diagnosis types
- `lambda/shared/qr-db.test.ts` - Unit tests for QR code types
- `lambda/shared/patient-summary.test.ts` - Unit tests for patient summary types

## Type Definitions

### Diagnosis Session Types

#### DiagnosisSession
Complete diagnosis session with all rounds and disease candidates.

```typescript
interface DiagnosisSession {
  sessionId: string;
  patientId: string;
  currentRound: number;
  initialSymptoms: StructuredSymptoms;
  possibleDiseases: DiseaseCandidate[];
  questionHistory: QuestionRound[];
  confidenceScore: number;
  status: 'active' | 'completed';
  createdAt: string;
  updatedAt: string;
}
```

#### DiseaseCandidate
A possible disease with probability and supporting/missing symptoms.

```typescript
interface DiseaseCandidate {
  diseaseName: string;
  probability: number;
  supportingSymptoms: string[];
  missingSymptoms: string[];
}
```

#### TargetedQuestion
A question generated to differentiate between disease candidates.

```typescript
interface TargetedQuestion {
  questionId: string;
  questionText: string;
  questionType: 'yes_no' | 'text' | 'multiple_choice' | 'scale';
  targetDiseases: string[];
  importance: 'high' | 'medium' | 'low';
  options?: string[];
}
```

#### QuestionAnswer
Patient's answer to a targeted question.

```typescript
interface QuestionAnswer {
  questionId: string;
  answer: string;
  timestamp: string;
}
```

#### QuestionRound
Complete round of questions and answers with disease refinement.

```typescript
interface QuestionRound {
  roundNumber: number;
  questions: TargetedQuestion[];
  answers: QuestionAnswer[];
  diseasesBeforeRound: DiseaseCandidate[];
  diseasesAfterRound: DiseaseCandidate[];
  timestamp: string;
}
```

### QR Code Types

#### QRCodeToken
Secure token for patient data access via QR code.

```typescript
interface QRCodeToken {
  tokenId: string;
  patientId: string;
  qrData: string;
  expiresAt: string;
  createdAt: string;
  scannedBy?: string;
  scannedAt?: string;
}
```

#### QRCodeResponse
Response when generating a QR code.

```typescript
interface QRCodeResponse {
  qrCodeImage: string; // Base64 encoded PNG
  qrData: string;
  expiresAt: string;
  expiresIn: number; // Seconds (86400 for 24 hours)
}
```

#### QRValidationRequest
Request to validate a scanned QR code.

```typescript
interface QRValidationRequest {
  qrData: string;
  doctorId: string;
}
```

#### QRValidationResponse
Response after validating a QR code.

```typescript
interface QRValidationResponse {
  valid: boolean;
  patientId?: string;
  error?: string;
  expiresAt?: string;
}
```

### Patient Summary Types

#### PatientSummary
Comprehensive patient data for doctor view after QR scan.

```typescript
interface PatientSummary {
  patient: Patient;
  diagnosisSessions: DiagnosisSessionSummary[];
  symptoms: Symptom[];
  reports: ReportWithAnalysis[];
  aiAnalysis: ComprehensiveAnalysis;
  redFlags: RedFlag[];
  treatmentHistory: TreatmentPlan[];
  generatedAt: string;
}
```

#### DiagnosisSessionSummary
Summary of a diagnosis session for doctor view.

```typescript
interface DiagnosisSessionSummary {
  sessionId: string;
  date: string;
  initialSymptoms: StructuredSymptoms;
  finalDiseases: DiseaseCandidate[];
  totalRounds: number;
  confidenceScore: number;
  keyFindings: string[];
}
```

#### ReportWithAnalysis
Medical report with AI-generated insights.

```typescript
interface ReportWithAnalysis {
  reportId: string;
  reportType: string;
  uploadDate: string;
  s3Key: string;
  pdfUrl: string; // Pre-signed S3 URL
  summary: ReportSummary;
  aiInsights: string[];
}
```

#### ComprehensiveAnalysis
AI-generated comprehensive analysis of patient data.

```typescript
interface ComprehensiveAnalysis {
  overallHealthStatus: string;
  chronicConditions: string[];
  recentSymptomPatterns: string[];
  reportTrends: string[];
  recommendations: string[];
  criticalAlerts: string[];
}
```

#### RedFlag
Critical health indicator requiring attention.

```typescript
interface RedFlag {
  type: 'allergy' | 'chronic_condition' | 'high_risk' | 'medication_interaction';
  description: string;
  source: string;
  severity: 'critical' | 'high' | 'medium';
  detectedAt: string;
}
```

## DynamoDB Key Patterns

New key patterns added to `DynamoDBKeys`:

```typescript
// Diagnosis session
diagnosisSession: (patientId: string, sessionId: string) => ({
  PK: `PATIENT#${patientId}`,
  SK: `DIAGNOSIS_SESSION#${sessionId}`
})

// QR token
qrToken: (tokenId: string) => ({
  PK: `QR_TOKEN#${tokenId}`,
  SK: 'METADATA'
})

// Patient history summary
patientHistory: (patientId: string) => ({
  PK: `PATIENT#${patientId}`,
  SK: 'HISTORY_SUMMARY'
})
```

## Database Helper Functions

### Diagnosis Session Operations (`diagnosis-db.ts`)

#### createDiagnosisSession(session: DiagnosisSession): Promise<void>
Creates a new diagnosis session in DynamoDB.

#### getDiagnosisSession(patientId: string, sessionId: string): Promise<DiagnosisSession | null>
Retrieves a diagnosis session by ID.

#### updateDiagnosisSession(session: DiagnosisSession): Promise<void>
Updates an existing diagnosis session.

#### getPatientDiagnosisSessions(patientId: string): Promise<DiagnosisSession[]>
Gets all diagnosis sessions for a patient.

#### getActiveDiagnosisSessions(patientId: string): Promise<DiagnosisSession[]>
Gets only active diagnosis sessions for a patient.

#### completeDiagnosisSession(patientId: string, sessionId: string): Promise<void>
Marks a diagnosis session as completed.

#### updatePatientHistorySummary(patientId: string, updates: object): Promise<void>
Updates patient history summary with diagnosis session count and timestamps.

#### getPatientHistorySummary(patientId: string): Promise<any | null>
Retrieves patient history summary.

#### markExpiredSessions(patientId: string): Promise<void>
Marks diagnosis sessions as expired if inactive for more than 7 days.

### QR Token Operations (`qr-db.ts`)

#### createQRToken(token: QRCodeToken): Promise<void>
Creates a new QR token with automatic TTL for cleanup.

#### getQRToken(tokenId: string): Promise<QRCodeToken | null>
Retrieves a QR token by ID.

#### updateQRTokenScanInfo(tokenId: string, doctorId: string, scannedAt: string): Promise<void>
Updates QR token with scan information (doctor ID and timestamp).

#### isQRTokenExpired(token: QRCodeToken): boolean
Checks if a QR token has expired.

#### validateQRToken(tokenId: string): Promise<{ valid: boolean; token?: QRCodeToken; error?: string }>
Validates a QR token (checks existence and expiration).

#### deleteQRToken(tokenId: string): Promise<void>
Manually deletes a QR token.

## DynamoDB Schema

### Diagnosis Session Item
```typescript
{
  PK: "PATIENT#{patientId}",
  SK: "DIAGNOSIS_SESSION#{sessionId}",
  sessionId: string,
  patientId: string,
  currentRound: number,
  initialSymptoms: StructuredSymptoms,
  possibleDiseases: DiseaseCandidate[],
  questionHistory: QuestionRound[],
  confidenceScore: number,
  status: 'active' | 'completed',
  createdAt: string,
  updatedAt: string,
  GSI1PK: "DIAGNOSIS_SESSION",
  GSI1SK: createdAt
}
```

### QR Token Item
```typescript
{
  PK: "QR_TOKEN#{tokenId}",
  SK: "METADATA",
  tokenId: string,
  patientId: string,
  qrData: string,
  expiresAt: string,
  createdAt: string,
  scannedBy?: string,
  scannedAt?: string,
  TTL: number // Unix timestamp for automatic cleanup
}
```

### Patient History Summary Item
```typescript
{
  PK: "PATIENT#{patientId}",
  SK: "HISTORY_SUMMARY",
  patientId: string,
  totalDiagnosisSessions: number,
  lastDiagnosisDate: string,
  lastQRGenerated: string,
  lastQRScanned: string,
  updatedAt: string
}
```

## Usage Examples

### Creating a Diagnosis Session

```typescript
import { createDiagnosisSession } from './diagnosis-db';
import { DiagnosisSession } from './types';

const session: DiagnosisSession = {
  sessionId: 'session-abc-123',
  patientId: 'patient-456',
  currentRound: 1,
  initialSymptoms: {
    bodyPart: 'chest',
    duration: '3 days',
    severity: 'moderate',
    associatedFactors: ['shortness of breath']
  },
  possibleDiseases: [],
  questionHistory: [],
  confidenceScore: 0.0,
  status: 'active',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

await createDiagnosisSession(session);
```

### Creating a QR Token

```typescript
import { createQRToken } from './qr-db';
import { QRCodeToken } from './types';

const token: QRCodeToken = {
  tokenId: 'token-xyz-789',
  patientId: 'patient-456',
  qrData: 'encrypted-token-string',
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  createdAt: new Date().toISOString()
};

await createQRToken(token);
```

### Validating a QR Token

```typescript
import { validateQRToken, updateQRTokenScanInfo } from './qr-db';

const result = await validateQRToken('token-xyz-789');

if (result.valid && result.token) {
  await updateQRTokenScanInfo(
    result.token.tokenId,
    'doctor-123',
    new Date().toISOString()
  );
  console.log('Valid token for patient:', result.token.patientId);
} else {
  console.error('Invalid token:', result.error);
}
```

## Verification

Run the verification script to confirm all types are correctly defined:

```bash
npx ts-node lambda/shared/verify-diagnosis-types.ts
```

Expected output:
```
✓ All types verified successfully!

DiagnosisSession keys: { PK: 'PATIENT#patient-456', SK: 'DIAGNOSIS_SESSION#session-abc-123' }
QRToken keys: { PK: 'QR_TOKEN#token-xyz-789', SK: 'METADATA' }
PatientHistory keys: { PK: 'PATIENT#patient-456', SK: 'HISTORY_SUMMARY' }

✓ DiagnosisSession type: OK
✓ DiseaseCandidate type: OK
✓ TargetedQuestion type: OK
✓ QuestionAnswer type: OK
✓ QRCodeToken type: OK
✓ QRCodeResponse type: OK
✓ QRValidationRequest type: OK
✓ QRValidationResponse type: OK
✓ RedFlag type: OK
✓ ComprehensiveAnalysis type: OK
✓ DynamoDB key patterns: OK
```

## Requirements Validated

This implementation validates the following requirements from the spec:

- **Requirement 1.1, 1.2**: Diagnosis session creation and management
- **Requirement 6.1**: QR token generation with unique IDs
- **Requirement 12.1**: DynamoDB schema for diagnosis sessions
- **Requirement 12.5**: QR token storage with TTL

## Next Steps

The following tasks can now be implemented using these types:

1. **Task 2**: Implement Bedrock prompts for disease analysis
2. **Task 3**: Create Lambda function for starting diagnosis sessions
3. **Task 4**: Create Lambda function for continuing diagnosis sessions
4. **Task 5**: Implement QR code generation Lambda
5. **Task 6**: Implement QR code validation Lambda
6. **Task 7**: Implement patient summary generation Lambda

## Notes

- All types are strongly typed with TypeScript for compile-time safety
- DynamoDB helper functions use the AWS SDK v3 with DynamoDBDocumentClient
- QR tokens automatically expire after 24 hours with DynamoDB TTL
- Diagnosis sessions can be marked as expired after 7 days of inactivity
- All timestamps use ISO 8601 format
- Patient history summary tracks diagnosis session counts and QR scan events

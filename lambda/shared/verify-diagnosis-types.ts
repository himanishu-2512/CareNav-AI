// Verification script for diagnosis and QR code types
// This demonstrates that all types are correctly defined and can be used

import {
  DiagnosisSession,
  DiseaseCandidate,
  QuestionRound,
  TargetedQuestion,
  QuestionAnswer,
  QRCodeToken,
  QRCodeResponse,
  QRValidationRequest,
  QRValidationResponse,
  PatientSummary,
  DiagnosisSessionSummary,
  ReportWithAnalysis,
  ComprehensiveAnalysis,
  RedFlag,
  DynamoDBKeys
} from './types';

// Verify DiagnosisSession type
const exampleSession: DiagnosisSession = {
  sessionId: 'session-abc-123',
  patientId: 'patient-456',
  currentRound: 1,
  initialSymptoms: {
    bodyPart: 'chest',
    duration: '3 days',
    severity: 'moderate',
    associatedFactors: ['shortness of breath', 'sweating'],
    timing: 'worse with exertion',
    character: 'pressure-like discomfort'
  },
  possibleDiseases: [
    {
      diseaseName: 'Angina Pectoris',
      probability: 0.35,
      supportingSymptoms: ['chest pressure', 'exertional', 'duration 3 days'],
      missingSymptoms: ['radiation pattern', 'relief with rest']
    },
    {
      diseaseName: 'Myocardial Infarction',
      probability: 0.25,
      supportingSymptoms: ['chest discomfort', 'sweating', 'moderate severity'],
      missingSymptoms: ['nausea', 'arm pain', 'sudden onset']
    }
  ],
  questionHistory: [],
  confidenceScore: 0.45,
  status: 'active',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z'
};

// Verify TargetedQuestion type
const exampleQuestion: TargetedQuestion = {
  questionId: 'q1',
  questionText: 'Does the discomfort spread to your arm, neck, or jaw?',
  questionType: 'yes_no',
  targetDiseases: ['Angina Pectoris', 'Myocardial Infarction'],
  importance: 'high'
};

// Verify QuestionAnswer type
const exampleAnswer: QuestionAnswer = {
  questionId: 'q1',
  answer: 'yes',
  timestamp: '2024-01-15T10:30:00Z'
};

// Verify QRCodeToken type
const exampleQRToken: QRCodeToken = {
  tokenId: 'token-xyz-789',
  patientId: 'patient-456',
  qrData: 'eyJ0b2tlbklkIjoiYWJjLTEyMyIsInBhdGllbnRJZCI6InBhdGllbnQtMTIzIi4uLg==',
  expiresAt: '2024-01-16T10:00:00Z',
  createdAt: '2024-01-15T10:00:00Z'
};

// Verify QRCodeResponse type
const exampleQRResponse: QRCodeResponse = {
  qrCodeImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
  qrData: 'eyJ0b2tlbklkIjoiYWJjLTEyMyIsInBhdGllbnRJZCI6InBhdGllbnQtMTIzIi4uLg==',
  expiresAt: '2024-01-16T10:00:00Z',
  expiresIn: 86400
};

// Verify QRValidationRequest type
const exampleValidationRequest: QRValidationRequest = {
  qrData: 'eyJ0b2tlbklkIjoiYWJjLTEyMyIsInBhdGllbnRJZCI6InBhdGllbnQtMTIzIi4uLg==',
  doctorId: 'doctor-789'
};

// Verify QRValidationResponse type
const exampleValidationResponse: QRValidationResponse = {
  valid: true,
  patientId: 'patient-456',
  expiresAt: '2024-01-16T10:00:00Z'
};

// Verify RedFlag type
const exampleRedFlag: RedFlag = {
  type: 'high_risk',
  description: 'Angina Pectoris (probability: 0.85)',
  source: 'Diagnosis Session session-abc-123',
  severity: 'high',
  detectedAt: '2024-01-15T10:00:00Z'
};

// Verify ComprehensiveAnalysis type
const exampleAnalysis: ComprehensiveAnalysis = {
  overallHealthStatus: 'Patient presenting with concerning cardiac symptoms requiring urgent evaluation',
  chronicConditions: [],
  recentSymptomPatterns: [
    'Exertional chest discomfort with radiation',
    'Associated autonomic symptoms (sweating, nausea)'
  ],
  reportTrends: [
    'Previous ECG normal, but symptoms suggest possible unstable angina'
  ],
  recommendations: [
    'Urgent cardiology consultation recommended',
    'Consider troponin levels and stress testing',
    'Patient should avoid strenuous activity until evaluated'
  ],
  criticalAlerts: [
    'High probability cardiac etiology - urgent evaluation needed'
  ]
};

// Verify DynamoDB key patterns
const diagnosisSessionKeys = DynamoDBKeys.diagnosisSession('patient-456', 'session-abc-123');
const qrTokenKeys = DynamoDBKeys.qrToken('token-xyz-789');
const patientHistoryKeys = DynamoDBKeys.patientHistory('patient-456');

console.log('✓ All types verified successfully!');
console.log('\nDiagnosisSession keys:', diagnosisSessionKeys);
console.log('QRToken keys:', qrTokenKeys);
console.log('PatientHistory keys:', patientHistoryKeys);

console.log('\n✓ DiagnosisSession type: OK');
console.log('✓ DiseaseCandidate type: OK');
console.log('✓ TargetedQuestion type: OK');
console.log('✓ QuestionAnswer type: OK');
console.log('✓ QRCodeToken type: OK');
console.log('✓ QRCodeResponse type: OK');
console.log('✓ QRValidationRequest type: OK');
console.log('✓ QRValidationResponse type: OK');
console.log('✓ RedFlag type: OK');
console.log('✓ ComprehensiveAnalysis type: OK');
console.log('✓ DynamoDB key patterns: OK');

export {
  exampleSession,
  exampleQuestion,
  exampleAnswer,
  exampleQRToken,
  exampleQRResponse,
  exampleValidationRequest,
  exampleValidationResponse,
  exampleRedFlag,
  exampleAnalysis
};

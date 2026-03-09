// Shared TypeScript types for CareNav AI Lambda functions

export interface Patient {
  patientId: string;
  name: string;
  age: number;
  dateOfBirth?: string; // ISO date string (YYYY-MM-DD)
  gender: string;
  contact: string;
  bloodGroup?: string; // A+, A-, B+, B-, AB+, AB-, O+, O-
  parentName?: string; // Parent or guardian name
  weight?: number; // in kg
  createdAt: string;
  updatedAt?: string;
}

export interface StructuredSymptoms {
  bodyPart: string;
  duration: string;
  severity: 'mild' | 'moderate' | 'severe';
  associatedFactors: string[];
  timing?: string;
  character?: string;
}

export interface Symptom {
  symptomId: string;
  patientId: string;
  rawText: string;
  structuredSymptoms: StructuredSymptoms;
  followUpAnswers?: FollowUpAnswer[];
  inputMethod: 'text' | 'voice';
  createdAt: string;
  // Disease analysis (hidden from patient, for doctor review)
  diseaseAnalysis?: DiseaseCandidate[];
  confidenceScore?: number;
  // AI-generated summaries for doctor review
  aiSummary?: string; // Comprehensive clinical summary
  briefSummary?: string; // One-line summary for list views
}

export interface FollowUpQuestion {
  questionId: string;
  questionText: string;
  questionType: 'text' | 'multiple_choice';
}

export interface FollowUpAnswer {
  questionId: string;
  questionText: string; // Store the question text for better summaries
  answer: string;
  answeredAt?: string; // Timestamp when answered
  tags?: string[]; // Medical terms extracted from the question
}

export interface CareNavigation {
  navigationId: string;
  patientId: string;
  symptomId: string;
  recommendedDepartment: string;
  urgencyLevel: 'routine' | 'urgent' | 'emergency';
  reasoning: string;
  disclaimer: string;
  emergencyMessage?: string;
  createdAt: string;
}

export interface ReportSummary {
  reportDate?: string;
  reportType?: string;
  keyFindings: string[];
  diagnoses: string[];
  medications: string[];
  procedures: string[];
  recommendations: string[];
  redFlags: string[];
}

export interface Report {
  reportId: string;
  patientId: string;
  s3Key: string;
  extractedText: string;
  summary: ReportSummary;
  uploadedAt: string;
}

export interface Prescription {
  medicineId: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  times: string[];
  startDate: string;
  stopDate: string;
  specialInstructions?: string;
  foodTiming?: 'before food' | 'after food' | 'with food' | 'anytime';
}

export interface TreatmentPlan {
  treatmentPlanId: string;
  patientId: string;
  doctorId: string;
  planName: string; // Name of the treatment plan
  disease: string; // Disease being treated
  duration: string; // Duration (e.g., "7 days", "2 weeks")
  prescriptions: Prescription[];
  createdAt: string;
  updatedAt?: string;
}

export interface Dose {
  patientId: string;
  medicineId: string;
  medicineName: string;
  dosage: string;
  scheduledTime: string;
  scheduledDate: string;
  status: 'pending' | 'due' | 'taken' | 'missed';
  takenAt?: string;
  createdAt: string;
}

export interface User {
  userId: string;
  email: string;
  passwordHash: string;
  role: 'patient' | 'doctor';
  name: string;
  createdAt: string;
  // Doctor-specific fields
  phone?: string;
  specialization?: string;
  licenseNumber?: string;
  // Patient-specific fields
  age?: number;
  dateOfBirth?: string; // ISO date string (YYYY-MM-DD)
  gender?: string;
  contact?: string;
  bloodGroup?: string; // A+, A-, B+, B-, AB+, AB-, O+, O-
  parentName?: string; // Parent or guardian name
}

export interface Session {
  token: string;
  userId: string;
  role: 'patient' | 'doctor';
  expiresAt: string;
  createdAt: string;
}

// DynamoDB key patterns
export const DynamoDBKeys = {
  patient: (patientId: string) => ({
    PK: `PATIENT#${patientId}`,
    SK: 'PROFILE'
  }),
  symptom: (patientId: string, symptomId: string) => ({
    PK: `PATIENT#${patientId}`,
    SK: `SYMPTOM#${symptomId}`
  }),
  navigation: (patientId: string, navigationId: string) => ({
    PK: `PATIENT#${patientId}`,
    SK: `NAVIGATION#${navigationId}`
  }),
  report: (patientId: string, reportId: string) => ({
    PK: `PATIENT#${patientId}`,
    SK: `REPORT#${reportId}`
  }),
  treatment: (patientId: string, treatmentPlanId: string) => ({
    PK: `PATIENT#${patientId}`,
    SK: `TREATMENT#${treatmentPlanId}`
  }),
  dose: (patientId: string, doseId: string) => ({
    PK: `PATIENT#${patientId}`,
    SK: `DOSE#${doseId}`
  }),
  user: (userId: string) => ({
    PK: `USER#${userId}`,
    SK: 'PROFILE'
  }),
  session: (token: string) => ({
    PK: `SESSION#${token}`,
    SK: 'METADATA'
  }),
  // AI Iterative Diagnosis Keys
  diagnosisSession: (patientId: string, sessionId: string) => ({
    PK: `PATIENT#${patientId}`,
    SK: `DIAGNOSIS_SESSION#${sessionId}`
  }),
  // QR Code Keys
  qrToken: (tokenId: string) => ({
    PK: `QR_TOKEN#${tokenId}`,
    SK: 'METADATA'
  }),
  // Patient History Summary
  patientHistory: (patientId: string) => ({
    PK: `PATIENT#${patientId}`,
    SK: 'HISTORY_SUMMARY'
  }),
  // Doctor-Patient Relationship Keys
  doctorPatient: (doctorId: string, patientId: string) => ({
    PK: `DOCTOR#${doctorId}`,
    SK: `PATIENT#${patientId}`
  }),
  // Treatment Episode Keys
  treatmentEpisode: (patientId: string, episodeId: string) => ({
    PK: `PATIENT#${patientId}`,
    SK: `EPISODE#${episodeId}`
  }),
  // Chat Message Keys
  chatMessage: (episodeId: string, timestamp: string, messageId: string) => ({
    PK: `EPISODE#${episodeId}`,
    SK: `MESSAGE#${timestamp}#${messageId}`
  })
};

// ============================================
// AI Iterative Diagnosis Types
// ============================================

export interface DiagnosisSession {
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

export interface DiseaseCandidate {
  diseaseName: string;
  probability: number;
  supportingSymptoms?: string[];
  missingSymptoms?: string[];
  reasoning?: string;
}

export interface QuestionRound {
  roundNumber: number;
  questions: TargetedQuestion[];
  answers: QuestionAnswer[];
  diseasesBeforeRound: DiseaseCandidate[];
  diseasesAfterRound: DiseaseCandidate[];
  timestamp: string;
}

export interface TargetedQuestion {
  questionId: string;
  questionText: string;
  questionType: 'yes_no' | 'text' | 'multiple_choice' | 'scale';
  targetDiseases: string[]; // Which diseases this question helps differentiate
  importance: 'high' | 'medium' | 'low';
  options?: string[]; // For multiple_choice type
  tags?: string[]; // Medical terms/topics covered by this question (extracted via Comprehend Medical)
}

export interface QuestionAnswer {
  questionId: string;
  answer: string;
  timestamp: string;
}

// ============================================
// QR Code Types
// ============================================

export interface QRCodeToken {
  tokenId: string;
  patientId: string;
  qrData: string; // Encrypted token string
  expiresAt: string; // Token valid for 24 hours
  createdAt: string;
  scannedBy?: string; // Doctor ID who scanned
  scannedAt?: string;
}

export interface QRCodeResponse {
  qrCodeImage: string; // Base64 encoded PNG
  qrData: string; // Raw token for QR code
  expiresAt: string;
  expiresIn: number; // Seconds until expiry
}

export interface QRValidationRequest {
  qrData: string;
  doctorId: string;
}

export interface QRValidationResponse {
  valid: boolean;
  patientId?: string;
  error?: string;
  expiresAt?: string;
}

// ============================================
// Patient Summary Types (Enhanced for QR Flow)
// ============================================

export interface PatientSummary {
  patient: Patient;
  diagnosisSessions: DiagnosisSessionSummary[];
  symptoms: Symptom[];
  reports: ReportWithAnalysis[];
  aiAnalysis: ComprehensiveAnalysis;
  redFlags: RedFlag[];
  treatmentHistory: TreatmentPlan[];
  generatedAt: string;
}

export interface DiagnosisSessionSummary {
  sessionId: string;
  date: string;
  initialSymptoms: StructuredSymptoms;
  finalDiseases: DiseaseCandidate[];
  totalRounds: number;
  confidenceScore: number;
  keyFindings: string[];
}

export interface ReportWithAnalysis {
  reportId: string;
  reportType: string;
  uploadDate: string;
  s3Key: string;
  pdfUrl: string; // Pre-signed S3 URL
  summary: ReportSummary;
  aiInsights: string[];
}

export interface ComprehensiveAnalysis {
  overallHealthStatus: string;
  chronicConditions: string[];
  recentSymptomPatterns: string[];
  reportTrends: string[];
  recommendations: string[];
  criticalAlerts: string[];
}

export interface RedFlag {
  type: 'allergy' | 'chronic_condition' | 'high_risk' | 'medication_interaction';
  description: string;
  source: string; // Which data source identified this
  severity: 'critical' | 'high' | 'medium';
  detectedAt: string;
}

// Patient Summary with Red Flags (for doctor view - legacy)
export interface PatientSummaryWithRedFlags {
  patient: Patient;
  criticalInformation: CriticalInformation[];
  redFlags: string[];
  disclaimer: string;
  totalRedFlags: number;
}

export interface CriticalInformation {
  source: 'Patient Profile' | 'Symptom Report' | 'Medical Report';
  information: string;
  detectedAt: string;
}

// Treatment Completion Summary
export interface TreatmentCompletionSummary {
  treatmentPlanId: string;
  patientId: string;
  completedAt: string;
  totalAdherenceRate: number;
  medicineCompletionDetails: MedicineCompletionDetail[];
  totalScheduledDoses: number;
  totalTakenDoses: number;
  totalMissedDoses: number;
  treatmentDuration: string; // e.g., "7 days"
  startDate: string;
  endDate: string;
}

export interface MedicineCompletionDetail {
  medicineId: string;
  medicineName: string;
  dosage: string;
  adherenceRate: number;
  scheduledDoses: number;
  takenDoses: number;
  missedDoses: number;
  startDate: string;
  stopDate: string;
}

// ============================================
// Doctor-Patient Relationship Types
// ============================================

export interface DoctorPatientRelationship {
  doctorId: string;
  patientId: string;
  uhid: string;
  patientName: string;
  addedAt: string;
  addedVia: 'qr_scan' | 'manual_code';
  lastConsultation: string;
  treatmentStatus: 'ongoing' | 'past';
  accessGrantedBy: string; // QR token ID or code
  trackedSymptomId?: string; // Optional: specific symptom/disease to track
}

export interface PatientListItem {
  patientId: string;
  uhid: string;
  name: string;
  lastConsultation: string;
  treatmentStatus: 'ongoing' | 'past';
  unreadMessages?: number;
  trackedSymptomId?: string;
  trackedDiseaseName?: string;
}

export interface DoctorPatientsResponse {
  patients: PatientListItem[];
  totalCount: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

// ============================================
// Treatment Episode Types
// ============================================

export interface TreatmentEpisode {
  episodeId: string;
  patientId: string;
  doctorId: string;
  startDate: string;
  endDate?: string;
  status: 'ongoing' | 'completed';
  diagnosis?: string;
  outcome?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Chat Message Types
// ============================================

export interface ChatMessage {
  messageId: string;
  episodeId: string;
  sender: 'doctor' | 'patient' | 'system';
  senderName: string;
  content: string;
  type: 'text' | 'prescription' | 'document' | 'recommendation';
  metadata?: Record<string, any>; // For prescription ID, document ID, etc.
  createdAt: string;
}

// ============================================
// Audit Log Types
// ============================================

export interface AuditLog {
  auditId: string;
  doctorId: string;
  patientId: string;
  accessType: 'qr_scan' | 'manual_code' | 'view_profile' | 'view_episode';
  accessMethod: string; // QR token or code
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  TTL: number; // Unix timestamp for automatic cleanup (30 days)
}

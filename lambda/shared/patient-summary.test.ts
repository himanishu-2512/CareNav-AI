// Unit tests for patient summary types

import { 
  PatientSummary, 
  DiagnosisSessionSummary, 
  ReportWithAnalysis, 
  ComprehensiveAnalysis, 
  RedFlag 
} from './types';

describe('Patient Summary Types', () => {
  test('DiagnosisSessionSummary type is correctly defined', () => {
    const summary: DiagnosisSessionSummary = {
      sessionId: 'session-123',
      date: new Date().toISOString(),
      initialSymptoms: {
        bodyPart: 'chest',
        duration: '3 days',
        severity: 'moderate',
        associatedFactors: ['shortness of breath']
      },
      finalDiseases: [
        {
          diseaseName: 'Angina Pectoris',
          probability: 0.85,
          supportingSymptoms: ['chest pressure', 'exertional'],
          missingSymptoms: []
        }
      ],
      totalRounds: 4,
      confidenceScore: 0.85,
      keyFindings: ['Chest discomfort radiating to arm', 'Symptoms worse with exertion']
    };

    expect(summary.sessionId).toBe('session-123');
    expect(summary.totalRounds).toBe(4);
    expect(summary.confidenceScore).toBe(0.85);
    expect(summary.finalDiseases).toHaveLength(1);
    expect(summary.keyFindings).toHaveLength(2);
  });

  test('ReportWithAnalysis type is correctly defined', () => {
    const report: ReportWithAnalysis = {
      reportId: 'report-789',
      reportType: 'ECG',
      uploadDate: new Date().toISOString(),
      s3Key: 'patient-123/reports/report-789.pdf',
      pdfUrl: 'https://s3.amazonaws.com/presigned-url',
      summary: {
        keyFindings: ['Normal sinus rhythm'],
        diagnoses: [],
        medications: [],
        procedures: [],
        recommendations: [],
        redFlags: []
      },
      aiInsights: ['ECG shows normal sinus rhythm', 'No acute ischemic changes']
    };

    expect(report.reportId).toBe('report-789');
    expect(report.reportType).toBe('ECG');
    expect(report.aiInsights).toHaveLength(2);
  });

  test('ComprehensiveAnalysis type is correctly defined', () => {
    const analysis: ComprehensiveAnalysis = {
      overallHealthStatus: 'Patient presenting with concerning cardiac symptoms',
      chronicConditions: [],
      recentSymptomPatterns: ['Exertional chest discomfort'],
      reportTrends: ['Previous ECG normal'],
      recommendations: ['Urgent cardiology consultation recommended'],
      criticalAlerts: ['High probability cardiac etiology']
    };

    expect(analysis.overallHealthStatus).toContain('cardiac');
    expect(analysis.recommendations).toHaveLength(1);
    expect(analysis.criticalAlerts).toHaveLength(1);
  });

  test('RedFlag type is correctly defined', () => {
    const redFlag: RedFlag = {
      type: 'high_risk',
      description: 'Angina Pectoris (probability: 0.85)',
      source: 'Diagnosis Session session-123',
      severity: 'high',
      detectedAt: new Date().toISOString()
    };

    expect(redFlag.type).toBe('high_risk');
    expect(redFlag.severity).toBe('high');
    expect(redFlag.source).toContain('Diagnosis Session');
  });

  test('RedFlag types are correctly constrained', () => {
    const allergyFlag: RedFlag = {
      type: 'allergy',
      description: 'Penicillin allergy',
      source: 'Medical Report',
      severity: 'critical',
      detectedAt: new Date().toISOString()
    };

    const chronicFlag: RedFlag = {
      type: 'chronic_condition',
      description: 'Diabetes Type 2',
      source: 'Patient Profile',
      severity: 'medium',
      detectedAt: new Date().toISOString()
    };

    const medicationFlag: RedFlag = {
      type: 'medication_interaction',
      description: 'Potential drug interaction',
      source: 'Treatment Plan',
      severity: 'high',
      detectedAt: new Date().toISOString()
    };

    expect(allergyFlag.type).toBe('allergy');
    expect(chronicFlag.type).toBe('chronic_condition');
    expect(medicationFlag.type).toBe('medication_interaction');
  });

  test('RedFlag severity levels are correctly constrained', () => {
    const criticalFlag: RedFlag = {
      type: 'allergy',
      description: 'Severe allergy',
      source: 'Medical Report',
      severity: 'critical',
      detectedAt: new Date().toISOString()
    };

    const highFlag: RedFlag = {
      ...criticalFlag,
      severity: 'high'
    };

    const mediumFlag: RedFlag = {
      ...criticalFlag,
      severity: 'medium'
    };

    expect(criticalFlag.severity).toBe('critical');
    expect(highFlag.severity).toBe('high');
    expect(mediumFlag.severity).toBe('medium');
  });

  test('PatientSummary type is correctly defined', () => {
    const summary: PatientSummary = {
      patient: {
        patientId: 'patient-123',
        name: 'Test Patient',
        age: 45,
        gender: 'Male',
        contact: '+91-9876543210',
        createdAt: new Date().toISOString()
      },
      diagnosisSessions: [],
      symptoms: [],
      reports: [],
      aiAnalysis: {
        overallHealthStatus: 'Good',
        chronicConditions: [],
        recentSymptomPatterns: [],
        reportTrends: [],
        recommendations: [],
        criticalAlerts: []
      },
      redFlags: [],
      treatmentHistory: [],
      generatedAt: new Date().toISOString()
    };

    expect(summary.patient.patientId).toBe('patient-123');
    expect(summary.diagnosisSessions).toEqual([]);
    expect(summary.generatedAt).toBeDefined();
  });

  test('PatientSummary with complete data', () => {
    const summary: PatientSummary = {
      patient: {
        patientId: 'patient-123',
        name: 'Test Patient',
        age: 45,
        gender: 'Male',
        contact: '+91-9876543210',
        createdAt: new Date().toISOString()
      },
      diagnosisSessions: [
        {
          sessionId: 'session-123',
          date: new Date().toISOString(),
          initialSymptoms: {
            bodyPart: 'chest',
            duration: '3 days',
            severity: 'moderate',
            associatedFactors: []
          },
          finalDiseases: [],
          totalRounds: 4,
          confidenceScore: 0.85,
          keyFindings: []
        }
      ],
      symptoms: [],
      reports: [
        {
          reportId: 'report-789',
          reportType: 'ECG',
          uploadDate: new Date().toISOString(),
          s3Key: 'patient-123/reports/report-789.pdf',
          pdfUrl: 'https://s3.amazonaws.com/presigned-url',
          summary: {
            keyFindings: [],
            diagnoses: [],
            medications: [],
            procedures: [],
            recommendations: [],
            redFlags: []
          },
          aiInsights: []
        }
      ],
      aiAnalysis: {
        overallHealthStatus: 'Concerning cardiac symptoms',
        chronicConditions: [],
        recentSymptomPatterns: ['Exertional chest pain'],
        reportTrends: [],
        recommendations: ['Urgent cardiology consultation'],
        criticalAlerts: ['High probability cardiac etiology']
      },
      redFlags: [
        {
          type: 'high_risk',
          description: 'Angina Pectoris',
          source: 'Diagnosis Session',
          severity: 'high',
          detectedAt: new Date().toISOString()
        }
      ],
      treatmentHistory: [],
      generatedAt: new Date().toISOString()
    };

    expect(summary.diagnosisSessions).toHaveLength(1);
    expect(summary.reports).toHaveLength(1);
    expect(summary.redFlags).toHaveLength(1);
    expect(summary.aiAnalysis.criticalAlerts).toHaveLength(1);
  });
});

// Unit tests for diagnosis database operations

import { DiagnosisSession, DiseaseCandidate, QuestionRound, TargetedQuestion, QuestionAnswer } from './types';

describe('Diagnosis Database Types', () => {
  test('DiagnosisSession type is correctly defined', () => {
    const session: DiagnosisSession = {
      sessionId: 'session-123',
      patientId: 'patient-456',
      currentRound: 1,
      initialSymptoms: {
        bodyPart: 'chest',
        duration: '3 days',
        severity: 'moderate',
        associatedFactors: ['shortness of breath'],
        timing: 'worse with exertion',
        character: 'pressure-like'
      },
      possibleDiseases: [],
      questionHistory: [],
      confidenceScore: 0.0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    expect(session.sessionId).toBe('session-123');
    expect(session.status).toBe('active');
    expect(session.currentRound).toBe(1);
  });

  test('DiseaseCandidate type is correctly defined', () => {
    const disease: DiseaseCandidate = {
      diseaseName: 'Angina Pectoris',
      probability: 0.75,
      supportingSymptoms: ['chest pressure', 'exertional'],
      missingSymptoms: ['radiation pattern']
    };

    expect(disease.diseaseName).toBe('Angina Pectoris');
    expect(disease.probability).toBe(0.75);
    expect(disease.supportingSymptoms).toHaveLength(2);
  });

  test('TargetedQuestion type is correctly defined', () => {
    const question: TargetedQuestion = {
      questionId: 'q1',
      questionText: 'Does the discomfort spread to your arm?',
      questionType: 'yes_no',
      targetDiseases: ['Angina Pectoris', 'Myocardial Infarction'],
      importance: 'high'
    };

    expect(question.questionType).toBe('yes_no');
    expect(question.importance).toBe('high');
    expect(question.targetDiseases).toHaveLength(2);
  });

  test('QuestionAnswer type is correctly defined', () => {
    const answer: QuestionAnswer = {
      questionId: 'q1',
      answer: 'yes',
      timestamp: new Date().toISOString()
    };

    expect(answer.questionId).toBe('q1');
    expect(answer.answer).toBe('yes');
  });

  test('QuestionRound type is correctly defined', () => {
    const round: QuestionRound = {
      roundNumber: 1,
      questions: [],
      answers: [],
      diseasesBeforeRound: [],
      diseasesAfterRound: [],
      timestamp: new Date().toISOString()
    };

    expect(round.roundNumber).toBe(1);
    expect(round.questions).toEqual([]);
  });

  test('Session status can be active or completed', () => {
    const activeSession: DiagnosisSession = {
      sessionId: 'session-1',
      patientId: 'patient-1',
      currentRound: 1,
      initialSymptoms: {
        bodyPart: 'head',
        duration: '2 days',
        severity: 'mild',
        associatedFactors: []
      },
      possibleDiseases: [],
      questionHistory: [],
      confidenceScore: 0.0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const completedSession: DiagnosisSession = {
      ...activeSession,
      status: 'completed'
    };

    expect(activeSession.status).toBe('active');
    expect(completedSession.status).toBe('completed');
  });

  test('Question types are correctly constrained', () => {
    const yesNoQuestion: TargetedQuestion = {
      questionId: 'q1',
      questionText: 'Do you have pain?',
      questionType: 'yes_no',
      targetDiseases: [],
      importance: 'high'
    };

    const multipleChoiceQuestion: TargetedQuestion = {
      questionId: 'q2',
      questionText: 'What type of pain?',
      questionType: 'multiple_choice',
      targetDiseases: [],
      importance: 'medium',
      options: ['Sharp', 'Dull', 'Burning']
    };

    const scaleQuestion: TargetedQuestion = {
      questionId: 'q3',
      questionText: 'Rate the pain from 1-10',
      questionType: 'scale',
      targetDiseases: [],
      importance: 'medium'
    };

    expect(yesNoQuestion.questionType).toBe('yes_no');
    expect(multipleChoiceQuestion.questionType).toBe('multiple_choice');
    expect(multipleChoiceQuestion.options).toHaveLength(3);
    expect(scaleQuestion.questionType).toBe('scale');
  });

  test('Importance levels are correctly constrained', () => {
    const highImportance: TargetedQuestion = {
      questionId: 'q1',
      questionText: 'Critical question',
      questionType: 'yes_no',
      targetDiseases: [],
      importance: 'high'
    };

    const mediumImportance: TargetedQuestion = {
      ...highImportance,
      importance: 'medium'
    };

    const lowImportance: TargetedQuestion = {
      ...highImportance,
      importance: 'low'
    };

    expect(highImportance.importance).toBe('high');
    expect(mediumImportance.importance).toBe('medium');
    expect(lowImportance.importance).toBe('low');
  });
});

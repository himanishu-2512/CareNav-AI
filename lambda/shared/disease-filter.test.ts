/**
 * Tests for Disease Name Filter
 * 
 * Validates Requirements: 3.6, 4.1, 4.2
 */

import {
  filterDiseaseNames,
  containsDiseaseNames,
  validateNoDiseaseNames,
  extractDiseaseNames,
  FilterResult
} from './disease-filter';
import { TargetedQuestion, DiseaseCandidate } from './types';

describe('Disease Name Filter', () => {
  // Sample disease candidates for testing
  const sampleDiseases: DiseaseCandidate[] = [
    {
      diseaseName: 'Angina Pectoris',
      probability: 0.65,
      supportingSymptoms: ['chest pressure', 'exertional'],
      missingSymptoms: ['previous episodes']
    },
    {
      diseaseName: 'Myocardial Infarction',
      probability: 0.25,
      supportingSymptoms: ['chest discomfort', 'sweating'],
      missingSymptoms: ['sudden onset']
    },
    {
      diseaseName: 'GERD',
      probability: 0.10,
      supportingSymptoms: ['chest discomfort'],
      missingSymptoms: ['burning sensation']
    }
  ];

  // Sample clean questions (no disease names)
  const cleanQuestions: TargetedQuestion[] = [
    {
      questionId: 'q1',
      questionText: 'Does the discomfort spread to your arm, neck, or jaw?',
      questionType: 'yes_no',
      targetDiseases: ['Angina Pectoris', 'Myocardial Infarction'],
      importance: 'high'
    },
    {
      questionId: 'q2',
      questionText: 'Does resting make the discomfort better?',
      questionType: 'yes_no',
      targetDiseases: ['Angina Pectoris'],
      importance: 'high'
    },
    {
      questionId: 'q3',
      questionText: 'Do you notice the discomfort more after eating?',
      questionType: 'yes_no',
      targetDiseases: ['GERD'],
      importance: 'medium'
    }
  ];

  // Sample questions with disease names (should be filtered)
  const contaminatedQuestions: TargetedQuestion[] = [
    {
      questionId: 'q1_bad',
      questionText: 'Is your angina worse with exertion?',
      questionType: 'yes_no',
      targetDiseases: ['Angina Pectoris'],
      importance: 'high'
    },
    {
      questionId: 'q2_bad',
      questionText: 'Have you been diagnosed with GERD before?',
      questionType: 'yes_no',
      targetDiseases: ['GERD'],
      importance: 'medium'
    },
    {
      questionId: 'q3_bad',
      questionText: 'Do you have symptoms of myocardial infarction?',
      questionType: 'yes_no',
      targetDiseases: ['Myocardial Infarction'],
      importance: 'high'
    }
  ];

  describe('filterDiseaseNames', () => {
    test('should return all questions as clean when no disease names present', () => {
      const result = filterDiseaseNames(cleanQuestions, sampleDiseases);

      expect(result.cleanQuestions).toHaveLength(3);
      expect(result.flaggedQuestions).toHaveLength(0);
      expect(result.totalFiltered).toBe(0);
    });

    test('should flag questions containing disease names', () => {
      const result = filterDiseaseNames(contaminatedQuestions, sampleDiseases);

      expect(result.cleanQuestions).toHaveLength(0);
      expect(result.flaggedQuestions).toHaveLength(3);
      expect(result.totalFiltered).toBe(3);
    });

    test('should handle mixed clean and contaminated questions', () => {
      const mixed = [...cleanQuestions, ...contaminatedQuestions];
      const result = filterDiseaseNames(mixed, sampleDiseases);

      expect(result.cleanQuestions).toHaveLength(3);
      expect(result.flaggedQuestions).toHaveLength(3);
      expect(result.totalFiltered).toBe(3);
    });

    test('should handle empty questions array', () => {
      const result = filterDiseaseNames([], sampleDiseases);

      expect(result.cleanQuestions).toHaveLength(0);
      expect(result.flaggedQuestions).toHaveLength(0);
      expect(result.totalFiltered).toBe(0);
    });

    test('should handle empty diseases array', () => {
      const result = filterDiseaseNames(cleanQuestions, []);

      expect(result.cleanQuestions).toHaveLength(3);
      expect(result.flaggedQuestions).toHaveLength(0);
      expect(result.totalFiltered).toBe(0);
    });

    test('should be case-insensitive', () => {
      const questions: TargetedQuestion[] = [
        {
          questionId: 'q1',
          questionText: 'Do you have ANGINA symptoms?',
          questionType: 'yes_no',
          targetDiseases: ['Angina Pectoris'],
          importance: 'high'
        },
        {
          questionId: 'q2',
          questionText: 'Is your gerd acting up?',
          questionType: 'yes_no',
          targetDiseases: ['GERD'],
          importance: 'medium'
        }
      ];

      const result = filterDiseaseNames(questions, sampleDiseases);

      expect(result.cleanQuestions).toHaveLength(0);
      expect(result.flaggedQuestions).toHaveLength(2);
      expect(result.totalFiltered).toBe(2);
    });

    test('should handle partial word matches correctly', () => {
      const questions: TargetedQuestion[] = [
        {
          questionId: 'q1',
          questionText: 'Do you have chest pain?', // "pain" should not match "Spain"
          questionType: 'yes_no',
          targetDiseases: [],
          importance: 'high'
        },
        {
          questionId: 'q2',
          questionText: 'Is the discomfort anginal in nature?', // "anginal" contains "angina"
          questionType: 'yes_no',
          targetDiseases: ['Angina Pectoris'],
          importance: 'high'
        }
      ];

      const result = filterDiseaseNames(questions, sampleDiseases);

      // "chest pain" should be clean
      // "anginal" should be flagged because it contains "angina" as a word part
      expect(result.cleanQuestions).toHaveLength(1);
      expect(result.cleanQuestions[0].questionId).toBe('q1');
      expect(result.flaggedQuestions).toHaveLength(1);
      expect(result.flaggedQuestions[0].questionId).toBe('q2');
    });

    test('should handle multi-word disease names', () => {
      const questions: TargetedQuestion[] = [
        {
          questionId: 'q1',
          questionText: 'Do you have myocardial symptoms?',
          questionType: 'yes_no',
          targetDiseases: ['Myocardial Infarction'],
          importance: 'high'
        },
        {
          questionId: 'q2',
          questionText: 'Is there any infarction present?',
          questionType: 'yes_no',
          targetDiseases: ['Myocardial Infarction'],
          importance: 'high'
        }
      ];

      const result = filterDiseaseNames(questions, sampleDiseases);

      // Both should be flagged as they contain parts of "Myocardial Infarction"
      expect(result.cleanQuestions).toHaveLength(0);
      expect(result.flaggedQuestions).toHaveLength(2);
    });
  });

  describe('containsDiseaseNames', () => {
    const diseaseNames = ['angina pectoris', 'myocardial infarction', 'gerd'];

    test('should return false for clean text', () => {
      expect(containsDiseaseNames('Does the discomfort spread to your arm?', diseaseNames)).toBe(false);
      expect(containsDiseaseNames('Do you have chest pain?', diseaseNames)).toBe(false);
      expect(containsDiseaseNames('Is the pain worse with exertion?', diseaseNames)).toBe(false);
    });

    test('should return true for text containing disease names', () => {
      expect(containsDiseaseNames('Is your angina worse?', diseaseNames)).toBe(true);
      expect(containsDiseaseNames('Do you have GERD?', diseaseNames)).toBe(true);
      expect(containsDiseaseNames('Symptoms of myocardial infarction', diseaseNames)).toBe(true);
    });

    test('should be case-insensitive', () => {
      expect(containsDiseaseNames('ANGINA symptoms', diseaseNames)).toBe(true);
      expect(containsDiseaseNames('gerd diagnosis', diseaseNames)).toBe(true);
      expect(containsDiseaseNames('Myocardial issues', diseaseNames)).toBe(true);
    });

    test('should handle empty inputs', () => {
      expect(containsDiseaseNames('', diseaseNames)).toBe(false);
      expect(containsDiseaseNames('Some text', [])).toBe(false);
      expect(containsDiseaseNames('', [])).toBe(false);
    });

    test('should match whole words only', () => {
      // "pain" should not match "Spain"
      expect(containsDiseaseNames('I visited Spain', ['pain'])).toBe(false);
      
      // "angina" should match in "angina pectoris"
      expect(containsDiseaseNames('angina pectoris', ['angina'])).toBe(true);
    });

    test('should handle special characters in disease names', () => {
      const specialDiseases = ['crohn\'s disease', 'alzheimer\'s'];
      
      expect(containsDiseaseNames('Do you have Crohn\'s disease?', specialDiseases)).toBe(true);
      expect(containsDiseaseNames('Alzheimer\'s symptoms', specialDiseases)).toBe(true);
    });
  });

  describe('validateNoDiseaseNames', () => {
    test('should not throw for clean questions', () => {
      expect(() => {
        validateNoDiseaseNames(cleanQuestions, sampleDiseases);
      }).not.toThrow();
    });

    test('should throw for contaminated questions', () => {
      expect(() => {
        validateNoDiseaseNames(contaminatedQuestions, sampleDiseases);
      }).toThrow('Questions contain disease names');
    });

    test('should include flagged questions in error message', () => {
      try {
        validateNoDiseaseNames(contaminatedQuestions, sampleDiseases);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('Is your angina worse with exertion?');
        expect(error.message).toContain('Have you been diagnosed with GERD before?');
      }
    });

    test('should not throw for empty arrays', () => {
      expect(() => {
        validateNoDiseaseNames([], sampleDiseases);
      }).not.toThrow();

      expect(() => {
        validateNoDiseaseNames(cleanQuestions, []);
      }).not.toThrow();
    });
  });

  describe('extractDiseaseNames', () => {
    test('should extract disease names in lowercase', () => {
      const names = extractDiseaseNames(sampleDiseases);

      expect(names).toHaveLength(3);
      expect(names).toContain('angina pectoris');
      expect(names).toContain('myocardial infarction');
      expect(names).toContain('gerd');
    });

    test('should handle empty array', () => {
      const names = extractDiseaseNames([]);
      expect(names).toHaveLength(0);
    });

    test('should normalize to lowercase', () => {
      const diseases: DiseaseCandidate[] = [
        {
          diseaseName: 'UPPERCASE DISEASE',
          probability: 0.5,
          supportingSymptoms: [],
          missingSymptoms: []
        }
      ];

      const names = extractDiseaseNames(diseases);
      expect(names[0]).toBe('uppercase disease');
    });
  });

  describe('Edge Cases', () => {
    test('should handle questions with punctuation', () => {
      const questions: TargetedQuestion[] = [
        {
          questionId: 'q1',
          questionText: 'Do you have angina? Please describe.',
          questionType: 'text',
          targetDiseases: ['Angina Pectoris'],
          importance: 'high'
        }
      ];

      const result = filterDiseaseNames(questions, sampleDiseases);
      expect(result.flaggedQuestions).toHaveLength(1);
    });

    test('should handle questions with numbers', () => {
      const questions: TargetedQuestion[] = [
        {
          questionId: 'q1',
          questionText: 'Rate your angina from 1-10',
          questionType: 'scale',
          targetDiseases: ['Angina Pectoris'],
          importance: 'high'
        }
      ];

      const result = filterDiseaseNames(questions, sampleDiseases);
      expect(result.flaggedQuestions).toHaveLength(1);
    });

    test('should handle very long disease names', () => {
      const diseases: DiseaseCandidate[] = [
        {
          diseaseName: 'Chronic Obstructive Pulmonary Disease with Acute Exacerbation',
          probability: 0.5,
          supportingSymptoms: [],
          missingSymptoms: []
        }
      ];

      const questions: TargetedQuestion[] = [
        {
          questionId: 'q1',
          questionText: 'Do you have chronic breathing issues?',
          questionType: 'yes_no',
          targetDiseases: [],
          importance: 'high'
        }
      ];

      const result = filterDiseaseNames(questions, diseases);
      // Should flag because "chronic" is a word in the disease name
      expect(result.flaggedQuestions).toHaveLength(1);
    });

    test('should handle diseases with abbreviations', () => {
      const diseases: DiseaseCandidate[] = [
        {
          diseaseName: 'COPD',
          probability: 0.5,
          supportingSymptoms: [],
          missingSymptoms: []
        }
      ];

      const questions: TargetedQuestion[] = [
        {
          questionId: 'q1',
          questionText: 'Do you have COPD symptoms?',
          questionType: 'yes_no',
          targetDiseases: ['COPD'],
          importance: 'high'
        }
      ];

      const result = filterDiseaseNames(questions, diseases);
      expect(result.flaggedQuestions).toHaveLength(1);
    });
  });

  describe('Integration with Question Generation', () => {
    test('should filter questions from AI response', () => {
      // Simulate AI returning questions with disease names
      const aiGeneratedQuestions: TargetedQuestion[] = [
        {
          questionId: 'q1',
          questionText: 'Does the discomfort spread to your arm?',
          questionType: 'yes_no',
          targetDiseases: ['Angina Pectoris'],
          importance: 'high'
        },
        {
          questionId: 'q2',
          questionText: 'Is your angina worse with exertion?', // BAD - contains disease name
          questionType: 'yes_no',
          targetDiseases: ['Angina Pectoris'],
          importance: 'high'
        },
        {
          questionId: 'q3',
          questionText: 'Do you have chest pain?',
          questionType: 'yes_no',
          targetDiseases: ['Myocardial Infarction'],
          importance: 'high'
        }
      ];

      const result = filterDiseaseNames(aiGeneratedQuestions, sampleDiseases);

      // Should filter out the contaminated question
      expect(result.cleanQuestions).toHaveLength(2);
      expect(result.flaggedQuestions).toHaveLength(1);
      expect(result.flaggedQuestions[0].questionId).toBe('q2');

      // Clean questions should be safe to show to patient
      result.cleanQuestions.forEach(q => {
        expect(q.questionText).not.toMatch(/angina|gerd|myocardial|infarction/i);
      });
    });
  });
});

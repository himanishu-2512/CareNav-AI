// Unit tests for adherence calculation module
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculatePatientAdherence,
  calculateMedicineAdherence,
  generateAdherenceTrends,
  identifyLowAdherencePatients,
  getMissedDoses
} from './adherence-calculator';
import * as treatmentDb from './treatment-db';
import * as dynamodbClient from './dynamodb-client';

// Mock the dependencies
vi.mock('./treatment-db');
vi.mock('./dynamodb-client');

describe('Adherence Calculator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculatePatientAdherence', () => {
    it('should calculate overall adherence correctly', async () => {
      // Mock treatment plans
      const mockTreatmentPlans = [
        {
          treatmentPlanId: 'plan-1',
          patientId: 'patient-1',
          doctorId: 'doctor-1',
          prescriptions: [
            {
              medicineId: 'med-1',
              medicineName: 'Aspirin',
              dosage: '75mg',
              frequency: 'once daily',
              times: ['08:00'],
              startDate: '2024-01-01T00:00:00.000Z',
              stopDate: '2024-01-31T00:00:00.000Z'
            }
          ],
          createdAt: '2024-01-01T00:00:00.000Z'
        }
      ];

      // Mock dose records: 10 scheduled, 8 taken
      const mockDoses = [
        ...Array(8).fill(null).map((_, i) => ({
          patientId: 'patient-1',
          medicineId: 'med-1',
          medicineName: 'Aspirin',
          dosage: '75mg',
          scheduledDate: `2024-01-${String(i + 1).padStart(2, '0')}`,
          scheduledTime: '08:00',
          status: 'taken',
          takenAt: `2024-01-${String(i + 1).padStart(2, '0')}T08:15:00.000Z`,
          createdAt: `2024-01-${String(i + 1).padStart(2, '0')}T08:00:00.000Z`
        })),
        ...Array(2).fill(null).map((_, i) => ({
          patientId: 'patient-1',
          medicineId: 'med-1',
          medicineName: 'Aspirin',
          dosage: '75mg',
          scheduledDate: `2024-01-${String(i + 9).padStart(2, '0')}`,
          scheduledTime: '08:00',
          status: 'missed',
          takenAt: null,
          createdAt: `2024-01-${String(i + 9).padStart(2, '0')}T08:00:00.000Z`
        }))
      ];

      vi.mocked(treatmentDb.getPatientTreatmentPlans).mockResolvedValue(mockTreatmentPlans);
      vi.mocked(dynamodbClient.dynamoDbClient.send).mockResolvedValue({
        Items: mockDoses,
        $metadata: {}
      });

      const result = await calculatePatientAdherence('patient-1');

      expect(result.patientId).toBe('patient-1');
      expect(result.overallAdherence).toBe(80); // 8/10 = 80%
      expect(result.totalScheduled).toBe(10);
      expect(result.totalTaken).toBe(8);
      expect(result.totalMissed).toBe(2);
      expect(result.isLowAdherence).toBe(false); // 80% is not < 80%
      expect(result.medicineAdherence).toHaveLength(1);
      expect(result.medicineAdherence[0].adherencePercentage).toBe(80);
    });

    it('should identify low adherence patients (< 80%)', async () => {
      const mockTreatmentPlans = [
        {
          treatmentPlanId: 'plan-1',
          patientId: 'patient-1',
          doctorId: 'doctor-1',
          prescriptions: [
            {
              medicineId: 'med-1',
              medicineName: 'Aspirin',
              dosage: '75mg',
              frequency: 'once daily',
              times: ['08:00'],
              startDate: '2024-01-01T00:00:00.000Z',
              stopDate: '2024-01-31T00:00:00.000Z'
            }
          ],
          createdAt: '2024-01-01T00:00:00.000Z'
        }
      ];

      // Mock dose records: 10 scheduled, 7 taken (70% adherence)
      const mockDoses = [
        ...Array(7).fill(null).map((_, i) => ({
          patientId: 'patient-1',
          medicineId: 'med-1',
          medicineName: 'Aspirin',
          dosage: '75mg',
          scheduledDate: `2024-01-${String(i + 1).padStart(2, '0')}`,
          scheduledTime: '08:00',
          status: 'taken',
          takenAt: `2024-01-${String(i + 1).padStart(2, '0')}T08:15:00.000Z`,
          createdAt: `2024-01-${String(i + 1).padStart(2, '0')}T08:00:00.000Z`
        })),
        ...Array(3).fill(null).map((_, i) => ({
          patientId: 'patient-1',
          medicineId: 'med-1',
          medicineName: 'Aspirin',
          dosage: '75mg',
          scheduledDate: `2024-01-${String(i + 8).padStart(2, '0')}`,
          scheduledTime: '08:00',
          status: 'missed',
          takenAt: null,
          createdAt: `2024-01-${String(i + 8).padStart(2, '0')}T08:00:00.000Z`
        }))
      ];

      vi.mocked(treatmentDb.getPatientTreatmentPlans).mockResolvedValue(mockTreatmentPlans);
      vi.mocked(dynamodbClient.dynamoDbClient.send).mockResolvedValue({
        Items: mockDoses,
        $metadata: {}
      });

      const result = await calculatePatientAdherence('patient-1');

      expect(result.overallAdherence).toBe(70); // 7/10 = 70%
      expect(result.isLowAdherence).toBe(true); // 70% < 80%
    });

    it('should return zero adherence for patient with no treatment plans', async () => {
      vi.mocked(treatmentDb.getPatientTreatmentPlans).mockResolvedValue([]);

      const result = await calculatePatientAdherence('patient-1');

      expect(result.overallAdherence).toBe(0);
      expect(result.totalScheduled).toBe(0);
      expect(result.totalTaken).toBe(0);
      expect(result.isLowAdherence).toBe(false);
    });
  });

  describe('calculateMedicineAdherence', () => {
    it('should calculate adherence for a specific medicine', async () => {
      const mockTreatmentPlans = [
        {
          treatmentPlanId: 'plan-1',
          patientId: 'patient-1',
          doctorId: 'doctor-1',
          prescriptions: [
            {
              medicineId: 'med-1',
              medicineName: 'Aspirin',
              dosage: '75mg',
              frequency: 'once daily',
              times: ['08:00'],
              startDate: '2024-01-01T00:00:00.000Z',
              stopDate: '2024-01-31T00:00:00.000Z'
            }
          ],
          createdAt: '2024-01-01T00:00:00.000Z'
        }
      ];

      const mockDoses = Array(5).fill(null).map((_, i) => ({
        patientId: 'patient-1',
        medicineId: 'med-1',
        medicineName: 'Aspirin',
        dosage: '75mg',
        scheduledDate: `2024-01-${String(i + 1).padStart(2, '0')}`,
        scheduledTime: '08:00',
        status: i < 4 ? 'taken' : 'missed',
        takenAt: i < 4 ? `2024-01-${String(i + 1).padStart(2, '0')}T08:15:00.000Z` : null,
        createdAt: `2024-01-${String(i + 1).padStart(2, '0')}T08:00:00.000Z`
      }));

      vi.mocked(treatmentDb.getPatientTreatmentPlans).mockResolvedValue(mockTreatmentPlans);
      vi.mocked(dynamodbClient.dynamoDbClient.send).mockResolvedValue({
        Items: mockDoses,
        $metadata: {}
      });

      const result = await calculateMedicineAdherence('patient-1', 'med-1');

      expect(result).not.toBeNull();
      expect(result?.medicineId).toBe('med-1');
      expect(result?.adherencePercentage).toBe(80); // 4/5 = 80%
      expect(result?.scheduled).toBe(5);
      expect(result?.taken).toBe(4);
      expect(result?.missed).toBe(1);
    });

    it('should return null for non-existent medicine', async () => {
      vi.mocked(treatmentDb.getPatientTreatmentPlans).mockResolvedValue([]);

      const result = await calculateMedicineAdherence('patient-1', 'non-existent');

      expect(result).toBeNull();
    });
  });

  describe('generateAdherenceTrends', () => {
    it('should generate daily adherence trends', async () => {
      const mockDoses = [
        {
          patientId: 'patient-1',
          medicineId: 'med-1',
          medicineName: 'Aspirin',
          dosage: '75mg',
          scheduledDate: '2024-01-01',
          scheduledTime: '08:00',
          status: 'taken',
          takenAt: '2024-01-01T08:15:00.000Z',
          createdAt: '2024-01-01T08:00:00.000Z'
        },
        {
          patientId: 'patient-1',
          medicineId: 'med-1',
          medicineName: 'Aspirin',
          dosage: '75mg',
          scheduledDate: '2024-01-02',
          scheduledTime: '08:00',
          status: 'missed',
          takenAt: null,
          createdAt: '2024-01-02T08:00:00.000Z'
        }
      ];

      vi.mocked(dynamodbClient.dynamoDbClient.send).mockResolvedValue({
        Items: mockDoses,
        $metadata: {}
      });

      const result = await generateAdherenceTrends(
        'patient-1',
        'daily',
        '2024-01-01',
        '2024-01-02'
      );

      expect(result).toHaveLength(2);
      expect(result[0].date).toBe('2024-01-01');
      expect(result[0].adherencePercentage).toBe(100); // 1/1 = 100%
      expect(result[1].date).toBe('2024-01-02');
      expect(result[1].adherencePercentage).toBe(0); // 0/1 = 0%
    });

    it('should generate weekly adherence trends', async () => {
      // Create 14 days of doses (2 weeks)
      const mockDoses = Array(14).fill(null).map((_, i) => ({
        patientId: 'patient-1',
        medicineId: 'med-1',
        medicineName: 'Aspirin',
        dosage: '75mg',
        scheduledDate: `2024-01-${String(i + 1).padStart(2, '0')}`,
        scheduledTime: '08:00',
        status: i % 2 === 0 ? 'taken' : 'missed', // 50% adherence
        takenAt: i % 2 === 0 ? `2024-01-${String(i + 1).padStart(2, '0')}T08:15:00.000Z` : null,
        createdAt: `2024-01-${String(i + 1).padStart(2, '0')}T08:00:00.000Z`
      }));

      vi.mocked(dynamodbClient.dynamoDbClient.send).mockResolvedValue({
        Items: mockDoses,
        $metadata: {}
      });

      const result = await generateAdherenceTrends(
        'patient-1',
        'weekly',
        '2024-01-01',
        '2024-01-14'
      );

      expect(result.length).toBeGreaterThan(0);
      // Each week should have approximately 50% adherence
      result.forEach(trend => {
        expect(trend.adherencePercentage).toBeGreaterThanOrEqual(0);
        expect(trend.adherencePercentage).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('identifyLowAdherencePatients', () => {
    it('should identify patients with adherence < 80%', async () => {
      // Mock patient 1 with 70% adherence
      const mockTreatmentPlans1 = [
        {
          treatmentPlanId: 'plan-1',
          patientId: 'patient-1',
          doctorId: 'doctor-1',
          prescriptions: [
            {
              medicineId: 'med-1',
              medicineName: 'Aspirin',
              dosage: '75mg',
              frequency: 'once daily',
              times: ['08:00'],
              startDate: '2024-01-01T00:00:00.000Z',
              stopDate: '2024-01-31T00:00:00.000Z'
            }
          ],
          createdAt: '2024-01-01T00:00:00.000Z'
        }
      ];

      const mockDoses1 = [
        ...Array(7).fill(null).map((_, i) => ({
          patientId: 'patient-1',
          medicineId: 'med-1',
          status: 'taken'
        })),
        ...Array(3).fill(null).map((_, i) => ({
          patientId: 'patient-1',
          medicineId: 'med-1',
          status: 'missed'
        }))
      ];

      // Mock patient 2 with 90% adherence
      const mockTreatmentPlans2 = [
        {
          treatmentPlanId: 'plan-2',
          patientId: 'patient-2',
          doctorId: 'doctor-1',
          prescriptions: [
            {
              medicineId: 'med-2',
              medicineName: 'Metformin',
              dosage: '500mg',
              frequency: 'once daily',
              times: ['08:00'],
              startDate: '2024-01-01T00:00:00.000Z',
              stopDate: '2024-01-31T00:00:00.000Z'
            }
          ],
          createdAt: '2024-01-01T00:00:00.000Z'
        }
      ];

      const mockDoses2 = [
        ...Array(9).fill(null).map((_, i) => ({
          patientId: 'patient-2',
          medicineId: 'med-2',
          status: 'taken'
        })),
        {
          patientId: 'patient-2',
          medicineId: 'med-2',
          status: 'missed'
        }
      ];

      vi.mocked(treatmentDb.getPatientTreatmentPlans)
        .mockResolvedValueOnce(mockTreatmentPlans1)
        .mockResolvedValueOnce(mockTreatmentPlans2);

      vi.mocked(dynamodbClient.dynamoDbClient.send)
        .mockResolvedValueOnce({ Items: mockDoses1, $metadata: {} })
        .mockResolvedValueOnce({ Items: mockDoses2, $metadata: {} });

      const result = await identifyLowAdherencePatients(['patient-1', 'patient-2']);

      expect(result).toContain('patient-1'); // 70% < 80%
      expect(result).not.toContain('patient-2'); // 90% >= 80%
    });
  });

  describe('getMissedDoses', () => {
    it('should return all missed doses for a patient', async () => {
      const mockDoses = [
        {
          patientId: 'patient-1',
          medicineId: 'med-1',
          medicineName: 'Aspirin',
          dosage: '75mg',
          scheduledDate: '2024-01-01',
          scheduledTime: '08:00',
          status: 'taken',
          takenAt: '2024-01-01T08:15:00.000Z',
          createdAt: '2024-01-01T08:00:00.000Z'
        },
        {
          patientId: 'patient-1',
          medicineId: 'med-1',
          medicineName: 'Aspirin',
          dosage: '75mg',
          scheduledDate: '2024-01-02',
          scheduledTime: '08:00',
          status: 'missed',
          takenAt: null,
          createdAt: '2024-01-02T08:00:00.000Z'
        },
        {
          patientId: 'patient-1',
          medicineId: 'med-1',
          medicineName: 'Aspirin',
          dosage: '75mg',
          scheduledDate: '2024-01-03',
          scheduledTime: '08:00',
          status: 'due',
          takenAt: null,
          createdAt: '2024-01-03T08:00:00.000Z'
        }
      ];

      vi.mocked(dynamodbClient.dynamoDbClient.send).mockResolvedValue({
        Items: mockDoses,
        $metadata: {}
      });

      const result = await getMissedDoses('patient-1');

      expect(result).toHaveLength(2); // 'missed' and 'due' statuses
      expect(result.every(dose => dose.status === 'missed' || dose.status === 'due')).toBe(true);
    });

    it('should filter missed doses by date range', async () => {
      const mockDoses = [
        {
          patientId: 'patient-1',
          medicineId: 'med-1',
          scheduledDate: '2024-01-01',
          status: 'missed'
        },
        {
          patientId: 'patient-1',
          medicineId: 'med-1',
          scheduledDate: '2024-01-05',
          status: 'missed'
        },
        {
          patientId: 'patient-1',
          medicineId: 'med-1',
          scheduledDate: '2024-01-10',
          status: 'missed'
        }
      ];

      vi.mocked(dynamodbClient.dynamoDbClient.send).mockResolvedValue({
        Items: mockDoses,
        $metadata: {}
      });

      const result = await getMissedDoses('patient-1', '2024-01-03', '2024-01-08');

      expect(result).toHaveLength(1);
      expect(result[0].scheduledDate).toBe('2024-01-05');
    });
  });
});

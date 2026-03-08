import React, { useState } from 'react';
import axios from '../lib/axios';
import { useAuth } from '../contexts/AuthContext';

interface Prescription {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: number;
  specialInstructions?: string;
}

interface GeneratedSchedule {
  medicineName: string;
  dosage: string;
  frequency: string;
  doseTimes: string[];
  startDate: string;
  stopDate: string;
  specialInstructions?: string;
}

export const TreatmentPlanner: React.FC = () => {
  const { user } = useAuth();
  const [patientId, setPatientId] = useState('');
  const [prescription, setPrescription] = useState<Prescription>({
    medicineName: '',
    dosage: '',
    frequency: 'once daily',
    duration: 7,
    specialInstructions: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [generatedSchedule, setGeneratedSchedule] = useState<GeneratedSchedule | null>(null);

  const frequencyOptions = [
    'once daily',
    'twice daily',
    'three times daily',
    'every 4 hours',
    'every 6 hours',
    'every 8 hours',
    'every 12 hours',
  ];

  const handleInputChange = (field: keyof Prescription, value: string | number) => {
    setPrescription((prev) => ({ ...prev, [field]: value }));
    setError('');
    setSuccess(false);
    setGeneratedSchedule(null);
  };

  const validateForm = (): string | null => {
    if (!patientId.trim()) {
      return 'Patient ID is required';
    }
    if (!prescription.medicineName.trim()) {
      return 'Medicine name is required';
    }
    if (!prescription.dosage.trim()) {
      return 'Dosage is required';
    }
    if (prescription.duration < 1) {
      return 'Duration must be at least 1 day';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await axios.post('/treatment/create', {
        patientId: patientId.trim(),
        doctorId: user?.userId,
        prescriptions: [prescription],
      });

      setGeneratedSchedule(response.data.schedule);
      setSuccess(true);

      // Reset form after successful submission
      setTimeout(() => {
        setPrescription({
          medicineName: '',
          dosage: '',
          frequency: 'once daily',
          duration: 7,
          specialInstructions: '',
        });
        setPatientId('');
        setGeneratedSchedule(null);
      }, 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create treatment plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Demo Data Warning */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              DEMO DATA ONLY - This is a demonstration system. Do not use for actual prescription management.
            </p>
          </div>
        </div>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-6">Treatment Planner</h1>

      {/* Treatment Plan Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient ID */}
          <div>
            <label htmlFor="patientId" className="block text-sm font-medium text-gray-700 mb-2">
              Patient ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="patientId"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter patient ID"
              disabled={loading}
            />
          </div>

          {/* Medicine Name */}
          <div>
            <label htmlFor="medicineName" className="block text-sm font-medium text-gray-700 mb-2">
              Medicine Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="medicineName"
              value={prescription.medicineName}
              onChange={(e) => handleInputChange('medicineName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Amoxicillin"
              disabled={loading}
            />
          </div>

          {/* Dosage */}
          <div>
            <label htmlFor="dosage" className="block text-sm font-medium text-gray-700 mb-2">
              Dosage <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="dosage"
              value={prescription.dosage}
              onChange={(e) => handleInputChange('dosage', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 500mg"
              disabled={loading}
            />
          </div>

          {/* Frequency */}
          <div>
            <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-2">
              Frequency <span className="text-red-500">*</span>
            </label>
            <select
              id="frequency"
              value={prescription.frequency}
              onChange={(e) => handleInputChange('frequency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              {frequencyOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
              Duration (days) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="duration"
              value={prescription.duration}
              onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max="365"
              disabled={loading}
            />
          </div>

          {/* Special Instructions */}
          <div>
            <label htmlFor="specialInstructions" className="block text-sm font-medium text-gray-700 mb-2">
              Special Instructions (Optional)
            </label>
            <textarea
              id="specialInstructions"
              value={prescription.specialInstructions}
              onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="e.g., Take with food, Avoid alcohol"
              disabled={loading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">Treatment plan created successfully!</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? 'Creating Treatment Plan...' : 'Create Treatment Plan'}
          </button>
        </form>
      </div>

      {/* Generated Schedule Preview */}
      {generatedSchedule && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Generated Schedule</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Medicine</p>
                <p className="text-gray-900">{generatedSchedule.medicineName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Dosage</p>
                <p className="text-gray-900">{generatedSchedule.dosage}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Frequency</p>
                <p className="text-gray-900">{generatedSchedule.frequency}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Duration</p>
                <p className="text-gray-900">
                  {generatedSchedule.startDate} to {generatedSchedule.stopDate}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Dose Times</p>
              <div className="flex flex-wrap gap-2">
                {generatedSchedule.doseTimes.map((time, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                  >
                    {time}
                  </span>
                ))}
              </div>
            </div>

            {generatedSchedule.specialInstructions && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">Special Instructions</p>
                <p className="text-sm text-blue-700 mt-1">{generatedSchedule.specialInstructions}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-6 bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              This system assists with treatment planning but does NOT replace clinical judgment. Always verify prescriptions and follow medical protocols.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

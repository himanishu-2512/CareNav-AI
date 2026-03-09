import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from './Header';
import axiosInstance from '../lib/axios';
import { useAuth } from '../contexts/AuthContext';

export default function CreateTreatmentPlan() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [patientId, setPatientId] = useState('');
  const [planName, setPlanName] = useState('');
  const [disease, setDisease] = useState('');
  const [duration, setDuration] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill patient ID from navigation state
  useEffect(() => {
    if (location.state?.patientId) {
      setPatientId(location.state.patientId);
    }
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!patientId || !planName || !disease || !duration) {
      setError('All fields are required');
      return;
    }

    if (!user?.userId) {
      setError('Doctor ID not found. Please log in again.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axiosInstance.post('/treatment/plan/create', {
        patientId,
        doctorId: user.userId,
        planName,
        disease,
        duration
      });

      // Navigate to treatment planner with the new plan ID
      navigate(`/doctor/treatment-plan/${response.data.treatmentPlanId}`, {
        state: { patientId, planName, disease, duration }
      });
    } catch (err: any) {
      console.error('Failed to create treatment plan:', err);
      setError(err.response?.data?.message || 'Failed to create treatment plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/doctor/dashboard')}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
          >
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Treatment Plan</h2>

          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient ID *
              </label>
              <input
                type="text"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter patient ID"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Treatment Plan Name *
              </label>
              <input
                type="text"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., Post-Surgery Recovery Plan"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Disease/Condition *
              </label>
              <input
                type="text"
                value={disease}
                onChange={(e) => setDisease(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., Hypertension, Diabetes"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration *
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., 7 days, 2 weeks, 1 month"
                required
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400"
              >
                {isSubmitting ? 'Creating...' : 'Create Plan'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/doctor/dashboard')}
                className="px-6 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

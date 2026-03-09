import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Header from './Header';
import axiosInstance from '../lib/axios';
import { useAuth } from '../contexts/AuthContext';

interface Medicine {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface TreatmentPlan {
  treatmentPlanId: string;
  planName: string;
  disease: string;
  duration: string;
}

export default function PrescribeMedicine() {
  const navigate = useNavigate();
  const { patientId: urlPatientId } = useParams<{ patientId?: string }>();
  const location = useLocation();
  const locationState = location.state as { patientId?: string; planId?: string } | null;
  const { user } = useAuth();

  // Use patient ID from URL params, location state, or empty string
  const initialPatientId = urlPatientId || locationState?.patientId || '';
  const initialPlanId = locationState?.planId;

  const [patientId, setPatientId] = useState(initialPatientId);
  const [patientName, setPatientName] = useState('');
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(initialPlanId || 'no-plan');
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [medicines, setMedicines] = useState<Medicine[]>([
    { id: '1', name: '', dosage: '', frequency: 'twice daily', duration: '', instructions: '' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const isReadOnly = !!urlPatientId;

  useEffect(() => {
    if (patientId) {
      loadPatientInfo();
      loadTreatmentPlans();
    }
  }, [patientId]);

  const loadPatientInfo = async () => {
    try {
      const response = await axiosInstance.get(`/auth/user/${patientId}`);
      setPatientName(response.data.name || response.data.email);
    } catch (err) {
      console.error('Failed to load patient info:', err);
    }
  };

  const loadTreatmentPlans = async () => {
    if (!user?.userId) return;
    
    setLoadingPlans(true);
    try {
      const response = await axiosInstance.get(`/treatment/plans/${patientId}`);
      // Filter to only show plans created by this doctor
      const doctorPlans = (response.data.plans || []).filter(
        (plan: any) => plan.doctorId === user.userId
      );
      setTreatmentPlans(doctorPlans);
    } catch (err: any) {
      // If 404, just set empty array (no plans yet)
      if (err.response?.status !== 404) {
        console.error('Failed to load treatment plans:', err);
      }
      setTreatmentPlans([]);
    } finally {
      setLoadingPlans(false);
    }
  };

  const addMedicine = () => {
    setMedicines([
      ...medicines,
      { id: Date.now().toString(), name: '', dosage: '', frequency: 'twice daily', duration: '', instructions: '' }
    ]);
  };

  const removeMedicine = (id: string) => {
    if (medicines.length > 1) {
      setMedicines(medicines.filter(m => m.id !== id));
    }
  };

  const updateMedicine = (id: string, field: keyof Medicine, value: string) => {
    setMedicines(medicines.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!patientId) {
      setError('Patient ID is required');
      return;
    }

    if (!user?.userId) {
      setError('Doctor ID not found. Please log in again.');
      return;
    }

    const validMedicines = medicines.filter(m => m.name.trim() && m.dosage.trim());
    if (validMedicines.length === 0) {
      setError('Please add at least one medicine with name and dosage');
      return;
    }

    setIsSubmitting(true);

    try {
      if (selectedPlanId === 'no-plan') {
        // Create standalone medicines (legacy endpoint - creates a default plan)
        await axiosInstance.post('/treatment/create', {
          patientId,
          doctorId: user.userId,
          prescriptions: validMedicines.map(medicine => ({
            medicineName: medicine.name,
            dosage: medicine.dosage,
            frequency: medicine.frequency,
            duration: medicine.duration,
            specialInstructions: medicine.instructions
          }))
        });
      } else {
        // Add medicines to existing treatment plan
        console.log('Adding medicines to plan:', selectedPlanId);
        console.log('Patient ID:', patientId);
        console.log('Doctor ID:', user.userId);
        
        for (const medicine of validMedicines) {
          const payload = {
            patientId,
            doctorId: user.userId,
            medicine: {
              medicineName: medicine.name,
              dosage: medicine.dosage,
              frequency: medicine.frequency,
              duration: medicine.duration,
              specialInstructions: medicine.instructions
            }
          };
          
          console.log('Sending payload:', JSON.stringify(payload, null, 2));
          console.log('URL:', `/treatment/plan/${selectedPlanId}/medicine`);
          
          await axiosInstance.post(`/treatment/plan/${selectedPlanId}/medicine`, payload);
        }
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/doctor/dashboard');
      }, 2000);
    } catch (err: any) {
      console.error('Failed to create prescription:', err);
      setError(err.response?.data?.message || 'Failed to create prescription');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Prescribe Medicine</h2>
            {patientName && (
              <p className="text-sm text-gray-600 mt-1">
                Patient: <span className="font-medium">{patientName}</span>
              </p>
            )}
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4">
              <p className="text-sm text-green-700">Prescription created successfully! Redirecting...</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Patient ID Input */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient ID *
              </label>
              <input
                type="text"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                readOnly={isReadOnly}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder="Enter patient ID (UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)"
                maxLength={36}
                required
              />
              <p className="text-xs text-gray-600 mt-1">
                {isReadOnly ? 'Patient ID is pre-filled from selection' : 'Enter the patient\'s unique ID to create a prescription'}
              </p>
            </div>

            {/* Treatment Plan Selection */}
            {patientId && (
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Treatment Plan *
                </label>
                {loadingPlans ? (
                  <div className="text-sm text-gray-600">Loading treatment plans...</div>
                ) : (
                  <>
                    <select
                      value={selectedPlanId}
                      onChange={(e) => setSelectedPlanId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="no-plan">No Plan (Standalone Medicine)</option>
                      {treatmentPlans.map((plan) => (
                        <option key={plan.treatmentPlanId} value={plan.treatmentPlanId}>
                          {plan.planName} - {plan.disease}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-600 mt-1">
                      {selectedPlanId === 'no-plan' 
                        ? 'Medicine will be prescribed without a treatment plan' 
                        : 'Medicine will be added to the selected treatment plan'}
                    </p>
                  </>
                )}
              </div>
            )}
            {medicines.map((medicine, index) => (
              <div key={medicine.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Medicine {index + 1}</h3>
                  {medicines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMedicine(medicine.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Medicine Name *
                    </label>
                    <input
                      type="text"
                      value={medicine.name}
                      onChange={(e) => updateMedicine(medicine.id, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="e.g., Paracetamol"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dosage *
                    </label>
                    <input
                      type="text"
                      value={medicine.dosage}
                      onChange={(e) => updateMedicine(medicine.id, 'dosage', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="e.g., 500mg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Frequency
                    </label>
                    <select
                      value={medicine.frequency}
                      onChange={(e) => updateMedicine(medicine.id, 'frequency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="once daily">Once daily</option>
                      <option value="twice daily">Twice daily</option>
                      <option value="three times daily">Three times daily</option>
                      <option value="four times daily">Four times daily</option>
                      <option value="every 6 hours">Every 6 hours</option>
                      <option value="every 8 hours">Every 8 hours</option>
                      <option value="every 12 hours">Every 12 hours</option>
                      <option value="as needed">As needed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration
                    </label>
                    <input
                      type="text"
                      value={medicine.duration}
                      onChange={(e) => updateMedicine(medicine.id, 'duration', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="e.g., 7 days"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Special Instructions
                    </label>
                    <textarea
                      value={medicine.instructions}
                      onChange={(e) => updateMedicine(medicine.id, 'instructions', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="e.g., Take after meals"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addMedicine}
              className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-green-500 hover:text-green-600 transition-colors flex items-center justify-center"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Another Medicine
            </button>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400"
              >
                {isSubmitting ? 'Creating Prescription...' : 'Create Prescription'}
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

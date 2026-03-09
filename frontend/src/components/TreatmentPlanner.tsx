import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from '../lib/axios';
import Header from './Header';

interface Prescription {
  medicineId: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  times: string[];
  startDate: string;
  stopDate: string;
  specialInstructions?: string;
  foodTiming?: 'before food' | 'after food' | 'with food' | 'anytime';
  // Track which plan and doctor this medicine belongs to
  treatmentPlanId?: string;
  doctorId?: string;
}

interface TreatmentPlan {
  treatmentPlanId: string;
  patientId: string;
  doctorId: string;
  planName: string;
  disease: string;
  duration: string;
  prescriptions: Prescription[];
  createdAt: string;
  updatedAt?: string;
}

interface PatientInfo {
  patientId: string;
  name: string;
  age: number;
  gender: string;
  contact: string;
}

export const TreatmentPlanner: React.FC = () => {
  const { planId } = useParams<{ planId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as { patientId?: string } | null;

  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  const [noPlanMedicines, setNoPlanMedicines] = useState<TreatmentPlan | null>(null);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const [error, setError] = useState('');
  
  // Search state
  const [searchPatientId, setSearchPatientId] = useState('');
  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (planId && locationState?.patientId) {
      // If viewing a specific plan, load it and set patient
      setSearchPatientId(locationState.patientId);
      loadPatientData(locationState.patientId);
      setExpandedPlanId(planId);
    }
  }, [planId, locationState?.patientId]);

  const handleSearchPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchPatientId.trim()) {
      setError('Please enter a patient ID');
      return;
    }

    await loadPatientData(searchPatientId);
  };

  const loadPatientData = async (patientId: string) => {
    setSearching(true);
    setError('');
    setPatient(null);
    setPlans([]);
    setNoPlanMedicines(null);

    try {
      // Fetch treatment plans directly without patient info
      try {
        const plansResponse = await axios.get(`/treatment/plans/${patientId}`);
        const allPlans = plansResponse.data.plans || [];
        
        console.log('All plans received from backend:', allPlans);
        
        // Set a minimal patient object with just the ID
        setPatient({
          patientId: patientId,
          name: `Patient ${patientId.substring(0, 8)}`,
          age: 0,
          gender: '',
          contact: ''
        });
        
        // Separate "No Plan" medicines from named plans
        const noPlanCandidates = allPlans.filter((p: TreatmentPlan) => {
          const isNoPlan = 
            p.planName === 'Legacy Treatment Plan' || 
            p.planName === 'No Plan' ||
            !p.planName ||
            p.planName.trim() === '' ||
            !p.disease ||
            p.disease === 'Not specified';
          
          console.log(`Plan ${p.treatmentPlanId}:`, {
            planName: p.planName,
            disease: p.disease,
            isNoPlan
          });
          
          return isNoPlan;
        });
        
        // Combine all "No Plan" medicines into one virtual plan
        const combinedNoPlanMedicines: Prescription[] = [];
        noPlanCandidates.forEach((plan: TreatmentPlan) => {
          // Add treatmentPlanId and doctorId to each medicine for tracking
          const medicinesWithMetadata = plan.prescriptions.map(med => ({
            ...med,
            treatmentPlanId: plan.treatmentPlanId,
            doctorId: plan.doctorId
          }));
          combinedNoPlanMedicines.push(...medicinesWithMetadata);
        });
        
        const namedPlans = allPlans.filter((p: TreatmentPlan) => 
          p.planName !== 'Legacy Treatment Plan' && 
          p.planName !== 'No Plan' &&
          p.planName &&
          p.planName.trim() !== '' &&
          p.disease &&
          p.disease !== 'Not specified'
        );
        
        console.log('Named plans:', namedPlans);
        console.log('No plan medicines count:', combinedNoPlanMedicines.length);
        
        // Create a virtual "No Plan" treatment plan if there are any standalone medicines
        if (combinedNoPlanMedicines.length > 0) {
          setNoPlanMedicines({
            treatmentPlanId: 'no-plan',
            patientId: patientId,
            doctorId: '',
            planName: 'No Plan',
            disease: 'Not specified',
            duration: '',
            prescriptions: combinedNoPlanMedicines,
            createdAt: new Date().toISOString()
          });
        } else {
          setNoPlanMedicines(null);
        }
        
        setPlans(namedPlans);
      } catch (planErr: any) {
        if (planErr.response?.status !== 404) {
          throw planErr;
        }
        setPlans([]);
      }
    } catch (err: any) {
      console.error('Failed to load treatment plans:', err);
      setError(err.response?.data?.message || 'Failed to load treatment plans');
      setPatient(null);
    } finally {
      setSearching(false);
    }
  };

  const togglePlan = (treatmentPlanId: string) => {
    setExpandedPlanId(expandedPlanId === treatmentPlanId ? null : treatmentPlanId);
  };

  // Calculate duration from start and stop dates
  const calculateDuration = (start: string, stop: string) => {
    const startDate = new Date(start);
    const stopDate = new Date(stop);
    const diffTime = Math.abs(stopDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} days`;
  };

  const renderMedicineCard = (medicine: Prescription) => {
    // Read-only view - no editing allowed in TreatmentPlanner
    return (
      <div key={medicine.medicineId} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">{medicine.medicineName}</h4>
            <p className="text-sm text-gray-600 mt-1">Dosage: {medicine.dosage}</p>
            <p className="text-sm text-gray-600">Frequency: {medicine.frequency}</p>
            <p className="text-sm text-gray-600">Duration: {calculateDuration(medicine.startDate, medicine.stopDate)}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {medicine.times.map((time, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                >
                  {time}
                </span>
              ))}
            </div>
            {medicine.specialInstructions && (
              <p className="text-sm text-gray-600 mt-2">
                Instructions: {medicine.specialInstructions}
              </p>
            )}
            {medicine.foodTiming && medicine.foodTiming !== 'anytime' && (
              <p className="text-sm text-gray-600 mt-1">
                Food Timing: {medicine.foodTiming}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-6xl mx-auto p-6">
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

        <h1 className="text-3xl font-bold text-gray-900 mb-6">Treatment Plans</h1>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <form onSubmit={handleSearchPatient} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search by Patient ID
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={searchPatientId}
                  onChange={(e) => setSearchPatientId(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter patient ID"
                />
                <button
                  type="submit"
                  disabled={searching}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {searching ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Treatment Plans */}
        {patient && (
          <div className="space-y-4">
            {/* No Plan Section */}
            {noPlanMedicines && noPlanMedicines.prescriptions.length > 0 && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <button
                  onClick={() => togglePlan('no-plan')}
                  className="w-full px-6 py-4 bg-gray-100 flex items-center justify-between hover:bg-gray-200 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className={`h-5 w-5 text-gray-600 transition-transform ${expandedPlanId === 'no-plan' ? 'rotate-90' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-gray-900">No Plan</h3>
                      <p className="text-sm text-gray-600">Standalone medicines ({noPlanMedicines.prescriptions.length})</p>
                    </div>
                  </div>
                </button>

                {expandedPlanId === 'no-plan' && (
                  <div className="px-6 py-4 space-y-3">
                    {noPlanMedicines.prescriptions.map((medicine) =>
                      renderMedicineCard(medicine)
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Named Treatment Plans */}
            {plans.map((plan) => {
              const isExpanded = expandedPlanId === plan.treatmentPlanId;

              return (
                <div key={plan.treatmentPlanId} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <button
                    onClick={() => togglePlan(plan.treatmentPlanId)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <svg
                        className={`h-5 w-5 text-gray-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <div className="text-left">
                        <h3 className="text-lg font-semibold text-gray-900">{plan.planName}</h3>
                        <p className="text-sm text-gray-600">
                          {plan.disease} • {plan.duration} • {plan.prescriptions.length} medicines
                        </p>
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-6 py-4">
                      {plan.prescriptions.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No medicines in this plan</p>
                      ) : (
                        <div className="space-y-3">
                          {plan.prescriptions.map((medicine) =>
                            renderMedicineCard(medicine)
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {plans.length === 0 && (!noPlanMedicines || noPlanMedicines.prescriptions.length === 0) && (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No treatment plans</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new treatment plan.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

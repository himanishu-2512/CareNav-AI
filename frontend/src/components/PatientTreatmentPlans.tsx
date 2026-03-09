import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from './Header';
import axiosInstance from '../lib/axios';
import { useAuth } from '../contexts/AuthContext';

interface Medicine {
  medicineId: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  startDate: string;
  stopDate: string;
  specialInstructions?: string;
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
  prescriptions: Medicine[];
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

export default function PatientTreatmentPlans() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([]);
  const [noPlanMedicines, setNoPlanMedicines] = useState<TreatmentPlan | null>(null);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const [editingMedicine, setEditingMedicine] = useState<{
    planId: string;
    medicine: Medicine;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const frequencyOptions = [
    'once daily',
    'twice daily',
    'three times daily',
    'every 4 hours',
    'every 6 hours',
    'every 8 hours',
    'every 12 hours',
  ];

  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    if (patientId) {
      fetchPatientData();
      fetchTreatmentPlans();
    }
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      const response = await axiosInstance.get(`/auth/user/${patientId}`);
      setPatient(response.data);
      setError(''); // Clear any previous errors
    } catch (err: any) {
      console.error('Failed to load patient:', err);
      // Don't set error here - patient info might not be critical
    }
  };

  const fetchTreatmentPlans = async () => {
    setLoading(true);
    setError(''); // Clear previous errors
    try {
      const response = await axiosInstance.get(`/treatment/plans/${patientId}`);
      const allPlans = response.data.plans || [];
      
      console.log('All plans received:', allPlans);
      
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
      const combinedNoPlanMedicines: Medicine[] = [];
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
          patientId: patientId || '',
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
      
      setTreatmentPlans(namedPlans);
    } catch (err: any) {
      console.error('Failed to load treatment plans:', err);
      if (err.response?.status !== 404) {
        setError(err.response?.data?.message || 'Failed to load treatment plans');
      }
      setTreatmentPlans([]);
      setNoPlanMedicines(null);
    } finally {
      setLoading(false);
    }
  };

  const isActivePlan = (plan: TreatmentPlan) => {
    const now = new Date();
    return plan.prescriptions.some(med => new Date(med.stopDate) > now);
  };

  const getActiveMedicines = (plan: TreatmentPlan) => {
    const now = new Date();
    return plan.prescriptions.filter(med => new Date(med.stopDate) > now);
  };

  const getCompletedMedicines = (plan: TreatmentPlan) => {
    const now = new Date();
    return plan.prescriptions.filter(med => new Date(med.stopDate) <= now);
  };

  const canEdit = (plan: TreatmentPlan) => {
    return plan.doctorId === user?.userId;
  };

  const togglePlan = (planId: string) => {
    setExpandedPlanId(expandedPlanId === planId ? null : planId);
  };

  // Calculate duration from start and stop dates
  const calculateDuration = (start: string, stop: string) => {
    const startDate = new Date(start);
    const stopDate = new Date(stop);
    const diffTime = Math.abs(stopDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} days`;
  };

  const renderMedicineCard = (medicine: Medicine, planId: string, editable: boolean) => {
    const isEditing = editingMedicine?.medicine.medicineId === medicine.medicineId;
    
    // For "No Plan" medicines, check if this specific medicine was created by current doctor
    const canEditThisMedicine = planId === 'no-plan' 
      ? medicine.doctorId === user?.userId 
      : editable;

    return (
      <div key={medicine.medicineId} className="border border-gray-200 rounded-lg p-4 bg-white">
        {isEditing ? (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medicine Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={editingMedicine.medicine.medicineName}
                onChange={(e) => setEditingMedicine({
                  ...editingMedicine,
                  medicine: { ...editingMedicine.medicine, medicineName: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dosage <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingMedicine.medicine.dosage}
                  onChange={(e) => setEditingMedicine({
                    ...editingMedicine,
                    medicine: { ...editingMedicine.medicine, dosage: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frequency <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={editingMedicine.medicine.frequency}
                  onChange={(e) => setEditingMedicine({
                    ...editingMedicine,
                    medicine: { ...editingMedicine.medicine, frequency: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {frequencyOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={editingMedicine.medicine.startDate.split('T')[0]}
                  onChange={(e) => setEditingMedicine({
                    ...editingMedicine,
                    medicine: { ...editingMedicine.medicine, startDate: new Date(e.target.value).toISOString() }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stop Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={editingMedicine.medicine.stopDate.split('T')[0]}
                  onChange={(e) => setEditingMedicine({
                    ...editingMedicine,
                    medicine: { ...editingMedicine.medicine, stopDate: new Date(e.target.value).toISOString() }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
              <textarea
                value={editingMedicine.medicine.specialInstructions || ''}
                onChange={(e) => setEditingMedicine({
                  ...editingMedicine,
                  medicine: { ...editingMedicine.medicine, specialInstructions: e.target.value }
                })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Optional"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit || !editingMedicine.medicine.medicineName || !editingMedicine.medicine.dosage || !editingMedicine.medicine.frequency}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
              >
                {savingEdit ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setEditingMedicine(null)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{medicine.medicineName}</h4>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Dosage:</span> {medicine.dosage}
                </div>
                <div>
                  <span className="font-medium">Frequency:</span> {medicine.frequency}
                </div>
                <div>
                  <span className="font-medium">Start:</span> {new Date(medicine.startDate).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">End:</span> {new Date(medicine.stopDate).toLocaleDateString()}
                </div>
                <div className="col-span-2">
                  <span className="font-medium">Duration:</span> {calculateDuration(medicine.startDate, medicine.stopDate)}
                </div>
              </div>
              {medicine.specialInstructions && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700">
                  <span className="font-medium">Instructions:</span> {medicine.specialInstructions}
                </div>
              )}
            </div>
            {canEditThisMedicine && (
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleEditMedicine(medicine.treatmentPlanId || planId, medicine)}
                  className="text-blue-600 hover:text-blue-800"
                  title="Edit"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDeleteMedicine(medicine.treatmentPlanId || planId, medicine.medicineId)}
                  className="text-red-600 hover:text-red-800"
                  title="Delete"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const handleAddMedicines = (planId: string) => {
    navigate('/doctor/prescribe', { 
      state: { 
        patientId,
        planId: planId !== 'no-plan' ? planId : undefined
      } 
    });
  };

  const handleCreatePlan = () => {
    navigate('/doctor/create-treatment-plan', { state: { patientId } });
  };

  const handleEditMedicine = (planId: string, medicine: Medicine) => {
    setEditingMedicine({ planId, medicine });
  };

  const handleSaveEdit = async () => {
    if (!editingMedicine || !patientId) return;

    // Validate required fields
    if (!editingMedicine.medicine.medicineName || !editingMedicine.medicine.dosage || !editingMedicine.medicine.frequency) {
      setError('Medicine name, dosage, and frequency are required');
      return;
    }

    setSavingEdit(true);
    setError('');

    try {
      await axiosInstance.put(
        `/treatment/plan/${editingMedicine.planId}/medicine/${editingMedicine.medicine.medicineId}`,
        {
          patientId,
          doctorId: user?.userId,
          updates: {
            medicineName: editingMedicine.medicine.medicineName,
            dosage: editingMedicine.medicine.dosage,
            frequency: editingMedicine.medicine.frequency,
            startDate: editingMedicine.medicine.startDate,
            stopDate: editingMedicine.medicine.stopDate,
            specialInstructions: editingMedicine.medicine.specialInstructions
          }
        }
      );

      setEditingMedicine(null);
      await fetchTreatmentPlans();
    } catch (err: any) {
      console.error('Failed to update medicine:', err);
      setError(err.response?.data?.message || 'Failed to update medicine');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteMedicine = async (planId: string, medicineId: string) => {
    if (!patientId || !confirm('Are you sure you want to delete this medicine?')) {
      return;
    }

    setError('');

    try {
      await axiosInstance.delete(
        `/treatment/plan/${planId}/medicine/${medicineId}`,
        {
          params: {
            patientId,
            doctorId: user?.userId
          }
        }
      );

      await fetchTreatmentPlans();
    } catch (err: any) {
      console.error('Failed to delete medicine:', err);
      setError(err.response?.data?.message || 'Failed to delete medicine');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            {patient ? (
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {patient.age} years • {patient.gender} • {patient.contact}
                </p>
              </div>
            ) : (
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Patient Treatment Plans</h1>
                <p className="text-sm text-gray-600 mt-1">Loading patient information...</p>
              </div>
            )}
            <button
              onClick={handleCreatePlan}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Treatment Plan
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : treatmentPlans.length === 0 && (!noPlanMedicines || noPlanMedicines.prescriptions.length === 0) ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No treatment plans</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new treatment plan.</p>
            <div className="mt-6">
              <button
                onClick={handleCreatePlan}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Create Treatment Plan
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* No Plan Section */}
            {noPlanMedicines && noPlanMedicines.prescriptions.length > 0 && (
              <div className="bg-white shadow rounded-lg overflow-hidden">
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
                      <div className="flex items-center gap-3">
                        <h2 className="text-lg font-semibold text-gray-900">No Plan</h2>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                          Standalone Medicines
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {noPlanMedicines.prescriptions.length} medicines prescribed without a treatment plan
                      </p>
                    </div>
                  </div>
                </button>

                {expandedPlanId === 'no-plan' && (
                  <div className="px-6 py-4">
                    {(() => {
                      const activeMeds = getActiveMedicines(noPlanMedicines);
                      const completedMeds = getCompletedMedicines(noPlanMedicines);
                      
                      return (
                        <>
                          {activeMeds.length > 0 && (
                            <div className="mb-6">
                              <h3 className="text-md font-medium text-gray-900 mb-3">Active Medicines ({activeMeds.length})</h3>
                              <div className="space-y-3">
                                {activeMeds.map((med) => renderMedicineCard(med, 'no-plan', false))}
                              </div>
                            </div>
                          )}

                          {completedMeds.length > 0 && (
                            <div>
                              <h3 className="text-md font-medium text-gray-900 mb-3">Completed Medicines ({completedMeds.length})</h3>
                              <div className="space-y-3">
                                {completedMeds.map((med) => renderMedicineCard(med, 'no-plan', false))}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Named Treatment Plans */}
            {treatmentPlans.map((plan) => {
              const active = isActivePlan(plan);
              const activeMeds = getActiveMedicines(plan);
              const completedMeds = getCompletedMedicines(plan);
              const isExpanded = expandedPlanId === plan.treatmentPlanId;
              const editable = canEdit(plan);

              return (
                <div key={plan.treatmentPlanId} className="bg-white shadow rounded-lg overflow-hidden">
                  <button
                    onClick={() => togglePlan(plan.treatmentPlanId)}
                    className={`w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${active ? 'bg-green-50' : 'bg-gray-50'}`}
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
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-semibold text-gray-900">{plan.planName}</h2>
                          {editable && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Your Plan
                            </span>
                          )}
                        </div>
                        <div className="mt-1 space-y-1">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Disease:</span> {plan.disease}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Duration:</span> {plan.duration}
                          </p>
                          <p className="text-sm text-gray-500">
                            Created on {new Date(plan.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 text-sm rounded-full ${
                        active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {active ? 'Active' : 'Completed'}
                      </span>
                      {editable && (
                        <span className="px-3 py-1 text-sm rounded-full bg-purple-100 text-purple-800">
                          Editable
                        </span>
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-6 py-4">
                      {plan.prescriptions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <p>No medicines added to this plan yet.</p>
                          {editable && (
                            <button
                              onClick={() => handleAddMedicines(plan.treatmentPlanId)}
                              className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              Add Medicines
                            </button>
                          )}
                        </div>
                      ) : (
                        <>
                          {activeMeds.length > 0 && (
                            <div className="mb-6">
                              <h3 className="text-md font-medium text-gray-900 mb-3">Active Medicines ({activeMeds.length})</h3>
                              <div className="space-y-3">
                                {activeMeds.map((med) => renderMedicineCard(med, plan.treatmentPlanId, editable))}
                              </div>
                            </div>
                          )}

                          {completedMeds.length > 0 && (
                            <div>
                              <h3 className="text-md font-medium text-gray-900 mb-3">Completed Medicines ({completedMeds.length})</h3>
                              <div className="space-y-3">
                                {completedMeds.map((med) => renderMedicineCard(med, plan.treatmentPlanId, false))}
                              </div>
                            </div>
                          )}

                          {editable && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <button
                                onClick={() => handleAddMedicines(plan.treatmentPlanId)}
                                className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-green-500 hover:text-green-600 transition-colors flex items-center justify-center"
                              >
                                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Medicines to This Plan
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

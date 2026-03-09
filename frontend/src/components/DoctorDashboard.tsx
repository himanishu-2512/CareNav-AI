import React, { useState, useEffect } from 'react';
import axios from '../lib/axios';
import { useAuth } from '../contexts/AuthContext';
import { usePatients } from '../contexts/PatientContext';
import Header from './Header';

interface PatientDetail {
  patient: {
    patientId: string;
    name: string;
    age: number;
    gender: string;
    contact: string;
  };
  symptoms: Array<{
    symptomId: string;
    rawText: string;
    createdAt: string;
    structuredSymptoms: {
      bodyPart: string;
      severity: string;
      duration: string;
    };
    aiSummary?: string;
    briefSummary?: string;
    diseaseAnalysis?: Array<{
      diseaseName: string;
      probability: number;
    }>;
    followUpAnswers?: Array<{
      questionId: string;
      questionText: string;
      answer: string;
    }>;
  }>;
  reports: Array<{
    reportId: string;
    uploadedAt: string;
    summary: any;
  }>;
}

interface DoctorDashboardProps {
  doctorId?: string;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = () => {
  const { user } = useAuth();
  const {
    patients,
    totalPages,
    loading,
    error: contextError,
    fetchPatients,
    refreshPatients,
    updatePatientStatus: updatePatientStatusInContext,
    removePatient: removePatientFromContext
  } = usePatients();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<('ongoing' | 'past')[]>(['ongoing', 'past']);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [addPatientMode, setAddPatientMode] = useState<'scan' | 'code' | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [addingPatient, setAddingPatient] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientDetail | null>(null);
  const [showPatientDetailModal, setShowPatientDetailModal] = useState(false);
  const [loadingPatientDetail, setLoadingPatientDetail] = useState(false);
  const [showDiseaseSelectionModal, setShowDiseaseSelectionModal] = useState(false);
  const [patientSymptoms, setPatientSymptoms] = useState<any[]>([]);
  const [selectedSymptomId, setSelectedSymptomId] = useState<string>('');
  const [pendingPatientId, setPendingPatientId] = useState<string>('');

  useEffect(() => {
    fetchPatients(currentPage, 20, searchQuery, statusFilter);
  }, [currentPage, statusFilter, searchQuery, fetchPatients]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (status: 'ongoing' | 'past') => {
    setStatusFilter(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
    setCurrentPage(1);
  };

  const handleAddPatient = async (patientId: string, symptomId?: string) => {
    setAddingPatient(true);
    try {
      await axios.post('/doctor/patients/add', { 
        patientId,
        addedVia: 'manual_code',
        accessGrantedBy: patientId,
        trackedSymptomId: symptomId || null
      });
      setShowAddPatientModal(false);
      setShowDiseaseSelectionModal(false);
      setAddPatientMode(null);
      setManualCode('');
      setPendingPatientId('');
      setSelectedSymptomId('');
      setPatientSymptoms([]);
      refreshPatients(); // Use context refresh instead of fetchPatients
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add patient');
    } finally {
      setAddingPatient(false);
    }
  };

  const handleManualCodeSubmit = async () => {
    if (!manualCode.trim() || !user?.userId) return;
    
    setAddingPatient(true);
    setError(null);
    try {
      const response = await axios.post('/qr/validate-code', { 
        uniqueCode: manualCode.trim(),
        doctorId: user.userId
      });
      if (response.data.valid && response.data.patientId) {
        const patientId = response.data.patientId;
        setPendingPatientId(patientId);
        
        // Fetch patient symptoms to let doctor choose
        try {
          const symptomsResponse = await axios.get(`/symptoms/history/${patientId}`);
          const symptoms = symptomsResponse.data.symptoms || [];
          
          if (symptoms.length > 0) {
            setPatientSymptoms(symptoms);
            setShowDiseaseSelectionModal(true);
          } else {
            // No symptoms, add patient without tracking specific disease
            await handleAddPatient(patientId);
          }
        } catch (symptomsError) {
          console.error('Failed to load symptoms:', symptomsError);
          // Add patient anyway without disease tracking
          await handleAddPatient(patientId);
        }
      } else {
        setError(response.data.error || 'Invalid code');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate code');
    } finally {
      setAddingPatient(false);
    }
  };

  const handleDiseaseSelection = async () => {
    if (!pendingPatientId) return;
    await handleAddPatient(pendingPatientId, selectedSymptomId || undefined);
  };

  const handleDeletePatient = async (patientId: string, patientName: string) => {
    if (!confirm(`Are you sure you want to remove ${patientName} from your patient list?`)) return;
    
    try {
      await axios.delete(`/doctor/patients/${patientId}`);
      removePatientFromContext(patientId); // Update context
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove patient');
    }
  };

  const handleStatusChange = async (patientId: string, newStatus: 'ongoing' | 'past') => {
    try {
      await axios.put(`/doctor/patients/${patientId}/status`, { status: newStatus });
      updatePatientStatusInContext(patientId, newStatus); // Update context
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update patient status');
    }
  };

  const handleViewPatientDetail = async (patientId: string) => {
    setLoadingPatientDetail(true);
    setShowPatientDetailModal(true);
    try {
      // Fetch patient profile
      const profileResponse = await axios.get(`/patients/${patientId}`);
      
      // Fetch patient symptoms (basic list)
      const symptomsResponse = await axios.get(`/symptoms/history/${patientId}`);
      const symptomsList = symptomsResponse.data.symptoms || [];
      
      // Fetch full details for each symptom to get aiSummary and briefSummary
      const symptomsWithDetails = await Promise.all(
        symptomsList.map(async (symptom: any) => {
          try {
            const detailResponse = await axios.get(`/symptoms/${symptom.symptomId}?patientId=${patientId}`);
            return detailResponse.data;
          } catch (error) {
            console.error(`Failed to load details for symptom ${symptom.symptomId}:`, error);
            return symptom; // Return basic symptom if detail fetch fails
          }
        })
      );
      
      // Fetch patient reports
      const reportsResponse = await axios.get(`/reports/timeline/${patientId}`);
      
      setSelectedPatient({
        patient: profileResponse.data,
        symptoms: symptomsWithDetails,
        reports: reportsResponse.data.reports || []
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load patient details');
      setShowPatientDetailModal(false);
    } finally {
      setLoadingPatientDetail(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Doctor Dashboard</h1>
        
        {/* Quick Action Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setShowAddPatientModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Patient
          </button>
          <button
            onClick={() => window.location.href = '/doctor/prescribe'}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Prescribe Medicine
          </button>
          <button
            onClick={() => window.location.href = '/treatment/planner'}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Treatment Planner
          </button>
          <button
            onClick={() => window.location.href = '/adherence/dashboard'}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Adherence
          </button>
          <button
            onClick={() => window.location.href = '/patients/summary'}
            className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 flex items-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Patient Summary
          </button>
        </div>
      </div>
      
      <div className="mb-4 flex gap-4">
        <input
          type="text"
          placeholder="Search by name or UHID..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="flex-1 px-4 py-2 border rounded"
        />
        <div className="flex gap-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={statusFilter.includes('ongoing')}
              onChange={() => handleStatusFilterChange('ongoing')}
              className="mr-2"
            />
            Ongoing
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={statusFilter.includes('past')}
              onChange={() => handleStatusFilterChange('past')}
              className="mr-2"
            />
            Past
          </label>
        </div>
      </div>

      {loading && <div className="text-center py-4">Loading...</div>}
      {(error || contextError) && <div className="text-red-500 py-4">{error || contextError}</div>}

      {!loading && !error && patients.length === 0 && (
        <div className="text-center py-4">No patients found</div>
      )}

      {!loading && !error && patients.length > 0 && (
        <>
          <div className="space-y-2">
            {patients.map(patient => (
              <div
                key={patient.patientId}
                className="p-4 border rounded hover:bg-gray-50"
              >
                <div className="flex justify-between items-start">
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => handleViewPatientDetail(patient.patientId)}
                  >
                    <h3 className="font-semibold">{patient.name}</h3>
                    <p className="text-sm text-gray-600">UHID: {patient.uhid}</p>
                    <p className="text-sm text-gray-600">
                      Last Consultation: {new Date(patient.lastConsultation).toLocaleDateString()}
                    </p>
                    {patient.trackedDiseaseName && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                          <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                          Tracking: {patient.trackedDiseaseName}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={patient.treatmentStatus}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleStatusChange(patient.patientId, e.target.value as 'ongoing' | 'past');
                      }}
                      className={`px-2 py-1 text-xs rounded border cursor-pointer ${
                        patient.treatmentStatus === 'ongoing' 
                          ? 'bg-green-100 text-green-800 border-green-300' 
                          : 'bg-gray-100 text-gray-800 border-gray-300'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="ongoing">Ongoing</option>
                      <option value="past">Completed</option>
                    </select>
                    {patient.unreadMessages > 0 && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        {patient.unreadMessages} new
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `/doctor/patient/${patient.patientId}/prescribe`;
                      }}
                      className="text-green-600 hover:text-green-800 p-1"
                      title="Prescribe medicine"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `/doctor/patient/${patient.patientId}/treatments`;
                      }}
                      className="text-purple-600 hover:text-purple-800 p-1"
                      title="View treatment plans"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `/doctor/patient/${patient.patientId}/adherence`;
                      }}
                      className="text-indigo-600 hover:text-indigo-800 p-1"
                      title="View adherence"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePatient(patient.patientId, patient.name);
                      }}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Remove patient"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Add Patient Modal */}
      {showAddPatientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Add New Patient</h2>
            
            {!addPatientMode ? (
              <div className="space-y-3">
                <button
                  onClick={() => setAddPatientMode('scan')}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Scan QR Code
                </button>
                <button
                  onClick={() => setAddPatientMode('code')}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Enter Unique Code
                </button>
                <button
                  onClick={() => setShowAddPatientModal(false)}
                  className="w-full px-4 py-3 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            ) : addPatientMode === 'code' ? (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Enter patient ID (UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="w-full px-4 py-2 border rounded"
                  maxLength={36}
                />
                {error && <div className="text-red-500 text-sm">{error}</div>}
                <div className="flex gap-2">
                  <button
                    onClick={handleManualCodeSubmit}
                    disabled={addingPatient || !manualCode.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {addingPatient ? 'Adding...' : 'Add Patient'}
                  </button>
                  <button
                    onClick={() => {
                      setAddPatientMode(null);
                      setManualCode('');
                      setError(null);
                    }}
                    className="px-4 py-2 border rounded hover:bg-gray-50"
                  >
                    Back
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">QR scanning will be implemented here</p>
                <button
                  onClick={() => {
                    setAddPatientMode(null);
                    setError(null);
                  }}
                  className="w-full px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Back
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Disease Selection Modal */}
      {showDiseaseSelectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-xl font-bold mb-4">Select Disease to Track</h2>
            <p className="text-sm text-gray-600 mb-4">
              Choose which condition you want to track for this patient. You can view all conditions in the treatment plans section.
            </p>
            
            {patientSymptoms.length === 0 ? (
              <p className="text-gray-500 text-sm">No symptoms found for this patient</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
                <div
                  className={`border rounded-lg p-4 cursor-pointer hover:bg-gray-50 ${
                    selectedSymptomId === '' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedSymptomId('')}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={selectedSymptomId === ''}
                      onChange={() => setSelectedSymptomId('')}
                      className="cursor-pointer"
                    />
                    <span className="font-medium">Track all conditions</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-6">Monitor all reported symptoms and conditions</p>
                </div>
                
                {patientSymptoms.map((symptom) => {
                  const topDisease = symptom.diseaseAnalysis?.[0];
                  return (
                    <div
                      key={symptom.symptomId}
                      className={`border rounded-lg p-4 cursor-pointer hover:bg-gray-50 ${
                        selectedSymptomId === symptom.symptomId ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                      onClick={() => setSelectedSymptomId(symptom.symptomId)}
                    >
                      <div className="flex items-start gap-2">
                        <input
                          type="radio"
                          checked={selectedSymptomId === symptom.symptomId}
                          onChange={() => setSelectedSymptomId(symptom.symptomId)}
                          className="mt-1 cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {topDisease && (
                              <span className="font-semibold text-gray-900">{topDisease.diseaseName}</span>
                            )}
                            <span className={`px-2 py-1 text-xs rounded ${
                              symptom.structuredSymptoms?.severity === 'severe' ? 'bg-red-100 text-red-800' :
                              symptom.structuredSymptoms?.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {symptom.structuredSymptoms?.severity || 'N/A'}
                            </span>
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                              {symptom.structuredSymptoms?.bodyPart || 'N/A'}
                            </span>
                          </div>
                          {topDisease && (
                            <p className="text-sm text-gray-600 mb-1">
                              Probability: {(topDisease.probability * 100).toFixed(0)}%
                            </p>
                          )}
                          <p className="text-sm text-gray-600">
                            Reported: {new Date(symptom.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-700 mt-2">{symptom.rawText}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            <div className="flex gap-2">
              <button
                onClick={handleDiseaseSelection}
                disabled={addingPatient}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {addingPatient ? 'Adding...' : 'Add Patient'}
              </button>
              <button
                onClick={() => {
                  setShowDiseaseSelectionModal(false);
                  setSelectedSymptomId('');
                  setPatientSymptoms([]);
                  setPendingPatientId('');
                }}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patient Detail Modal */}
      {showPatientDetailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-2xl font-bold">Patient Details</h2>
              <button
                onClick={() => {
                  setShowPatientDetailModal(false);
                  setSelectedPatient(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {loadingPatientDetail ? (
              <div className="flex justify-center py-12">
                <svg className="animate-spin h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : selectedPatient ? (
              <div className="overflow-y-auto flex-1 p-6">
                <div className="space-y-6">
                  {/* Patient Summary - Main Section */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <svg className="h-6 w-6 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                      </svg>
                      <h2 className="text-xl font-bold text-blue-900">Patient Summary</h2>
                    </div>

                    {/* Patient Basic Info */}
                    <div className="bg-white rounded-lg p-4 mb-4">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 font-medium">Name</p>
                          <p className="text-gray-900 font-semibold">{selectedPatient.patient.name}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 font-medium">Age / Gender</p>
                          <p className="text-gray-900">{selectedPatient.patient.age} years / {selectedPatient.patient.gender}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 font-medium">Contact</p>
                          <p className="text-gray-900">{selectedPatient.patient.contact}</p>
                        </div>
                      </div>
                    </div>

                    {/* Recent Conditions */}
                    {(() => {
                      const thirtyDaysAgo = new Date();
                      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                      
                      const recentDiseases: Array<{
                        diseaseName: string;
                        probability: number;
                        symptomDate: string;
                        symptomId: string;
                        bodyPart: string;
                        severity: string;
                      }> = [];
                      
                      selectedPatient.symptoms.forEach((symptom) => {
                        const symptomDate = new Date(symptom.createdAt);
                        if (symptomDate >= thirtyDaysAgo && symptom.diseaseAnalysis && Array.isArray(symptom.diseaseAnalysis)) {
                          symptom.diseaseAnalysis.forEach((disease: any) => {
                            if (disease.probability > 0.3) {
                              recentDiseases.push({
                                diseaseName: disease.diseaseName,
                                probability: disease.probability,
                                symptomDate: symptom.createdAt,
                                symptomId: symptom.symptomId,
                                bodyPart: symptom.structuredSymptoms?.bodyPart || 'N/A',
                                severity: symptom.structuredSymptoms?.severity || 'N/A'
                              });
                            }
                          });
                        }
                      });
                      
                      recentDiseases.sort((a, b) => b.probability - a.probability);
                      
                      return recentDiseases.length > 0 ? (
                        <div className="bg-white rounded-lg p-4 mb-4">
                          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <svg className="h-5 w-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            Recent Conditions (Last 30 days)
                          </h3>
                          <div className="space-y-2">
                            {recentDiseases.slice(0, 5).map((disease, index) => (
                              <div 
                                key={index} 
                                className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer transition-colors"
                                onClick={() => window.location.href = `/symptoms/${disease.symptomId}`}
                              >
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{disease.diseaseName}</p>
                                  <p className="text-xs text-gray-600">
                                    {disease.bodyPart} • {disease.severity} • {new Date(disease.symptomDate).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    disease.probability > 0.7 ? 'bg-red-100 text-red-800' : 
                                    disease.probability > 0.5 ? 'bg-orange-100 text-orange-800' : 
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {(disease.probability * 100).toFixed(0)}%
                                  </span>
                                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null;
                    })()}

                    {/* Medical Reports Summary */}
                    {selectedPatient.reports.length > 0 && (
                      <div className="bg-white rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <svg className="h-5 w-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                          Recent Medical Records
                        </h3>
                        <div className="space-y-2">
                          {selectedPatient.reports.slice(0, 3).map((report) => (
                            <div key={report.reportId} className="flex items-start text-sm p-2 bg-gray-50 rounded">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{new Date(report.uploadedAt).toLocaleDateString()}</p>
                                {report.summary && report.summary.keyFindings && report.summary.keyFindings.length > 0 && (
                                  <p className="text-gray-600 text-xs">{report.summary.keyFindings[0]}</p>
                                )}
                              </div>
                            </div>
                          ))}
                          {selectedPatient.reports.length > 3 && (
                            <p className="text-xs text-gray-500 text-center pt-2">
                              +{selectedPatient.reports.length - 3} more records
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Summary Footer */}
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <p className="text-xs text-blue-700">
                        ⓘ This summary provides a quick overview of the patient's recent medical history.
                      </p>
                    </div>
                  </div>

                  {/* Detailed Symptom History */}
                  <div className="bg-white rounded-lg border p-4">
                    <h3 className="text-lg font-semibold mb-3">Detailed Symptom History</h3>
                    {selectedPatient.symptoms.length === 0 ? (
                      <p className="text-gray-500 text-sm">No symptoms reported</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedPatient.symptoms.map((symptom) => (
                          <div key={symptom.symptomId} className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                {symptom.structuredSymptoms.bodyPart}
                              </span>
                              <span className={`px-2 py-1 text-xs rounded ${
                                symptom.structuredSymptoms.severity === 'severe' ? 'bg-red-100 text-red-800' :
                                symptom.structuredSymptoms.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {symptom.structuredSymptoms.severity}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(symptom.createdAt).toLocaleDateString()} at {new Date(symptom.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                            
                            {/* AI Summary Section */}
                            {symptom.aiSummary && (
                              <div className="mb-3 p-3 bg-blue-50 rounded border border-blue-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                  </svg>
                                  <span className="text-sm font-semibold text-blue-900">AI Clinical Summary</span>
                                </div>
                                <div className="text-sm text-gray-800 whitespace-pre-line">
                                  {symptom.aiSummary}
                                </div>
                              </div>
                            )}
                            
                            {/* Patient's Original Description */}
                            <div className="mb-2">
                              <p className="text-xs font-medium text-gray-600 mb-1">Patient's Description:</p>
                              <p className="text-sm text-gray-900">{symptom.rawText}</p>
                            </div>
                            
                            {/* Questions Answered Count */}
                            {symptom.followUpAnswers && symptom.followUpAnswers.length > 0 && (
                              <div className="mt-2 text-xs text-gray-600">
                                <span className="font-medium">{symptom.followUpAnswers.length} follow-up questions answered</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Detailed Reports */}
                  {selectedPatient.reports.length > 0 && (
                    <div className="bg-white rounded-lg border p-4">
                      <h3 className="text-lg font-semibold mb-3">All Medical Reports</h3>
                      <div className="space-y-3">
                        {selectedPatient.reports.map((report) => (
                          <div key={report.reportId} className="border rounded-lg p-3 bg-gray-50">
                            <p className="text-sm font-medium mb-1">Report uploaded on {new Date(report.uploadedAt).toLocaleDateString()}</p>
                            {report.summary && report.summary.keyFindings && report.summary.keyFindings.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-600 font-medium">Key Findings:</p>
                                <ul className="text-xs text-gray-700 list-disc list-inside">
                                  {report.summary.keyFindings.map((finding: string, idx: number) => (
                                    <li key={idx}>{finding}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

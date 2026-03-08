import React, { useState, useEffect } from 'react';
import axios from '../lib/axios';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';

interface PatientListItem {
  patientId: string;
  uhid: string;
  name: string;
  lastConsultation: string;
  treatmentStatus: 'ongoing' | 'past';
  unreadMessages: number;
}

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
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<('ongoing' | 'past')[]>(['ongoing', 'past']);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [addPatientMode, setAddPatientMode] = useState<'scan' | 'code' | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [addingPatient, setAddingPatient] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientDetail | null>(null);
  const [showPatientDetailModal, setShowPatientDetailModal] = useState(false);
  const [loadingPatientDetail, setLoadingPatientDetail] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, [currentPage, statusFilter, searchQuery]);

  const fetchPatients = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(searchQuery && { q: searchQuery }),
        ...(statusFilter.length > 0 && { status: statusFilter.join(',') })
      });

      const response = await axios.get(`/doctor/patients?${params}`);
      setPatients(response.data.patients);
      setTotalPages(response.data.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

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

  const handleAddPatient = async (patientId: string) => {
    setAddingPatient(true);
    try {
      await axios.post('/doctor/patients/add', { 
        patientId,
        addedVia: 'manual_code',
        accessGrantedBy: patientId
      });
      setShowAddPatientModal(false);
      setAddPatientMode(null);
      setManualCode('');
      fetchPatients();
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
        await handleAddPatient(response.data.patientId);
      } else {
        setError(response.data.error || 'Invalid code');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate code');
    } finally {
      setAddingPatient(false);
    }
  };

  const handleDeletePatient = async (patientId: string, patientName: string) => {
    if (!confirm(`Are you sure you want to remove ${patientName} from your patient list?`)) return;
    
    try {
      await axios.delete(`/doctor/patients/${patientId}`);
      fetchPatients();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove patient');
    }
  };

  const handleViewPatientDetail = async (patientId: string) => {
    setLoadingPatientDetail(true);
    setShowPatientDetailModal(true);
    try {
      // Fetch patient profile
      const profileResponse = await axios.get(`/patients/${patientId}`);
      
      // Fetch patient symptoms
      const symptomsResponse = await axios.get(`/symptoms/history/${patientId}`);
      
      // Fetch patient reports
      const reportsResponse = await axios.get(`/reports/timeline/${patientId}`);
      
      setSelectedPatient({
        patient: profileResponse.data,
        symptoms: symptomsResponse.data.symptoms || [],
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Patient Dashboard</h1>
        <button
          onClick={() => setShowAddPatientModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Add Patient
        </button>
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
      {error && <div className="text-red-500 py-4">{error}</div>}

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
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded ${
                      patient.treatmentStatus === 'ongoing' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {patient.treatmentStatus}
                    </span>
                    {patient.unreadMessages > 0 && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        {patient.unreadMessages} new
                      </span>
                    )}
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
                  placeholder="Enter patient's unique code"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="w-full px-4 py-2 border rounded"
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

      {/* Patient Detail Modal */}
      {showPatientDetailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 my-8">
            <div className="flex justify-between items-center mb-6">
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
              <div className="space-y-6">
                {/* Patient Profile */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">Profile</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium">{selectedPatient.patient.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Age</p>
                      <p className="font-medium">{selectedPatient.patient.age}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Gender</p>
                      <p className="font-medium">{selectedPatient.patient.gender}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Contact</p>
                      <p className="font-medium">{selectedPatient.patient.contact}</p>
                    </div>
                  </div>
                </div>

                {/* Symptom History */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Symptom History</h3>
                  {selectedPatient.symptoms.length === 0 ? (
                    <p className="text-gray-500 text-sm">No symptoms reported</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedPatient.symptoms.map((symptom) => (
                        <div key={symptom.symptomId} className="border rounded-lg p-4 bg-white">
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

                {/* Reports */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Medical Reports</h3>
                  {selectedPatient.reports.length === 0 ? (
                    <p className="text-gray-500 text-sm">No reports uploaded</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedPatient.reports.map((report) => (
                        <div key={report.reportId} className="border rounded-lg p-3">
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

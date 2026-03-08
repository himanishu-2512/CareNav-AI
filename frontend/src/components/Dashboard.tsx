import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Header from './Header';
import axiosInstance from '../lib/axios';

interface SymptomHistory {
  symptomId: string;
  rawText: string;
  structuredSymptoms: {
    bodyPart: string;
    severity: string;
    duration: string;
  };
  createdAt: string;
  status?: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [symptomHistory, setSymptomHistory] = useState<SymptomHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [uniqueCode, setUniqueCode] = useState<string | null>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  // Load symptom history for patients
  useEffect(() => {
    if (user?.role === 'patient') {
      loadSymptomHistory();
    }
  }, [user]);

  const loadSymptomHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await axiosInstance.get(`/symptoms/history/${user?.userId}`);
      setSymptomHistory(response.data.symptoms || []);
    } catch (error) {
      console.error('Failed to load symptom history:', error);
      setSymptomHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const generateQRCode = async () => {
    setIsGeneratingQR(true);
    try {
      const response = await axiosInstance.post('/qr/generate', {
        patientId: user?.userId
      });
      setQrCode(response.data.qrCodeImage);
      setUniqueCode(response.data.uniqueCode);
      setShowQRModal(true);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      alert('Failed to generate QR code. Please try again.');
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const deleteSymptom = async (symptomId: string) => {
    if (!confirm('Are you sure you want to delete this symptom report?')) return;
    
    try {
      await axiosInstance.delete(`/symptoms/${symptomId}?patientId=${user?.userId}`);
      setSymptomHistory(prev => prev.filter(s => s.symptomId !== symptomId));
    } catch (error) {
      console.error('Failed to delete symptom:', error);
      alert('Failed to delete symptom. Please try again.');
    }
  };

  const [showAddDetailsModal, setShowAddDetailsModal] = useState(false);
  const [selectedSymptomId, setSelectedSymptomId] = useState<string | null>(null);
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [isAddingDetails, setIsAddingDetails] = useState(false);

  const handleAddMoreDetails = (symptomId: string) => {
    setSelectedSymptomId(symptomId);
    setAdditionalDetails('');
    setShowAddDetailsModal(true);
  };

  const submitAdditionalDetails = async () => {
    if (!selectedSymptomId || !additionalDetails.trim()) return;
    
    setIsAddingDetails(true);
    try {
      await axiosInstance.put(`/symptoms/${selectedSymptomId}/add-details`, {
        patientId: user?.userId,
        additionalText: additionalDetails.trim()
      });
      
      setShowAddDetailsModal(false);
      setSelectedSymptomId(null);
      setAdditionalDetails('');
      loadSymptomHistory();
      alert('Additional details added successfully!');
    } catch (error) {
      console.error('Failed to add details:', error);
      alert('Failed to add details. Please try again.');
    } finally {
      setIsAddingDetails(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {user?.role === 'patient' ? (
          /* Patient Dashboard */
          <div className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome back!
              </h2>
              <p className="text-gray-600">
                Manage your symptoms and health records
              </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Add New Symptom */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <h3 className="ml-3 text-lg font-semibold text-gray-900">
                    Report New Symptoms
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Describe your symptoms and get AI-powered department recommendations
                </p>
                <button
                  onClick={() => navigate('/symptoms/input')}
                  className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Start Symptom Analysis
                </button>
              </div>

              {/* Generate QR Code */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  </div>
                  <h3 className="ml-3 text-lg font-semibold text-gray-900">
                    Share with Doctor
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Generate a QR code to share your medical history with your doctor
                </p>
                <button
                  onClick={generateQRCode}
                  disabled={isGeneratingQR}
                  className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400"
                >
                  {isGeneratingQR ? 'Generating...' : 'Generate QR Code'}
                </button>
              </div>

              {/* Edit Profile */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="ml-3 text-lg font-semibold text-gray-900">
                    My Profile
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Update your personal information and medical history
                </p>
                <button
                  onClick={() => navigate('/profile/edit')}
                  className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Symptom History */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Previous Symptom Reports
                </h3>
                <button
                  onClick={loadSymptomHistory}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Refresh
                </button>
              </div>

              {isLoadingHistory ? (
                <div className="flex justify-center py-8">
                  <svg
                    className="animate-spin h-8 w-8 text-blue-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
              ) : symptomHistory.length === 0 ? (
                <div className="text-center py-8">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No symptom reports yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by reporting your first symptom
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => navigate('/symptoms/input')}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Report Symptoms
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {symptomHistory.map((symptom) => (
                    <div
                      key={symptom.symptomId}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => navigate(`/symptoms/${symptom.symptomId}`)}
                        >
                          <div className="flex items-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {symptom.structuredSymptoms.bodyPart}
                            </span>
                            <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              symptom.structuredSymptoms.severity === 'severe' ? 'bg-red-100 text-red-800' :
                              symptom.structuredSymptoms.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {symptom.structuredSymptoms.severity}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-gray-900">{symptom.rawText}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            {new Date(symptom.createdAt).toLocaleDateString()} at {new Date(symptom.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddMoreDetails(symptom.symptomId);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                            title="Add more details"
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSymptom(symptom.symptomId);
                            }}
                            className="text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Disclaimer */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    This system does not diagnose diseases or provide medical advice. Always consult a qualified healthcare provider.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Doctor Dashboard */
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Doctor Dashboard
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => navigate('/treatment/planner')}
                  className="py-4 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Create Treatment Plan
                </button>
                <button
                  onClick={() => navigate('/patients/summary')}
                  className="py-4 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  View Patient Summary
                </button>
                <button
                  onClick={() => navigate('/adherence/dashboard')}
                  className="py-4 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  Adherence Dashboard
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* QR Code Modal */}
      {showQRModal && qrCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Your QR Code</h3>
              <button
                onClick={() => {
                  setShowQRModal(false);
                  setQrCode(null);
                  setUniqueCode(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="text-center">
              <img src={qrCode} alt="Patient QR Code" className="mx-auto mb-4 border-2 border-gray-200 rounded" />
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-2">Unique Access Code</p>
                <p className="text-2xl font-mono font-bold text-gray-900">{uniqueCode}</p>
                <p className="text-xs text-gray-500 mt-2">Doctor can enter this code manually</p>
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(uniqueCode || '');
                  alert('Code copied to clipboard!');
                }}
                className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Copy Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Details Modal */}
      {showAddDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add More Details</h3>
              <button
                onClick={() => {
                  setShowAddDetailsModal(false);
                  setSelectedSymptomId(null);
                  setAdditionalDetails('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Symptoms or Details
                </label>
                <textarea
                  value={additionalDetails}
                  onChange={(e) => setAdditionalDetails(e.target.value)}
                  placeholder="Describe any new symptoms or additional details..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={submitAdditionalDetails}
                  disabled={isAddingDetails || !additionalDetails.trim()}
                  className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
                >
                  {isAddingDetails ? 'Adding...' : 'Add Details'}
                </button>
                <button
                  onClick={() => {
                    setShowAddDetailsModal(false);
                    setSelectedSymptomId(null);
                    setAdditionalDetails('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

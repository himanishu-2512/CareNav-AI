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

  // Calculate age from date of birth
  const calculateAge = (dob: string): number => {
    if (!dob) return 0;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

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
            {/* Welcome Section with Patient Profile */}
            <div className="bg-white shadow rounded-lg p-6 border-t-4 border-red-500">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Welcome back!
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Manage your symptoms and health records
                  </p>
                  
                  {/* Patient Profile Details */}
                  <div className="bg-gray-50 rounded-lg p-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Name</p>
                        <p className="text-sm font-medium text-gray-900">{user?.name || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-sm font-medium text-gray-900">{user?.email || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Age</p>
                        <p className="text-sm font-medium text-gray-900">
                          {user?.dateOfBirth 
                            ? `${calculateAge(user.dateOfBirth)} years` 
                            : (user?.age ? `${user.age} years` : 'Not set')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Gender</p>
                        <p className="text-sm font-medium text-gray-900 capitalize">{user?.gender || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Blood Group</p>
                        <p className="text-sm font-medium text-gray-900">{user?.bloodGroup || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Contact</p>
                        <p className="text-sm font-medium text-gray-900">{user?.contact || 'Not set'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500">Parent/Guardian</p>
                        <p className="text-sm font-medium text-gray-900">{user?.parentName || 'Not set'}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Edit Profile Icon */}
                <button
                  onClick={() => navigate('/profile/edit')}
                  className="ml-4 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  title="Edit Profile"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Add New Symptom */}
              <div className="bg-white shadow rounded-lg p-6 border-t-4 border-blue-600">
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
              <div className="bg-white shadow rounded-lg p-6 border-t-4 border-green-600">
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

              {/* Medicine Schedule - Yellow Line Feature 1 */}
              <div className="bg-white shadow rounded-lg p-6 border-t-4 border-orange-600">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <h3 className="ml-3 text-lg font-semibold text-gray-900">
                    Medicine Schedule
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  View your medications and dosage schedule
                </p>
                <button
                  onClick={() => navigate('/treatment/schedule')}
                  className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  View Medicine Schedule
                </button>
              </div>

              {/* Department Predictor - Yellow Line Feature 2 */}
              <div className="bg-white shadow rounded-lg p-6 border-t-4 border-indigo-600">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="ml-3 text-lg font-semibold text-gray-900">
                    Department Finder
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  AI-powered department recommendation based on symptoms
                </p>
                <button
                  onClick={() => navigate('/department/finder')}
                  className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Find Department
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
          </div>
        ) : (
          /* Doctor Dashboard */
          <div className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Doctor Dashboard
              </h2>
              <p className="text-gray-600">
                Manage patients, prescriptions, and treatment plans
              </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => navigate('/doctor/patients')}
                className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow border-t-4 border-blue-600 text-left"
              >
                <div className="flex items-center mb-3">
                  <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Patient List</h3>
                <p className="text-sm text-gray-600">View all registered patients</p>
              </button>

              <button
                onClick={() => navigate('/doctor/prescribe')}
                className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow border-t-4 border-green-600 text-left"
              >
                <div className="flex items-center mb-3">
                  <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Prescribe Medicine</h3>
                <p className="text-sm text-gray-600">Create new prescription</p>
              </button>

              <button
                onClick={() => navigate('/treatment/planner')}
                className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow border-t-4 border-purple-600 text-left"
              >
                <div className="flex items-center mb-3">
                  <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Treatment Plan</h3>
                <p className="text-sm text-gray-600">Create treatment schedule</p>
              </button>

              <button
                onClick={() => navigate('/adherence/dashboard')}
                className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow border-t-4 border-orange-600 text-left"
              >
                <div className="flex items-center mb-3">
                  <svg className="h-8 w-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Adherence</h3>
                <p className="text-sm text-gray-600">Track medication adherence</p>
              </button>
            </div>

            {/* Additional Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Access</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/patients/summary')}
                    className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-between"
                  >
                    <span className="text-sm font-medium text-gray-700">Patient Summary</span>
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => navigate('/doctor/qr-scanner')}
                    className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-between"
                  >
                    <span className="text-sm font-medium text-gray-700">Scan Patient QR</span>
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Patients</span>
                    <span className="text-lg font-semibold text-gray-900">-</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Active Treatments</span>
                    <span className="text-lg font-semibold text-gray-900">-</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Pending Reviews</span>
                    <span className="text-lg font-semibold text-gray-900">-</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* QR Code Modal */}
      {showQRModal && qrCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-md w-full p-6 my-8">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-md w-full p-6 my-8">
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

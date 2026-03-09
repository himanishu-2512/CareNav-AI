import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from './Header';
import axiosInstance from '../lib/axios';

interface PatientInfo {
  patientId: string;
  name: string;
  age: number;
  gender: string;
}

interface MedicineAdherence {
  medicineId: string;
  medicineName: string;
  dosage: string;
  adherencePercentage: number;
  scheduled: number;
  taken: number;
  missed: number;
  isActive: boolean;
  startDate: string;
  stopDate: string;
  warningLevel: 'good' | 'warning' | 'critical';
}

interface AdherenceData {
  patient: PatientInfo;
  adherence: {
    overall: number;
    isLowAdherence: boolean;
    warningLevel: 'good' | 'warning' | 'critical';
    totalScheduled: number;
    totalTaken: number;
    totalMissed: number;
  };
  medicines: MedicineAdherence[];
}

export default function PatientAdherence() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [adherenceData, setAdherenceData] = useState<AdherenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (patientId) {
      fetchAdherenceData();
    }
  }, [patientId]);

  const fetchAdherenceData = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/adherence/${patientId}`);
      setAdherenceData(response.data);
    } catch (err: any) {
      console.error('Failed to load adherence data:', err);
      setError(err.response?.data?.message || 'Failed to load adherence data');
    } finally {
      setLoading(false);
    }
  };

  const getWarningColor = (level: string) => {
    switch (level) {
      case 'good':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
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

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : adherenceData ? (
          <div className="space-y-6">
            {/* Patient Header */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{adherenceData.patient.name}</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    {adherenceData.patient.age} years • {adherenceData.patient.gender}
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/doctor/patient/${patientId}/treatments`)}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  View Treatment Plans
                </button>
              </div>
            </div>

            {/* Overall Adherence */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Overall Adherence</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className={`p-4 rounded-lg border ${getWarningColor(adherenceData.adherence.warningLevel)}`}>
                  <div className="text-3xl font-bold">{adherenceData.adherence.overall}%</div>
                  <div className="text-sm mt-1">Overall Rate</div>
                </div>
                <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                  <div className="text-3xl font-bold text-gray-900">{adherenceData.adherence.totalScheduled}</div>
                  <div className="text-sm text-gray-600 mt-1">Total Scheduled</div>
                </div>
                <div className="p-4 rounded-lg border border-green-200 bg-green-50">
                  <div className="text-3xl font-bold text-green-600">{adherenceData.adherence.totalTaken}</div>
                  <div className="text-sm text-green-700 mt-1">Doses Taken</div>
                </div>
                <div className="p-4 rounded-lg border border-red-200 bg-red-50">
                  <div className="text-3xl font-bold text-red-600">{adherenceData.adherence.totalMissed}</div>
                  <div className="text-sm text-red-700 mt-1">Doses Missed</div>
                </div>
              </div>
            </div>

            {/* Medicine-wise Adherence */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Medicine-wise Adherence</h2>
              
              {adherenceData.medicines.filter(m => m.isActive).length > 0 && (
                <div className="mb-6">
                  <h3 className="text-md font-medium text-gray-900 mb-3">Active Medicines</h3>
                  <div className="space-y-3">
                    {adherenceData.medicines.filter(m => m.isActive).map((medicine) => (
                      <div key={medicine.medicineId} className={`border rounded-lg p-4 ${getWarningColor(medicine.warningLevel)}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900">{medicine.medicineName}</h4>
                            <p className="text-sm text-gray-600">{medicine.dosage}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">{medicine.adherencePercentage}%</div>
                            <div className="text-xs text-gray-600">Adherence</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="font-medium">Scheduled:</span> {medicine.scheduled}
                          </div>
                          <div className="text-green-600">
                            <span className="font-medium">Taken:</span> {medicine.taken}
                          </div>
                          <div className="text-red-600">
                            <span className="font-medium">Missed:</span> {medicine.missed}
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          {new Date(medicine.startDate).toLocaleDateString()} - {new Date(medicine.stopDate).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {adherenceData.medicines.filter(m => !m.isActive).length > 0 && (
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-3">Completed Medicines</h3>
                  <div className="space-y-3">
                    {adherenceData.medicines.filter(m => !m.isActive).map((medicine) => (
                      <div key={medicine.medicineId} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-gray-700">{medicine.medicineName}</h4>
                            <p className="text-sm text-gray-600">{medicine.dosage}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-700">{medicine.adherencePercentage}%</div>
                            <div className="text-xs text-gray-600">Final Adherence</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Scheduled:</span> {medicine.scheduled}
                          </div>
                          <div>
                            <span className="font-medium">Taken:</span> {medicine.taken}
                          </div>
                          <div>
                            <span className="font-medium">Missed:</span> {medicine.missed}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

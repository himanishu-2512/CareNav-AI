import React, { useState } from 'react';
import axios from '../lib/axios';

interface MissedDose {
  medicineId: string;
  medicineName: string;
  dosage: string;
  scheduledDate: string;
  scheduledTime: string;
  status: string;
}

interface AdherenceTrend {
  date: string;
  adherencePercentage: number;
  scheduled: number;
  taken: number;
  missed: number;
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

interface PatientAdherence {
  patient: {
    patientId: string;
    name: string;
    age: number;
    gender: string;
  };
  adherence: {
    overall: number;
    isLowAdherence: boolean;
    warningLevel: 'good' | 'warning' | 'critical';
    totalScheduled: number;
    totalTaken: number;
    totalMissed: number;
    lastCalculated: string;
  };
  medicines: MedicineAdherence[];
  trends: {
    daily: AdherenceTrend[];
    weekly: AdherenceTrend[];
  };
  missedDoses: MissedDose[];
  summary: {
    hasLowAdherence: boolean;
    lowAdherenceMedicines: string[];
    recentMissedCount: number;
    recommendations: string[];
  };
}

export const AdherenceDashboard: React.FC = () => {
  const [patientId, setPatientId] = useState('');
  const [adherenceData, setAdherenceData] = useState<PatientAdherence | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientId.trim()) {
      setError('Please enter a patient ID');
      return;
    }

    setLoading(true);
    setError('');
    setAdherenceData(null);

    try {
      const response = await axios.get(`/adherence/${patientId.trim()}`);
      setAdherenceData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load adherence data');
    } finally {
      setLoading(false);
    }
  };

  const getAdherenceColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAdherenceBgColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-50 border-green-300';
    if (rate >= 60) return 'bg-yellow-50 border-yellow-300';
    return 'bg-red-50 border-red-300';
  };

  const getAdherenceIcon = (rate: number) => {
    if (rate >= 80) {
      return (
        <svg className="h-8 w-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
    }
    if (rate >= 60) {
      return (
        <svg className="h-8 w-8 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
    }
    return (
      <svg className="h-8 w-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-4 md:p-6">
      {/* Back Button */}
      <div className="mb-4 md:mb-6">
        <button
          onClick={() => window.history.back()}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
        >
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 md:mb-6">Adherence Dashboard</h1>

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 md:mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <label htmlFor="patientId" className="block text-sm font-medium text-gray-700 mb-2">
              Patient ID
            </label>
            <input
              type="text"
              id="patientId"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              placeholder="Enter patient ID"
              disabled={loading}
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium text-sm sm:text-base"
            >
              {loading ? 'Loading...' : 'View Adherence'}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>

      {/* Adherence Data */}
      {adherenceData && (
        <div className="space-y-4 sm:space-y-6">
          {/* Overall Adherence Card */}
          <div className={`rounded-lg shadow-md p-4 sm:p-6 border-2 ${getAdherenceBgColor(adherenceData.adherence.overall)}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{adherenceData.patient.name}</h2>
                <p className="text-xs sm:text-sm text-gray-600">Patient ID: {adherenceData.patient.patientId}</p>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  Active Medicines: {adherenceData.medicines.filter(m => m.isActive).length}
                </p>
              </div>
              <div className="text-center">
                {getAdherenceIcon(adherenceData.adherence.overall)}
                <div className={`text-3xl sm:text-4xl font-bold mt-2 ${getAdherenceColor(adherenceData.adherence.overall)}`}>
                  {adherenceData.adherence.overall}%
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">Overall Adherence</p>
              </div>
            </div>

            {adherenceData.adherence.isLowAdherence && (
              <div className="mt-4 pt-4 border-t border-gray-300">
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm text-red-800 font-medium mb-2">
                      Low adherence detected. Consider patient follow-up and intervention.
                    </p>
                    {adherenceData.summary.recommendations.length > 0 && (
                      <ul className="text-sm text-red-700 space-y-1">
                        {adherenceData.summary.recommendations.map((rec, idx) => (
                          <li key={idx}>• {rec}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Medicine-wise Adherence */}
          {adherenceData.medicines.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Medicine-wise Adherence</h2>
              
              <div className="space-y-3 sm:space-y-4">
                {adherenceData.medicines.map((medicine) => (
                  <div key={medicine.medicineId} className={`p-3 sm:p-4 rounded-lg border-2 ${getAdherenceBgColor(medicine.adherencePercentage)}`}>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 text-sm sm:text-base">{medicine.medicineName}</h3>
                        <p className="text-xs sm:text-sm text-gray-600">{medicine.dosage}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(medicine.startDate).toLocaleDateString()} - {new Date(medicine.stopDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <div className={`text-xl sm:text-2xl font-bold ${getAdherenceColor(medicine.adherencePercentage)}`}>
                          {medicine.adherencePercentage}%
                        </div>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                          medicine.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {medicine.isActive ? 'Active' : 'Completed'}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
                      <div>
                        <span className="text-gray-600">Scheduled:</span>
                        <span className="ml-1 sm:ml-2 font-medium">{medicine.scheduled}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Taken:</span>
                        <span className="ml-1 sm:ml-2 font-medium text-green-600">{medicine.taken}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Missed:</span>
                        <span className="ml-1 sm:ml-2 font-medium text-red-600">{medicine.missed}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Adherence Trends */}
          {adherenceData.trends.daily.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Adherence Trends (Last 30 Days)</h2>
              
              <div className="space-y-3">
                {adherenceData.trends.daily.slice(-30).map((trend, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-24 text-sm text-gray-600">{trend.date}</div>
                    <div className="flex-1 mx-4">
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                          className={`h-4 rounded-full transition-all ${
                            trend.adherencePercentage >= 80
                              ? 'bg-green-600'
                              : trend.adherencePercentage >= 60
                              ? 'bg-yellow-600'
                              : 'bg-red-600'
                          }`}
                          style={{ width: `${trend.adherencePercentage}%` }}
                        />
                      </div>
                    </div>
                    <div className={`w-16 text-right font-medium ${getAdherenceColor(trend.adherencePercentage)}`}>
                      {trend.adherencePercentage}%
                    </div>
                    <div className="ml-4 text-xs text-gray-500">
                      {trend.taken}/{trend.scheduled}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Missed Doses */}
          {adherenceData.missedDoses.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Missed Doses ({adherenceData.missedDoses.length})
              </h2>
              
              <div className="space-y-3">
                {adherenceData.missedDoses.map((dose, index) => (
                  <div key={index} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{dose.medicineName}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Dosage: {dose.dosage}
                        </p>
                        <p className="text-sm text-gray-600">
                          Scheduled: {dose.scheduledTime} on {new Date(dose.scheduledDate).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-red-600 text-white text-xs font-medium rounded-full">
                        Missed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {adherenceData.missedDoses.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <svg className="mx-auto h-12 w-12 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No missed doses</h3>
              <p className="mt-1 text-sm text-gray-500">Patient is maintaining good adherence.</p>
            </div>
          )}

          {/* Adherence Guidelines */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Adherence Guidelines</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>≥80%: Good adherence - Continue monitoring</li>
                    <li>60-79%: Moderate adherence - Consider patient counseling</li>
                    <li>&lt;60%: Poor adherence - Immediate intervention recommended</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

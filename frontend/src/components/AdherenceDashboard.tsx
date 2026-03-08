import React, { useState } from 'react';
import axios from '../lib/axios';

interface MissedDose {
  medicineId: string;
  medicineName: string;
  doseTime: string;
  missedDate: string;
}

interface AdherenceTrend {
  date: string;
  adherenceRate: number;
}

interface PatientAdherence {
  patientId: string;
  patientName: string;
  overallAdherence: number;
  activeMedicines: number;
  missedDoses: MissedDose[];
  trends: AdherenceTrend[];
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
    <div className="max-w-6xl mx-auto p-6">
      {/* Demo Data Warning */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              DEMO DATA ONLY - This is a demonstration system. Do not use for actual patient monitoring.
            </p>
          </div>
        </div>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-6">Adherence Dashboard</h1>

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="patientId" className="block text-sm font-medium text-gray-700 mb-2">
              Patient ID
            </label>
            <input
              type="text"
              id="patientId"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter patient ID"
              disabled={loading}
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
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
        <div className="space-y-6">
          {/* Overall Adherence Card */}
          <div className={`rounded-lg shadow-md p-6 border-2 ${getAdherenceBgColor(adherenceData.overallAdherence)}`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{adherenceData.patientName}</h2>
                <p className="text-sm text-gray-600">Patient ID: {adherenceData.patientId}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Active Medicines: {adherenceData.activeMedicines}
                </p>
              </div>
              <div className="text-center">
                {getAdherenceIcon(adherenceData.overallAdherence)}
                <div className={`text-4xl font-bold mt-2 ${getAdherenceColor(adherenceData.overallAdherence)}`}>
                  {adherenceData.overallAdherence}%
                </div>
                <p className="text-sm text-gray-600 mt-1">Overall Adherence</p>
              </div>
            </div>

            {adherenceData.overallAdherence < 80 && (
              <div className="mt-4 pt-4 border-t border-gray-300">
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-red-800 font-medium">
                    Low adherence detected. Consider patient follow-up and intervention.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Adherence Trends */}
          {adherenceData.trends.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Adherence Trends</h2>
              
              <div className="space-y-3">
                {adherenceData.trends.map((trend, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-24 text-sm text-gray-600">{trend.date}</div>
                    <div className="flex-1 mx-4">
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                          className={`h-4 rounded-full transition-all ${
                            trend.adherenceRate >= 80
                              ? 'bg-green-600'
                              : trend.adherenceRate >= 60
                              ? 'bg-yellow-600'
                              : 'bg-red-600'
                          }`}
                          style={{ width: `${trend.adherenceRate}%` }}
                        />
                      </div>
                    </div>
                    <div className={`w-16 text-right font-medium ${getAdherenceColor(trend.adherenceRate)}`}>
                      {trend.adherenceRate}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Missed Doses */}
          {adherenceData.missedDoses.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Missed Doses</h2>
              
              <div className="space-y-3">
                {adherenceData.missedDoses.map((dose, index) => (
                  <div key={index} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{dose.medicineName}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Scheduled: {dose.doseTime}
                        </p>
                        <p className="text-sm text-gray-600">
                          Date: {dose.missedDate}
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

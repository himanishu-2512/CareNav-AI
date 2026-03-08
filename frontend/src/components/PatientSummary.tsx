import { useState } from 'react';
import axios from '../lib/axios';

interface Patient {
  patientId: string;
  name: string;
  age: number;
  gender: string;
  contact: string;
  registrationDate: string;
}

interface RedFlag {
  keyword: string;
  source: string;
  context: string;
}

interface TimelineEntry {
  date: string;
  reportId: string;
  fileName: string;
  summary: string;
}

export const PatientSummary: React.FC = () => {
  const [patientId, setPatientId] = useState('');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [redFlags, setRedFlags] = useState<RedFlag[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
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
    setPatient(null);
    setRedFlags([]);
    setTimeline([]);

    try {
      // Fetch patient data
      const patientResponse = await axios.get(`/patients/${patientId.trim()}`);
      setPatient(patientResponse.data.patient);

      // Fetch red flags
      const redFlagsResponse = await axios.get(`/patients/${patientId.trim()}/red-flags`);
      setRedFlags(redFlagsResponse.data.redFlags || []);

      // Fetch medical timeline
      const timelineResponse = await axios.get(`/reports/timeline/${patientId.trim()}`);
      setTimeline(timelineResponse.data.timeline || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load patient data');
    } finally {
      setLoading(false);
    }
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
              DEMO DATA ONLY - This is a demonstration system. Do not use for actual patient care.
            </p>
          </div>
        </div>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-6">Patient Summary</h1>

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
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>

      {/* Patient Information */}
      {patient && (
        <div className="space-y-6">
          {/* Critical Information - Red Flags */}
          {redFlags.length > 0 && (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <svg className="h-6 w-6 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <h2 className="text-xl font-bold text-red-900">Critical Information</h2>
              </div>
              
              <div className="space-y-3">
                {redFlags.map((flag, index) => (
                  <div key={index} className="flex items-start">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-600 text-white mr-3">
                      {flag.keyword}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm text-red-900">
                        <span className="font-medium">Source:</span> {flag.source}
                      </p>
                      {flag.context && (
                        <p className="text-sm text-red-800 mt-1">{flag.context}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-red-200">
                <p className="text-xs text-red-700">
                  ⓘ Red flags are automatically highlighted based on keywords. Always verify with patient records and clinical assessment.
                </p>
              </div>
            </div>
          )}

          {/* Patient Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Patient Information</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Name</p>
                <p className="text-gray-900 font-semibold">{patient.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Patient ID</p>
                <p className="text-gray-900">{patient.patientId}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Age</p>
                <p className="text-gray-900">{patient.age} years</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Gender</p>
                <p className="text-gray-900 capitalize">{patient.gender}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Contact</p>
                <p className="text-gray-900">{patient.contact}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Registration Date</p>
                <p className="text-gray-900">{patient.registrationDate}</p>
              </div>
            </div>
          </div>

          {/* Medical Timeline */}
          {timeline.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Medical Timeline</h2>
              
              <div className="space-y-4">
                {timeline.map((entry, index) => (
                  <div key={entry.reportId} className="flex">
                    <div className="flex flex-col items-center mr-4">
                      <div className="w-3 h-3 bg-blue-600 rounded-full" />
                      {index < timeline.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-300 mt-1" />
                      )}
                    </div>
                    <div className="pb-4 flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900">{entry.date}</p>
                        <span className="text-xs text-gray-500">{entry.fileName}</span>
                      </div>
                      <p className="text-sm text-gray-700">{entry.summary}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {timeline.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No medical records</h3>
              <p className="mt-1 text-sm text-gray-500">This patient has not uploaded any medical reports yet.</p>
            </div>
          )}

          {/* Automated Highlighting Disclaimer */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Red flag highlighting is automated and may not capture all critical information. Always perform a comprehensive clinical assessment and review complete patient records.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

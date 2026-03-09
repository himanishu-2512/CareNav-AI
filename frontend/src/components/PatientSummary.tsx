import { useState } from 'react';
import axios from '../lib/axios';

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

export const PatientSummary: React.FC = () => {
  const [patientId, setPatientId] = useState('');
  const [patientDetail, setPatientDetail] = useState<PatientDetail | null>(null);
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
    setPatientDetail(null);

    try {
      // Fetch patient profile
      const profileResponse = await axios.get(`/patients/${patientId.trim()}`);
      
      // Fetch patient symptoms (basic list)
      const symptomsResponse = await axios.get(`/symptoms/history/${patientId.trim()}`);
      const symptomsList = symptomsResponse.data.symptoms || [];
      
      // Fetch full details for each symptom to get aiSummary and briefSummary
      const symptomsWithDetails = await Promise.all(
        symptomsList.map(async (symptom: any) => {
          try {
            const detailResponse = await axios.get(`/symptoms/${symptom.symptomId}?patientId=${patientId.trim()}`);
            return detailResponse.data;
          } catch (error) {
            console.error(`Failed to load details for symptom ${symptom.symptomId}:`, error);
            return symptom; // Return basic symptom if detail fetch fails
          }
        })
      );
      
      // Fetch patient reports
      const reportsResponse = await axios.get(`/reports/timeline/${patientId.trim()}`);
      
      setPatientDetail({
        patient: profileResponse.data,
        symptoms: symptomsWithDetails,
        reports: reportsResponse.data.reports || []
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load patient data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Back Button */}
      <div className="mb-6">
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
      {patientDetail && (
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
                  <p className="text-gray-900 font-semibold">{patientDetail.patient.name}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Age / Gender</p>
                  <p className="text-gray-900">{patientDetail.patient.age} years / {patientDetail.patient.gender}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Contact</p>
                  <p className="text-gray-900">{patientDetail.patient.contact}</p>
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
              
              patientDetail.symptoms.forEach((symptom) => {
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
            {patientDetail.reports.length > 0 && (
              <div className="bg-white rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <svg className="h-5 w-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  Recent Medical Records
                </h3>
                <div className="space-y-2">
                  {patientDetail.reports.slice(0, 3).map((report) => (
                    <div key={report.reportId} className="flex items-start text-sm p-2 bg-gray-50 rounded">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{new Date(report.uploadedAt).toLocaleDateString()}</p>
                        {report.summary && report.summary.keyFindings && report.summary.keyFindings.length > 0 && (
                          <p className="text-gray-600 text-xs">{report.summary.keyFindings[0]}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {patientDetail.reports.length > 3 && (
                    <p className="text-xs text-gray-500 text-center pt-2">
                      +{patientDetail.reports.length - 3} more records
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
            {patientDetail.symptoms.length === 0 ? (
              <p className="text-gray-500 text-sm">No symptoms reported</p>
            ) : (
              <div className="space-y-3">
                {patientDetail.symptoms.map((symptom) => (
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
          {patientDetail.reports.length > 0 && (
            <div className="bg-white rounded-lg border p-4">
              <h3 className="text-lg font-semibold mb-3">All Medical Reports</h3>
              <div className="space-y-3">
                {patientDetail.reports.map((report) => (
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
      )}
    </div>
  );
};

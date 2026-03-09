import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import axiosInstance from '../lib/axios';
// import { useAuth } from '../contexts/AuthContext';

export default function DepartmentPredictor() {
  const navigate = useNavigate();
  // const { user } = useAuth();
  const [symptomText, setSymptomText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [prediction, setPrediction] = useState<{
    department: string;
    isEmergency: boolean;
    confidence: number;
    reasoning: string;
  } | null>(null);

  const analyzeDepartment = async () => {
    if (!symptomText.trim()) {
      alert('Please describe your symptoms');
      return;
    }

    setIsAnalyzing(true);
    try {
      // Call department prediction endpoint directly without saving to history
      const response = await axiosInstance.post('/symptoms/predict-department', {
        symptomText: symptomText.trim()
      });

      setPrediction({
        department: response.data.department || 'General Medicine',
        isEmergency: response.data.isEmergency || false,
        confidence: response.data.confidence || 0.8,
        reasoning: response.data.reasoning || 'Based on symptom analysis'
      });
    } catch (error: any) {
      console.error('Department prediction failed:', error);
      alert(error.response?.data?.message || 'Failed to predict department. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-blue-600 hover:text-blue-700"
          >
            <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-6">
            <svg className="h-10 w-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-900">Department Finder</h1>
              <p className="text-gray-600">AI-powered department recommendation</p>
            </div>
          </div>

          {!prediction ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe your symptoms
                </label>
                <textarea
                  value={symptomText}
                  onChange={(e) => setSymptomText(e.target.value)}
                  placeholder="Example: I have severe chest pain and difficulty breathing..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={6}
                  disabled={isAnalyzing}
                />
                <p className="mt-2 text-sm text-gray-500">
                  Describe your symptoms in detail for accurate department recommendation
                </p>
              </div>

              <button
                onClick={analyzeDepartment}
                disabled={isAnalyzing || !symptomText.trim()}
                className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
              >
                {isAnalyzing ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </span>
                ) : (
                  'Find Department'
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Emergency Alert */}
              {prediction.isEmergency && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        ⚠️ EMERGENCY DETECTED
                      </h3>
                      <p className="mt-2 text-sm text-red-700">
                        Please visit the emergency department immediately or call emergency services!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Department Recommendation */}
              <div className={`border-2 rounded-lg p-6 ${prediction.isEmergency ? 'border-red-500 bg-red-50' : 'border-indigo-500 bg-indigo-50'}`}>
                <div className="text-center">
                  <svg className={`mx-auto h-16 w-16 ${prediction.isEmergency ? 'text-red-600' : 'text-indigo-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <h2 className="mt-4 text-2xl font-bold text-gray-900">
                    Recommended Department
                  </h2>
                  <p className={`mt-2 text-3xl font-bold ${prediction.isEmergency ? 'text-red-600' : 'text-indigo-600'}`}>
                    {prediction.department}
                  </p>
                  <div className="mt-4 flex items-center justify-center">
                    <span className="text-sm text-gray-600">Confidence:</span>
                    <div className="ml-2 flex-1 max-w-xs">
                      <div className="bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${prediction.isEmergency ? 'bg-red-600' : 'bg-indigo-600'}`}
                          style={{ width: `${prediction.confidence * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className="ml-2 text-sm font-medium text-gray-900">
                      {Math.round(prediction.confidence * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Reasoning */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Analysis</h3>
                <p className="text-sm text-gray-700">{prediction.reasoning}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setPrediction(null);
                    setSymptomText('');
                  }}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Try Again
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex-1 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                This is an AI-powered recommendation only. Always consult with a qualified healthcare provider for proper diagnosis and treatment.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

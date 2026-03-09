import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../lib/axios';
import { AxiosError } from 'axios';
import Header from './Header';

interface NavigationRecommendation {
  navigationId: string;
  recommendedDepartment: string;
  urgencyLevel: 'routine' | 'urgent' | 'emergency';
  reasoning: string;
  disclaimer: string;
  emergencyMessage?: string;
}

export default function CareNavigation() {
  const { symptomId } = useParams<{ symptomId: string }>();
  const navigate = useNavigate();
  const [recommendation, setRecommendation] = useState<NavigationRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRecommendation();
  }, [symptomId]);

  const fetchRecommendation = async () => {
    if (!symptomId) {
      setError('Symptom ID not found');
      setIsLoading(false);
      return;
    }

    try {
      // Get patientId from localStorage
      const userStr = localStorage.getItem('carenav_user');
      if (!userStr) {
        setError('User not found. Please log in again.');
        setIsLoading(false);
        return;
      }
      
      const user = JSON.parse(userStr);
      const patientId = user.userId;

      const response = await axios.post<NavigationRecommendation>('/navigation/recommend', {
        patientId,
        symptomId,
      });

      setRecommendation(response.data);
      setIsLoading(false);
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.error || 'Failed to get department recommendation');
      } else {
        setError('An unexpected error occurred');
      }
      setIsLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'routine':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'urgent':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'emergency':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'routine':
        return (
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'urgent':
        return (
          <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'emergency':
        return (
          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-center items-center py-12">
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
              <span className="ml-3 text-gray-600">Analyzing symptoms...</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!recommendation) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
          >
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
        </div>

        {/* Emergency Alert */}
        {recommendation.urgencyLevel === 'emergency' && recommendation.emergencyMessage && (
          <div className="bg-red-600 text-white p-6 rounded-lg shadow-lg mb-6 animate-pulse">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-bold mb-2">EMERGENCY</h3>
                <p className="text-lg font-semibold">{recommendation.emergencyMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Recommendation Card */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-6">
          <div className="px-6 py-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              Department Recommendation
            </h2>

            {/* Department Display */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-center mb-3">
                <svg className="h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-center text-blue-900 mb-2">
                {recommendation.recommendedDepartment}
              </h3>
              <p className="text-center text-blue-700 text-sm">
                Recommended Department
              </p>
            </div>

            {/* Urgency Level */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Urgency Level</h4>
              <div className={`p-4 rounded-lg border-2 ${getUrgencyColor(recommendation.urgencyLevel)}`}>
                <div className="flex items-center mb-2">
                  {getUrgencyIcon(recommendation.urgencyLevel)}
                  <span className="ml-3 text-lg font-bold capitalize">
                    {recommendation.urgencyLevel}
                  </span>
                </div>
                <div className="text-sm font-medium mt-2">
                  {recommendation.urgencyLevel === 'routine' && 'Can wait for scheduled appointment'}
                  {recommendation.urgencyLevel === 'urgent' && 'Should be seen within 24-48 hours'}
                  {recommendation.urgencyLevel === 'emergency' && 'Needs immediate medical attention'}
                </div>
              </div>
            </div>

            {/* Reasoning */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Reasoning</h4>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
                  {recommendation.reasoning}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mandatory Disclaimer */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Important Disclaimer
              </h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                {recommendation.disclaimer}
              </p>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Next Steps
          </h3>
          <ul className="space-y-3">
            <li className="flex items-start">
              <svg className="h-5 w-5 text-blue-600 mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-gray-700">
                Visit the <strong>{recommendation.recommendedDepartment}</strong> department at your nearest healthcare facility
              </span>
            </li>
            <li className="flex items-start">
              <svg className="h-5 w-5 text-blue-600 mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-gray-700">
                Bring any relevant medical records or previous test results
              </span>
            </li>
            <li className="flex items-start">
              <svg className="h-5 w-5 text-blue-600 mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-gray-700">
                Inform the healthcare provider about all your symptoms and their duration
              </span>
            </li>
            {recommendation.urgencyLevel === 'emergency' && (
              <li className="flex items-start">
                <svg className="h-5 w-5 text-red-600 mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-red-700 font-semibold">
                  Do not delay - seek immediate medical attention or call emergency services
                </span>
              </li>
            )}
          </ul>
        </div>

        {/* Back to Home Button */}
        <div className="flex justify-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Back to Home
          </button>
        </div>
      </main>
    </div>
  );
}

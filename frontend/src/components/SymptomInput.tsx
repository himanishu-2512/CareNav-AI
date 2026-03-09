import { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../lib/axios';
import { AxiosError } from 'axios';
import Header from './Header';

interface StructuredSymptoms {
  bodyPart: string;
  duration: string;
  severity: string;
  associatedFactors: string[];
  timing: string;
  character: string;
}

interface SymptomResponse {
  symptomId: string;
  structuredSymptoms: StructuredSymptoms;
  followUpQuestions: Array<{
    questionId: string;
    questionText: string;
    questionType: string;
  }>;
}

export default function SymptomInput() {
  const navigate = useNavigate();
  const [symptomText, setSymptomText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [, setShowVoiceMessage] = useState(false);
  const [structuredSymptoms, setStructuredSymptoms] = useState<StructuredSymptoms | null>(null);
  const [symptomId, setSymptomId] = useState<string | null>(null);
  const [followUpQuestions, setFollowUpQuestions] = useState<Array<{
    questionId: string;
    questionText: string;
    questionType: string;
  }> | null>(null);

  const characterCount = symptomText.length;
  const maxCharacters = 2000;

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= maxCharacters) {
      setSymptomText(text);
    }
  };

  const handleVoiceClick = () => {
    setShowVoiceMessage(true);
    setTimeout(() => setShowVoiceMessage(false), 3000);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!symptomText.trim()) {
      setError('Please describe your symptoms');
      return;
    }

    if (symptomText.trim().length < 10) {
      setError('Please provide more details about your symptoms (at least 10 characters)');
      return;
    }

    setIsLoading(true);

    try {
      // Get user from localStorage
      const userStr = localStorage.getItem('carenav_user');
      if (!userStr) {
        throw new Error('User not found. Please log in again.');
      }
      const user = JSON.parse(userStr);

      const response = await axios.post<SymptomResponse>('/symptoms/input', {
        patientId: user.userId,
        symptomText: symptomText.trim(),
        inputMethod: 'text',
      });

      setSymptomId(response.data.symptomId);
      setStructuredSymptoms(response.data.structuredSymptoms);
      setFollowUpQuestions(response.data.followUpQuestions || []);
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.error || 'Failed to process symptoms. Please try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    console.log('handleConfirm called', { symptomId, followUpQuestions });
    // Navigate to follow-up questions with symptomId and questions
    if (symptomId) {
      if (followUpQuestions && followUpQuestions.length > 0) {
        console.log('Navigating to follow-up questions');
        navigate(`/symptoms/followup/${symptomId}`, {
          state: { questions: followUpQuestions }
        });
      } else {
        // No follow-up questions, go directly to care navigation
        console.log('Navigating to care navigation');
        navigate(`/symptoms/navigation/${symptomId}`);
      }
    } else {
      console.error('No symptomId available');
    }
  };

  const handleEdit = () => {
    setStructuredSymptoms(null);
    setSymptomId(null);
    setFollowUpQuestions(null);
  };

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

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Describe Your Symptoms
          </h2>

          {!structuredSymptoms ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
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
              )}

              <div>
                <label
                  htmlFor="symptoms"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Tell us what you're experiencing
                </label>
                <p className="text-sm text-gray-500 mb-3">
                  Describe your symptoms in your own words. Include details like when they started,
                  how severe they are, and what makes them better or worse.
                </p>
                <textarea
                  id="symptoms"
                  name="symptoms"
                  rows={8}
                  value={symptomText}
                  onChange={handleTextChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Example: I've been having a headache for the past 3 days. It's a dull pain on the right side of my head that gets worse in the afternoon..."
                  disabled={isLoading}
                />
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Minimum 10 characters
                  </span>
                  <span
                    className={`text-xs ${
                      characterCount > maxCharacters * 0.9
                        ? 'text-red-600 font-semibold'
                        : 'text-gray-500'
                    }`}
                  >
                    {characterCount} / {maxCharacters}
                  </span>
                </div>
              </div>

              {/* Voice Input Button (Placeholder) */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleVoiceClick}
                  disabled={isLoading}
                  className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <svg
                    className="h-5 w-5 mr-2 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                  Use Voice Input
                </button>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isLoading || symptomText.trim().length < 10}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                      Processing with AI...
                    </>
                  ) : (
                    'Analyze Symptoms'
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Structured Symptom Summary */
            <div className="space-y-6">
              <div className="bg-green-50 border-l-4 border-green-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-green-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">
                      Your symptoms have been processed successfully!
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Symptom Summary
                </h3>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="bg-gray-50 px-4 py-3 rounded-md">
                    <dt className="text-sm font-medium text-gray-500">Body Part</dt>
                    <dd className="mt-1 text-sm text-gray-900">{structuredSymptoms.bodyPart}</dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 rounded-md">
                    <dt className="text-sm font-medium text-gray-500">Duration</dt>
                    <dd className="mt-1 text-sm text-gray-900">{structuredSymptoms.duration}</dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 rounded-md">
                    <dt className="text-sm font-medium text-gray-500">Severity</dt>
                    <dd className="mt-1 text-sm text-gray-900 capitalize">
                      {structuredSymptoms.severity}
                    </dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 rounded-md">
                    <dt className="text-sm font-medium text-gray-500">Timing</dt>
                    <dd className="mt-1 text-sm text-gray-900">{structuredSymptoms.timing}</dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 rounded-md sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Character</dt>
                    <dd className="mt-1 text-sm text-gray-900">{structuredSymptoms.character}</dd>
                  </div>
                  {structuredSymptoms.associatedFactors.length > 0 && (
                    <div className="bg-gray-50 px-4 py-3 rounded-md sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">Associated Factors</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <ul className="list-disc list-inside">
                          {structuredSymptoms.associatedFactors.map((factor, index) => (
                            <li key={index}>{factor}</li>
                          ))}
                        </ul>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-sm text-blue-800">
                  Please review the summary above. If it looks correct, click "Confirm" to continue.
                  If you need to make changes, click "Edit" to modify your description.
                </p>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={handleEdit}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Edit Description
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Confirm & Continue
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { AxiosError } from 'axios';
import axiosInstance from '../lib/axios';
import Header from './Header';

interface Question {
  questionId: string;
  questionText: string;
  questionType: 'text' | 'yes_no' | 'multiple_choice' | 'scale';
  options?: string[];
}

interface StructuredSymptoms {
  bodyPart: string;
  duration: string;
  severity: string;
  associatedFactors: string[];
  timing: string;
  character: string;
}

interface AnswerSubmitResponse {
  updatedSymptoms?: StructuredSymptoms;
  additionalQuestions?: Question[];
  round?: number | 'complete';
  message?: string;
}

export default function FollowUpQuestions() {
  const navigate = useNavigate();
  const { symptomId } = useParams<{ symptomId: string }>();
  const location = useLocation();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [updatedSymptoms, setUpdatedSymptoms] = useState<StructuredSymptoms | null>(null);
  const [displayMode, setDisplayMode] = useState<'one-at-a-time' | 'list'>('one-at-a-time');
  const [showRoundTransition, setShowRoundTransition] = useState(false);

  useEffect(() => {
    // Get questions from navigation state (passed from SymptomInput)
    const state = location.state as { questions?: Question[] };
    if (state?.questions && state.questions.length > 0) {
      setQuestions(state.questions);
      setIsLoading(false);
    } else {
      setError('No follow-up questions available');
      setIsLoading(false);
    }
  }, [location]);

  const handleAnswerChange = (value: string) => {
    setCurrentAnswer(value);
  };

  const handleNext = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    
    if (currentAnswer.trim()) {
      // Save the answer
      const newAnswers = { ...answers, [currentQuestion.questionId]: currentAnswer };
      setAnswers(newAnswers);
    }

    // Move to next question
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentAnswer('');
    } else {
      // All questions answered, submit
      await submitAnswers();
    }
  };

  const handleSkip = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentAnswer('');
    } else {
      // Last question, submit what we have
      submitAnswers();
    }
  };

  const handleListAnswerChange = (questionId: string, value: string) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleSubmitAll = async (e: FormEvent) => {
    e.preventDefault();
    await submitAnswers();
  };

  const submitAnswers = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      // Get patientId from localStorage (from auth context)
      const userStr = localStorage.getItem('carenav_user');
      if (!userStr) {
        setError('User not found. Please log in again.');
        setIsSubmitting(false);
        return;
      }
      
      const user = JSON.parse(userStr);
      const patientId = user.userId; // userId is the patientId

      // Submit all answers
      const answerArray = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      }));

      const response = await axiosInstance.post<AnswerSubmitResponse>('/symptoms/followup/answer', {
        patientId,
        symptomId,
        answers: answerArray,
      });

      // Check if there are additional questions (Round 2)
      if (response.data.additionalQuestions && response.data.additionalQuestions.length > 0) {
        console.log('Received additional questions:', response.data.additionalQuestions.length);
        
        // Show transition message
        setShowRoundTransition(true);
        
        // Append new questions to existing questions array
        setQuestions(prevQuestions => [...prevQuestions, ...response.data.additionalQuestions!]);
        
        // Move to the first new question
        setCurrentQuestionIndex(questions.length);
        
        // Clear current answer
        setCurrentAnswer('');
        
        // Hide transition message after 3 seconds
        setTimeout(() => {
          setShowRoundTransition(false);
        }, 3000);
        
        // Don't show completion screen yet
        return;
      }
      
      // All questions answered or no more questions - show completion
      if (response.data.updatedSymptoms) {
        setUpdatedSymptoms(response.data.updatedSymptoms);
      }
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.error || 'Failed to submit answers');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinue = () => {
    // Navigate to care navigation
    navigate(`/symptoms/navigation/${symptomId}`);
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
              <span className="ml-3 text-gray-600">Loading questions...</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    No follow-up questions available at this time.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Home
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (updatedSymptoms) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
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
                    Thank you! Your answers have been recorded.
                  </p>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Updated Symptom Summary
            </h2>

            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="bg-gray-50 px-4 py-3 rounded-md">
                <dt className="text-sm font-medium text-gray-500">Body Part</dt>
                <dd className="mt-1 text-sm text-gray-900">{updatedSymptoms.bodyPart}</dd>
              </div>
              <div className="bg-gray-50 px-4 py-3 rounded-md">
                <dt className="text-sm font-medium text-gray-500">Duration</dt>
                <dd className="mt-1 text-sm text-gray-900">{updatedSymptoms.duration}</dd>
              </div>
              <div className="bg-gray-50 px-4 py-3 rounded-md">
                <dt className="text-sm font-medium text-gray-500">Severity</dt>
                <dd className="mt-1 text-sm text-gray-900 capitalize">
                  {updatedSymptoms.severity}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-3 rounded-md">
                <dt className="text-sm font-medium text-gray-500">Timing</dt>
                <dd className="mt-1 text-sm text-gray-900">{updatedSymptoms.timing}</dd>
              </div>
              <div className="bg-gray-50 px-4 py-3 rounded-md sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Character</dt>
                <dd className="mt-1 text-sm text-gray-900">{updatedSymptoms.character}</dd>
              </div>
              {updatedSymptoms.associatedFactors.length > 0 && (
                <div className="bg-gray-50 px-4 py-3 rounded-md sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Associated Factors</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <ul className="list-disc list-inside">
                      {updatedSymptoms.associatedFactors.map((factor, index) => (
                        <li key={index}>{factor}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
              )}
            </dl>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleContinue}
                className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Continue to Department Recommendation
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Demo Data Warning */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>DEMO DATA ONLY</strong> - Do not enter real medical information.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Follow-Up Questions
            </h2>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setDisplayMode('one-at-a-time')}
                className={`px-3 py-1 text-sm rounded-md ${
                  displayMode === 'one-at-a-time'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                One at a Time
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode('list')}
                className={`px-3 py-1 text-sm rounded-md ${
                  displayMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All Questions
              </button>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-6">
            Please answer these questions to help us better understand your symptoms. You can skip
            any question if you prefer.
          </p>

          {showRoundTransition && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>Based on your answers, we have a few more questions to better understand your condition.</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
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

          {displayMode === 'one-at-a-time' ? (
            /* One at a Time Mode */
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-sm text-blue-800">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </p>
              </div>

              <div>
                <label className="block text-lg font-medium text-gray-900 mb-3">
                  {questions[currentQuestionIndex].questionText}
                </label>
                
                {/* Render input based on question type */}
                {questions[currentQuestionIndex].questionType === 'yes_no' ? (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setCurrentAnswer('Yes')}
                      className={`w-full py-3 px-4 border-2 rounded-md text-sm font-medium transition-colors ${
                        currentAnswer === 'Yes'
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentAnswer('No')}
                      className={`w-full py-3 px-4 border-2 rounded-md text-sm font-medium transition-colors ${
                        currentAnswer === 'No'
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      No
                    </button>
                  </div>
                ) : questions[currentQuestionIndex].questionType === 'multiple_choice' && questions[currentQuestionIndex].options ? (
                  <div className="space-y-2">
                    {questions[currentQuestionIndex].options!.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setCurrentAnswer(option)}
                        className={`w-full py-3 px-4 border-2 rounded-md text-sm font-medium text-left transition-colors ${
                          currentAnswer === option
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                ) : questions[currentQuestionIndex].questionType === 'scale' ? (
                  <div className="space-y-3">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={currentAnswer || '5'}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>1 (Mild)</span>
                      <span className="font-semibold text-blue-600">{currentAnswer || '5'}</span>
                      <span>10 (Severe)</span>
                    </div>
                  </div>
                ) : (
                  <textarea
                    value={currentAnswer}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    rows={4}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Type your answer here..."
                    disabled={isSubmitting}
                  />
                )}
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={isSubmitting}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin inline-block -ml-1 mr-2 h-4 w-4 text-white"
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
                      Submitting...
                    </>
                  ) : currentQuestionIndex < questions.length - 1 ? (
                    'Next'
                  ) : (
                    'Submit'
                  )}
                </button>
              </div>

              {/* Progress Indicator */}
              <div className="mt-4">
                <div className="flex space-x-2">
                  {questions.map((_, index) => (
                    <div
                      key={index}
                      className={`flex-1 h-2 rounded-full ${
                        index <= currentQuestionIndex ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* List Mode */
            <form onSubmit={handleSubmitAll} className="space-y-6">
              {questions.map((question, index) => (
                <div key={question.questionId} className="border-b border-gray-200 pb-6 last:border-b-0">
                  <label className="block text-base font-medium text-gray-900 mb-2">
                    {index + 1}. {question.questionText}
                  </label>
                  
                  {/* Render input based on question type */}
                  {question.questionType === 'yes_no' ? (
                    <div className="flex space-x-4">
                      <button
                        type="button"
                        onClick={() => handleListAnswerChange(question.questionId, 'Yes')}
                        className={`flex-1 py-2 px-4 border-2 rounded-md text-sm font-medium transition-colors ${
                          answers[question.questionId] === 'Yes'
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => handleListAnswerChange(question.questionId, 'No')}
                        className={`flex-1 py-2 px-4 border-2 rounded-md text-sm font-medium transition-colors ${
                          answers[question.questionId] === 'No'
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        No
                      </button>
                    </div>
                  ) : question.questionType === 'multiple_choice' && question.options ? (
                    <div className="space-y-2">
                      {question.options.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => handleListAnswerChange(question.questionId, option)}
                          className={`w-full py-2 px-4 border-2 rounded-md text-sm font-medium text-left transition-colors ${
                            answers[question.questionId] === option
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  ) : question.questionType === 'scale' ? (
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={answers[question.questionId] || '5'}
                        onChange={(e) => handleListAnswerChange(question.questionId, e.target.value)}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>1 (Mild)</span>
                        <span className="font-semibold text-blue-600">{answers[question.questionId] || '5'}</span>
                        <span>10 (Severe)</span>
                      </div>
                    </div>
                  ) : (
                    <textarea
                      value={answers[question.questionId] || ''}
                      onChange={(e) => handleListAnswerChange(question.questionId, e.target.value)}
                      rows={3}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Type your answer here (optional)..."
                      disabled={isSubmitting}
                    />
                  )}
                </div>
              ))}

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin inline-block -ml-1 mr-3 h-5 w-5 text-white"
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
                      Submitting Answers...
                    </>
                  ) : (
                    'Submit All Answers'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Disclaimer */}
        <div className="mt-6 bg-white shadow rounded-lg p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            Important Notice
          </h3>
          <p className="text-sm text-gray-600">
            These questions help us understand your symptoms better for workflow assistance only.
            This system does not diagnose diseases or provide medical advice. Always consult a
            qualified healthcare provider for medical advice, diagnosis, and treatment.
          </p>
        </div>
      </main>
    </div>
  );
}

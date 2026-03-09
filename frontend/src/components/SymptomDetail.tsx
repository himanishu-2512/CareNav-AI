import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from './Header';
import axiosInstance from '../lib/axios';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  id: string;
  type: 'question' | 'answer' | 'summary';
  content: string;
  timestamp: string;
}

export default function SymptomDetail() {
  const { symptomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [finalSummary, setFinalSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const isDoctor = user?.role === 'doctor';

  useEffect(() => {
    loadSymptomDetail();
  }, [symptomId]);

  const loadSymptomDetail = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(`/symptoms/${symptomId}?patientId=${user?.userId}`);
      const symptom = response.data;

      // Build chat-like messages
      const chatMessages: Message[] = [];

      // Initial symptom
      chatMessages.push({
        id: 'initial',
        type: 'answer',
        content: symptom.rawText,
        timestamp: symptom.createdAt
      });

      // Follow-up Q&A
      if (symptom.followUpAnswers && symptom.followUpAnswers.length > 0) {
        symptom.followUpAnswers.forEach((qa: any, index: number) => {
          chatMessages.push({
            id: `q-${index}`,
            type: 'question',
            content: qa.questionText,
            timestamp: qa.answeredAt || symptom.createdAt
          });
          chatMessages.push({
            id: `a-${index}`,
            type: 'answer',
            content: qa.answer,
            timestamp: qa.answeredAt || symptom.createdAt
          });
        });
      }

      setMessages(chatMessages);

      // Generate detailed analysis summary (for doctors only)
      const summaryText = `
**Symptom Summary**

**Body Part:** ${symptom.structuredSymptoms.bodyPart}
**Severity:** ${symptom.structuredSymptoms.severity}
**Duration:** ${symptom.structuredSymptoms.duration}

**Possible Conditions:**
${symptom.diseaseAnalysis?.map((d: any, i: number) => 
  `${i + 1}. ${d.diseaseName} (${(d.probability * 100).toFixed(0)}% probability)`
).join('\n') || 'Analysis pending'}

**Status:** ${symptom.followUpAnswers?.length > 0 ? 'Completed' : 'Pending follow-up'}
      `.trim();

      setSummary(summaryText);

      // Generate final summary (for both patients and doctors)
      const topCondition = symptom.diseaseAnalysis?.[0];
      const finalSummaryText = topCondition 
        ? `Based on your symptoms, the most likely condition is **${topCondition.diseaseName}** with ${(topCondition.probability * 100).toFixed(0)}% probability. Please consult with a healthcare professional for proper diagnosis and treatment.`
        : 'Your symptom report has been recorded. Please consult with a healthcare professional for proper diagnosis.';
      
      setFinalSummary(finalSummaryText);
    } catch (error) {
      console.error('Failed to load symptom detail:', error);
      alert('Failed to load symptom details');
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center h-96">
          <svg className="animate-spin h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-blue-600 hover:text-blue-700"
          >
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
        </div>

        <div className="bg-white shadow rounded-lg max-h-[85vh] overflow-y-auto">
          {/* Chat Header */}
          <div className="border-b border-gray-200 px-6 py-4 sticky top-0 bg-white z-10">
            <h2 className="text-xl font-semibold text-gray-900">Symptom Conversation</h2>
            <p className="text-sm text-gray-500 mt-1">Review your symptom report and analysis</p>
          </div>

          {/* Chat Messages */}
          <div className="px-6 py-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'answer' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.type === 'answer'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${message.type === 'answer' ? 'text-blue-100' : 'text-gray-500'}`}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Section - Only for Doctors */}
          {isDoctor && (
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Analysis Summary</h3>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">{summary}</pre>
              </div>
            </div>
          )}

          {/* Final Summary - For Both Patients and Doctors */}
          <div className="border-t border-gray-200 px-6 py-4 bg-blue-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Summary</h3>
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-gray-700">{finalSummary}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PatientProfile } from '../components/PatientProfile';

export const PatientProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  if (!user || user.role !== 'doctor') {
    return <div className="p-6">Access denied</div>;
  }

  if (!patientId) {
    return <div className="p-6">Patient ID required</div>;
  }

  return (
    <div>
      {/* Back Button */}
      <div className="p-6 pb-0">
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
      <PatientProfile patientId={patientId} doctorId={user.userId} />
    </div>
  );
};

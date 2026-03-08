import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { TreatmentChat } from '../components/TreatmentChat';

export const TreatmentChatPage: React.FC = () => {
  const { user } = useAuth();
  const { episodeId } = useParams<{ episodeId: string }>();
  const navigate = useNavigate();

  if (!user || user.role !== 'doctor') {
    return <div className="p-6">Access denied</div>;
  }

  if (!episodeId) {
    return <div className="p-6">Episode ID required</div>;
  }

  const handleComplete = () => {
    navigate('/doctor/dashboard');
  };

  return (
    <TreatmentChat
      episodeId={episodeId}
      patientId="" // Will be fetched from episode
      doctorId={user.userId}
      onComplete={handleComplete}
    />
  );
};

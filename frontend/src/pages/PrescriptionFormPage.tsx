import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PrescriptionForm } from '../components/PrescriptionForm';
import axios from '../lib/axios';

export const PrescriptionFormPage: React.FC = () => {
  const { user } = useAuth();
  const { episodeId } = useParams<{ episodeId: string }>();
  const navigate = useNavigate();

  if (!user || user.role !== 'doctor') {
    return <div className="p-6">Access denied</div>;
  }

  if (!episodeId) {
    return <div className="p-6">Episode ID required</div>;
  }

  const handleSubmit = async (prescription: any) => {
    await axios.post(`/prescription/create`, {
      episodeId,
      ...prescription
    });
  };

  const handleClose = () => {
    navigate(`/doctor/treatment/${episodeId}`);
  };

  return (
    <PrescriptionForm
      episodeId={episodeId}
      patientId="" // Will be fetched from episode
      onSubmit={handleSubmit}
      onClose={handleClose}
    />
  );
};

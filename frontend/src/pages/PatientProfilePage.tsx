import React from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PatientProfile } from '../components/PatientProfile';

export const PatientProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { patientId } = useParams<{ patientId: string }>();

  if (!user || user.role !== 'doctor') {
    return <div className="p-6">Access denied</div>;
  }

  if (!patientId) {
    return <div className="p-6">Patient ID required</div>;
  }

  return <PatientProfile patientId={patientId} doctorId={user.userId} />;
};

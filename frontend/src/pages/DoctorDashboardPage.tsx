import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DoctorDashboard } from '../components/DoctorDashboard';

export const DoctorDashboardPage: React.FC = () => {
  const { user } = useAuth();
  
  if (!user || user.role !== 'doctor') {
    return <div className="p-6">Access denied</div>;
  }

  return <DoctorDashboard doctorId={user.userId} />;
};

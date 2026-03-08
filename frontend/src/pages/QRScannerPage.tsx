import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { QRScanner } from '../components/QRScanner';

export const QRScannerPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!user || user.role !== 'doctor') {
    return <div className="p-6">Access denied</div>;
  }

  const handleScanSuccess = (patientId: string) => {
    setSuccess('Patient added successfully!');
    setError(null);
    setTimeout(() => {
      navigate(`/doctor/patient/${patientId}`);
    }, 1500);
  };

  const handleScanError = (errorMsg: string) => {
    setError(errorMsg);
    setSuccess(null);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Scan Patient QR Code</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-800 rounded">
          {success}
        </div>
      )}

      <QRScanner
        doctorId={user.userId}
        onScanSuccess={handleScanSuccess}
        onScanError={handleScanError}
      />
    </div>
  );
};

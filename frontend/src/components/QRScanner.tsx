import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import axios from '../lib/axios';

interface QRScannerProps {
  onScanSuccess: (patientId: string) => void;
  onScanError: (error: string) => void;
  doctorId: string;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onScanError, doctorId }) => {
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const elementId = 'qr-reader';

  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop();
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      const scanner = new Html5Qrcode(elementId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        async (decodedText: string) => {
          await handleQRScan(decodedText);
          scanner.stop();
          setScanning(false);
        },
        (errorMessage: string) => {
          console.log('QR scan error:', errorMessage);
        }
      );

      setScanning(true);
    } catch (err) {
      onScanError('Failed to start camera. Please check permissions.');
    }
  };

  const handleQRScan = async (qrData: string) => {
    try {
      const response = await axios.post('/qr/validate', { qrData, doctorId });
      if (response.data.valid && response.data.patientId) {
        onScanSuccess(response.data.patientId);
      } else {
        onScanError('Invalid QR code');
      }
    } catch (err) {
      onScanError(err instanceof Error ? err.message : 'QR validation failed');
    }
  };

  const handleManualCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate UUID format (36 characters with hyphens)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(manualCode)) {
      onScanError('Please enter a valid patient ID (UUID format)');
      return;
    }

    try {
      const response = await axios.post('/qr/validate-code', { uniqueCode: manualCode, doctorId });
      if (response.data.valid && response.data.patientId) {
        onScanSuccess(response.data.patientId);
        setManualCode('');
      } else {
        onScanError('Invalid code');
      }
    } catch (err) {
      onScanError(err instanceof Error ? err.message : 'Code validation failed');
    }
  };

  return (
    <div className="p-4">
      <div className="flex gap-4 mb-4">
        <button
          onClick={startScanning}
          disabled={scanning}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {scanning ? 'Scanning...' : 'Scan QR Code'}
        </button>
        <button
          onClick={() => setShowManualEntry(!showManualEntry)}
          className="px-4 py-2 bg-gray-500 text-white rounded"
        >
          {showManualEntry ? 'Hide' : 'Enter Code Manually'}
        </button>
      </div>

      {scanning && (
        <div id={elementId} className="w-full max-w-md mx-auto" />
      )}

      {showManualEntry && (
        <form onSubmit={handleManualCodeSubmit} className="mt-4">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.toLowerCase())}
            placeholder="Enter patient ID (e.g., 12345678-1234-1234-1234-123456789abc)"
            maxLength={36}
            className="px-4 py-2 border rounded mr-2 w-96"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            Validate Code
          </button>
        </form>
      )}
    </div>
  );
};

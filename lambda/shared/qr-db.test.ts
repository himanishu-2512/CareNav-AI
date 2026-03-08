// Unit tests for QR code database operations

import { QRCodeToken, QRCodeResponse, QRValidationRequest, QRValidationResponse } from './types';

describe('QR Code Database Types', () => {
  test('QRCodeToken type is correctly defined', () => {
    const token: QRCodeToken = {
      tokenId: 'token-123',
      patientId: 'patient-456',
      qrData: 'encrypted-data-string',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString()
    };

    expect(token.tokenId).toBe('token-123');
    expect(token.patientId).toBe('patient-456');
    expect(token.qrData).toBe('encrypted-data-string');
  });

  test('QRCodeToken with scan information', () => {
    const token: QRCodeToken = {
      tokenId: 'token-123',
      patientId: 'patient-456',
      qrData: 'encrypted-data-string',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      scannedBy: 'doctor-789',
      scannedAt: new Date().toISOString()
    };

    expect(token.scannedBy).toBe('doctor-789');
    expect(token.scannedAt).toBeDefined();
  });

  test('QRCodeResponse type is correctly defined', () => {
    const response: QRCodeResponse = {
      qrCodeImage: 'base64-encoded-png-data',
      qrData: 'encrypted-token-string',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      expiresIn: 86400
    };

    expect(response.qrCodeImage).toBe('base64-encoded-png-data');
    expect(response.expiresIn).toBe(86400);
  });

  test('QRValidationRequest type is correctly defined', () => {
    const request: QRValidationRequest = {
      qrData: 'encrypted-token-string',
      doctorId: 'doctor-789'
    };

    expect(request.qrData).toBe('encrypted-token-string');
    expect(request.doctorId).toBe('doctor-789');
  });

  test('QRValidationResponse for valid token', () => {
    const response: QRValidationResponse = {
      valid: true,
      patientId: 'patient-456',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    expect(response.valid).toBe(true);
    expect(response.patientId).toBe('patient-456');
    expect(response.error).toBeUndefined();
  });

  test('QRValidationResponse for invalid token', () => {
    const response: QRValidationResponse = {
      valid: false,
      error: 'Invalid QR code'
    };

    expect(response.valid).toBe(false);
    expect(response.error).toBe('Invalid QR code');
    expect(response.patientId).toBeUndefined();
  });

  test('QRValidationResponse for expired token', () => {
    const response: QRValidationResponse = {
      valid: false,
      error: 'QR code has expired. Please generate a new one.'
    };

    expect(response.valid).toBe(false);
    expect(response.error).toContain('expired');
  });

  test('QR token expiration is 24 hours from creation', () => {
    const now = Date.now();
    const expiresAt = new Date(now + 24 * 60 * 60 * 1000);
    
    const token: QRCodeToken = {
      tokenId: 'token-123',
      patientId: 'patient-456',
      qrData: 'encrypted-data',
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date(now).toISOString()
    };

    const createdTime = new Date(token.createdAt).getTime();
    const expiryTime = new Date(token.expiresAt).getTime();
    const diffInHours = (expiryTime - createdTime) / (1000 * 60 * 60);

    expect(diffInHours).toBe(24);
  });

  test('QRCodeResponse expiresIn is 86400 seconds (24 hours)', () => {
    const response: QRCodeResponse = {
      qrCodeImage: 'base64-data',
      qrData: 'encrypted-token',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      expiresIn: 86400
    };

    expect(response.expiresIn).toBe(86400);
    expect(response.expiresIn).toBe(24 * 60 * 60);
  });
});

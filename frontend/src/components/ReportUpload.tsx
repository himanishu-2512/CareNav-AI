import React, { useState, useRef } from 'react';
import axios from '../lib/axios';
import { useAuth } from '../contexts/AuthContext';

interface ReportSummary {
  keyFindings: string[];
  dates: string[];
  diagnoses: string[];
  medications: string[];
}

interface Report {
  reportId: string;
  patientId: string;
  fileName: string;
  uploadDate: string;
  summary: ReportSummary;
}

interface TimelineEntry {
  date: string;
  reportId: string;
  fileName: string;
  summary: string;
}

export const ReportUpload: React.FC = () => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [report, setReport] = useState<Report | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

    if (file.size > maxSize) {
      return 'File size must be less than 10MB';
    }

    if (!allowedTypes.includes(file.type)) {
      return 'Only PDF, JPEG, and PNG files are allowed';
    }

    return null;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      setFile(null);
      return;
    }

    setError('');
    setFile(selectedFile);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    setUploading(true);
    setError('');
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('patientId', user.userId);

      const response = await axios.post('/reports/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        },
      });

      setReport(response.data.report);
      
      // Fetch timeline after successful upload
      const timelineResponse = await axios.get(`/reports/timeline/${user.userId}`);
      setTimeline(timelineResponse.data.timeline);

      setFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload report. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Back Button */}
      <div className="mb-6">
        <button
          onClick={() => window.history.back()}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
        >
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-6">Upload Medical Report</h1>

      {/* Upload Area */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center ${
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-600">
            Drag and drop your medical report here, or
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            browse files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileInputChange}
          />
          <p className="mt-2 text-xs text-gray-500">
            PDF, JPEG, or PNG (max 10MB)
          </p>
        </div>

        {file && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="h-8 w-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button
                onClick={() => setFile(null)}
                className="text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        )}

        {uploading && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? 'Uploading...' : 'Upload Report'}
        </button>
      </div>

      {/* Report Summary */}
      {report && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Report Summary</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">File Name</h3>
              <p className="text-gray-900">{report.fileName}</p>
            </div>

            {report.summary.keyFindings.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Key Findings</h3>
                <ul className="list-disc list-inside space-y-1">
                  {report.summary.keyFindings.map((finding, index) => (
                    <li key={index} className="text-gray-900">{finding}</li>
                  ))}
                </ul>
              </div>
            )}

            {report.summary.diagnoses.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Diagnoses</h3>
                <ul className="list-disc list-inside space-y-1">
                  {report.summary.diagnoses.map((diagnosis, index) => (
                    <li key={index} className="text-gray-900">{diagnosis}</li>
                  ))}
                </ul>
              </div>
            )}

            {report.summary.medications.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Medications</h3>
                <ul className="list-disc list-inside space-y-1">
                  {report.summary.medications.map((medication, index) => (
                    <li key={index} className="text-gray-900">{medication}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Medical Timeline */}
      {timeline.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Medical Timeline</h2>
          
          <div className="space-y-4">
            {timeline.map((entry, index) => (
              <div key={entry.reportId} className="flex">
                <div className="flex flex-col items-center mr-4">
                  <div className="w-3 h-3 bg-blue-600 rounded-full" />
                  {index < timeline.length - 1 && (
                    <div className="w-0.5 h-full bg-gray-300 mt-1" />
                  )}
                </div>
                <div className="pb-4">
                  <p className="text-sm font-medium text-gray-900">{entry.date}</p>
                  <p className="text-sm text-gray-600">{entry.fileName}</p>
                  <p className="text-sm text-gray-700 mt-1">{entry.summary}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import axios from '../lib/axios';
import { useAuth } from '../contexts/AuthContext';

interface Dose {
  time: string;
  status: 'pending' | 'due' | 'taken' | 'missed';
  takenAt?: string;
}

interface Medicine {
  medicineId: string;
  medicineName: string;
  dosage: string;
  frequency?: string;
  startDate?: string;
  stopDate: string;
  specialInstructions?: string;
  todayDoses: Dose[];
  planName?: string;
  treatmentPlanId?: string;
}

interface CompletedTreatment {
  medicineId: string;
  medicineName: string;
  dosage: string;
  completedDate: string;
  adherenceRate: number;
}

export const TreatmentSchedule: React.FC = () => {
  const { user } = useAuth();
  const [activeMedicines, setActiveMedicines] = useState<Medicine[]>([]);
  const [completedTreatments, setCompletedTreatments] = useState<CompletedTreatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingDose, setMarkingDose] = useState<string | null>(null);
  const [editingMedicine, setEditingMedicine] = useState<string | null>(null);
  const [editedTimes, setEditedTimes] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const response = await axios.get(`/treatment/schedule/${user.userId}`);
      setActiveMedicines(response.data.activeMedicines || []);
      setCompletedTreatments(response.data.completedTreatments || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load treatment schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsTaken = async (medicineId: string, doseTime: string) => {
    if (!user) return;

    const doseKey = `${medicineId}-${doseTime}`;
    setMarkingDose(doseKey);
    setError('');

    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      await axios.post('/treatment/mark-taken', {
        patientId: user.userId,
        medicineId,
        scheduledDate: today,
        scheduledTime: doseTime,
      });

      // Refresh schedule after marking dose
      await fetchSchedule();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to mark dose as taken');
    } finally {
      setMarkingDose(null);
    }
  };

  // const handleEditTime = (medicineId: string, doseIndex: number, currentTime: string) => {
  //   setEditingMedicine(medicineId);
  //   const key = `${medicineId}-${doseIndex}`;
  //   setEditedTimes({ ...editedTimes, [key]: currentTime });
  // };

  const handleSaveTime = (medicineId: string, doseIndex: number) => {
    const key = `${medicineId}-${doseIndex}`;
    const newTime = editedTimes[key];
    
    if (!newTime) return;

    // Update the medicine's dose time locally
    setActiveMedicines(prev => prev.map(med => {
      if (med.medicineId === medicineId) {
        const updatedDoses = [...med.todayDoses];
        updatedDoses[doseIndex] = { ...updatedDoses[doseIndex], time: newTime };
        return { ...med, todayDoses: updatedDoses };
      }
      return med;
    }));

    setEditingMedicine(null);
    setEditedTimes({});
  };

  const handleCancelEdit = () => {
    setEditingMedicine(null);
    setEditedTimes({});
  };

  const groupMedicinesByTime = () => {
    const timeGroups: { [key: string]: { medicine: Medicine; dose: Dose }[] } = {};

    activeMedicines.forEach((medicine) => {
      medicine.todayDoses.forEach((dose) => {
        if (!timeGroups[dose.time]) {
          timeGroups[dose.time] = [];
        }
        timeGroups[dose.time].push({ medicine, dose });
      });
    });

    return Object.entries(timeGroups).sort(([timeA], [timeB]) => timeA.localeCompare(timeB));
  };

  const getDoseStatusColor = (status: string) => {
    switch (status) {
      case 'taken':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'due':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'missed':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getDoseStatusIcon = (status: string) => {
    switch (status) {
      case 'taken':
        return (
          <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'due':
        return (
          <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      case 'missed':
        return (
          <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="ml-4 text-gray-600">Loading treatment schedule...</p>
        </div>
      </div>
    );
  }

  const timeGroups = groupMedicinesByTime();

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

      <h1 className="text-3xl font-bold text-gray-900 mb-6">Treatment Schedule</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Active Medicines */}
      {activeMedicines.length > 0 ? (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Today's Schedule</h2>
            
            {timeGroups.length > 0 ? (
              <div className="space-y-4">
                {timeGroups.map(([time, items]) => (
                  <div key={time} className="border-l-4 border-blue-500 pl-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{time}</h3>
                    <div className="space-y-3">
                      {items.map(({ medicine, dose }) => {
                        const doseKey = `${medicine.medicineId}-${dose.time}`;
                        const isMarking = markingDose === doseKey;

                        return (
                          <div
                            key={doseKey}
                            className={`p-4 rounded-lg border ${getDoseStatusColor(dose.status)}`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3">
                                {getDoseStatusIcon(dose.status)}
                                <div>
                                  <h4 className="font-medium text-gray-900">{medicine.medicineName}</h4>
                                  <p className="text-sm text-gray-600">{medicine.dosage}</p>
                                  {medicine.planName && (
                                    <p className="text-xs text-purple-600 mt-1">
                                      📋 Plan: {medicine.planName}
                                    </p>
                                  )}
                                  {medicine.specialInstructions && (
                                    <p className="text-sm text-blue-600 mt-1">
                                      ⓘ {medicine.specialInstructions}
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-500 mt-1">
                                    Status: <span className="capitalize">{dose.status}</span>
                                    {dose.takenAt && ` • Taken at ${dose.takenAt}`}
                                  </p>
                                </div>
                              </div>
                              {dose.status !== 'taken' && (
                                <button
                                  onClick={() => handleMarkAsTaken(medicine.medicineId, dose.time)}
                                  disabled={isMarking}
                                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                                >
                                  {isMarking ? 'Marking...' : 'Mark as Taken'}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No doses scheduled for today.</p>
            )}
          </div>

          {/* All Active Medicines List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Medicines</h2>
            <div className="space-y-4">
              {activeMedicines.map((medicine) => (
                <div key={medicine.medicineId} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">{medicine.medicineName}</h3>
                      {medicine.planName && (
                        <p className="text-xs text-purple-600 mt-1">
                          📋 Plan: {medicine.planName}
                        </p>
                      )}
                    </div>
                    {editingMedicine !== medicine.medicineId && (
                      <button
                        onClick={() => setEditingMedicine(medicine.medicineId)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Edit Times
                      </button>
                    )}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Dosage:</span> {medicine.dosage}
                    </div>
                    {medicine.frequency && (
                      <div>
                        <span className="font-medium">Frequency:</span> {medicine.frequency}
                      </div>
                    )}
                    {medicine.startDate && (
                      <div>
                        <span className="font-medium">Start Date:</span> {medicine.startDate}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">End Date:</span> {medicine.stopDate}
                    </div>
                  </div>
                  
                  {/* Dose Times */}
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Scheduled Times:</p>
                    <div className="space-y-2">
                      {medicine.todayDoses.map((dose, index) => {
                        const key = `${medicine.medicineId}-${index}`;
                        const isEditing = editingMedicine === medicine.medicineId;
                        
                        return (
                          <div key={index} className="flex items-center gap-2">
                            {isEditing ? (
                              <>
                                <input
                                  type="time"
                                  value={editedTimes[key] || dose.time}
                                  onChange={(e) => setEditedTimes({ ...editedTimes, [key]: e.target.value })}
                                  className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                  onClick={() => handleSaveTime(medicine.medicineId, index)}
                                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                >
                                  Save
                                </button>
                                {index === 0 && (
                                  <button
                                    onClick={handleCancelEdit}
                                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                                  >
                                    Cancel
                                  </button>
                                )}
                              </>
                            ) : (
                              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                                {dose.time}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {medicine.specialInstructions && (
                    <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700">
                      <span className="font-medium">Special Instructions:</span> {medicine.specialInstructions}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No active treatments</h3>
          <p className="mt-1 text-sm text-gray-500">You don't have any active treatment plans at the moment.</p>
        </div>
      )}

      {/* Completed Treatments */}
      {completedTreatments.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Completed Treatments</h2>
          <div className="space-y-3">
            {completedTreatments.map((treatment) => (
              <div key={treatment.medicineId} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{treatment.medicineName}</h3>
                    <p className="text-sm text-gray-600">{treatment.dosage}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Completed on {treatment.completedDate}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {treatment.adherenceRate}%
                    </div>
                    <p className="text-xs text-gray-500">Adherence</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-6 bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              This system does NOT prescribe or modify medications. Always follow your doctor's instructions and consult them before making any changes to your treatment plan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

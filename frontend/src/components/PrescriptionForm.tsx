import React, { useState } from 'react';

interface MedicationEntry {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: number;
  specialInstructions?: string;
  foodTiming?: 'before food' | 'after food' | 'with food' | 'anytime';
}

interface PrescriptionFormProps {
  episodeId: string;
  patientId: string;
  onSubmit: (prescription: { medications: MedicationEntry[] }) => Promise<void>;
  onClose: () => void;
}

export const PrescriptionForm: React.FC<PrescriptionFormProps> = ({
  episodeId: _episodeId,
  patientId: _patientId,
  onSubmit,
  onClose
}) => {
  const [medications, setMedications] = useState<MedicationEntry[]>([
    {
      medicineName: '',
      dosage: '',
      frequency: '',
      duration: 0,
      specialInstructions: '',
      foodTiming: 'anytime'
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addMedication = () => {
    setMedications([
      ...medications,
      {
        medicineName: '',
        dosage: '',
        frequency: '',
        duration: 0,
        specialInstructions: '',
        foodTiming: 'anytime'
      }
    ]);
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const updateMedication = (index: number, field: keyof MedicationEntry, value: any) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value };
    setMedications(updated);
  };

  const validateForm = (): boolean => {
    for (const med of medications) {
      if (!med.medicineName || !med.dosage || !med.frequency || med.duration <= 0) {
        setError('All required fields must be filled');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setLoading(true);
    try {
      await onSubmit({ medications });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create prescription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center overflow-y-auto">
      <div className="bg-white p-6 rounded max-w-2xl w-full m-4">
        <h2 className="text-2xl font-bold mb-4">Prescribe Medication</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 max-h-96 overflow-y-auto">
            {medications.map((med, index) => (
              <div key={index} className="p-4 border rounded">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold">Medication {index + 1}</h3>
                  {medications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMedication(index)}
                      className="text-red-500 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Medicine Name *
                    </label>
                    <input
                      type="text"
                      value={med.medicineName}
                      onChange={(e) => updateMedication(index, 'medicineName', e.target.value)}
                      className="w-full px-3 py-2 border rounded"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Dosage *
                    </label>
                    <input
                      type="text"
                      value={med.dosage}
                      onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                      className="w-full px-3 py-2 border rounded"
                      placeholder="e.g., 500mg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Frequency *
                    </label>
                    <select
                      value={med.frequency}
                      onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                      className="w-full px-3 py-2 border rounded"
                      required
                    >
                      <option value="">Select frequency</option>
                      <option value="once daily">Once daily</option>
                      <option value="twice daily">Twice daily</option>
                      <option value="three times daily">Three times daily</option>
                      <option value="four times daily">Four times daily</option>
                      <option value="every 6 hours">Every 6 hours</option>
                      <option value="every 8 hours">Every 8 hours</option>
                      <option value="as needed">As needed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Duration (days) *
                    </label>
                    <input
                      type="number"
                      value={med.duration || ''}
                      onChange={(e) => updateMedication(index, 'duration', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border rounded"
                      min="1"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Food Timing
                    </label>
                    <select
                      value={med.foodTiming}
                      onChange={(e) => updateMedication(index, 'foodTiming', e.target.value)}
                      className="w-full px-3 py-2 border rounded"
                    >
                      <option value="anytime">Anytime</option>
                      <option value="before food">Before food</option>
                      <option value="after food">After food</option>
                      <option value="with food">With food</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-semibold mb-1">
                      Special Instructions
                    </label>
                    <textarea
                      value={med.specialInstructions}
                      onChange={(e) => updateMedication(index, 'specialInstructions', e.target.value)}
                      className="w-full px-3 py-2 border rounded"
                      rows={2}
                      placeholder="Additional instructions..."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addMedication}
            className="mt-4 px-4 py-2 bg-gray-200 rounded"
          >
            + Add Another Medication
          </button>

          <div className="flex gap-2 mt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Prescription'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-300 rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

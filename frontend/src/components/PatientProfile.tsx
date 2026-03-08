import React, { useState, useEffect } from 'react';
import axios from '../lib/axios';

interface PatientDemographics {
  name: string;
  age: number;
  uhid: string;
  gender: string;
  contact: string;
  email: string;
}

interface TreatmentEpisode {
  episodeId: string;
  startDate: string;
  endDate?: string;
  status: 'ongoing' | 'completed';
  diagnosis?: string;
  outcome?: string;
}

interface SymptomSummary {
  description: string;
  severity: 'severe' | 'moderate' | 'mild';
  duration: string;
}

interface PatientProfileProps {
  patientId: string;
  doctorId: string;
}

export const PatientProfile: React.FC<PatientProfileProps> = ({ patientId, doctorId: _doctorId }) => {
  const [demographics, setDemographics] = useState<PatientDemographics | null>(null);
  const [episodes, setEpisodes] = useState<TreatmentEpisode[]>([]);
  const [symptoms, setSymptoms] = useState<SymptomSummary[]>([]);
  const [episodeFilter, setEpisodeFilter] = useState<'all' | 'ongoing' | 'past'>('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPatientData();
  }, [patientId]);

  const fetchPatientData = async () => {
    setLoading(true);
    try {
      const [profileRes, episodesRes] = await Promise.all([
        axios.get(`/patients/summary/${patientId}`),
        axios.get(`/treatment/patient/${patientId}/episodes`)
      ]);

      const profileData = profileRes.data;
      setDemographics({
        name: profileData.name,
        age: profileData.age,
        uhid: profileData.uhid,
        gender: profileData.gender,
        contact: profileData.phone,
        email: profileData.email
      });
      setSymptoms(profileData.symptoms || []);

      setEpisodes(episodesRes.data.episodes || []);
    } catch (err) {
      console.error('Failed to fetch patient data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEpisodes = episodes.filter(ep => {
    if (episodeFilter === 'all') return true;
    if (episodeFilter === 'ongoing') return ep.status === 'ongoing';
    return ep.status === 'completed';
  });

  const sortedSymptoms = [...symptoms].sort((a, b) => {
    const severityOrder = { severe: 0, moderate: 1, mild: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  if (loading) return <div className="p-6">Loading...</div>;
  if (!demographics) return <div className="p-6">Patient not found</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Patient Profile</h1>
        <div className="bg-white p-4 rounded border">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-semibold">{demographics.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Age</p>
              <p className="font-semibold">{demographics.age}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">UHID</p>
              <p className="font-semibold">{demographics.uhid}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Gender</p>
              <p className="font-semibold">{demographics.gender}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Contact</p>
              <p className="font-semibold">{demographics.contact}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-semibold">{demographics.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">Current Symptoms</h2>
        {sortedSymptoms.length === 0 ? (
          <p className="text-gray-600">No current symptoms reported</p>
        ) : (
          <div className="space-y-2">
            {sortedSymptoms.map((symptom, idx) => (
              <div key={idx} className="p-3 border rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{symptom.description}</p>
                    <p className="text-sm text-gray-600">Duration: {symptom.duration}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${
                    symptom.severity === 'severe' ? 'bg-red-100 text-red-800' :
                    symptom.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {symptom.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Treatment History</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setEpisodeFilter('all')}
              className={`px-3 py-1 rounded ${episodeFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              All
            </button>
            <button
              onClick={() => setEpisodeFilter('ongoing')}
              className={`px-3 py-1 rounded ${episodeFilter === 'ongoing' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              Ongoing
            </button>
            <button
              onClick={() => setEpisodeFilter('past')}
              className={`px-3 py-1 rounded ${episodeFilter === 'past' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              Past
            </button>
          </div>
        </div>

        {filteredEpisodes.length === 0 ? (
          <p className="text-gray-600">No treatment episodes found</p>
        ) : (
          <div className="space-y-2">
            {filteredEpisodes.map(episode => (
              <div key={episode.episodeId} className="p-4 border rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">
                      {episode.diagnosis || 'Consultation'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Started: {new Date(episode.startDate).toLocaleDateString()}
                    </p>
                    {episode.endDate && (
                      <p className="text-sm text-gray-600">
                        Ended: {new Date(episode.endDate).toLocaleDateString()}
                      </p>
                    )}
                    {episode.outcome && (
                      <p className="text-sm text-gray-600">Outcome: {episode.outcome}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${
                    episode.status === 'ongoing' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {episode.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

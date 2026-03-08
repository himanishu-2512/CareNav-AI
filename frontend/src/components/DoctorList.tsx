import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  credentials: string;
  rating: number;
  reviews: number;
  fee: number;
  avatar: string;
}

const mockDoctors: Doctor[] = [
  {
    id: '1',
    name: 'Dr. Aaliya Y.',
    specialty: 'Neurology',
    credentials: 'MDS, FDS RCPS',
    rating: 4.5,
    reviews: 2530,
    fee: 50.99,
    avatar: '👩‍⚕️'
  },
  {
    id: '2',
    name: 'Dr. Amira',
    specialty: 'Dentistry',
    credentials: 'BDS, Dentistry',
    rating: 4.5,
    reviews: 2530,
    fee: 50.99,
    avatar: '👨‍⚕️'
  },
  {
    id: '3',
    name: 'Dr. Anna G.',
    specialty: 'Cardiology',
    credentials: 'Cardiologist',
    rating: 4.5,
    reviews: 2530,
    fee: 50.99,
    avatar: '👩‍⚕️'
  },
  {
    id: '4',
    name: 'Dr. Anne.',
    specialty: 'Hepatology',
    credentials: 'Hepatology',
    rating: 4.5,
    reviews: 2530,
    fee: 50.99,
    avatar: '👨‍⚕️'
  },
  {
    id: '5',
    name: 'Dr. Andrea H.',
    specialty: 'Neurosurgery',
    credentials: 'Neurosurgery',
    rating: 4.5,
    reviews: 2530,
    fee: 50.99,
    avatar: '👩‍⚕️'
  }
];

const specialtyFilters = ['Neurolief', 'Neuromedicine', 'Medicine', 'Psychiatry'];

export default function DoctorList() {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState('Neurolief');

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-green-50">
      {/* Header */}
      <div className="bg-white px-4 py-4 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold">
                M
              </div>
              <div>
                <div className="text-xs text-gray-500">Welcome Back</div>
                <div className="text-sm font-semibold text-gray-900">Mr. Williamson</div>
              </div>
            </div>
            <div className="flex space-x-2">
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Specialty Filters */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {specialtyFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedFilter === filter
                    ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-teal-300'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Doctor List */}
      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <div className="space-y-4">
          {mockDoctors.map((doctor) => (
            <div
              key={doctor.id}
              className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-pink-500 flex items-center justify-center text-3xl">
                    {doctor.avatar}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{doctor.name}</h3>
                    <p className="text-sm text-gray-500">{doctor.credentials}</p>
                    <div className="flex items-center mt-1">
                      <span className="text-yellow-400 text-sm">⭐</span>
                      <span className="text-sm text-gray-700 ml-1">
                        {doctor.rating} ({doctor.reviews})
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 mb-2">Fees ${doctor.fee}</div>
                  <button
                    onClick={() => navigate(`/doctor/${doctor.id}`)}
                    className="px-6 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-full text-sm font-medium hover:from-teal-600 hover:to-teal-700 transition-all"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-around py-3">
            <button onClick={() => navigate('/dashboard')} className="flex flex-col items-center text-gray-400 hover:text-teal-600">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              <span className="text-xs mt-1">Home</span>
            </button>

            <button className="flex flex-col items-center text-teal-600">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              <span className="text-xs mt-1">Doctors</span>
            </button>

            <button
              onClick={() => navigate('/symptoms/chat')}
              className="flex flex-col items-center -mt-6"
            >
              <div className="w-14 h-14 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white shadow-lg">
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </div>
            </button>

            <button onClick={() => navigate('/messages')} className="flex flex-col items-center text-gray-400 hover:text-teal-600">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
              </svg>
              <span className="text-xs mt-1">Messages</span>
            </button>

            <button onClick={() => navigate('/more')} className="flex flex-col items-center text-gray-400 hover:text-teal-600">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
              <span className="text-xs mt-1">More</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

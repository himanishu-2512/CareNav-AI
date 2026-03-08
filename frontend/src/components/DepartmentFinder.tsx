import { useNavigate } from 'react-router-dom';

interface Department {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const departments: Department[] = [
  { id: 'nephrology', name: 'Nephrology', icon: '🫘', color: 'from-pink-400 to-pink-500' },
  { id: 'anesthesiology', name: 'Anesthesiology', icon: '👨‍⚕️', color: 'from-blue-400 to-blue-500' },
  { id: 'orthopedics', name: 'Orthopedics', icon: '🦴', color: 'from-orange-400 to-orange-500' },
  { id: 'ophthalmology', name: 'Ophthalmology', icon: '👁️', color: 'from-red-400 to-red-500' },
  { id: 'pediatrics', name: 'Pediatrics', icon: '👶', color: 'from-purple-400 to-purple-500' },
  { id: 'oncology', name: 'Oncology', icon: '🎗️', color: 'from-pink-500 to-pink-600' },
  { id: 'dermatology', name: 'Dermatology', icon: '🧴', color: 'from-yellow-400 to-yellow-500' },
  { id: 'pathology', name: 'Pathology', icon: '🔬', color: 'from-teal-400 to-teal-500' },
  { id: 'psychiatry', name: 'Psychiatry', icon: '🧠', color: 'from-purple-500 to-purple-600' },
  { id: 'general-surgery', name: 'General surgery', icon: '🏥', color: 'from-red-400 to-red-500' },
  { id: 'endocrinology', name: 'Endocrinology', icon: '🦋', color: 'from-pink-400 to-pink-500' },
  { id: 'radiology', name: 'Radiology', icon: '📡', color: 'from-blue-500 to-blue-600' },
  { id: 'surgery', name: 'Surgery', icon: '🫀', color: 'from-red-500 to-red-600' },
  { id: 'cardiology', name: 'Cardiology', icon: '❤️', color: 'from-pink-500 to-pink-600' },
  { id: 'geriatrics', name: 'Geriatrics', icon: '👴', color: 'from-orange-400 to-orange-500' }
];

export default function DepartmentFinder() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-green-50">
      {/* Header */}
      <div className="bg-white px-4 py-4 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900">Find Your Doctor</h1>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Department Grid */}
      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <div className="grid grid-cols-3 gap-4">
          {departments.map((dept) => (
            <button
              key={dept.id}
              onClick={() => navigate(`/doctors?department=${dept.id}`)}
              className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all flex flex-col items-center"
            >
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${dept.color} flex items-center justify-center text-3xl mb-2`}>
                {dept.icon}
              </div>
              <span className="text-xs text-gray-700 text-center font-medium">{dept.name}</span>
            </button>
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

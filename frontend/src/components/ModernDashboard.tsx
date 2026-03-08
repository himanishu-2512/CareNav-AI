import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface DashboardStats {
  height: string;
  weight: string;
  age: number;
  bloodType: string;
}

export default function ModernDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats] = useState<DashboardStats>({
    height: '5.8 in',
    weight: '25',
    age: 25,
    bloodType: 'B+'
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-green-50">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-500 text-white px-4 py-6 rounded-b-3xl shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-semibold">Profile</h1>
            <button onClick={handleLogout} className="p-2 hover:bg-white/10 rounded-full">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>

          {/* Profile Picture */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-white p-1">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white text-3xl font-bold">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center text-white border-2 border-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
            <h2 className="mt-4 text-xl font-bold">{user?.email?.split('@')[0] || 'Patient'}</h2>
            <div className="mt-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
              Premium Member ⭐
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-4xl mx-auto px-4 -mt-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl mb-1">👤</div>
              <div className="text-xs text-gray-500">Height</div>
              <div className="text-sm font-semibold text-gray-900">{stats.height}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-1">⚖️</div>
              <div className="text-xs text-gray-500">Weight</div>
              <div className="text-sm font-semibold text-gray-900">{stats.weight}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-1">🎂</div>
              <div className="text-xs text-gray-500">Age</div>
              <div className="text-sm font-semibold text-gray-900">{stats.age}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-1">🩸</div>
              <div className="text-xs text-gray-500">Blood</div>
              <div className="text-sm font-semibold text-gray-900">{stats.bloodType}</div>
            </div>
          </div>
        </div>

        {/* About Me */}
        <div className="mt-6 bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">About Me</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Welcome to your health dashboard. Track your symptoms, manage appointments, and stay connected with your healthcare providers.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/symptoms/chat')}
            className="bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all"
          >
            <div className="text-3xl mb-2">💬</div>
            <div className="font-semibold">Symptom Chat</div>
            <div className="text-xs opacity-90 mt-1">Describe your symptoms</div>
          </button>

          <button
            onClick={() => navigate('/departments')}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all"
          >
            <div className="text-3xl mb-2">🏥</div>
            <div className="font-semibold">Find Department</div>
            <div className="text-xs opacity-90 mt-1">Browse specialties</div>
          </button>

          <button
            onClick={() => navigate('/reports/upload')}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all"
          >
            <div className="text-3xl mb-2">📄</div>
            <div className="font-semibold">Upload Reports</div>
            <div className="text-xs opacity-90 mt-1">Medical documents</div>
          </button>

          <button
            onClick={() => navigate('/treatment/schedule')}
            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all"
          >
            <div className="text-3xl mb-2">💊</div>
            <div className="font-semibold">Medications</div>
            <div className="text-xs opacity-90 mt-1">Treatment schedule</div>
          </button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-around py-3">
            <button className="flex flex-col items-center text-teal-600">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              <span className="text-xs mt-1">Home</span>
            </button>

            <button onClick={() => navigate('/doctors')} className="flex flex-col items-center text-gray-400 hover:text-teal-600">
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
                <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
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

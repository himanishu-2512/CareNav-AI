import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleLogoClick = () => {
    navigate('/dashboard');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <header className="bg-teal-50 shadow-sm border-b border-teal-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <h1 
              onClick={handleLogoClick}
              className="text-2xl font-bold text-teal-700 cursor-pointer hover:text-teal-800 transition-all"
            >
              CareNav AI
            </h1>
            {user && (
              <span className="ml-4 px-3 py-1 text-xs font-medium rounded-full bg-teal-100 text-teal-700 border border-teal-200">
                {user.role === 'patient' ? 'Patient' : 'Doctor'}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <span className="text-sm text-gray-700 font-medium">{user.email}</span>
            )}
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-red-200 text-sm font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>);}
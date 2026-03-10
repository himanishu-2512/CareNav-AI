import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  userId: string;
  email: string;
  role: 'patient' | 'doctor';
  name?: string;
  age?: number;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  parentName?: string;
  contact?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Create a separate axios instance for auth to avoid circular dependency with interceptors
const authAxios = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token and user from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('carenav_token');
    const storedUser = localStorage.getItem('carenav_user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        localStorage.removeItem('carenav_token');
        localStorage.removeItem('carenav_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authAxios.post('/api/auth/login', {
        email,
        password,
      });

      const { token: newToken, userId, role, name, age, dateOfBirth, gender, contact, bloodGroup, parentName } = response.data;
      const newUser: User = { 
        userId, 
        email, 
        role,
        name,
        age,
        dateOfBirth,
        gender,
        contact,
        bloodGroup,
        parentName
      };

      // Store in state
      setToken(newToken);
      setUser(newUser);

      // Store in localStorage
      localStorage.setItem('carenav_token', newToken);
      localStorage.setItem('carenav_user', JSON.stringify(newUser));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Login failed');
      }
      throw new Error('Login failed');
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await authAxios.post(
          '/api/auth/logout',
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear state and localStorage regardless of API call success
      setToken(null);
      setUser(null);
      localStorage.removeItem('carenav_token');
      localStorage.removeItem('carenav_user');
    }
  };

  const refreshUser = async () => {
    if (!user?.userId || !token) return;
    
    try {
      // Fetch fresh user data from the auth endpoint
      const response = await authAxios.get(`/api/auth/user/${user.userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const userData = response.data.user || response.data;
      
      const updatedUser: User = {
        userId: user.userId,
        email: userData.email || user.email,
        role: user.role,
        name: userData.name,
        age: userData.age,
        dateOfBirth: userData.dateOfBirth,
        gender: userData.gender,
        bloodGroup: userData.bloodGroup,
        parentName: userData.parentName,
        contact: userData.contact,
      };

      setUser(updatedUser);
      localStorage.setItem('carenav_user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

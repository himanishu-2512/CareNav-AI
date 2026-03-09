import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('carenav_token');
    if (token) {
      // Validate token format before sending
      try {
        // Basic JWT format check (should have 3 parts separated by dots)
        const parts = token.split('.');
        if (parts.length === 3) {
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          console.error('Invalid token format detected');
          // Clear invalid token
          localStorage.removeItem('carenav_token');
          localStorage.removeItem('carenav_user');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      } catch (error) {
        console.error('Error validating token:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token expired, invalid, or forbidden
      console.error('Authentication error:', error.response?.status, error.response?.data);
      
      // Check if it's an IncompleteSignatureException
      if (error.response?.headers?.['x-amzn-errortype']?.includes('IncompleteSignature')) {
        console.error('Invalid token signature detected');
      }
      
      localStorage.removeItem('carenav_token');
      localStorage.removeItem('carenav_user');
      
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

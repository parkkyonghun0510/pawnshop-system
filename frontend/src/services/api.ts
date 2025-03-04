import axios from 'axios';

// Create an axios instance with default configuration
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding token to requests
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('accessToken');
    
    // If token exists, add it to request headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 (Unauthorized) and not a retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (refreshToken) {
          const response = await axios.post('/api/v1/auth/refresh', {
            refresh_token: refreshToken,
          });
          
          const { access_token } = response.data;
          
          // Update tokens in localStorage
          localStorage.setItem('accessToken', access_token);
          
          // Update Authorization header
          api.defaults.headers.common.Authorization = `Bearer ${access_token}`;
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          
          // Retry original request
          return api(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        // Redirect to login page
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// API utility functions

// Function to handle API errors
export const handleApiError = (error: any): string => {
  if (error.response) {
    // Server responded with a status other than 2xx
    const { data, status } = error.response;
    
    if (status === 401) {
      return 'Authentication error. Please log in again.';
    }
    
    if (status === 403) {
      return 'You do not have permission to perform this action.';
    }
    
    if (status === 404) {
      return 'The requested resource was not found.';
    }
    
    if (status === 500) {
      return 'Server error. Please try again later.';
    }
    
    // Return custom error message if available
    if (data?.detail) {
      return data.detail;
    }
    
    if (data?.message) {
      return data.message;
    }
  }
  
  if (error.request) {
    // Request was made but no response received
    return 'No response from server. Please check your internet connection.';
  }
  
  // Something else caused the error
  return error.message || 'An unknown error occurred.';
}; 
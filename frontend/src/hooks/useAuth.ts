import { useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { api } from '../services/api';

// Define types for our JWT token and user
interface JwtPayload {
  sub: string; // user id
  exp: number; // expiration time
  role: string[]; // user roles
}

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  roles: string[];
}

// State to be shared
interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

// Authentication hook
export const useAuth = (): AuthState => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);

  // Function to check if token is valid
  const isTokenValid = (token: string): boolean => {
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp > currentTime;
    } catch (error) {
      return false;
    }
  };

  // Function to check authentication status
  const checkAuth = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    
    const token = localStorage.getItem('accessToken');
    if (!token || !isTokenValid(token)) {
      localStorage.removeItem('accessToken');
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);
      return false;
    }

    try {
      // Set auth header for future requests
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      
      // Fetch user data
      const response = await api.get('/api/v1/users/me');
      setUser(response.data);
      setIsAuthenticated(true);
      setIsLoading(false);
      return true;
    } catch (error) {
      localStorage.removeItem('accessToken');
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);
      return false;
    }
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await api.post('/api/v1/auth/login', { email, password });
      const { access_token } = response.data;
      
      localStorage.setItem('accessToken', access_token);
      api.defaults.headers.common.Authorization = `Bearer ${access_token}`;
      
      await checkAuth();
    } catch (error) {
      localStorage.removeItem('accessToken');
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);
      throw error;
    }
  };

  // Logout function
  const logout = (): void => {
    localStorage.removeItem('accessToken');
    delete api.defaults.headers.common.Authorization;
    setIsAuthenticated(false);
    setUser(null);
  };

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout,
    checkAuth
  };
}; 
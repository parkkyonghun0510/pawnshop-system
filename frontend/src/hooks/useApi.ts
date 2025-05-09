import { useState } from 'react';
import apiClient from '../api/client';
import { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface ApiMethods<T> {
  get: (endpoint: string, config?: AxiosRequestConfig) => Promise<T | null>;
  post: <D>(endpoint: string, data: D, config?: AxiosRequestConfig) => Promise<T | null>;
  put: <D>(endpoint: string, data: D, config?: AxiosRequestConfig) => Promise<T | null>;
  patch: <D>(endpoint: string, data: D, config?: AxiosRequestConfig) => Promise<T | null>;
  delete: (endpoint: string, config?: AxiosRequestConfig) => Promise<T | null>;
  resetState: () => void;
}

type UseApiReturn<T> = [
  ApiState<T>,
  ApiMethods<T>
];

export function useApi<T = any>(): UseApiReturn<T> {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const resetState = () => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  };

  const handleRequest = async <D>(
    requestFn: () => Promise<AxiosResponse<T, D>>,
  ): Promise<T | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await requestFn();
      setState({ data: response.data, loading: false, error: null });
      return response.data;
    } catch (err) {
      const error = err as AxiosError;
      const errorMessage = error.response?.data
        ? typeof error.response.data === 'string'
          ? error.response.data
          : (error.response.data as any)?.detail || 'An error occurred'
        : error.message || 'An error occurred';
        
      setState({ data: null, loading: false, error: errorMessage });
      return null;
    }
  };

  const get = (endpoint: string, config?: AxiosRequestConfig) => 
    handleRequest(() => apiClient.get<T>(endpoint, config));
  
  const post = <D>(endpoint: string, data: D, config?: AxiosRequestConfig) => 
    handleRequest(() => apiClient.post<T>(endpoint, data, config));
  
  const put = <D>(endpoint: string, data: D, config?: AxiosRequestConfig) => 
    handleRequest(() => apiClient.put<T>(endpoint, data, config));
  
  const patch = <D>(endpoint: string, data: D, config?: AxiosRequestConfig) => 
    handleRequest(() => apiClient.patch<T>(endpoint, data, config));
  
  const del = (endpoint: string, config?: AxiosRequestConfig) => 
    handleRequest(() => apiClient.delete<T>(endpoint, config));

  return [
    state,
    {
      get,
      post,
      put,
      patch,
      delete: del,
      resetState,
    },
  ];
}

export default useApi; 
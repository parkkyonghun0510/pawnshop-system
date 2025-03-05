import { useState } from 'react';
import { AxiosError } from 'axios';

interface ApiError {
  message: string;
  code?: number;
  details?: unknown;
}

export const useApiError = () => {
  const [error, setError] = useState<ApiError | null>(null);

  const handleError = (error: unknown) => {
    if (error instanceof AxiosError) {
      const apiError: ApiError = {
        message: error.response?.data?.detail || error.message,
        code: error.response?.status,
        details: error.response?.data
      };
      setError(apiError);
    } else if (error instanceof Error) {
      setError({ message: error.message });
    } else {
      setError({ message: 'An unknown error occurred' });
    }
  };

  const clearError = () => setError(null);

  return { error, handleError, clearError };
};

export default useApiError; 
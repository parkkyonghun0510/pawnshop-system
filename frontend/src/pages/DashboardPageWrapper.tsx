import { useState, useEffect } from 'react';
import { Box, Typography, Button, Alert, CircularProgress } from '@mui/material';
import { ErrorOutline, Refresh } from '@mui/icons-material';
import DashboardPage from './dashboard/DashboardPage';
import apiClient from '../api/client';

export default function DashboardPageWrapper() {
  const [apiStatus, setApiStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    checkApiStatus();
  }, []);

  const checkApiStatus = async () => {
    setApiStatus('loading');
    try {
      // Try to fetch a simple endpoint to check if the API is working
      await apiClient.get('/dashboard/dashboard', { params: { days: 1 } });
      setApiStatus('success');
    } catch (error: any) {
      console.error('API Error:', error);
      setApiStatus('error');

      // Extract error message
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response.status === 500) {
          // Internal server error - likely a code issue
          if (error.response.data && error.response.data.detail) {
            setErrorMessage(`Server error: ${error.response.data.detail}`);
          } else {
            setErrorMessage(`Internal server error. This might be due to a code issue or missing database tables.`);
          }
        } else if (error.response.status === 404) {
          // Not found error
          setErrorMessage(`API endpoint not found. Please check if the backend server is configured correctly.`);
        } else if (error.response.status === 401 || error.response.status === 403) {
          // Authentication/authorization error
          setErrorMessage(`Authentication error. Please log in again.`);
        } else {
          // Other HTTP errors
          setErrorMessage(`Server error: ${error.response.status} ${error.response.statusText}`);
        }
      } else if (error.request) {
        // The request was made but no response was received
        setErrorMessage('No response from server. Please check if the backend server is running.');
      } else {
        // Something happened in setting up the request that triggered an Error
        setErrorMessage(`Error: ${error.message}`);
      }
    }
  };

  if (apiStatus === 'loading') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading dashboard...
        </Typography>
      </Box>
    );
  }

  if (apiStatus === 'error') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <ErrorOutline sx={{ fontSize: 60, color: 'error.main' }} />
        <Typography variant="h5" sx={{ mt: 2 }}>
          Dashboard API Error
        </Typography>
        <Alert severity="error" sx={{ mt: 2, mb: 2, width: '80%', maxWidth: '600px' }}>
          {errorMessage || 'There was an error connecting to the dashboard API.'}
        </Alert>
        <Typography variant="body1" sx={{ mb: 2, textAlign: 'center', maxWidth: '600px' }}>
          {errorMessage.includes('appraisal_value') ?
            "There's an issue with the database field names. The code is looking for 'appraisal_value' but the database uses 'appraised_value'." :
            errorMessage.includes('loan_amount') ?
              "There's an issue with the database field names. The code is looking for 'loan_amount' but the database uses 'principal_amount'." :
              "This could be due to missing data in the database or a server configuration issue."}
        </Typography>
        <Button
          variant="contained"
          startIcon={<Refresh />}
          onClick={checkApiStatus}
        >
          Retry Connection
        </Button>
      </Box>
    );
  }

  return <DashboardPage />;
}

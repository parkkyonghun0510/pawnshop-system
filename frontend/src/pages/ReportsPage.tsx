import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import apiClient from '../api/client';

// Function to format numbers as currency
const formatCurrency = (amount: number, currency: 'USD' | 'KHR' = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    currencyDisplay: currency === 'KHR' ? 'code' : 'symbol',
  }).format(amount);
};

export default function ReportsPage() {
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; type: 'success' | 'error' }>({
    open: false,
    message: '',
    type: 'success',
  });

  // Fetch report data
  const { data: reportData, isLoading, error } = useQuery({
    queryKey: ['reportData'],
    queryFn: async () => {
      const response = await apiClient.get('/reports/summary');
      return response.data;
    },
  });

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>Business Insights</Typography>
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">Error loading report data: {(error as any).message}</Alert>
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2">Total Sales</Typography>
              <Typography variant="h6">{formatCurrency(reportData.totalSales)}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2">Total Loans</Typography>
              <Typography variant="h6">{formatCurrency(reportData.totalLoans)}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2">Outstanding Balances</Typography>
              <Typography variant="h6">{formatCurrency(reportData.outstandingBalances)}</Typography>
            </Paper>
          </Grid>
          {/* Additional metrics and charts can be added here */}
        </Grid>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.type}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 
import React from 'react';
import { Paper, Typography, Divider, Box, Button } from '@mui/material';
import dayjs from 'dayjs';
import { UpcomingDueLoan } from '../types';

interface UpcomingLoansListProps {
  loans?: UpcomingDueLoan[];
}

const UpcomingLoansList: React.FC<UpcomingLoansListProps> = ({ loans = [] }) => {
  return (
    <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Upcoming Due Loans
        </Typography>
        <Button size="small" color="primary">
          View All
        </Button>
      </Box>
      <Divider sx={{ mb: 2 }} />
      {loans.map((loan) => (
        <Box key={loan.id} sx={{ mb: 2, pb: 2, borderBottom: '1px solid #eee' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="subtitle1" fontWeight="medium">
              {loan.customer}
            </Typography>
            <Typography variant="subtitle1" fontWeight="bold">
              ${loan.amount.toLocaleString()}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Due on {dayjs(loan.dueDate).format('MMM DD, YYYY')}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: loan.daysLeft <= 2 ? 'error.main' : 'warning.main',
                bgcolor: loan.daysLeft <= 2 ? 'error.lighter' : 'warning.lighter',
                px: 1,
                borderRadius: 1,
              }}
            >
              {loan.daysLeft} days left
            </Typography>
          </Box>
        </Box>
      ))}
      {loans.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          No upcoming due loans
        </Typography>
      )}
    </Paper>
  );
};

export default UpcomingLoansList;

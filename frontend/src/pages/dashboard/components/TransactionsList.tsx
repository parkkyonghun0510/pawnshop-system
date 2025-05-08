import React from 'react';
import { Paper, Typography, Divider, Box, Button } from '@mui/material';
import dayjs from 'dayjs';
import { RecentTransaction } from '../types';

interface TransactionsListProps {
  transactions?: RecentTransaction[];
}

const TransactionsList: React.FC<TransactionsListProps> = ({ transactions = [] }) => {
  return (
    <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Recent Transactions
        </Typography>
        <Button size="small" color="primary">
          View All
        </Button>
      </Box>
      <Divider sx={{ mb: 2 }} />
      {transactions.map((transaction) => (
        <Box key={transaction.id} sx={{ mb: 2, pb: 2, borderBottom: '1px solid #eee' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="subtitle1" fontWeight="medium">
              {transaction.customer}
            </Typography>
            <Typography variant="subtitle1" fontWeight="bold">
              ${transaction.amount.toLocaleString()}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              {transaction.type} • {dayjs(transaction.date).format('MMM DD, YYYY')}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: transaction.status === 'Completed' ? 'success.main' : 'info.main',
                bgcolor: transaction.status === 'Completed' ? 'success.lighter' : 'info.lighter',
                px: 1,
                borderRadius: 1,
              }}
            >
              {transaction.status}
            </Typography>
          </Box>
        </Box>
      ))}
      {transactions.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          No recent transactions
        </Typography>
      )}
    </Paper>
  );
};

export default TransactionsList;

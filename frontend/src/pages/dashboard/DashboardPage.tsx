import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Divider,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
  Store as StoreIcon,
  ReceiptLong as ReceiptIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

// Mock data (would come from API in production)
const branchPerformanceData = [
  { name: 'Branch A', loans: 40, revenue: 24, items: 18 },
  { name: 'Branch B', loans: 30, revenue: 13, items: 22 },
  { name: 'Branch C', loans: 20, revenue: 9, items: 13 },
  { name: 'Branch D', loans: 25, revenue: 12, items: 20 },
  { name: 'Branch E', loans: 18, revenue: 8, items: 12 },
];

const inventoryStatusData = [
  { name: 'Pawned', value: 40, color: '#1a457a' },
  { name: 'For Sale', value: 25, color: '#61dafb' },
  { name: 'Redeemed', value: 20, color: '#4caf50' },
  { name: 'Defaulted', value: 15, color: '#f44336' },
];

const recentTransactionData = [
  { id: 1, customer: 'John Doe', type: 'Pawn', amount: 250, date: '2023-03-01', status: 'Completed' },
  { id: 2, customer: 'Jane Smith', type: 'Redemption', amount: 300, date: '2023-03-01', status: 'Completed' },
  { id: 3, customer: 'Bob Johnson', type: 'Sale', amount: 175, date: '2023-02-28', status: 'Completed' },
  { id: 4, customer: 'Alice Brown', type: 'Pawn', amount: 500, date: '2023-02-28', status: 'Completed' },
  { id: 5, customer: 'Charlie Wilson', type: 'Payment', amount: 120, date: '2023-02-27', status: 'Completed' },
];

const upcomingDueLoansData = [
  { id: 1, customer: 'David Lee', amount: 400, dueDate: '2023-03-05', daysLeft: 2 },
  { id: 2, customer: 'Sarah Davis', amount: 650, dueDate: '2023-03-06', daysLeft: 3 },
  { id: 3, customer: 'Michael Wilson', amount: 300, dueDate: '2023-03-07', daysLeft: 4 },
  { id: 4, customer: 'Emily Thompson', amount: 525, dueDate: '2023-03-08', daysLeft: 5 },
];

// Dashboard page component
const DashboardPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summaryData, setSummaryData] = useState({
    totalItems: 345,
    activeLoans: 178,
    revenue: 27850,
    customers: 412,
    branches: 5,
    transactions: 892,
  });

  // Simulate loading data
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          height: '100%',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Paper 
          sx={{ 
            p: 3, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            bgcolor: 'error.lighter',
          }}
        >
          <WarningIcon color="error" sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="h5" color="error" gutterBottom>
            Error Loading Dashboard
          </Typography>
          <Typography variant="body1" gutterBottom>
            {error}
          </Typography>
          <Button 
            variant="contained" 
            sx={{ mt: 2 }}
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Welcome back, {user?.fullName || 'User'}! Here's what's happening across your pawn shop network.
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 2, 
              display: 'flex', 
              flexDirection: 'column',
              borderRadius: 2,
              bgcolor: '#e3f2fd',
              height: '100%',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <InventoryIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" color="primary">Inventory</Typography>
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 'bold', my: 1 }}>
              {summaryData.totalItems}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total items in system
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 2, 
              display: 'flex', 
              flexDirection: 'column',
              borderRadius: 2,
              bgcolor: '#fff8e1',
              height: '100%',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <ReceiptIcon sx={{ mr: 1, color: 'secondary.main' }} />
              <Typography variant="h6" color="secondary">Loans</Typography>
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 'bold', my: 1 }}>
              {summaryData.activeLoans}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active loans
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 2, 
              display: 'flex', 
              flexDirection: 'column',
              borderRadius: 2,
              bgcolor: '#e8f5e9',
              height: '100%',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <MoneyIcon sx={{ mr: 1, color: 'success.main' }} />
              <Typography variant="h6" color="success.main">Revenue</Typography>
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 'bold', my: 1 }}>
              ${summaryData.revenue.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Monthly revenue
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 2, 
              display: 'flex', 
              flexDirection: 'column',
              borderRadius: 2,
              bgcolor: '#f3e5f5',
              height: '100%',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <PeopleIcon sx={{ mr: 1, color: 'purple' }} />
              <Typography variant="h6" color="purple">Customers</Typography>
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 'bold', my: 1 }}>
              {summaryData.customers}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Registered customers
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 2, 
              display: 'flex', 
              flexDirection: 'column',
              borderRadius: 2,
              bgcolor: '#e0f7fa',
              height: '100%',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <StoreIcon sx={{ mr: 1, color: 'info.main' }} />
              <Typography variant="h6" color="info.main">Branches</Typography>
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 'bold', my: 1 }}>
              {summaryData.branches}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active branches
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 2, 
              display: 'flex', 
              flexDirection: 'column',
              borderRadius: 2,
              bgcolor: '#fce4ec',
              height: '100%',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <ReceiptIcon sx={{ mr: 1, color: 'error.main' }} />
              <Typography variant="h6" color="error.main">Transactions</Typography>
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 'bold', my: 1 }}>
              {summaryData.transactions}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total transactions
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Charts and Data */}
      <Grid container spacing={3}>
        {/* Branch Performance Chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Branch Performance
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={branchPerformanceData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="loans" name="Loans" fill="#1a457a" />
                <Bar dataKey="revenue" name="Revenue (K)" fill="#e6a817" />
                <Bar dataKey="items" name="Items" fill="#4caf50" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Inventory Status Chart */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Inventory Status
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={inventoryStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {inventoryStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Recent Transactions */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Recent Transactions
              </Typography>
              <Button size="small" color="primary">
                View All
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {recentTransactionData.map((transaction) => (
              <Box key={transaction.id} sx={{ mb: 2, pb: 2, borderBottom: '1px solid #eee' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle1" fontWeight="medium">
                    {transaction.customer}
                  </Typography>
                  <Typography variant="subtitle1" fontWeight="bold">
                    ${transaction.amount}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    {transaction.type} • {transaction.date}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'success.main',
                      bgcolor: 'success.lighter',
                      px: 1,
                      borderRadius: 1,
                    }}
                  >
                    {transaction.status}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* Upcoming Due Loans */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Upcoming Due Loans
              </Typography>
              <Button size="small" color="primary">
                View All
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {upcomingDueLoansData.map((loan) => (
              <Box key={loan.id} sx={{ mb: 2, pb: 2, borderBottom: '1px solid #eee' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle1" fontWeight="medium">
                    {loan.customer}
                  </Typography>
                  <Typography variant="subtitle1" fontWeight="bold">
                    ${loan.amount}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    Due on {loan.dueDate}
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
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage; 
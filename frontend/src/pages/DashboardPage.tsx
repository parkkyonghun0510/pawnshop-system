import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Divider,
  Button,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
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
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import apiClient from '../api/client';

interface DashboardStats {
  total_items: number;
  active_loans: number;
  total_revenue: number;
  total_customers: number;
  total_branches: number;
  total_transactions: number;
  total_users: number;
  total_employees: number;
}

interface BranchPerformance {
  name: string;
  loans: number;
  revenue: number;
  items: number;
}

interface InventoryStatus {
  name: string;
  value: number;
  color: string;
}

interface RecentTransaction {
  id: number;
  customer: string;
  type: string;
  amount: number;
  date: string;
  status: string;
}

interface UpcomingDueLoan {
  id: number;
  customer: string;
  amount: number;
  dueDate: string;
  daysLeft: number;
}

interface RecentActivity {
  id: number;
  type: string;
  description: string;
  timestamp: string;
}

export default function DashboardPage() {
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard/stats');
      return response.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch branch performance
  const { data: branchPerformance, isLoading: branchLoading } = useQuery<BranchPerformance[]>({
    queryKey: ['branch-performance'],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard/branch-performance');
      return response.data;
    },
    refetchInterval: 30000,
  });

  // Fetch inventory status
  const { data: inventoryStatus, isLoading: inventoryLoading } = useQuery<InventoryStatus[]>({
    queryKey: ['inventory-status'],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard/inventory-status');
      return response.data;
    },
    refetchInterval: 30000,
  });

  // Fetch recent transactions
  const { data: recentTransactions, isLoading: transactionsLoading } = useQuery<RecentTransaction[]>({
    queryKey: ['recent-transactions'],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard/recent-transactions');
      return response.data;
    },
    refetchInterval: 30000,
  });

  // Fetch upcoming due loans
  const { data: upcomingDueLoans, isLoading: loansLoading } = useQuery<UpcomingDueLoan[]>({
    queryKey: ['upcoming-due-loans'],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard/upcoming-due-loans');
      return response.data;
    },
    refetchInterval: 30000,
  });

  // Fetch recent activity
  const { data: recentActivity, isLoading: activityLoading } = useQuery<RecentActivity[]>({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard/recent-activity');
      return response.data;
    },
    refetchInterval: 30000,
  });

  const isLoading = statsLoading || branchLoading || inventoryLoading || 
                   transactionsLoading || loansLoading || activityLoading;

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  const statCards = [
    {
      title: 'Total Items',
      value: stats?.total_items || 0,
      icon: <InventoryIcon sx={{ fontSize: 40 }} />,
      color: '#1976d2',
    },
    {
      title: 'Active Loans',
      value: stats?.active_loans || 0,
      icon: <ReceiptIcon sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
    },
    {
      title: 'Total Revenue',
      value: `$${(stats?.total_revenue || 0).toLocaleString()}`,
      icon: <MoneyIcon sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
    },
    {
      title: 'Total Customers',
      value: stats?.total_customers || 0,
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      color: '#9c27b0',
    },
    {
      title: 'Total Branches',
      value: stats?.total_branches || 0,
      icon: <StoreIcon sx={{ fontSize: 40 }} />,
      color: '#0288d1',
    },
    {
      title: 'Total Employees',
      value: stats?.total_employees || 0,
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      color: '#d32f2f',
    },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Welcome back! Here's what's happening across your pawn shop network.
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card) => (
          <Grid item xs={12} sm={6} md={4} key={card.title}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ color: card.color, mr: 2 }}>{card.icon}</Box>
                  <Typography variant="h6" component="div">
                    {card.title}
                  </Typography>
                </Box>
                <Typography variant="h4" component="div">
                  {card.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
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
                data={branchPerformance}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="loans" name="Loans" fill="#1976d2" />
                <Bar dataKey="revenue" name="Revenue (K)" fill="#2e7d32" />
                <Bar dataKey="items" name="Items" fill="#ed6c02" />
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
                  data={inventoryStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {inventoryStatus?.map((entry, index) => (
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
            {recentTransactions?.map((transaction) => (
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
                    {transaction.type} • {new Date(transaction.date).toLocaleDateString()}
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
            {upcomingDueLoans?.map((loan) => (
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
                    Due on {new Date(loan.dueDate).toLocaleDateString()}
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

        {/* Recent Activity */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List>
              {recentActivity?.map((activity, index) => (
                <React.Fragment key={activity.id}>
                  <ListItem>
                    <ListItemText
                      primary={activity.description}
                      secondary={new Date(activity.timestamp).toLocaleString()}
                    />
                  </ListItem>
                  {index < recentActivity.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
} 
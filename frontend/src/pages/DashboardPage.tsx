import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Divider,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
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
  AreaChart,
  Area,
} from 'recharts';
import {
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
  Store as StoreIcon,
  ReceiptLong as ReceiptIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import apiClient from '../api/client';
import useDashboardWebSocket from '../hooks/useDashboardWebSocket';

interface DashboardStats {
  total_items: number;
  active_loans: number;
  total_revenue: number;
  total_customers: number;
  total_branches: number;
  total_transactions: number;
  total_users: number;
  total_employees: number;
  revenue_by_day?: Array<{ date: string; value: number }>;
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
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);
  const [branchFilter, setBranchFilter] = useState('all');

  // Use WebSocket for real-time updates
  const { data: wsData, isConnected, error: wsError } = useDashboardWebSocket();

  // Update React Query cache when WebSocket data arrives
  useEffect(() => {
    if (wsData) {
      if (wsData.stats) {
        queryClient.setQueryData(['dashboard-stats'], wsData.stats);
      }
      if (wsData.branchPerformance) {
        queryClient.setQueryData(['branch-performance'], wsData.branchPerformance);
      }
      if (wsData.inventoryStatus) {
        queryClient.setQueryData(['inventory-status'], wsData.inventoryStatus);
      }
    }
  }, [wsData, queryClient]);

  // Set WebSocket error if any
  useEffect(() => {
    if (wsError) {
      setError(wsError);
    }
  }, [wsError]);

  // Fetch dashboard stats (fallback if WebSocket is not connected)
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats', dateRange[0].format('YYYY-MM-DD'), dateRange[1].format('YYYY-MM-DD')],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard/stats', {
        params: {
          start_date: dateRange[0].format('YYYY-MM-DD'),
          end_date: dateRange[1].format('YYYY-MM-DD')
        }
      });
      return response.data;
    },
    enabled: !isConnected, // Only run if WebSocket is not connected
    refetchInterval: isConnected ? false : 30000, // Only poll if WebSocket is not connected
  });

  // Fetch branch performance
  const { data: branchPerformance, isLoading: branchLoading } = useQuery<BranchPerformance[]>({
    queryKey: ['branch-performance', branchFilter],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard/branch-performance', {
        params: { branch_id: branchFilter !== 'all' ? branchFilter : undefined }
      });
      return response.data;
    },
    enabled: !isConnected,
    refetchInterval: isConnected ? false : 30000,
  });

  // Fetch inventory status
  const { data: inventoryStatus, isLoading: inventoryLoading } = useQuery<InventoryStatus[]>({
    queryKey: ['inventory-status', branchFilter],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard/inventory-status', {
        params: { branch_id: branchFilter !== 'all' ? branchFilter : undefined }
      });
      return response.data;
    },
    enabled: !isConnected,
    refetchInterval: isConnected ? false : 30000,
  });

  // Fetch recent transactions
  const { data: recentTransactions, isLoading: transactionsLoading } = useQuery<RecentTransaction[]>({
    queryKey: ['recent-transactions'],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard/recent-transactions');
      return response.data;
    },
    enabled: !isConnected,
    refetchInterval: isConnected ? false : 30000,
  });

  // Fetch upcoming due loans
  const { data: upcomingDueLoans, isLoading: loansLoading } = useQuery<UpcomingDueLoan[]>({
    queryKey: ['upcoming-due-loans'],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard/upcoming-due-loans');
      return response.data;
    },
    enabled: !isConnected,
    refetchInterval: isConnected ? false : 30000,
  });

  // Fetch recent activity
  const { /* data: recentActivity, */ isLoading: activityLoading } = useQuery<RecentActivity[]>({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard/recent-activity');
      return response.data;
    },
    enabled: !isConnected,
    refetchInterval: isConnected ? false : 30000,
  });

  // Combine loading states
  const isLoading = (!isConnected && (statsLoading || branchLoading || inventoryLoading ||
    transactionsLoading || loansLoading || activityLoading));

  // Get data from WebSocket or React Query
  const dashboardStats = wsData?.stats || stats;
  const branchData = wsData?.branchPerformance || branchPerformance;
  const inventoryData = wsData?.inventoryStatus || inventoryStatus;

  // Handle manual refresh
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    queryClient.invalidateQueries({ queryKey: ['branch-performance'] });
    queryClient.invalidateQueries({ queryKey: ['inventory-status'] });
    queryClient.invalidateQueries({ queryKey: ['recent-transactions'] });
    queryClient.invalidateQueries({ queryKey: ['upcoming-due-loans'] });
    queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
  };

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
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  // Create stat cards data
  const statCards = dashboardStats ? [
    {
      title: 'Active Loans',
      value: dashboardStats.active_loans || 0,
      icon: <ReceiptIcon sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
    },
    {
      title: 'Total Revenue',
      value: `$${(dashboardStats.total_revenue || 0).toLocaleString()}`,
      icon: <MoneyIcon sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
    },
    {
      title: 'Inventory',
      value: dashboardStats.total_items || 0,
      icon: <InventoryIcon sx={{ fontSize: 40 }} />,
      color: '#1976d2',
    },
    {
      title: 'Customers',
      value: dashboardStats.total_customers || 0,
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      color: '#9c27b0',
    },
    {
      title: 'Branches',
      value: dashboardStats.total_branches || 0,
      icon: <StoreIcon sx={{ fontSize: 40 }} />,
      color: '#0288d1',
    },
  ] : [];

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Welcome back! Here's what's happening across your pawn shop network.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {isConnected ? (
            <Alert severity="success" sx={{ mr: 2 }}>Live updates active</Alert>
          ) : (
            <Alert severity="info" sx={{ mr: 2 }}>Using periodic updates</Alert>
          )}
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body1" sx={{ mr: 2 }}>Date Range:</Typography>
            <DatePicker
              label="Start Date"
              value={dateRange[0]}
              onChange={(newValue) => setDateRange([newValue || dayjs().subtract(30, 'day'), dateRange[1]])}
              slotProps={{ textField: { size: 'small' } }}
            />
            <Box sx={{ mx: 1 }}>to</Box>
            <DatePicker
              label="End Date"
              value={dateRange[1]}
              onChange={(newValue) => setDateRange([dateRange[0], newValue || dayjs()])}
              slotProps={{ textField: { size: 'small' } }}
            />
          </Box>
        </LocalizationProvider>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Branch</InputLabel>
          <Select
            value={branchFilter}
            label="Branch"
            onChange={(e) => setBranchFilter(e.target.value)}
          >
            <MenuItem value="all">All Branches</MenuItem>
            <MenuItem value="1">Branch A</MenuItem>
            <MenuItem value="2">Branch B</MenuItem>
            <MenuItem value="3">Branch C</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card) => (
          <Grid item xs={12} sm={6} md={4} lg={2.4} key={card.title}>
            <Card sx={{ height: '100%' }}>
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
        {/* Revenue Trend Chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Revenue Trend
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={dashboardStats?.revenue_by_day || []}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => dayjs(date).format('MMM DD')}
                />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip
                  labelFormatter={(date) => dayjs(date).format('MMMM DD, YYYY')}
                  formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#8884d8"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
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
                  data={inventoryData || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {inventoryData?.map((entry: InventoryStatus, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Items']} />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Branch Performance Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Branch Performance
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={branchData || []}
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
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}


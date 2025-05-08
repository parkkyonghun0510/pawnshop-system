import { useState } from 'react';
import { Box, Grid } from '@mui/material';
import {
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
  Store as StoreIcon,
  ReceiptLong as ReceiptIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';

// Import custom hooks
import useDashboardData from './hooks/useDashboardData';

// Import components
import {
  StatCard,
  RevenueChart,
  InventoryChart,
  BranchPerformanceChart,
  TransactionsList,
  UpcomingLoansList,
  DashboardHeader,
  LoadingState,
  ErrorState
} from './components';

// Import types
import { FilterState } from './types';

export default function DashboardPage() {
  // State for filters
  const [filters, setFilters] = useState<FilterState>({
    dateRange: [dayjs().subtract(30, 'day'), dayjs()],
    branchFilter: 'all',
  });

  // Use custom hook for data fetching
  const {
    dashboardStats,
    branchData,
    inventoryData,
    recentTransactions,
    upcomingDueLoans,
    isLoading,
    error,
    isConnected,
    handleRefresh
  } = useDashboardData(filters);

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Show loading state
  if (isLoading) {
    return <LoadingState />;
  }

  // Show error state
  if (error) {
    return <ErrorState error={error} onRetry={handleRefresh} />;
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
      {/* Header and Filters */}
      <DashboardHeader
        isConnected={isConnected}
        onRefresh={handleRefresh}
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card) => (
          <Grid item xs={12} sm={6} md={4} lg={2.4} key={card.title}>
            <StatCard
              title={card.title}
              value={card.value}
              icon={card.icon}
              color={card.color}
            />
          </Grid>
        ))}
      </Grid>

      {/* Charts and Data */}
      <Grid container spacing={3}>
        {/* Revenue Trend Chart */}
        <Grid item xs={12} md={8}>
          <RevenueChart data={dashboardStats?.revenue_by_day} />
        </Grid>

        {/* Inventory Status Chart */}
        <Grid item xs={12} md={4}>
          <InventoryChart data={inventoryData} />
        </Grid>

        {/* Branch Performance Chart */}
        <Grid item xs={12}>
          <BranchPerformanceChart data={branchData} />
        </Grid>

        {/* Recent Transactions */}
        <Grid item xs={12} md={6}>
          <TransactionsList transactions={recentTransactions} />
        </Grid>

        {/* Upcoming Due Loans */}
        <Grid item xs={12} md={6}>
          <UpcomingLoansList loans={upcomingDueLoans} />
        </Grid>
      </Grid>
    </Box>
  );
}

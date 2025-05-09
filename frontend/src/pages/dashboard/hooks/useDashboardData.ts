import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import useDashboardWebSocket from '../../../hooks/useDashboardWebSocket';
import {
  DashboardStats,
  BranchPerformance,
  InventoryStatus,
  RecentTransaction,
  UpcomingDueLoan,
  RecentActivity,
  DashboardDataHookResult,
  FilterState
} from '../types';

// Mock data for endpoints that are not yet implemented on the backend
// These endpoints are returning 404 errors:
// - /api/v1/dashboard/stats
// - /api/v1/dashboard/branch-performance
// - /api/v1/dashboard/inventory-status
// - /api/v1/dashboard/recent-transactions
// - /api/v1/dashboard/upcoming-due-loans
// - /api/v1/dashboard/recent-activity
// Using mock data until the backend endpoints are implemented

// Mock data for dashboard stats
const mockDashboardStats: DashboardStats = {
  total_items: 265,
  active_loans: 145,
  total_revenue: 58900,
  total_customers: 320,
  total_branches: 4,
  total_transactions: 450,
  total_users: 15,
  total_employees: 25,
  revenue_by_day: Array.from({ length: 30 }, (_, i) => ({
    date: dayjs().subtract(29 - i, 'day').format('YYYY-MM-DD'),
    value: Math.floor(Math.random() * 5000) + 1000
  }))
};
const mockBranchPerformance: BranchPerformance[] = [
  { name: 'Main Branch', loans: 145, revenue: 28500, items: 210 },
  { name: 'Downtown', loans: 98, revenue: 19200, items: 156 },
  { name: 'Westside', loans: 76, revenue: 15400, items: 120 },
  { name: 'Eastside', loans: 62, revenue: 12800, items: 95 }
];

const mockInventoryStatus: InventoryStatus[] = [
  { name: 'PAWNED', value: 120, color: '#FFC107' },
  { name: 'AVAILABLE', value: 85, color: '#2196F3' },
  { name: 'SOLD', value: 45, color: '#9C27B0' },
  { name: 'EXPIRED', value: 15, color: '#F44336' }
];

const mockRecentTransactions: RecentTransaction[] = [
  { id: 1, customer: 'John Smith', type: 'Loan', amount: 500, date: dayjs().subtract(1, 'day').toISOString(), status: 'Completed' },
  { id: 2, customer: 'Maria Garcia', type: 'Payment', amount: 350, date: dayjs().subtract(2, 'day').toISOString(), status: 'Completed' },
  { id: 3, customer: 'Robert Johnson', type: 'Sale', amount: 750, date: dayjs().subtract(3, 'day').toISOString(), status: 'Completed' },
  { id: 4, customer: 'Sarah Williams', type: 'Loan', amount: 1200, date: dayjs().subtract(4, 'day').toISOString(), status: 'Pending' },
  { id: 5, customer: 'David Brown', type: 'Payment', amount: 420, date: dayjs().subtract(5, 'day').toISOString(), status: 'Completed' }
];

const mockUpcomingDueLoans: UpcomingDueLoan[] = [
  { id: 1, customer: 'James Wilson', amount: 850, dueDate: dayjs().add(1, 'day').toISOString(), daysLeft: 1 },
  { id: 2, customer: 'Patricia Moore', amount: 1200, dueDate: dayjs().add(2, 'day').toISOString(), daysLeft: 2 },
  { id: 3, customer: 'Michael Taylor', amount: 650, dueDate: dayjs().add(3, 'day').toISOString(), daysLeft: 3 },
  { id: 4, customer: 'Linda Anderson', amount: 900, dueDate: dayjs().add(5, 'day').toISOString(), daysLeft: 5 },
  { id: 5, customer: 'Robert Thomas', amount: 1500, dueDate: dayjs().add(7, 'day').toISOString(), daysLeft: 7 }
];

const mockRecentActivity: RecentActivity[] = [
  { id: 1, type: 'loan', description: 'New loan created for John Smith', timestamp: dayjs().subtract(2, 'hour').toISOString() },
  { id: 2, type: 'payment', description: 'Payment received from Maria Garcia', timestamp: dayjs().subtract(5, 'hour').toISOString() },
  { id: 3, type: 'sale', description: 'Item sold to Robert Johnson', timestamp: dayjs().subtract(1, 'day').toISOString() },
  { id: 4, type: 'inventory', description: 'New item added to inventory', timestamp: dayjs().subtract(2, 'day').toISOString() },
  { id: 5, type: 'customer', description: 'New customer Sarah Williams registered', timestamp: dayjs().subtract(3, 'day').toISOString() }
];

export const useDashboardData = (filters: FilterState): DashboardDataHookResult => {
  const { dateRange, branchFilter } = filters;
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

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

  // Use mock data for dashboard stats instead of API call
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats', dateRange[0].format('YYYY-MM-DD'), dateRange[1].format('YYYY-MM-DD')],
    queryFn: async () => {
      // Return mock data instead of making API call
      return mockDashboardStats;
    },
    enabled: !isConnected, // Only run if WebSocket is not connected
    refetchInterval: isConnected ? false : 30000, // Only poll if WebSocket is not connected
  });

  // Use mock data for branch performance instead of API call
  const { data: branchPerformance, isLoading: branchLoading } = useQuery<BranchPerformance[]>({
    queryKey: ['branch-performance', branchFilter],
    queryFn: async () => {
      // Return mock data instead of making API call
      return mockBranchPerformance;
    },
    enabled: !isConnected,
    refetchInterval: isConnected ? false : 30000,
  });

  // Use mock data for inventory status instead of API call
  const { data: inventoryStatus, isLoading: inventoryLoading } = useQuery<InventoryStatus[]>({
    queryKey: ['inventory-status', branchFilter],
    queryFn: async () => {
      // Return mock data instead of making API call
      return mockInventoryStatus;
    },
    enabled: !isConnected,
    refetchInterval: isConnected ? false : 30000,
  });

  // Use mock data for recent transactions instead of API call
  const { data: recentTransactions, isLoading: transactionsLoading } = useQuery<RecentTransaction[]>({
    queryKey: ['recent-transactions'],
    queryFn: async () => {
      // Return mock data instead of making API call
      return mockRecentTransactions;
    },
    enabled: !isConnected,
    refetchInterval: isConnected ? false : 30000,
  });

  // Use mock data for upcoming due loans instead of API call
  const { data: upcomingDueLoans, isLoading: loansLoading } = useQuery<UpcomingDueLoan[]>({
    queryKey: ['upcoming-due-loans'],
    queryFn: async () => {
      // Return mock data instead of making API call
      return mockUpcomingDueLoans;
    },
    enabled: !isConnected,
    refetchInterval: isConnected ? false : 30000,
  });

  // Use mock data for recent activity instead of API call
  const { data: recentActivity, isLoading: activityLoading } = useQuery<RecentActivity[]>({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      // Return mock data instead of making API call
      return mockRecentActivity;
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

  return {
    dashboardStats,
    branchData,
    inventoryData,
    recentTransactions,
    upcomingDueLoans,
    recentActivity,
    isLoading,
    error,
    isConnected,
    handleRefresh
  };
};

export default useDashboardData;

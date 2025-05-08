import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import apiClient from '../../../api/client';
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
  const { data: recentActivity, isLoading: activityLoading } = useQuery<RecentActivity[]>({
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

import { useState } from 'react';
import { dashboardService, handleApiError } from '../services/api';

interface InventoryStatus {
  total_items: number;
  pawned_items: number;
  for_sale_items: number;
  total_value: number;
}

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  branch_id: string;
  branch_name: string;
  customer_id: string;
  customer_name: string;
  date: string;
  description: string;
}

interface DueLoan {
  id: string;
  customer_id: string;
  customer_name: string;
  principal_amount: number;
  interest_rate: number;
  due_date: string;
  days_remaining: number;
  status: string;
}

export const useDashboard = () => {
  const [inventoryStatus, setInventoryStatus] = useState<InventoryStatus | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [upcomingDueLoans, setUpcomingDueLoans] = useState<DueLoan[]>([]);
  const [loading, setLoading] = useState({
    inventory: false,
    transactions: false,
    loans: false
  });
  const [error, setError] = useState<{
    inventory: string | null,
    transactions: string | null,
    loans: string | null
  }>({
    inventory: null,
    transactions: null,
    loans: null
  });

  const fetchInventoryStatus = async () => {
    setLoading(prev => ({ ...prev, inventory: true }));
    setError(prev => ({ ...prev, inventory: null }));
    try {
      const response = await dashboardService.getInventoryStatus();
      setInventoryStatus(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(prev => ({ ...prev, inventory: errorMessage }));
      return null;
    } finally {
      setLoading(prev => ({ ...prev, inventory: false }));
    }
  };

  const fetchRecentTransactions = async () => {
    setLoading(prev => ({ ...prev, transactions: true }));
    setError(prev => ({ ...prev, transactions: null }));
    try {
      const response = await dashboardService.getRecentTransactions();
      setRecentTransactions(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(prev => ({ ...prev, transactions: errorMessage }));
      return null;
    } finally {
      setLoading(prev => ({ ...prev, transactions: false }));
    }
  };

  const fetchUpcomingDueLoans = async () => {
    setLoading(prev => ({ ...prev, loans: true }));
    setError(prev => ({ ...prev, loans: null }));
    try {
      const response = await dashboardService.getUpcomingDueLoans();
      setUpcomingDueLoans(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(prev => ({ ...prev, loans: errorMessage }));
      return null;
    } finally {
      setLoading(prev => ({ ...prev, loans: false }));
    }
  };

  const refreshDashboard = async () => {
    await Promise.all([
      fetchInventoryStatus(),
      fetchRecentTransactions(),
      fetchUpcomingDueLoans()
    ]);
  };

  return {
    inventoryStatus,
    recentTransactions,
    upcomingDueLoans,
    loading,
    error,
    fetchInventoryStatus,
    fetchRecentTransactions,
    fetchUpcomingDueLoans,
    refreshDashboard
  };
};

export default useDashboard; 
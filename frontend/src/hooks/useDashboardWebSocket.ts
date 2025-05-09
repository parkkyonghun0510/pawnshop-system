import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { WebSocketData, BranchPerformance, InventoryStatus, DashboardStats } from '../pages/dashboard/types';

// Get WebSocket URL from environment or use default
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/dashboard';

// Mock data for WebSocket to use when endpoints are not available
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

export const useDashboardWebSocket = () => {
  const [data, setData] = useState<WebSocketData | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: number | null = null;

    const connectWebSocket = () => {
      ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const newData = JSON.parse(event.data);

          // Add mock data for endpoints that are not yet implemented
          const enhancedData: WebSocketData = {
            ...newData,
            // Use mock data for stats if not provided by the server
            stats: newData.stats || mockDashboardStats,
            // Use mock data for branch performance if not provided by the server
            branchPerformance: newData.branchPerformance || mockBranchPerformance,
            // Use mock data for inventory status if not provided by the server
            inventoryStatus: newData.inventoryStatus || mockInventoryStatus
          };

          setData(enhancedData);
        } catch (err) {
          console.error('Error parsing WebSocket data:', err);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        // Attempt to reconnect after 3 seconds
        reconnectTimer = window.setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setError('WebSocket connection error');

        // Provide mock data even when WebSocket fails
        setData({
          stats: mockDashboardStats,
          branchPerformance: mockBranchPerformance,
          inventoryStatus: mockInventoryStatus
        });

        // ws?.close(); // Removed to avoid closing the WebSocket immediately on error
      };
    };

    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
    };
  }, []);

  return { data, isConnected, error };
};

export default useDashboardWebSocket;

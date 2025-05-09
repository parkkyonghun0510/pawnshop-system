import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { WebSocketData, BranchPerformance, InventoryStatus, DashboardStats } from '../pages/dashboard/types';
import { getCookie } from '../utils/cookies';


// Get WebSocket URL from environment or use default
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/dashboard';

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
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: number | null = null;
    const maxReconnectAttempts = 5;
    const initialReconnectDelay = 1000; // 1 second

    const connectWebSocket = () => {
      // Get the authentication token from cookies
      const token = getCookie('access_token') || '';
      const tokenValue = token.startsWith('Bearer ') ? token.substring(7) : token;
      
      // Add token to the WebSocket URL as a query parameter if available
      let wsUrl = WS_BASE_URL;
      if (tokenValue) {
        wsUrl += wsUrl.includes('?') ? '&' : '?';
        wsUrl += `token=${encodeURIComponent(tokenValue)}`;
      }

      // Don't try to connect if we've exceeded the max reconnect attempts
      if (reconnectAttempts >= maxReconnectAttempts) {
        console.log(`Exceeded maximum reconnect attempts (${maxReconnectAttempts}), using mock data`);
        setData({
          stats: mockDashboardStats,
          branchPerformance: mockBranchPerformance,
          inventoryStatus: mockInventoryStatus
        });
        return;
      }

      // Close any existing connection
      if (ws) {
        ws.close();
      }

      console.log(`Attempting to connect to WebSocket: ${wsUrl}`);
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
        setReconnectAttempts(0); // Reset reconnect counter on successful connection
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

      ws.onclose = (event) => {
        console.log(`WebSocket disconnected (code: ${event.code}, reason: ${event.reason})`);
        setIsConnected(false);
        
        // Calculate exponential backoff delay
        const nextAttempt = reconnectAttempts + 1;
        setReconnectAttempts(nextAttempt);
        const delay = Math.min(initialReconnectDelay * Math.pow(1.5, nextAttempt), 30000); // Max 30 seconds
        
        // Only attempt to reconnect if we haven't exceeded the max attempts
        if (nextAttempt < maxReconnectAttempts) {
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${nextAttempt}/${maxReconnectAttempts})...`);
          reconnectTimer = window.setTimeout(connectWebSocket, delay);
        } else {
          console.log('Maximum reconnect attempts reached, using mock data');
          // Provide mock data when max reconnection attempts are reached
          setData({
            stats: mockDashboardStats,
            branchPerformance: mockBranchPerformance,
            inventoryStatus: mockInventoryStatus
          });
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setError('WebSocket connection error');
        
        // Don't close here, let the onclose handler manage reconnection
        // The browser will automatically call onclose after onerror
      };
    };

    // Delay initial connection to ensure authentication is ready
    const initialConnectionDelay = setTimeout(() => {
      connectWebSocket();
    }, 1000); // 1 second delay

    return () => {
      clearTimeout(initialConnectionDelay);
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

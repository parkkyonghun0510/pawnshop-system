export interface DashboardStats {
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

export interface BranchPerformance {
  name: string;
  loans: number;
  revenue: number;
  items: number;
}

export interface InventoryStatus {
  name: string;
  value: number;
  color: string;
}

export interface RecentTransaction {
  id: number;
  customer: string;
  type: string;
  amount: number;
  date: string;
  status: string;
}

export interface UpcomingDueLoan {
  id: number;
  customer: string;
  amount: number;
  dueDate: string;
  daysLeft: number;
}

export interface RecentActivity {
  id: number;
  type: string;
  description: string;
  timestamp: string;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

export interface WebSocketData {
  stats?: DashboardStats;
  branchPerformance?: BranchPerformance[];
  inventoryStatus?: InventoryStatus[];
  error?: string;
}

export interface DashboardDataHookResult {
  dashboardStats: DashboardStats | undefined;
  branchData: BranchPerformance[] | undefined;
  inventoryData: InventoryStatus[] | undefined;
  recentTransactions: RecentTransaction[] | undefined;
  upcomingDueLoans: UpcomingDueLoan[] | undefined;
  recentActivity: RecentActivity[] | undefined;
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  handleRefresh: () => void;
}

export interface FilterState {
  dateRange: [any, any]; // Using 'any' for dayjs type compatibility
  branchFilter: string;
}

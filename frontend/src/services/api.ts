import apiClient from '../api/client';

/**
 * Authentication Services
 */
export const authService = {
  login: (username: string, password: string) => 
    apiClient.post('/authentication/auth/token', 
      new URLSearchParams({ username, password }).toString(), 
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    ),
    
  register: (userData: any) => 
    apiClient.post('/authentication/auth/register', userData),
    
  resetPassword: (email: string) => 
    apiClient.post('/authentication/auth/password-reset', { email }),
    
  changePassword: (oldPassword: string, newPassword: string) => 
    apiClient.post('/authentication/auth/change-password', { old_password: oldPassword, new_password: newPassword }),
    
  getCurrentUser: () => 
    apiClient.get('/authentication/auth/me'),
    
  logout: () => 
    apiClient.post('/authentication/auth/logout', {}),
    
  verifyToken: () => 
    apiClient.get('/authentication/auth/verify')
};

/**
 * User Management Services
 */
export const userService = {
  getUsers: (params?: any) => 
    apiClient.get('/users', { params }),
    
  createUser: (userData: any) => 
    apiClient.post('/users', userData),
    
  getUser: (id: string) => 
    apiClient.get(`/users/${id}`),
    
  updateUser: (id: string, userData: any) => 
    apiClient.put(`/users/${id}`, userData),
    
  deleteUser: (id: string) => 
    apiClient.delete(`/users/${id}`)
};

/**
 * Branch Management Services
 */
export const branchService = {
  getBranches: (params?: any) => 
    apiClient.get('/branches', { params }),
    
  createBranch: (branchData: any) => 
    apiClient.post('/branches', branchData),
    
  getBranch: (id: string) => 
    apiClient.get(`/branches/${id}`),
    
  updateBranch: (id: string, branchData: any) => 
    apiClient.put(`/branches/${id}`, branchData),
    
  deleteBranch: (id: string) => 
    apiClient.delete(`/branches/${id}`)
};

/**
 * Inventory Management Services
 */
export const inventoryService = {
  getInventory: (params?: any) => 
    apiClient.get('/inventory', { params }),
    
  addInventoryItem: (itemData: any) => 
    apiClient.post('/inventory', itemData),
    
  getInventoryItem: (id: string) => 
    apiClient.get(`/inventory/${id}`),
    
  updateInventoryItem: (id: string, itemData: any) => 
    apiClient.put(`/inventory/${id}`, itemData),
    
  deleteInventoryItem: (id: string) => 
    apiClient.delete(`/inventory/${id}`)
};

/**
 * Loan Management Services
 */
export const loanService = {
  getLoans: (params?: any) => 
    apiClient.get('/loans', { params }),
    
  createLoan: (loanData: any) => 
    apiClient.post('/loans', loanData),
    
  getLoan: (id: string) => 
    apiClient.get(`/loans/${id}`),
    
  updateLoan: (id: string, loanData: any) => 
    apiClient.put(`/loans/${id}`, loanData),
    
  deleteLoan: (id: string) => 
    apiClient.delete(`/loans/${id}`)
};

/**
 * Transaction Management Services
 */
export const transactionService = {
  getTransactions: (params?: any) => 
    apiClient.get('/transactions', { params }),
    
  createTransaction: (transactionData: any) => 
    apiClient.post('/transactions', transactionData),
    
  getTransaction: (id: string) => 
    apiClient.get(`/transactions/${id}`)
};

/**
 * Reporting Services
 */
export const reportService = {
  getReports: (params?: any) => 
    apiClient.get('/reports', { params }),
    
  generateReport: (reportData: any) => 
    apiClient.post('/reports/generate', reportData),
    
  downloadReport: (id: string) => 
    apiClient.get(`/reports/${id}/download`, { responseType: 'blob' })
};

/**
 * Dashboard Services
 */
export const dashboardService = {
  getInventoryStatus: () => 
    apiClient.get('/dashboard/inventory-status'),
    
  getRecentTransactions: () => 
    apiClient.get('/dashboard/recent-transactions'),
    
  getUpcomingDueLoans: () => 
    apiClient.get('/dashboard/upcoming-due-loans')
};

// Helper function to handle API errors
export const handleApiError = (error: any): string => {
  if (error.response) {
    // Server responded with a status other than 2xx
    const { data, status } = error.response;
    
    if (status === 401) {
      return 'Authentication error. Please log in again.';
    }
    
    if (status === 403) {
      return 'You do not have permission to perform this action.';
    }
    
    if (status === 404) {
      return 'The requested resource was not found.';
    }
    
    if (status === 500) {
      return 'Server error. Please try again later.';
    }
    
    // Return custom error message if available
    if (data?.detail) {
      return data.detail;
    }
    
    if (data?.message) {
      return data.message;
    }
  }
  
  if (error.request) {
    // Request was made but no response received
    return 'No response from server. Please check your internet connection.';
  }
  
  // Something else caused the error
  return error.message || 'An unknown error occurred.';
}; 
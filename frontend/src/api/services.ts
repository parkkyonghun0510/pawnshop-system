import apiClient from './client';
import {
    LoginCredentials,
    User,
    Customer,
    Loan,
    InventoryItem,
    Transaction,
    Branch,
    ReportParams,
    ReportData,
    PaginatedResponse,
    ApiResponse
} from './types';

// Auth Services
export const authService = {
    login: async (credentials: LoginCredentials): Promise<ApiResponse<{ access_token: string }>> => {
        try {
            console.log('Attempting login with URL:', import.meta.env.VITE_APP_API_URL);
            const formData = new URLSearchParams();
            formData.append('username', credentials.username);
            formData.append('password', credentials.password);
            
            const response = await apiClient.post('/auth/token', formData.toString(), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            console.log('Login response:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Login error:', error.response?.data || error.message);
            throw error;
        }
    },

    logout: async (): Promise<void> => {
        await apiClient.post('/auth/logout');
    },

    getCurrentUser: async (): Promise<ApiResponse<User>> => {
        try {
            const response = await apiClient.get('/auth/me');
            return response.data;
        } catch (error: any) {
            console.error('Get current user error:', error.response?.data || error.message);
            throw error;
        }
    },

    verifyToken: async (): Promise<ApiResponse<boolean>> => {
        try {
            const response = await apiClient.get('/auth/verify');
            return response.data;
        } catch (error: any) {
            console.error('Token verification error:', error.response?.data || error.message);
            throw error;
        }
    },
};

// Users Service
export const usersService = {
    getUsers: async (page = 1, size = 10): Promise<PaginatedResponse<User>> => {
        const response = await apiClient.get('/users', { params: { page, size } });
        return response.data;
    },

    createUser: async (userData: Partial<User>): Promise<ApiResponse<User>> => {
        const response = await apiClient.post('/users', userData);
        return response.data;
    },

    updateUser: async (id: number, userData: Partial<User>): Promise<ApiResponse<User>> => {
        const response = await apiClient.put(`/users/${id}`, userData);
        return response.data;
    },

    deleteUser: async (id: number): Promise<void> => {
        await apiClient.delete(`/users/${id}`);
    },
};

// Customers Service
export const customersService = {
    getCustomers: async (page = 1, size = 10): Promise<PaginatedResponse<Customer>> => {
        const response = await apiClient.get('/customers', { params: { page, size } });
        return response.data;
    },

    getCustomerById: async (id: number): Promise<ApiResponse<Customer>> => {
        const response = await apiClient.get(`/customers/${id}`);
        return response.data;
    },

    createCustomer: async (customerData: Partial<Customer>): Promise<ApiResponse<Customer>> => {
        const response = await apiClient.post('/customers', customerData);
        return response.data;
    },

    updateCustomer: async (id: number, customerData: Partial<Customer>): Promise<ApiResponse<Customer>> => {
        const response = await apiClient.put(`/customers/${id}`, customerData);
        return response.data;
    },

    deleteCustomer: async (id: number): Promise<void> => {
        await apiClient.delete(`/customers/${id}`);
    },
};

// Loans Service
export const loansService = {
    getLoans: async (page = 1, size = 10): Promise<PaginatedResponse<Loan>> => {
        const response = await apiClient.get('/loans', { params: { page, size } });
        return response.data;
    },

    getLoanById: async (id: number): Promise<ApiResponse<Loan>> => {
        const response = await apiClient.get(`/loans/${id}`);
        return response.data;
    },

    createLoan: async (loanData: Partial<Loan>): Promise<ApiResponse<Loan>> => {
        const response = await apiClient.post('/loans', loanData);
        return response.data;
    },

    updateLoan: async (id: number, loanData: Partial<Loan>): Promise<ApiResponse<Loan>> => {
        const response = await apiClient.put(`/loans/${id}`, loanData);
        return response.data;
    },

    deleteLoan: async (id: number): Promise<void> => {
        await apiClient.delete(`/loans/${id}`);
    },

    makePayment: async (loanId: number, amount: number): Promise<ApiResponse<Transaction>> => {
        const response = await apiClient.post(`/loans/${loanId}/payments`, { amount });
        return response.data;
    },
};

// Inventory Service
export const inventoryService = {
    getItems: async (page = 1, size = 10): Promise<PaginatedResponse<InventoryItem>> => {
        const response = await apiClient.get('/inventory', { params: { page, size } });
        return response.data;
    },

    getItemById: async (id: number): Promise<ApiResponse<InventoryItem>> => {
        const response = await apiClient.get(`/inventory/${id}`);
        return response.data;
    },

    createItem: async (itemData: Partial<InventoryItem>): Promise<ApiResponse<InventoryItem>> => {
        const response = await apiClient.post('/inventory', itemData);
        return response.data;
    },

    updateItem: async (id: number, itemData: Partial<InventoryItem>): Promise<ApiResponse<InventoryItem>> => {
        const response = await apiClient.put(`/inventory/${id}`, itemData);
        return response.data;
    },

    deleteItem: async (id: number): Promise<void> => {
        await apiClient.delete(`/inventory/${id}`);
    },
};

// Transactions Service
export const transactionsService = {
    getTransactions: async (page = 1, size = 10): Promise<PaginatedResponse<Transaction>> => {
        const response = await apiClient.get('/transactions', { params: { page, size } });
        return response.data;
    },

    getTransactionById: async (id: number): Promise<ApiResponse<Transaction>> => {
        const response = await apiClient.get(`/transactions/${id}`);
        return response.data;
    },

    createTransaction: async (transactionData: Partial<Transaction>): Promise<ApiResponse<Transaction>> => {
        const response = await apiClient.post('/transactions', transactionData);
        return response.data;
    },
};

// Reports Service
export const reportsService = {
    getReports: async (page = 1, size = 10): Promise<PaginatedResponse<ReportData>> => {
        const response = await apiClient.get('/reports', { params: { page, size } });
        return response.data;
    },

    generateReport: async (params: ReportParams): Promise<ApiResponse<ReportData>> => {
        const response = await apiClient.post('/reports/generate', params);
        return response.data;
    },

    downloadReport: async (reportId: number, format: 'pdf' | 'csv' = 'pdf'): Promise<Blob> => {
        const response = await apiClient.get(`/reports/${reportId}/download`, {
            params: { format },
            responseType: 'blob'
        });
        return response.data;
    },
};

// Branches Service
export const branchesService = {
    getBranches: async (page = 1, size = 10): Promise<PaginatedResponse<Branch>> => {
        const response = await apiClient.get('/branches', { params: { page, size } });
        return response.data;
    },

    getBranchById: async (id: number): Promise<ApiResponse<Branch>> => {
        const response = await apiClient.get(`/branches/${id}`);
        return response.data;
    },

    createBranch: async (branchData: Partial<Branch>): Promise<ApiResponse<Branch>> => {
        const response = await apiClient.post('/branches', branchData);
        return response.data;
    },

    updateBranch: async (id: number, branchData: Partial<Branch>): Promise<ApiResponse<Branch>> => {
        const response = await apiClient.put(`/branches/${id}`, branchData);
        return response.data;
    },

    deleteBranch: async (id: number): Promise<void> => {
        await apiClient.delete(`/branches/${id}`);
    },
}; 
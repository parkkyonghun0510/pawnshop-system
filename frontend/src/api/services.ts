import { JSONSchema4 } from 'json-schema';
import Ajv from 'ajv';
const ajv = new Ajv();
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
    Role,
    Permission,
    PaginatedResponse,
    ApiResponse
} from './types';

// Auth Services
export const authService = {
    login: async (credentials: LoginCredentials): Promise<ApiResponse<{ access_token: string }>> => {
        try {
            console.log('Attempting login with URL:', import.meta.env.VITE_APP_API_URL);

            const loginData = {
                username: credentials.username,
                password: credentials.password
            };

            // Validate request
            const validateRequest = (data: typeof loginData) => {
                const schema = {
                    type: 'object',
                    required: ['username', 'password'],
                    properties: {
                        username: { type: 'string', minLength: 1 },
                        password: { type: 'string', minLength: 1 }
                    }
                };
                const validate = (data: any) => {
                    try {
                        if (!ajv.validate(schema, data)) {
                            throw new Error(ajv.errorsText());
                        }
                        return true;
                    } catch (error: unknown) {
                        console.error('Validation error:', (error as Error).message);
                        return false;
                    }
                };
                return validate(data);
            };

            if (!validateRequest(loginData)) {
                throw new Error('Invalid login credentials');
            }

            const formData = new URLSearchParams();
            formData.append('username', loginData.username);
            formData.append('password', loginData.password);

            const response = await apiClient.post('authentication/auth/token', formData.toString(), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                withCredentials: true,
            });

            console.log('Login response:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Login error:', error.response?.data || error.message);
            throw error;
        }
    },

    logout: async (): Promise<void> => {
        await apiClient.post('authentication/auth/logout');
    },

    getCurrentUser: async (): Promise<ApiResponse<User>> => {
        try {
            const response = await apiClient.get('authentication/auth/me');
            return response.data;
        } catch (error: any) {
            console.error('Get current user error:', error.response?.data || error.message);
            throw error;
        }
    },

    verifyToken: async (): Promise<ApiResponse<boolean>> => {
        try {
            const response = await apiClient.get('authentication/auth/verify');
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
        try {
            if (page < 1 || size < 1) {
                throw new Error('Invalid pagination parameters');
            }
            const response = await apiClient.get('users', { params: { page, size } });
            return response.data;
        } catch (error: unknown) {
            console.error('Get users error:', (error as Error).message);
            throw error;
        }
    },

    createUser: async (userData: Partial<User>): Promise<ApiResponse<User>> => {
        try {
            const userSchema: JSONSchema4 = {
                type: 'object',
                required: ['username', 'email', 'roleId'],
                properties: {
                    username: { type: 'string', minLength: 1 },
                    email: { type: 'string', format: 'email' },
                    roleId: { type: 'integer', minimum: 1 }
                }
            };

            if (!ajv.validate(userSchema, userData)) {
                throw new Error(ajv.errorsText());
            }

            const response = await apiClient.post('users', userData);
            return response.data;
        } catch (error: unknown) {
            console.error('Create user error:', (error as Error).message);
            throw error;
        }
    },

    updateUser: async (id: number, userData: Partial<User>): Promise<ApiResponse<User>> => {
        const response = await apiClient.put(`users/${id}`, userData);
        return response.data;
    },

    deleteUser: async (id: number): Promise<void> => {
        await apiClient.delete(`users/${id}`);
    },
};

// Customers Service
export const customersService = {
    getCustomers: async (page = 1, size = 10): Promise<PaginatedResponse<Customer>> => {
        try {
            if (page < 1 || size < 1) {
                throw new Error('Invalid pagination parameters');
            }
            const response = await apiClient.get('customers', { params: { page, size } });
            return response.data;
        } catch (error: unknown) {
            console.error('Get customers error:', (error as Error).message);
            throw error;
        }
    },

    getCustomerById: async (id: number): Promise<ApiResponse<Customer>> => {
        const response = await apiClient.get(`customers/${id}`);
        return response.data;
    },

    createCustomer: async (customerData: Partial<Customer>): Promise<ApiResponse<Customer>> => {
        const response = await apiClient.post('customers', customerData);
        return response.data;
    },

    updateCustomer: async (id: number, customerData: Partial<Customer>): Promise<ApiResponse<Customer>> => {
        const response = await apiClient.put(`customers/${id}`, customerData);
        return response.data;
    },

    deleteCustomer: async (id: number): Promise<void> => {
        await apiClient.delete(`customers/${id}`);
    },
};

// Loans Service
export const loansService = {
    getLoans: async (page = 1, size = 10): Promise<PaginatedResponse<Loan>> => {
        try {
            if (page < 1 || size < 1) {
                throw new Error('Invalid pagination parameters');
            }
            const response = await apiClient.get('loans', { params: { page, size } });
            return response.data;
        } catch (error: unknown) {
            console.error('Get loans error:', (error as Error).message);
            throw error;
        }
    },

    getLoanById: async (id: number): Promise<ApiResponse<Loan>> => {
        const response = await apiClient.get(`loans/${id}`);
        return response.data;
    },

    createLoan: async (loanData: Partial<Loan>): Promise<ApiResponse<Loan>> => {
        const response = await apiClient.post('loans', loanData);
        return response.data;
    },

    updateLoan: async (id: number, loanData: Partial<Loan>): Promise<ApiResponse<Loan>> => {
        const response = await apiClient.put(`loans/${id}`, loanData);
        return response.data;
    },

    deleteLoan: async (id: number): Promise<void> => {
        await apiClient.delete(`loans/${id}`);
    },

    makePayment: async (loanId: number, amount: number): Promise<ApiResponse<Transaction>> => {
        const response = await apiClient.post(`loans/${loanId}/payments`, { amount });
        return response.data;
    },
};

// Inventory Service
export const inventoryService = {
    getItems: async (page = 1, size = 10): Promise<PaginatedResponse<InventoryItem>> => {
        try {
            if (page < 1 || size < 1) {
                throw new Error('Invalid pagination parameters');
            }
            const response = await apiClient.get('inventory', { params: { page, size } });
            return response.data;
        } catch (error: unknown) {
            console.error('Get inventory items error:', (error as Error).message);
            throw error;
        }
    },

    getItemById: async (id: number): Promise<ApiResponse<InventoryItem>> => {
        const response = await apiClient.get(`inventory/${id}`);
        return response.data;
    },

    createItem: async (itemData: Partial<InventoryItem>): Promise<ApiResponse<InventoryItem>> => {
        const response = await apiClient.post('inventory', itemData);
        return response.data;
    },

    updateItem: async (id: number, itemData: Partial<InventoryItem>): Promise<ApiResponse<InventoryItem>> => {
        const response = await apiClient.put(`inventory/${id}`, itemData);
        return response.data;
    },

    deleteItem: async (id: number): Promise<void> => {
        await apiClient.delete(`inventory/${id}`);
    },
};

// Transactions Service
export const transactionsService = {
    getTransactions: async (page = 1, size = 10): Promise<PaginatedResponse<Transaction>> => {
        try {
            if (page < 1 || size < 1) {
                throw new Error('Invalid pagination parameters');
            }
            const response = await apiClient.get('transactions', { params: { page, size } });
            return response.data;
        } catch (error: unknown) {
            console.error('Get transactions error:', (error as Error).message); throw error;
        }
    },

    getTransactionById: async (id: number): Promise<ApiResponse<Transaction>> => {
        const response = await apiClient.get(`transactions/${id}`);
        return response.data;
    },

    createTransaction: async (transactionData: Partial<Transaction>): Promise<ApiResponse<Transaction>> => {
        const response = await apiClient.post('transactions', transactionData);
        return response.data;
    },
};

// Reports Service
export const reportsService = {
    getReports: async (page = 1, size = 10): Promise<PaginatedResponse<ReportData>> => {
        try {
            if (page < 1 || size < 1) {
                throw new Error('Invalid pagination parameters');
            }
            const response = await apiClient.get('reports', { params: { page, size } });
            return response.data;
        } catch (error: unknown) {
            console.error('Get reports error:', (error as Error).message);
            throw error;
        }
    },

    generateReport: async (params: ReportParams): Promise<ApiResponse<ReportData>> => {
        try {
            // Add validation for ReportParams
            const reportParamsSchema: JSONSchema4 = {
                type: 'object',
                required: ['startDate', 'endDate', 'branchId'],
                properties: {
                    startDate: { type: 'string', format: 'date' },
                    endDate: { type: 'string', format: 'date' },
                    branchId: { type: 'integer', minimum: 1 }
                }
            };

            if (!ajv.validate(reportParamsSchema, params)) {
                throw new Error(ajv.errorsText());
            }

            const response = await apiClient.post('reports/generate', params);
            return response.data;
        } catch (error: unknown) {
            console.error('Generate report error:', (error as Error).message);
            throw error;
        }
    },

    downloadReport: async (reportId: number, format: 'pdf' | 'csv' = 'pdf'): Promise<Blob> => {
        try {
            if (reportId < 1) {
                throw new Error('Invalid report ID');
            }
            const response = await apiClient.get(`reports/${reportId}/download`, {
                params: { format },
                responseType: 'blob'
            });
            return response.data;
        } catch (error: unknown) {
            console.error('Download report error:', (error as Error).message);
            throw error;
        }
    },
};

// Branches Service
export const branchesService = {
    getBranches: async (page = 1, size = 10): Promise<PaginatedResponse<Branch>> => {
        const response = await apiClient.get('branches', { params: { page, size } });
        return response.data;
    },

    getBranchById: async (id: number): Promise<ApiResponse<Branch>> => {
        const response = await apiClient.get(`branches/${id}`);
        return response.data;
    },

    createBranch: async (branchData: Partial<Branch>): Promise<ApiResponse<Branch>> => {
        const response = await apiClient.post('branches', branchData);
        return response.data;
    },

    updateBranch: async (id: number, branchData: Partial<Branch>): Promise<ApiResponse<Branch>> => {
        const response = await apiClient.put(`branches/${id}`, branchData);
        return response.data;
    },

    deleteBranch: async (id: number): Promise<void> => {
        await apiClient.delete(`branches/${id}`);
    },
};

// Roles Service
export const rolesService = {
    getRoles: async (): Promise<ApiResponse<Role[]>> => {
        try {
            console.log('Fetching roles...');
            const response = await apiClient.get('users/roles');
            console.log('Roles response:', response);
            return response.data;
        } catch (error: any) {
            console.error('Get roles error:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
            throw error;
        }
    },

    getRoleById: async (id: number): Promise<ApiResponse<Role>> => {
        const response = await apiClient.get(`users/roles/${id}`);
        return response.data;
    },

    createRole: async (roleData: Partial<Role>): Promise<ApiResponse<Role>> => {
        try {
            // Extract only the fields expected by the backend
            const rolePayload = {
                name: roleData.name,
                description: roleData.description
            };
            console.log('Creating role with data:', rolePayload);
            const response = await apiClient.post('users/roles', rolePayload);
            console.log('Create role response:', response);
            return response.data;
        } catch (error: any) {
            console.error('Create role error:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
            throw error;
        }
    },

    updateRole: async (id: number, roleData: Partial<Role>): Promise<ApiResponse<Role>> => {
        try {
            // Extract only the fields expected by the backend
            const rolePayload = {
                name: roleData.name,
                description: roleData.description
            };
            console.log('Updating role with data:', { id, roleData: rolePayload });
            const response = await apiClient.put(`users/roles/${id}`, rolePayload);
            console.log('Update role response:', response);
            return response.data;
        } catch (error: any) {
            console.error('Update role error:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
            throw error;
        }
    },

    deleteRole: async (id: number): Promise<void> => {
        await apiClient.delete(`users/roles/${id}`);
    },

    assignPermissions: async (roleId: number, permissionIds: number[]): Promise<ApiResponse<Role>> => {
        try {
            // Validate inputs
            if (!roleId || !Array.isArray(permissionIds)) {
                throw new Error('Invalid input parameters');
            }

            console.log('Assigning permissions to role:', { roleId, permissionIds });
            const response = await apiClient.post(`users/roles/${roleId}/permissions`, {
                permission_ids: permissionIds
            });
            console.log('Assign permissions response:', response);
            return response.data;
        } catch (error: any) {
            console.error('Assign permissions error:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
            throw error;
        }
    },
};

// Permissions Service
export const permissionsService = {
    getPermissions: async (): Promise<ApiResponse<Permission[]>> => {
        try {
            console.log('Fetching permissions...');
            const response = await apiClient.get('users/permissions');
            console.log('Permissions response:', response);
            return response.data;
        } catch (error: any) {
            console.error('Get permissions error:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
            throw error;
        }
    },

    getPermissionById: async (id: number): Promise<ApiResponse<Permission>> => {
        const response = await apiClient.get(`users/permissions/${id}`);
        return response.data;
    },

    createPermission: async (permissionData: Partial<Permission>): Promise<ApiResponse<Permission>> => {
        const response = await apiClient.post('users/permissions', permissionData);
        return response.data;
    },

    updatePermission: async (id: number, permissionData: Partial<Permission>): Promise<ApiResponse<Permission>> => {
        const response = await apiClient.put(`users/permissions/${id}`, permissionData);
        return response.data;
    },

    deletePermission: async (id: number): Promise<void> => {
        await apiClient.delete(`users/permissions/${id}`);
    },
};

// Dashboard Service
export const dashboardService = {
    getStats: async (): Promise<ApiResponse<any>> => {
        const response = await apiClient.get('dashboard/stats');
        return response.data;
    },

    getBranchPerformance: async (): Promise<ApiResponse<any>> => {
        const response = await apiClient.get('dashboard/branch-performance');
        return response.data;
    },

    getInventoryStatus: async (): Promise<ApiResponse<any>> => {
        const response = await apiClient.get('dashboard/inventory-status');
        return response.data;
    },

    getRecentTransactions: async (limit = 5): Promise<ApiResponse<Transaction[]>> => {
        const response = await apiClient.get('dashboard/recent-transactions', {
            params: { limit }
        });
        return response.data;
    },

    getUpcomingDueLoans: async (days = 7): Promise<ApiResponse<Loan[]>> => {
        const response = await apiClient.get('dashboard/upcoming-due-loans', {
            params: { days }
        });
        return response.data;
    },

    getRecentActivity: async (limit = 10): Promise<ApiResponse<any>> => {
        const response = await apiClient.get('dashboard/recent-activity', {
            params: { limit }
        });
        return response.data;
    }
};
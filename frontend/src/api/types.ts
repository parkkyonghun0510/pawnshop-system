// Common Types
export interface BaseEntity {
    id: number;
    created_at: string;
    updated_at: string;
}

// Auth & User Types
export interface LoginCredentials {
    username: string;
    password: string;
}

export interface User extends BaseEntity {
    username: string;
    email: string;
    role: string;
    is_active: boolean;
    permissions?: string[];
}

// Customer Types
export interface Customer extends BaseEntity {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    address: string;
    id_type: string;
    id_number: string;
    status: 'active' | 'inactive' | 'blocked';
}

// Loan Types
export interface Loan extends BaseEntity {
    customer_id: number;
    item_id: number;
    principal_amount: number;
    interest_rate: number;
    term_months: number;
    status: 'pending' | 'active' | 'paid' | 'defaulted' | 'renewed';
    payment_schedule: PaymentSchedule[];
    maturity_date: string;
}

export interface PaymentSchedule {
    due_date: string;
    amount: number;
    status: 'pending' | 'paid' | 'overdue';
}

// Inventory Types
export interface InventoryItem extends BaseEntity {
    name: string;
    description: string;
    category: string;
    condition: 'new' | 'good' | 'fair' | 'poor';
    appraisal_value: number;
    status: 'available' | 'pawned' | 'sold' | 'forfeited';
    location: string;
}

// Transaction Types
export interface Transaction extends BaseEntity {
    type: 'payment' | 'loan' | 'sale' | 'redemption';
    amount: number;
    loan_id?: number;
    customer_id: number;
    payment_method: 'cash' | 'card' | 'bank_transfer';
    status: 'completed' | 'pending' | 'failed';
    reference_number: string;
}

// Branch Types
export interface Branch extends BaseEntity {
    name: string;
    address: string;
    phone_number: string;
    manager_id: number;
    status: 'active' | 'inactive';
}

// Report Types
export interface ReportParams {
    start_date: string;
    end_date: string;
    type: 'loans' | 'transactions' | 'inventory' | 'customers';
    branch_id?: number;
}

export interface ReportData {
    generated_at: string;
    type: string;
    data: any;
    summary: {
        total_count: number;
        total_amount?: number;
        [key: string]: any;
    };
}

// Response Types
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    size: number;
    pages: number;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    errors?: any;
} 
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPageWrapper';
import UsersPage from './pages/UsersPage';
import CustomersPage from './pages/CustomersPage';
import LoansPage from './pages/LoansPage';
import InventoryPage from './pages/InventoryPage';
import TransactionsPage from './pages/TransactionsPage';
import ReportsPage from './pages/ReportsPage';
import BranchesPage from './pages/BranchesPage';
import EmployeesPage from './pages/EmployeesPage';
import AppPortalPage from './pages/AppPortalPage';
import RolesPage from './pages/RolesPage';
import PermissionsPage from './pages/PermissionsPage';
import AuditLogPage from './pages/AuditLogPage';
import LoanApplicationsPage from './pages/LoanApplicationsPage';

const App = () => {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Routes */}
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <DashboardPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/users"
                element={
                    <ProtectedRoute
                        requiredPermissions={['view_users', 'manage_users']}
                        requireAll={false}
                    >
                        <UsersPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/customers"
                element={
                    <ProtectedRoute
                        requiredPermissions={['view_customers', 'manage_customers']}
                        requireAll={false}
                    >
                        <CustomersPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/loans"
                element={
                    <ProtectedRoute
                        requiredPermissions={['view_loans', 'create_loans', 'manage_loans']}
                        requireAll={false}
                    >
                        <LoansPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/inventory"
                element={
                    <ProtectedRoute
                        requiredPermissions={['view_inventory', 'manage_inventory']}
                        requireAll={false}
                    >
                        <InventoryPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/transactions"
                element={
                    <ProtectedRoute
                        requiredPermissions={['view_transactions', 'manage_transactions']}
                        requireAll={false}
                    >
                        <TransactionsPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/reports"
                element={
                    <ProtectedRoute
                        requiredPermissions={['view_reports', 'manage_reports']}
                        requireAll={false}
                    >
                        <ReportsPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/branches"
                element={
                    <ProtectedRoute
                        requiredPermissions={['view_branches', 'manage_branches']}
                        requireAll={false}
                    >
                        <BranchesPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/employees"
                element={
                    <ProtectedRoute
                        requiredPermissions={['view_users', 'manage_users']}
                        requireAll={false}
                    >
                        <EmployeesPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/roles"
                element={
                    <ProtectedRoute
                        requiredPermissions={['manage_roles', 'manage_permissions']}
                        requireAll={false}
                    >
                        <RolesPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/permissions"
                element={
                    <ProtectedRoute
                        requiredPermissions={['manage_permissions']}
                        requireAll={true}
                    >
                        <PermissionsPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/audit-logs"
                element={
                    <ProtectedRoute
                        requiredPermissions={['view_audit_logs']}
                        requireAll={true}
                    >
                        <AuditLogPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/applications"
                element={
                    <ProtectedRoute
                        requiredPermissions={['view_loans', 'create_loans']}
                        requireAll={false}
                    >
                        <AppPortalPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/loan-applications"
                element={
                    <ProtectedRoute
                        requiredPermissions={['view_loans', 'create_loans', 'manage_loans']}
                        requireAll={false}
                    >
                        <LoanApplicationsPage />
                    </ProtectedRoute>
                }
            />

            {/* Redirect root to dashboard */}
            <Route
                path="/"
                element={<Navigate to="/dashboard" replace />}
            />
        </Routes>
    );
};

export default App;
import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import MainLayout from './layouts/MainLayout';
import LoadingScreen from './components/ui/LoadingScreen';

// Lazy-loaded components for better performance
const DashboardPage = lazy(() => import('./pages/DashboardPageWrapper'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const CustomersPage = lazy(() => import('./pages/CustomersPage'));
const LoansPage = lazy(() => import('./pages/LoansPage'));
const InventoryPage = lazy(() => import('./pages/InventoryPage'));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const BranchesPage = lazy(() => import('./pages/BranchesPage'));
const EmployeesPage = lazy(() => import('./pages/EmployeesPage'));
const AppPortalPage = lazy(() => import('./pages/AppPortalPage'));
const RolesPage = lazy(() => import('./pages/RolesPage'));
const PermissionsPage = lazy(() => import('./pages/PermissionsPage'));
const AuditLogPage = lazy(() => import('./pages/AuditLogPage'));
const LoanApplicationsPage = lazy(() => import('./pages/LoanApplicationsPage'));
const SamplePage = lazy(() => import('./pages/SamplePage'));
const ContentLayoutDemo = lazy(() => import('./pages/ContentLayoutDemo'));

const App = () => {
    return (
        <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes with MainLayout */}
            <Route
                element={
                    <ProtectedRoute>
                        <MainLayout />
                    </ProtectedRoute>
                }
            >
                {/* Dashboard */}
                <Route
                    path="/dashboard"
                    element={
                        <Suspense fallback={<LoadingScreen />}>
                            <DashboardPage />
                        </Suspense>
                    }
                />

                {/* User Management */}
                <Route
                    path="/users"
                    element={
                        <Suspense fallback={<LoadingScreen />}>
                            <ProtectedRoute
                                requiredPermissions={['view_users', 'manage_users']}
                                requireAll={false}
                            >
                                <UsersPage />
                            </ProtectedRoute>
                        </Suspense>
                    }
                />

                {/* Customer Management */}
                <Route
                    path="/customers"
                    element={
                        <Suspense fallback={<LoadingScreen />}>
                            <ProtectedRoute
                                requiredPermissions={['view_customers', 'manage_customers']}
                                requireAll={false}
                            >
                                <CustomersPage />
                            </ProtectedRoute>
                        </Suspense>
                    }
                />

                {/* Loan Management */}
                <Route
                    path="/loans"
                    element={
                        <Suspense fallback={<LoadingScreen />}>
                            <ProtectedRoute
                                requiredPermissions={['view_loans', 'create_loans', 'manage_loans']}
                                requireAll={false}
                            >
                                <LoansPage />
                            </ProtectedRoute>
                        </Suspense>
                    }
                />

                {/* Inventory */}
                <Route
                    path="/inventory"
                    element={
                        <Suspense fallback={<LoadingScreen />}>
                            <ProtectedRoute
                                requiredPermissions={['view_inventory', 'manage_inventory']}
                                requireAll={false}
                            >
                                <InventoryPage />
                            </ProtectedRoute>
                        </Suspense>
                    }
                />

                {/* Transactions */}
                <Route
                    path="/transactions"
                    element={
                        <Suspense fallback={<LoadingScreen />}>
                            <ProtectedRoute
                                requiredPermissions={['view_transactions', 'manage_transactions']}
                                requireAll={false}
                            >
                                <TransactionsPage />
                            </ProtectedRoute>
                        </Suspense>
                    }
                />

                {/* Reports */}
                <Route
                    path="/reports"
                    element={
                        <Suspense fallback={<LoadingScreen />}>
                            <ProtectedRoute
                                requiredPermissions={['view_reports', 'manage_reports']}
                                requireAll={false}
                            >
                                <ReportsPage />
                            </ProtectedRoute>
                        </Suspense>
                    }
                />

                {/* Branch Management */}
                <Route
                    path="/branches"
                    element={
                        <Suspense fallback={<LoadingScreen />}>
                            <ProtectedRoute
                                requiredPermissions={['view_branches', 'manage_branches']}
                                requireAll={false}
                            >
                                <BranchesPage />
                            </ProtectedRoute>
                        </Suspense>
                    }
                />

                <Route
                    path="/employees"
                    element={
                        <Suspense fallback={<LoadingScreen />}>
                            <ProtectedRoute
                                requiredPermissions={['view_users', 'manage_users']}
                                requireAll={false}
                            >
                                <EmployeesPage />
                            </ProtectedRoute>
                        </Suspense>
                    }
                />

                {/* Administration */}
                <Route
                    path="/roles"
                    element={
                        <Suspense fallback={<LoadingScreen />}>
                            <ProtectedRoute
                                requiredPermissions={['manage_roles', 'manage_permissions']}
                                requireAll={false}
                            >
                                <RolesPage />
                            </ProtectedRoute>
                        </Suspense>
                    }
                />

                <Route
                    path="/permissions"
                    element={
                        <Suspense fallback={<LoadingScreen />}>
                            <ProtectedRoute
                                requiredPermissions={['manage_permissions']}
                                requireAll={true}
                            >
                                <PermissionsPage />
                            </ProtectedRoute>
                        </Suspense>
                    }
                />

                <Route
                    path="/audit-logs"
                    element={
                        <Suspense fallback={<LoadingScreen />}>
                            <ProtectedRoute
                                requiredPermissions={['view_audit_logs']}
                                requireAll={true}
                            >
                                <AuditLogPage />
                            </ProtectedRoute>
                        </Suspense>
                    }
                />

                {/* Applications */}
                <Route
                    path="/applications"
                    element={
                        <Suspense fallback={<LoadingScreen />}>
                            <ProtectedRoute
                                requiredPermissions={['view_loans', 'create_loans']}
                                requireAll={false}
                            >
                                <AppPortalPage />
                            </ProtectedRoute>
                        </Suspense>
                    }
                />

                <Route
                    path="/loan-applications"
                    element={
                        <Suspense fallback={<LoadingScreen />}>
                            <ProtectedRoute
                                requiredPermissions={['view_loans', 'create_loans', 'manage_loans']}
                                requireAll={false}
                            >
                                <LoanApplicationsPage />
                            </ProtectedRoute>
                        </Suspense>
                    }
                />

                {/* Sample Page for UI Components Demo */}
                <Route
                    path="/sample"
                    element={
                        <Suspense fallback={<LoadingScreen />}>
                            <SamplePage />
                        </Suspense>
                    }
                />

                {/* Content Layout Demo Page */}
                <Route
                    path="/content-layout-demo"
                    element={
                        <Suspense fallback={<LoadingScreen />}>
                            <ContentLayoutDemo />
                        </Suspense>
                    }
                />
            </Route>

            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
};

export default App;
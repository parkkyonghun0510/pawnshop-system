import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import Cookies from 'js-cookie';

// Types
interface Permission {
    value: string;
    description?: string;
}

interface Role {
    id: number;
    name: string;
    description: string;
    permissions: Permission[];
}

interface User {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    is_active: boolean;
    is_superuser: boolean;
    role_id: number;
    role?: Role;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    hasPermission: (permission: string) => boolean;
    hasAnyPermission: (permissions: string[]) => boolean;
    hasAllPermissions: (permissions: string[]) => boolean;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const isAuthenticated = !!user;

    // Permission checking functions
    const hasPermission = (permission: string): boolean => {
        if (!user || !user.role || !user.role.permissions) return false;
        return user.role.permissions.some(p => p.value === permission);
    };

    const hasAnyPermission = (permissions: string[]): boolean => {
        return permissions.some(permission => hasPermission(permission));
    };

    const hasAllPermissions = (permissions: string[]): boolean => {
        return permissions.every(permission => hasPermission(permission));
    };

    // Function to fetch the user profile
    const fetchUserProfile = async () => {
        try {
            console.log('Fetching user profile...');
            console.log('Cookie value:', Cookies.get('access_token'));

            // Get all cookies for debugging
            const allCookies = Cookies.get();
            console.log('All cookies:', allCookies);

            const response = await api.get('authentication/auth/me', {
                withCredentials: true,
                headers: {
                    // Explicitly set the Authorization header with the cookie value
                    'Authorization': `Bearer ${Cookies.get('access_token')?.replace('Bearer ', '')}`
                }
            });
            console.log('User profile response:', response.data);
            setUser(response.data);
            return true;
        } catch (err) {
            console.error('Error fetching user profile:', err);
            setError('Failed to fetch user profile');
            Cookies.remove('access_token', { path: '/' });
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Check if user is logged in on mount
    useEffect(() => {
        const checkAuth = async () => {
            const token = Cookies.get('access_token');

            if (token) {
                try {
                    const success = await fetchUserProfile();
                    if (!success) {
                        navigate('/login');
                    }
                } catch (err) {
                    console.error('Authentication error:', err);
                    setError('Authentication failed');
                    setLoading(false);
                    navigate('/login');
                }
            } else {
                setLoading(false);
                if (window.location.pathname !== '/login') {
                    navigate('/login');
                }
            }
        };

        checkAuth();
    }, [navigate]);

    // Login function
    const login = async (email: string, password: string) => {
        setLoading(true);
        setError(null);

        try {
            console.log('Attempting login with email:', email);

            // Use the authService to login
            const response = await api.post('authentication/auth/token',
                new URLSearchParams({
                    'username': email, // OAuth2 spec uses 'username' even for email
                    'password': password
                }).toString(),
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    }
                }
            );

            console.log('Login response:', response);

            // Check if the cookie was set
            console.log('Cookie after login:', Cookies.get('access_token'));

            // Get all cookies for debugging
            const allCookies = Cookies.get();
            console.log('All cookies after login:', allCookies);

            if (response.status === 200) {
                // Add a small delay to ensure cookie is set
                await new Promise(resolve => setTimeout(resolve, 500));

                // Check cookies again after delay
                console.log('Cookie after delay:', Cookies.get('access_token'));

                // If cookie is not set, manually set it
                if (!Cookies.get('access_token') && response.data.access_token) {
                    console.log('Manually setting cookie with token:', response.data.access_token);
                    Cookies.set('access_token', `Bearer ${response.data.access_token}`, {
                        path: '/',
                        sameSite: 'lax'
                    });
                }

                const success = await fetchUserProfile();
                if (success) {
                    navigate('/dashboard');
                }
            }
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.response?.data?.detail || 'Failed to login. Please check your credentials.');
            setLoading(false);
        }
    };

    // Logout function
    const logout = async () => {
        try {
            await api.post('authentication/auth/logout', {}, { withCredentials: true });
        } catch (err) {
            console.error('Logout error:', err);
        }

        setUser(null);
        Cookies.remove('access_token', { path: '/' });
        navigate('/login');
    };

    const value = {
        user,
        loading,
        error,
        login,
        logout,
        isAuthenticated,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
import axios, { AxiosError, AxiosResponse } from 'axios';
import Cookies from 'js-cookie';

// API base URL from environment variable
const API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:8000';

// Rate limiting configuration
const RATE_LIMIT = {
    maxRequests: 50,
    perWindow: 60000, // 1 minute
    requests: new Map<string, number[]>(),
};

// Create axios instance
const apiClient = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest', // CSRF protection
        'Accept': 'application/json',
    },
    timeout: 10000, // 10 seconds
});

// Rate limiting function
const isRateLimited = (endpoint: string): boolean => {
    const now = Date.now();
    const requests = RATE_LIMIT.requests.get(endpoint) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < RATE_LIMIT.perWindow);
    
    if (validRequests.length >= RATE_LIMIT.maxRequests) {
        return true;
    }
    
    // Add current request
    validRequests.push(now);
    RATE_LIMIT.requests.set(endpoint, validRequests);
    return false;
};

// Request interceptor
apiClient.interceptors.request.use(
    async (config) => {
        // Rate limiting check
        const endpoint = config.url || '';
        if (isRateLimited(endpoint)) {
            throw new Error('Rate limit exceeded. Please try again later.');
        }

        // Get token from cookie
        const token = Cookies.get('access_token');
        
        // If token exists, add it to Authorization header
        if (token && config.headers) {
            config.headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        }

        // Get CSRF token if it exists
        const csrfToken = Cookies.get('csrf_token');
        if (csrfToken && config.headers) {
            config.headers['X-CSRF-Token'] = csrfToken;
        }

        // Add security headers
        if (config.headers) {
            config.headers['X-Content-Type-Options'] = 'nosniff';
            config.headers['X-Frame-Options'] = 'DENY';
            config.headers['X-XSS-Protection'] = '1; mode=block';
        }
        
        return config;
    },
    (error: AxiosError) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        // Handle CSRF token in response if present
        const csrfToken = response.headers['x-csrf-token'];
        if (csrfToken) {
            Cookies.set('csrf_token', csrfToken, { secure: true, sameSite: 'strict' });
        }
        return response;
    },
    async (error: AxiosError) => {
        if (error.response) {
            const { status, data } = error.response;

            // Handle 401 Unauthorized
            if (status === 401) {
                Cookies.remove('access_token', { path: '/' });
                Cookies.remove('csrf_token', { path: '/' });
                
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }

            // Handle 403 Forbidden (possibly CSRF token mismatch)
            if (status === 403) {
                // Refresh CSRF token
                try {
                    const response = await axios.get(`${API_URL}/auth/csrf-token`);
                    const newCsrfToken = response.headers['x-csrf-token'];
                    if (newCsrfToken) {
                        Cookies.set('csrf_token', newCsrfToken, { secure: true, sameSite: 'strict' });
                    }
                } catch (csrfError) {
                    console.error('Failed to refresh CSRF token:', csrfError);
                }
            }

            // Handle 429 Too Many Requests
            if (status === 429) {
                const retryAfter = error.response.headers['retry-after'];
                if (retryAfter) {
                    console.warn(`Rate limited. Retry after ${retryAfter} seconds`);
                }
            }

            // Enhance error object with additional information
            interface EnhancedError extends Error {
                code: number;
                message: string;
                details: unknown;
                timestamp: string;
            }

            const enhancedError = new Error() as EnhancedError;
            enhancedError.code = status;
            enhancedError.message = typeof data === 'string' ? data : (data as any)?.detail || 'An error occurred';
            enhancedError.details = data;
            enhancedError.timestamp = new Date().toISOString();

            return Promise.reject(enhancedError);
        }

        return Promise.reject(error);
    }
);

// Helper function to convert FormData to URLSearchParams
export const formDataToURLSearchParams = (formData: FormData): string => {
    const params = new URLSearchParams();
    for (const [key, value] of formData.entries()) {
        params.append(key, value.toString());
    }
    return params.toString();
};

export default apiClient; 
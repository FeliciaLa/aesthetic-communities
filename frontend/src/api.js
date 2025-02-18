import axios from "axios";
import { getApiUrl } from './config';
import { authService } from './services/authService';

// Remove any trailing slashes from the base URL
const baseURL = getApiUrl().replace(/\/+$/, '');

console.log('API URL Construction:', {
    baseURL,
    fullTestUrl: `${baseURL}/auth/login/`  // Note the added / here
});

const api = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL || 'https://aesthetic-communities-production.up.railway.app/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        // Define public routes that don't need auth
        const publicRoutes = [
            '/communities',
            '/announcements'
        ];

        // Check if the current request is for a public route
        const isPublicRoute = publicRoutes.some(route => 
            config.url.startsWith(route) && 
            config.method.toLowerCase() === 'get'
        );

        // Only add auth token for non-public routes
        const token = localStorage.getItem('token');
        if (token && !isPublicRoute) {
            config.headers.Authorization = `Token ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Only handle 401 errors for non-public routes
        if (error.response?.status === 401) {
            const protectedRoutes = [
                '/auth/profile/',
                '/membership/',
                '/saved/',
                '/gallery/',
                '/products/save/',
                '/create-community/',
                '/edit-community/'
            ];
            
            const isProtectedRoute = protectedRoutes.some(route => 
                error.config.url.includes(route) || 
                ['post', 'put', 'delete'].includes(error.config.method?.toLowerCase())
            );

            if (isProtectedRoute) {
                authService.logout();
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

export default api;

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

// Request interceptor - simplified to just add token if present
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Token ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - only handle auth errors for protected routes
api.interceptors.response.use(
    (response) => response,
    (error) => {
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
                error.config.url.includes(route)
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

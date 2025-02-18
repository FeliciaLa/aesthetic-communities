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
    baseURL: baseURL,  // This will not have a trailing slash
    withCredentials: true,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    },
    timeout: 15000
});

// Update the request interceptor to preserve the URL
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Token ${token}`;
        }
        
        // Ensure URL is not being transformed
        if (config.url.includes('spotify-playlist')) {
            console.log('Spotify request details:', {
                originalUrl: config.url,
                baseURL: config.baseURL,
                fullUrl: `${config.baseURL}${config.url}`,
                method: config.method,
                headers: config.headers
            });
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Define protected routes that require authentication
        const protectedRoutes = [
            '/auth/profile/',
            '/membership/',
            '/saved/',
            '/gallery/',
            '/products/save/',
            '/create-community/',
            '/edit-community/'
        ];

        // Check if the current route is protected
        const isProtectedRoute = protectedRoutes.some(route => 
            error.config.url.includes(route) || 
            ['post', 'put', 'delete'].includes(error.config.method?.toLowerCase())
        );

        // Only redirect for 401 errors on protected routes
        if (error.response?.status === 401 && isProtectedRoute) {
            authService.logout();
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

export default api;

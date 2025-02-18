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
    baseURL: baseURL,
    withCredentials: true,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    },
    timeout: 15000
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Token ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Only redirect for auth profile and actions that modify data
        const protectedActions = ['post', 'put', 'delete', 'patch'];
        const isProtectedAction = protectedActions.includes(error.config.method?.toLowerCase());
        const isAuthProfile = error.config.url.includes('/auth/profile');

        if (error.response?.status === 401 && (isProtectedAction || isAuthProfile)) {
            authService.logout();
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

export default api;

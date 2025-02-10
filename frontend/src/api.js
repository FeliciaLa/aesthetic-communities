import axios from "axios";
import { getApiUrl } from './config';

console.log('API Configuration:', {
    baseURL: getApiUrl(),
    environment: process.env.NODE_ENV
});

const api = axios.create({
    baseURL: getApiUrl(),
    withCredentials: true,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    },
    timeout: 15000, // Increase timeout to 15 seconds
    // Add retry logic
    retry: 3,
    retryDelay: (retryCount) => {
        return retryCount * 1000;
    }
});

// Add request interceptor for auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Token ${token}`;
        }
        // Add CSRF token if needed
        const csrfToken = document.cookie.match('(^|;)\\s*csrftoken\\s*=\\s*([^;]+)');
        if (csrfToken) {
            config.headers['X-CSRFToken'] = csrfToken[2];
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Add response interceptor with better error handling
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.code === 'ERR_NETWORK') {
            console.error('Network Error Details:', {
                baseURL: api.defaults.baseURL,
                endpoint: error.config?.url,
                method: error.config?.method
            });
        }
        return Promise.reject(error);
    }
);

export default api;

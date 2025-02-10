import axios from "axios";
import { getApiUrl } from './config';

const baseURL = getApiUrl();
console.log('API Configuration:', {
    baseURL,
    environment: process.env.NODE_ENV,
    fullLoginUrl: `${baseURL}auth/login/`
});

const api = axios.create({
    baseURL,
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

// Add request interceptor with more detailed logging
api.interceptors.request.use(
    (config) => {
        const fullUrl = config.baseURL + config.url;
        console.log('Making API request:', {
            method: config.method,
            url: fullUrl,
            headers: config.headers,
            data: config.data
        });
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
    (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
    }
);

// Add response interceptor
api.interceptors.response.use(
    (response) => {
        console.log('API Response:', {
            status: response.status,
            data: response.data,
            headers: response.headers
        });
        return response;
    },
    (error) => {
        console.error('API Response Error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            config: error.config
        });
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

import axios from "axios";
import { getApiUrl } from './config';

const baseURL = getApiUrl();

console.log('API URL Construction:', {
    baseURL,
    fullTestUrl: `${baseURL}auth/login/`
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

// Add request interceptor with more detailed logging
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        console.log('Request interceptor:', {
            url: config.url,
            hasToken: !!token,
            authHeader: token ? `Token ${token}` : 'No token'
        });
        
        if (token) {
            config.headers.Authorization = `Token ${token}`;
        }
        
        // Add CSRF token if needed
        const csrfToken = document.cookie.match('(^|;)\\s*csrftoken\\s*=\\s*([^;]+)');
        if (csrfToken) {
            config.headers['X-CSRFToken'] = csrfToken[2];
        }

        console.log('Final request headers:', config.headers);
        return config;
    },
    (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Add response interceptor for debugging
api.interceptors.response.use(
    (response) => {
        console.log('Response:', {
            url: response.config.url,
            status: response.status,
            hasAuthHeader: !!response.config.headers.Authorization
        });
        return response;
    },
    (error) => {
        console.error('Response error:', {
            url: error.config?.url,
            status: error.response?.status,
            message: error.message,
            hasAuthHeader: !!error.config?.headers?.Authorization
        });

        // Handle 401 Unauthorized responses
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            localStorage.removeItem('username');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

export default api;

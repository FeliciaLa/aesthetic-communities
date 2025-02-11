import axios from "axios";
import { getApiUrl } from './config';

const baseURL = getApiUrl();
// Remove the api/ from here since it's part of the URL pattern
const apiBaseURL = baseURL;

console.log('API URL Construction:', {
    rawBaseURL: baseURL,
    apiBaseURL: apiBaseURL,
    fullRequestUrl: `${apiBaseURL}api/auth/login/`
});

// Add this right before the axios.create
console.log('Final Axios Config:', {
    baseURL: apiBaseURL,
    fullTestUrl: `${apiBaseURL}auth/login/`
});

const api = axios.create({
    baseURL: apiBaseURL,
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
        return Promise.reject(error);
    }
);

export default api;

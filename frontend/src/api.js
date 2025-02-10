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
        console.log('Request Config BEFORE:', {
            originalUrl: config.url,
            baseURL: config.baseURL,
            fullUrl: `${config.baseURL}${config.url}`,
            method: config.method
        });
        
        const fullUrl = config.baseURL + config.url;
        console.log('Request Config AFTER:', {
            modifiedUrl: config.url,
            baseURL: config.baseURL,
            fullUrl: fullUrl,
            method: config.method
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
        console.error('Request interceptor error:', error);
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
        console.error('API Error Details:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            config: {
                url: error.config?.url,
                baseURL: error.config?.baseURL,
                method: error.config?.method,
                headers: error.config?.headers
            }
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

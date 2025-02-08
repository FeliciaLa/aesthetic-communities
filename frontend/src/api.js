import axios from "axios";

// Force production URL and add debug logging
const baseURL = 'https://aesthetic-communities-production.up.railway.app/api/';
console.log('API Configuration:', {
    baseURL: baseURL,
    environment: process.env.NODE_ENV
});

const api = axios.create({
    baseURL: baseURL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Modify the request interceptor to add token to ALL requests
api.interceptors.request.use(
    (config) => {
        console.log('Request Config:', {
            url: config.url,
            fullUrl: `${baseURL}${config.url}`,
            headers: config.headers
        });
        const token = localStorage.getItem('token');
        if (token) {
            // Add token to all requests, including image requests
            config.headers.Authorization = `Token ${token}`;
            
            // Log the request for debugging
            console.log('Request Config:', {
                url: config.url,
                fullUrl: config.baseURL + config.url,
                headers: config.headers
            });
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
    response => response,
    error => {
        console.error('API Error:', {
            url: error.config?.url,
            data: error.config?.data,
            response: error.response?.data
        });
        return Promise.reject(error);
    }
);

export default api;

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
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    },
    // Remove withCredentials since we're using token auth
    withCredentials: false
});

// Add request interceptor for debugging
api.interceptors.request.use(
    (config) => {
        // Log the full URL being requested
        console.log('Making request to:', `${baseURL}${config.url}`, {
            method: config.method,
            headers: config.headers
        });
        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// Add response interceptor for debugging
api.interceptors.response.use(
    (response) => {
        console.log('Successful response:', response.data);
        return response;
    },
    (error) => {
        console.error('Response error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        return Promise.reject(error);
    }
);

export default api;

import axios from "axios";

// Force production URL and add debug logging
const baseURL = 'https://aesthetic-communities-production.up.railway.app/api';
console.log('API Configuration:', {
    baseURL: baseURL,
    environment: process.env.NODE_ENV
});

const api = axios.create({
    baseURL: baseURL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Add request interceptor for debugging
api.interceptors.request.use(
    (config) => {
        console.log('Request URL:', config.url);
        console.log('Full URL:', config.baseURL + config.url);
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

// Add response interceptor for debugging
api.interceptors.response.use(
    (response) => {
        console.log('Received response:', response.status);
        return response;
    },
    (error) => {
        console.error('API Error:', error);
        return Promise.reject(error);
    }
);

export default api;

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

// Modify the request interceptor to add token to ALL requests
api.interceptors.request.use(
    (config) => {
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

// Keep your existing response interceptor
api.interceptors.response.use(
    (response) => {
        console.log('Response Status:', response.status);
        return response;
    },
    (error) => {
        console.error('API Error:', error);
        return Promise.reject(error);
    }
);

export default api;

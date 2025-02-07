import axios from "axios";

// Add console log to check environment
console.log('Current NODE_ENV:', process.env.NODE_ENV);

const baseURL = process.env.NODE_ENV === 'production'
    ? 'https://aesthetic-communities-production.up.railway.app/api/'
    : 'http://localhost:8000/api/';

// Add console log to check baseURL
console.log('Selected baseURL:', baseURL);

const api = axios.create({
    baseURL,
    timeout: 5000,
    withCredentials: true,  // Important for cookies/sessions
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
});

// Add a request interceptor to add the auth token
api.interceptors.request.use(
    (config) => {
        // Add console log to check each request URL
        console.log('Making request to:', config.baseURL + config.url);
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Token ${token}`;
        }
        console.log('Making request to:', config.url, 'with headers:', config.headers); // Debug log
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor for debugging
api.interceptors.response.use(
    response => {
        console.log('Response from:', response.config.url, response.data); // Debug log
        return response;
    },
    error => {
        console.error('API Error:', error.response?.status, error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export default api;

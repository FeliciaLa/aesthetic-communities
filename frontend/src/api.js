import axios from "axios";

const baseURL = process.env.NODE_ENV === 'production'
    ? 'https://aesthetic-communities-production.up.railway.app/api/'
    : 'http://localhost:8000/api/';

console.log('API baseURL:', baseURL); // Debug log

const api = axios.create({
    baseURL,
    timeout: 5000,
    withCredentials: true,  // Important for cookies/sessions
    headers: {
        'Content-Type': 'application/json',
    }
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Token ${token}`;
    }
    console.log('Making request to:', config.url, 'with headers:', config.headers); // Debug log
    return config;
});

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

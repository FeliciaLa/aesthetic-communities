import axios from "axios";

const baseURL = process.env.NODE_ENV === 'production'
    ? 'https://aesthetic-communities-production.up.railway.app/api/'
    : 'http://127.0.0.1:8000/api/';

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
    return config;
});

// Add response interceptor for debugging
api.interceptors.response.use(
    response => response,
    error => {
        console.error('API Error:', error.response || error);
        return Promise.reject(error);
    }
);

export default api;

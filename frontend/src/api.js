import axios from "axios";

// Force production URL for Vercel deployment
const baseURL = 'https://aesthetic-communities-production.up.railway.app/api/';

console.log('Using baseURL:', baseURL);

const api = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
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

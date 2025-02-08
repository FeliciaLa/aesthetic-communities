import axios from "axios";

// Force production URL
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
        'Content-Type': 'application/json'
    }
});

// Test connection immediately
const testConnection = async () => {
    try {
        const response = await axios({
            method: 'get',
            url: `${baseURL}communities/`,
            headers: {
                'Accept': 'application/json'
            }
        });
        console.log('Test connection successful:', response.data);
    } catch (error) {
        console.error('Test connection failed:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            config: error.config
        });
    }
};

// Run test
testConnection();

// Add request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Token ${token}`;
        }
        console.log('Request:', config.url, config.data);
        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// Add response interceptor
api.interceptors.response.use(
    (response) => {
        console.log('Response:', response.data);
        return response;
    },
    (error) => {
        console.error('Response error:', {
            url: error.config?.url,
            status: error.response?.status,
            data: error.response?.data
        });
        return Promise.reject(error);
    }
);

export default api;

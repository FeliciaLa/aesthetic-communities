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

// Add request interceptor for debugging
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Token ${token}`;
        }
        console.log('Making request:', {
            url: `${baseURL}${config.url}`,
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
        console.log('Response:', response.data);
        return response;
    },
    (error) => {
        console.error('Response error:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            config: error.config
        });
        return Promise.reject(error);
    }
);

export default api;

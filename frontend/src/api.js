import axios from "axios";

// Force production URL
const baseURL = 'https://aesthetic-communities-production.up.railway.app/api/';

console.log('API Configuration:', {
    baseURL: baseURL,
    environment: process.env.NODE_ENV
});

const api = axios.create({
    baseURL: baseURL,
    timeout: 30000,
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
        // Remove any double slashes in the URL except after http(s):
        config.url = config.url.replace(/([^:]\/)\/+/g, "$1");
        
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Log the complete request URL and data
        console.log('Making request:', {
            url: `${config.baseURL}${config.url}`,
            method: config.method,
            data: config.data,
            headers: config.headers
        });
        
        config.headers['Access-Control-Allow-Origin'] = '*';
        
        return config;
    },
    (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Add response interceptor
api.interceptors.response.use(
    (response) => {
        console.log('Response received:', {
            url: response.config.url,
            status: response.status,
            data: response.data
        });
        return response;
    },
    (error) => {
        if (error.code === 'ERR_NETWORK') {
            console.error('Network Error Details:', {
                url: error.config?.url,
                message: error.message,
                code: error.code
            });
        }
        return Promise.reject(error);
    }
);

export default api;

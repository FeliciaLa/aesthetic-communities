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

// Add request interceptor for debugging
api.interceptors.request.use(
    (config) => {
        // Ensure the URL starts with the correct base URL
        if (!config.url.startsWith('http')) {
            config.url = `${baseURL}${config.url.replace(/^\//, '')}`;
        }
        
        console.log('Making request to:', config.url, {
            method: config.method,
            data: config.data
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
        console.log('Response received:', {
            url: response.config.url,
            status: response.status,
            data: response.data
        });
        return response;
    },
    (error) => {
        console.error('API Error:', {
            url: error.config?.url,
            message: error.message,
            response: error.response?.data
        });
        return Promise.reject(error);
    }
);

// Login helper function
api.login = async (email, password) => {
    try {
        const response = await api.post('/auth/login/', {
            identifier: email,  // Backend expects 'identifier'
            password: password
        });
        return response.data;
    } catch (error) {
        console.error('Login failed:', error);
        throw error;
    }
};

export default api;

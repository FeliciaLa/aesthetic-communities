// Base API URL for production
const API_BASE_URL = process.env.REACT_APP_API_URL;
console.log('Environment Variables:', {
    REACT_APP_API_URL: process.env.REACT_APP_API_URL,
    NODE_ENV: process.env.NODE_ENV
});

if (!API_BASE_URL) {
    console.error('API_BASE_URL is not set! Check .env.production file');
}

// Don't add /api/ here since it's part of the URL patterns
export const getApiUrl = () => {
    return API_BASE_URL?.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;
};

// Export the base URL for other uses
export const getBaseUrl = () => {
    return API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;
};

export { API_BASE_URL };

// Axios default config
import axios from 'axios';
axios.defaults.withCredentials = true;

export const axiosConfig = {
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
}; 
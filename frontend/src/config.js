// Move all imports to the top
import axios from 'axios';
// Add any other imports here

const config = {
  // Your configuration settings
};

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Base API URL for production
const API_BASE_URL = process.env.REACT_APP_API_URL;
console.log('Environment Variables:', {
    REACT_APP_API_URL: process.env.REACT_APP_API_URL,
    NODE_ENV: process.env.NODE_ENV
});

if (!API_BASE_URL) {
    console.error('API_BASE_URL is not set! Check .env.production file');
}

// Don't add /api/ here since it's already in the URL
export const getApiUrl = () => {
    if (!API_BASE_URL) {
        console.error('API_BASE_URL is not set');
        return 'https://aesthetic-communities-production.up.railway.app/';
    }
    // Remove any trailing slashes
    const cleanBaseUrl = API_BASE_URL.replace(/\/+$/, '');
    return `${cleanBaseUrl}/`;
};

// Export the base URL for other uses
export const getBaseUrl = () => {
    return API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;
};

export { API_BASE_URL };

// Axios default config
axios.defaults.withCredentials = true;

export const axiosConfig = {
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
};

export default api; 
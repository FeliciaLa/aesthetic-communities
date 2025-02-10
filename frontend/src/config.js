// Base API URL for production
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://aesthetic-communities-production.up.railway.app';

// Ensure trailing slash and api path
export const getApiUrl = () => {
    return API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;
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
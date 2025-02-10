// Base API URL for production
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://aesthetic-communities-production.up.railway.app/api';

// Ensure trailing slash
export const getApiUrl = () => {
    const url = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;
    console.log('Current API URL:', url); // Debug log
    return url;
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
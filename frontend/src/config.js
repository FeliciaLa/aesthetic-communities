// Base API URL for production
const API_BASE_URL = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:8000/api/'
    : 'https://aesthetic-communities-production.up.railway.app/api/';

// Ensure trailing slash
export const getApiUrl = () => {
    const url = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;
    console.log('API URL:', url); // Add this for debugging
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
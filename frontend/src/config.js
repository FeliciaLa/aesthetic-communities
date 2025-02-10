// Base API URL for production
export const API_BASE_URL = 'https://aesthetic-communities-production.up.railway.app/api';

// Axios default config
export const axiosConfig = {
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
}; 
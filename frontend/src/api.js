import axios from "axios";
import { getApiUrl } from './config';

const baseURL = getApiUrl();

console.log('API URL Construction:', {
    baseURL,
    fullTestUrl: `${baseURL}auth/login/`
});

const api = axios.create({
    baseURL: baseURL,
    withCredentials: true,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    },
    timeout: 15000
});

// Add request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Token ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && 
            !error.config.url.includes('login') && 
            !error.config.url.includes('register')) {
            authService.logout();
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

export default api;

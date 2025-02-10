import api from '../api';
import { API_BASE_URL } from '../config';

export const authService = {
    login: async (credentials) => {
        try {
            const requestUrl = 'auth/login/';
            console.log('URL Construction:', {
                requestUrl,
                baseURL: api.defaults.baseURL,
                expectedFullUrl: `${api.defaults.baseURL}${requestUrl}`,
                credentials
            });

            const response = await api.post(requestUrl, {
                username: credentials.username,
                password: credentials.password
            }, {
                baseURL: api.defaults.baseURL,
                url: requestUrl,
                validateStatus: function (status) {
                    return status < 500;
                }
            });

            console.log('Login response:', response);

            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('userId', response.data.user.id.toString());
                localStorage.setItem('username', response.data.user.username);
                return response.data;
            }
            throw new Error('No token received');
        } catch (error) {
            console.error('Login error details:', {
                message: error.message,
                code: error.code,
                response: error.response?.data,
                baseURL: api.defaults.baseURL,
                fullURL: api.defaults.baseURL + 'auth/login/',
                status: error.response?.status
            });
            
            if (error.code === 'ERR_NETWORK') {
                throw new Error('Unable to connect to server. Please check your internet connection and try again.');
            }
            throw error;
        }
    },

    register: async (credentials) => {
        try {
            console.log('Attempting registration with:', {
                email: credentials.email,
                username: credentials.username,
                hasPassword: !!credentials.password,
                hasConfirmPassword: !!credentials.confirmPassword,
                isOver16: credentials.isOver16
            });

            const formData = {
                username: credentials.username,
                email: credentials.email,
                password: credentials.password,
                confirm_password: credentials.confirmPassword,
                is_over_16: credentials.isOver16
            };

            console.log('Registration URL:', `${api.defaults.baseURL}auth/register/`);

            const response = await api.post('auth/register/', formData);
            console.log('Registration response:', {
                status: response.status,
                data: response.data,
                headers: response.headers
            });
            
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('username', response.data.username);
                localStorage.setItem('userId', response.data.user_id?.toString());
                return response.data;
            } else {
                console.error('No token in response:', response.data);
                throw new Error('Registration failed: No token received');
            }
        } catch (error) {
            console.error('Registration error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                url: error.config?.url,
                method: error.config?.method
            });
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
    },

    getCurrentUser: () => {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        return { token, userId };
    },

    isAuthenticated: () => {
        return !!localStorage.getItem('token');
    },

    requestPasswordReset: async (email) => {
        try {
            const response = await api.post('password-reset/', {
                email: email
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    resetPassword: async (userId, token, password) => {
        try {
            const response = await api.post(
                `/password-reset-confirm/${userId}/${token}/`,
                { password }
            );
            return response.data;
        } catch (error) {
            throw error;
        }
    }
}; 
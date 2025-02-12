import api from '../api';
import { API_BASE_URL } from '../config';

export const authService = {
    login: async (credentials) => {
        try {
            console.log('Login attempt:', {
                username: credentials.username,
                timestamp: new Date().toISOString()
            });

            const response = await api.post('/auth/login/', {
                username: credentials.username,
                password: credentials.password
            });

            console.log('Login response:', {
                hasToken: !!response.data?.token,
                hasUser: !!response.data?.user,
                username: response.data?.user?.username,
                timestamp: new Date().toISOString()
            });

            if (response.data?.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('userId', response.data.user.id.toString());
                localStorage.setItem('username', response.data.user.username);

                // Verify storage
                console.log('LocalStorage after login:', {
                    storedToken: !!localStorage.getItem('token'),
                    storedUserId: localStorage.getItem('userId'),
                    storedUsername: localStorage.getItem('username'),
                    allKeys: Object.keys(localStorage)
                });

                return response.data;
            }
            throw new Error('Invalid login response');
        } catch (error) {
            console.error('Login error:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            localStorage.removeItem('username');
            throw error;
        }
    },

    register: async (credentials) => {
        try {
            console.log('Register attempt:', {
                username: credentials.username,
                timestamp: new Date().toISOString()
            });

            const response = await api.post('/auth/register/', {
                username: credentials.username,
                password: credentials.password,
                email: credentials.email,
                confirm_password: credentials.confirm_password
            });

            console.log('Register response:', {
                success: !!response.data,
                timestamp: new Date().toISOString(),
                endpoint: '/auth/register/',
                baseURL: api.defaults.baseURL
            });

            if (response.data?.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('userId', response.data.user.id.toString());
                localStorage.setItem('username', response.data.user.username);
                return response.data;
            }
            throw new Error('Invalid registration response');
        } catch (error) {
            console.error('Register error:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                endpoint: '/auth/register/',
                baseURL: api.defaults.baseURL
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

    isAuthenticated: async () => {
        const token = localStorage.getItem('token');
        if (!token) return false;

        try {
            await api.get('/auth/profile/');
            return true;
        } catch (error) {
            console.error('Token validation failed:', error);
            // Clear invalid tokens
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            localStorage.removeItem('username');
            return false;
        }
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
    },

    validateToken: async () => {
        try {
            const response = await api.get('/auth/profile/');
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }
}; 
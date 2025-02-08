import api from '../api';

export const authService = {
    login: async (credentials) => {
        try {
            console.log('Attempting login with:', {
                url: 'auth/login/',
                identifier: credentials.identifier
            });

            const response = await api.post('auth/login/', {
                identifier: credentials.identifier,
                password: credentials.password
            });

            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('userId', response.data.user.id.toString());
                localStorage.setItem('username', response.data.user.username);
                return response.data;
            } else {
                throw new Error('No token received');
            }
        } catch (error) {
            console.error('Login error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            throw error;
        }
    },

    register: async (credentials) => {
        try {
            console.log('Attempting registration with:', {
                email: credentials.email,
                username: credentials.username
            });

            const formData = {
                email: credentials.email,
                username: credentials.username,
                password: credentials.password,
                confirm_password: credentials.confirmPassword,
                is_over_16: credentials.isOver16
            };

            const response = await api.post('auth/register/', formData);
            
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('username', response.data.username);
                localStorage.setItem('userId', response.data.user_id.toString());
                console.log('Registration successful:', response.data);
                return response.data;
            } else {
                throw new Error('Registration failed: No token received');
            }
        } catch (error) {
            console.error('Registration error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
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
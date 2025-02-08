import api from '../api';

export const authService = {
    login: async (credentials) => {
        try {
            const response = await api.post('auth/login/', {
                username: credentials.identifier,
                password: credentials.password
            });
            const { token, user } = response.data;
            
            localStorage.setItem('token', token);
            localStorage.setItem('userId', user.id.toString());
            console.log('Stored user ID:', user.id);
            
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    register: async (credentials) => {
        try {
            const response = await api.post('auth/register/', {
                email: credentials.email,
                username: credentials.username,
                password: credentials.password,
                confirm_password: credentials.confirmPassword,
                is_over_16: credentials.isOver16
            });
            const { token, user } = response.data;
            
            localStorage.setItem('token', token);
            localStorage.setItem('userId', user.id.toString());
            
            return response.data;
        } catch (error) {
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
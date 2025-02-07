import axios from 'axios';

const API_URL = process.env.NODE_ENV === 'production' 
    ? 'https://aesthetic-communities-production.up.railway.app/api/'
    : 'http://localhost:8000/api/';

export const authService = {
    login: async (credentials) => {
        try {
            const response = await axios.post(`${API_URL}login/`, {
                username: credentials.identifier,
                password: credentials.password
            });
            const { token, user } = response.data;
            
            // Store both token and user ID
            localStorage.setItem('token', token);
            localStorage.setItem('userId', user.id.toString());
            console.log('Stored user ID:', user.id); // Debug log
            
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    register: async (credentials) => {
        try {
            const response = await axios.post(`${API_URL}auth/register/`, {
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
            const response = await axios.post(`${API_URL}password-reset/`, {
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
            const response = await axios.post(
                `${API_URL}/password-reset-confirm/${userId}/${token}/`,
                { password }
            );
            return response.data;
        } catch (error) {
            throw error;
        }
    }
}; 
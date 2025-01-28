import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/';

export const authService = {
    login: async (credentials) => {
        try {
            const response = await axios.post(`${API_URL}auth/login/`, credentials);
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

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
    },

    getCurrentUser: () => {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        return { token, userId };
    }
}; 
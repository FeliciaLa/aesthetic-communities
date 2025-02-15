import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';

const AccountActivation = () => {
    const { registration_id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const activateAccount = async () => {
            try {
                // Make the request with proper headers
                const response = await api.post(`auth/activate/${registration_id}/`, {}, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });

                if (response.data && response.data.message) {
                    navigate('/', { 
                        state: { 
                            showAuthModal: true,
                            initialMode: 'login',
                            message: response.data.message
                        }
                    });
                } else {
                    throw new Error('Invalid response from server');
                }
            } catch (error) {
                navigate('/', { 
                    state: { 
                        showAuthModal: true,
                        initialMode: 'login',
                        error: error.response?.data?.error || 'Account activation failed. Please try registering again.'
                    }
                });
            }
        };

        activateAccount();
    }, [registration_id, navigate]);

    return <div>Activating your account...</div>;
};

export default AccountActivation; 
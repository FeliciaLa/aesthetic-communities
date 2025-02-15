import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';

const AccountActivation = () => {
    const { registration_id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const activateAccount = async () => {
            try {
                console.log('Attempting to activate account...');
                await api.post(`/api/auth/activate/${registration_id}/`);
                console.log('Account activated successfully');
                
                // Redirect to login with a success message
                navigate('/', { 
                    state: { 
                        showAuthModal: true,
                        initialMode: 'login',
                        message: 'Account activated successfully! Please log in.' 
                    }
                });
            } catch (error) {
                console.error('Activation failed:', error);
                // Redirect to login with an error message
                navigate('/', { 
                    state: { 
                        showAuthModal: true,
                        initialMode: 'login',
                        error: 'Account activation failed. Please try registering again.' 
                    }
                });
            }
        };

        activateAccount();
    }, [registration_id, navigate]);

    // No need for a UI - this component just handles the activation and redirect
    return null;
};

export default AccountActivation; 
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';

const AccountActivation = () => {
    const { registration_id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const activateAccount = async () => {
            try {
                console.log('Attempting activation with ID:', registration_id);
                // Remove the /api prefix since it's in the base URL
                const response = await api.post(`auth/activate/${registration_id}/`, {}, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });
                console.log('Activation response:', response);

                if (response.data && response.data.message) {
                    navigate('/', { 
                        state: { 
                            showAuthModal: true,
                            initialMode: 'login',
                            message: response.data.message
                        },
                        replace: true
                    });
                } else {
                    throw new Error('Invalid response from server');
                }
            } catch (error) {
                console.error('Activation error:', error.response || error);
                navigate('/', { 
                    state: { 
                        showAuthModal: true,
                        initialMode: 'login',
                        error: error.response?.data?.error || 'Account activation failed. Please try registering again.'
                    },
                    replace: true
                });
            }
        };

        activateAccount();
    }, [registration_id, navigate]);

    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh' 
        }}>
            Activating your account...
        </div>
    );
};

export default AccountActivation; 
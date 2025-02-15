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
                const response = await api.post(`auth/activate/${registration_id}/`);
                console.log('Activation response:', response);
                
                navigate('/', { 
                    state: { 
                        showAuthModal: true,
                        initialMode: 'login',
                        message: 'Account activated successfully! Please log in.'
                    },
                    replace: true
                });
            } catch (error) {
                console.error('Activation error:', {
                    message: error.message,
                    response: error.response?.data,
                    status: error.response?.status
                });
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

    // Return a loading state instead of null
    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            gap: '1rem',
            padding: '20px',
            textAlign: 'center'
        }}>
            <h2>Account Activation</h2>
            <p>Activating your account with ID: {registration_id}</p>
            <p>Please wait while we process your request...</p>
        </div>
    );
};

export default AccountActivation; 
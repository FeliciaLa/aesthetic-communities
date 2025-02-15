import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';

const AccountActivation = () => {
    const { registration_id } = useParams();
    const navigate = useNavigate();

    console.log('Component rendered with ID:', registration_id); // Debug log

    useEffect(() => {
        console.log('useEffect triggered'); // Debug log
        
        const activateAccount = async () => {
            console.log('Attempting activation...'); // Debug log
            try {
                console.log('Making API call to:', `auth/activate/${registration_id}/`); // Debug log
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
            textAlign: 'center',
            backgroundColor: '#fff'
        }}>
            <h2>Account Activation</h2>
            <p>Activating your account with ID: {registration_id}</p>
            <p>Please wait while we process your request...</p>
        </div>
    );
};

export default AccountActivation; 
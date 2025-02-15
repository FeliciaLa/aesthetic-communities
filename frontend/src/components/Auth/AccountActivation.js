import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import api from '../../api';

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
`;

const Card = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  max-width: 400px;
  width: 100%;
  text-align: center;
`;

const AccountActivation = () => {
    const [status, setStatus] = useState('activating');
    const { registration_id } = useParams();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    useEffect(() => {
        console.log('=== Debug Info ===');
        console.log('Current URL:', window.location.href);
        console.log('API Base URL:', api.defaults.baseURL);
        
        const activateAccount = async () => {
            try {
                // Use the api instance directly - it already has the base URL configured
                const response = await api.post(
                    `auth/activate/${registration_id}/`, 
                    {}, 
                    { 
                        timeout: 10000,
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        }
                    }
                );
                
                console.log('Activation response:', response);
                setStatus('success');
                setTimeout(() => navigate('/login'), 3000);
            } catch (err) {
                console.error('Activation error:', {
                    message: err.message,
                    status: err.response?.status,
                    data: err.response?.data,
                    code: err.code,
                    baseURL: api.defaults.baseURL,
                    url: `auth/activate/${registration_id}/`
                });
                setError(err.response?.data?.error || 'Failed to activate account');
                setStatus('error');
            }
        };

        activateAccount();
    }, [registration_id, navigate]);

    return (
        <Container>
            <Card>
                <h2>Account Activation</h2>
                {status === 'activating' && <p>Activating your account...</p>}
                {status === 'success' && (
                    <SuccessMessage>
                        Account activated successfully! Redirecting to login...
                    </SuccessMessage>
                )}
                {status === 'error' && (
                    <ErrorMessage>
                        {error}
                    </ErrorMessage>
                )}
            </Card>
        </Container>
    );
};

export default AccountActivation; 
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import api from '../../api';
import { getApiUrl } from '../../config';

const ActivationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
`;

const ActivationCard = styled.div`
  padding: 2rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  max-width: 400px;
  width: 100%;
  text-align: center;
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  margin: 1rem 0;
  padding: 0.5rem;
  border-radius: 4px;
  background-color: #fdeaea;
`;

const SuccessMessage = styled.div`
  color: #27ae60;
  margin: 1rem 0;
  padding: 0.5rem;
  border-radius: 4px;
  background-color: #e8f5e9;
`;

const AccountActivation = () => {
    const [status, setStatus] = useState('activating');
    const { registration_id } = useParams();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    console.log('AccountActivation component mounted');
    console.log('Registration ID from params:', registration_id);

    useEffect(() => {
        console.log('=== Debug Info ===');
        console.log('Current URL:', window.location.href);
        console.log('API Base URL:', api.defaults.baseURL);
        
        const activateAccount = async () => {
            try {
                console.log('Making activation request...');
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
                console.error('Activation error:', err);
                setError(err.response?.data?.error || 'Failed to activate account');
                setStatus('error');
            }
        };

        activateAccount();
    }, [registration_id, navigate]);

    return (
        <ActivationContainer>
            <ActivationCard>
                <h2>Account Activation</h2>
                {status === 'activating' && (
                    <>
                        <p>Activating your account...</p>
                        <p>ID: {registration_id}</p>
                    </>
                )}
                {status === 'success' && (
                    <p style={{color: 'green'}}>Account activated! Redirecting to login...</p>
                )}
                {status === 'error' && (
                    <p style={{color: 'red'}}>{error}</p>
                )}
            </ActivationCard>
        </ActivationContainer>
    );
};

export default AccountActivation; 
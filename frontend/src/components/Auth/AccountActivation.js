import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import api from '../../api';
import { getApiUrl } from '../../config';

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 20px;
`;

const Card = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
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
        console.log('API Base URL:', process.env.REACT_APP_API_URL);
        
        const activateAccount = async () => {
            try {
                const fullUrl = `${process.env.REACT_APP_API_URL}/auth/activate/${registration_id}/`;
                console.log('Making request to:', fullUrl);
                
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
                console.error('Detailed error:', {
                    message: err.message,
                    status: err.response?.status,
                    data: err.response?.data,
                    code: err.code,
                    url: `${process.env.REACT_APP_API_URL}/auth/activate/${registration_id}/`
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
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import api from '../../api';

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

    useEffect(() => {
        const activateAccount = async () => {
            try {
                console.log('Attempting to activate with ID:', registration_id);
                const fullUrl = `/auth/activate/${registration_id}/`;
                const baseURL = api.defaults.baseURL;
                console.log('Base URL:', baseURL);
                console.log('Making request to:', `${baseURL}${fullUrl}`);
                
                const response = await api.post(fullUrl);
                console.log('Activation response:', response);
                setStatus('success');
                setTimeout(() => navigate('/login'), 3000);
            } catch (err) {
                console.error('Activation error:', err);
                console.error('Full error details:', {
                    message: err.message,
                    response: err.response?.data,
                    status: err.response?.status,
                    baseURL: api.defaults.baseURL,
                    fullUrl: `/auth/activate/${registration_id}/`
                });
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
                        Failed to activate account. Invalid or expired activation link.
                    </ErrorMessage>
                )}
            </Card>
        </Container>
    );
};

export default AccountActivation; 
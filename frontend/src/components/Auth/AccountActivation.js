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
    const { userId, token } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const activateAccount = async () => {
            try {
                await api.post(`/auth/activate/${userId}/${token}/`);
                setStatus('success');
                setTimeout(() => navigate('/login'), 3000);
            } catch (err) {
                setStatus('error');
            }
        };
        activateAccount();
    }, [userId, token, navigate]);

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
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

    useEffect(() => {
        const activateAccount = async () => {
            try {
                await api.post(`auth/activate/${registration_id}/`);
                setStatus('success');
                setTimeout(() => navigate('/'), 3000);
            } catch (error) {
                setStatus('error');
                console.error('Activation failed:', error);
            }
        };

        activateAccount();
    }, [registration_id, navigate]);

    return (
        <Container>
            <Card>
                <h2>Account Activation</h2>
                {status === 'activating' && <p>Activating your account...</p>}
                {status === 'success' && <p>Account activated successfully! Redirecting...</p>}
                {status === 'error' && (
                    <>
                        <p>Failed to activate account. Please try again.</p>
                        <button onClick={() => navigate('/')}>Go Home</button>
                    </>
                )}
            </Card>
        </Container>
    );
};

export default AccountActivation; 
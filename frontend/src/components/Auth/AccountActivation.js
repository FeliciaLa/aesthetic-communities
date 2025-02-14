import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import { Container, Card, ErrorMessage } from './styles';

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
                    <p>Account activated successfully! Redirecting to login...</p>
                )}
                {status === 'error' && (
                    <ErrorMessage>Failed to activate account. Invalid or expired activation link.</ErrorMessage>
                )}
            </Card>
        </Container>
    );
};

export default AccountActivation; 
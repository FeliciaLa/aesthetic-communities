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
        console.log('API Base URL:', api.defaults.baseURL);
        
        const activateAccount = async () => {
            try {
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
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            backgroundColor: '#f5f5f5'
        }}>
            <div style={{
                padding: '2rem',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                maxWidth: '400px',
                width: '100%',
                textAlign: 'center'
            }}>
                <h2>Account Activation</h2>
                
                {status === 'activating' && (
                    <div>
                        <p>Activating your account...</p>
                        <p style={{color: '#666'}}>Registration ID: {registration_id}</p>
                    </div>
                )}
                
                {status === 'success' && (
                    <div style={{color: 'green'}}>
                        <p>✅ Account activated successfully!</p>
                        <p>Redirecting to login page in 3 seconds...</p>
                    </div>
                )}
                
                {status === 'error' && (
                    <div style={{color: 'red'}}>
                        <p>❌ Activation failed</p>
                        <p>{error}</p>
                        <button 
                            onClick={() => navigate('/login')}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#fa8072',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                marginTop: '1rem'
                            }}
                        >
                            Go to Login
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccountActivation; 
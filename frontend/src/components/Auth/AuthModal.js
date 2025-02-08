import React, { useState } from 'react';
import styled from 'styled-components';
import { authService } from '../../services/authService';
import { Link } from 'react-router-dom';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;

  input {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  button {
    padding: 0.5rem;
    background: #fa8072;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;

    &:hover {
      background: #fa8072;
    }
  }
`;

const ErrorMessage = styled.div`
  color: red;
  margin-bottom: 1rem;
`;

const Checkbox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  
  input[type="checkbox"] {
    width: auto;
  }
`;

const AuthModal = ({ show, onClose, initialMode, setIsLoggedIn }) => {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isOver16, setIsOver16] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      let response;
      if (mode === 'login') {
        response = await authService.login({
          identifier: email,
          password: password
        });
      } else {
        // Validation for registration
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        if (!isOver16) {
          setError('You must be 16 or older to register');
          return;
        }
        if (password.length < 8) {
          setError('Password must be at least 8 characters long');
          return;
        }
        if (!username) {
          setError('Username is required');
          return;
        }

        try {
          response = await authService.register({
            email,
            username,
            password,
            confirmPassword,
            isOver16
          });
        } catch (err) {
          // Handle specific validation errors
          if (err.response?.data) {
            const errors = err.response.data;
            if (errors.username) {
              setError(errors.username[0]);
              return;
            }
            if (errors.email) {
              setError(errors.email[0]);
              return;
            }
          }
          setError('Registration failed. Please try again.');
          return;
        }
      }

      if (response.token) {
        setIsLoggedIn(true);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <h2>{mode === 'login' ? 'Log In' : 'Sign Up'}</h2>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <Form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          {mode === 'register' && (
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          )}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {mode === 'login' && (
            <Link 
              to="/password-reset"
              onClick={() => {
                onClose();  // Close the modal when clicking the link
              }}
              style={{
                display: 'block',
                textAlign: 'center',
                marginTop: '0.5rem',
                color: '#fa8072',
                textDecoration: 'none',
                fontSize: '0.9rem'
              }}
            >
              Forgot Password?
            </Link>
          )}
          {mode === 'register' && (
            <>
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
              <Checkbox>
                <input
                  type="checkbox"
                  checked={isOver16}
                  onChange={e => setIsOver16(e.target.checked)}
                  required
                />
                <label>I confirm that I am 16 years or older</label>
              </Checkbox>
            </>
          )}
          <button type="submit">
            {mode === 'login' ? 'Log In' : 'Sign Up'}
          </button>
        </Form>
        <button 
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          style={{ 
            marginTop: '1rem',
            background: 'transparent',
            border: 'none',
            color: 'black',
            cursor: 'pointer'
          }}
        >
          {mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Log in'}
        </button>
      </ModalContent>
    </ModalOverlay>
  );
};

export default AuthModal; 
import React, { useState } from 'react';
import styled from 'styled-components';
import { authService } from '../../services/authService';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);

  h2 {
    text-align: center;
    color: #333;
    margin-bottom: 1.5rem;
    font-size: 1.8rem;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    input[type="text"],
    input[type="email"],
    input[type="password"] {
      padding: 0.8rem;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 1rem;
      
      &:focus {
        outline: none;
        border-color: #fa8072;
        box-shadow: 0 0 0 2px rgba(250, 128, 114, 0.2);
      }
    }

    button {
      background: #fa8072;
      color: white;
      padding: 0.8rem;
      border: none;
      border-radius: 6px;
      font-size: 1rem;
      cursor: pointer;
      transition: background 0.2s;

      &:hover {
        background: #ff6b5b;
      }
    }
  }

  .checkbox-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin: 0.5rem 0;

    label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      color: #666;
    }
  }

  .error-message {
    color: #ff4444;
    text-align: center;
    margin: 0.5rem 0;
    font-size: 0.9rem;
  }

  p {
    text-align: center;
    margin-top: 1rem;
    color: #666;

    button.switch-mode {
      background: none;
      border: none;
      color: #fa8072;
      cursor: pointer;
      padding: 0;
      font-size: inherit;
      text-decoration: underline;

      &:hover {
        color: #ff6b5b;
      }
    }
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  
  &:hover {
    color: #333;
  }
`;

const AuthModal = ({ onClose, initialMode, onLoginSuccess }) => {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isOver16, setIsOver16] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (mode === 'register') {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        if (!isOver16) {
          setError('You must be over 16 to register');
          return;
        }
        if (!agreedToTerms || !agreedToPrivacy) {
          setError('Please agree to both the Terms & Conditions and Privacy Policy');
          return;
        }
        
        const response = await authService.register({
          username,
          email,
          password,
          password_confirm: confirmPassword
        });
        
        onClose();
        alert('Please check your email to activate your account');
      } else {
        const response = await authService.login({
          username: email,
          email: email,
          password
        });

        if (response && response.token) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('userId', response.user.id.toString());
          localStorage.setItem('email', response.user.email);
          setTimeout(async () => {
            await onLoginSuccess();
          }, 100);
        }
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred');
    }
  };

  return (
    <ModalOverlay>
      <ModalContent>
        <CloseButton onClick={onClose}>&times;</CloseButton>
        <h2>{mode === 'register' ? 'Create Account' : 'Log In'}</h2>
        <form onSubmit={handleSubmit}>
          {mode === 'register' ? (
            <>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={isOver16}
                    onChange={(e) => setIsOver16(e.target.checked)}
                  />
                  I am over 16 years old
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                  />
                  I agree to the Terms & Conditions
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={agreedToPrivacy}
                    onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                  />
                  I agree to the Privacy Policy
                </label>
              </div>
            </>
          ) : (
            <>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </>
          )}
          {error && <div className="error-message">{error}</div>}
          <button type="submit">
            {mode === 'register' ? 'Create Account' : 'Log In'}
          </button>
        </form>
        <p>
          {mode === 'register' 
            ? 'Already have an account? ' 
            : "Don't have an account? "}
          <button 
            className="switch-mode" 
            onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
          >
            {mode === 'register' ? 'Log In' : 'Register'}
          </button>
        </p>
      </ModalContent>
    </ModalOverlay>
  );
};

export default AuthModal; 
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
  font-size: 0.9rem;
  
  input[type="checkbox"] {
    width: auto;
  }

  label {
    color: #666;
  }

  a {
    color: #fa8072;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
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
          email,
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
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <h2>{mode === 'register' ? 'Create Account' : 'Log In'}</h2>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <Form onSubmit={handleSubmit}>
          {mode === 'register' && (
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
                onChange={e => setPassword(e.target.value)}
                required
              />
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
                <label>I am over 16 years old</label>
              </Checkbox>
              <Checkbox>
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={e => setAgreedToTerms(e.target.checked)}
                  required
                />
                <label>I agree to the <Link to="/terms" onClick={(e) => e.stopPropagation()}>Terms & Conditions</Link></label>
              </Checkbox>
              <Checkbox>
                <input
                  type="checkbox"
                  checked={agreedToPrivacy}
                  onChange={e => setAgreedToPrivacy(e.target.checked)}
                  required
                />
                <label>I agree to the <Link to="/privacy-policy" onClick={(e) => e.stopPropagation()}>Privacy Policy</Link></label>
              </Checkbox>
            </>
          )}
          <button type="submit">
            {mode === 'register' ? 'Create Account' : 'Log In'}
          </button>
        </Form>
        <div className="modal-footer">
          {mode === 'register' ? (
            <p>
              Already have an account?{' '}
              <button onClick={() => setMode('login')}>Log In</button>
            </p>
          ) : (
            <p>
              Don't have an account?{' '}
              <button onClick={() => setMode('register')}>Create Account</button>
            </p>
          )}
        </div>
        <button className="close-button" onClick={onClose}>
          ×
        </button>
      </ModalContent>
    </ModalOverlay>
  );
};

export default AuthModal; 
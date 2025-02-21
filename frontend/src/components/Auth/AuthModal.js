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

const AuthModal = ({ onClose, initialMode, onLoginSuccess }) => {
  const [mode, setMode] = useState(initialMode);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isOver16, setIsOver16] = useState(false);
  const [error, setError] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);

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
                setError("Please agree to both the Terms & Conditions and Privacy Policy");
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
                username,
                password
            });

            if (response && response.token) {
                localStorage.setItem('token', response.token);
                localStorage.setItem('userId', response.user.id.toString());
                localStorage.setItem('username', response.user.username);
                setTimeout(async () => {
                    await onLoginSuccess();
                }, 100);
            }
        }
    } catch (err) {
        console.error('Auth error:', err);
        setError(err.response?.data?.detail || err.response?.data?.error || 'An error occurred');
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <h2>{mode === 'login' ? 'Log In' : 'Sign Up'}</h2>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <Form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          )}
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
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
          <div className="agreements">
            <label className="agreement-label">
                <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    required
                />
                I agree to the <Link to="/terms" onClick={(e) => e.stopPropagation()}>Terms & Conditions</Link>
            </label>
            
            <label className="agreement-label">
                <input
                    type="checkbox"
                    checked={agreedToPrivacy}
                    onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                    required
                />
                I agree to the <Link to="/privacy-policy" onClick={(e) => e.stopPropagation()}>Privacy Policy</Link>
            </label>
          </div>
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
      <style jsx>{`
        .agreements {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            margin-bottom: 1rem;
        }

        .agreement-label {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.9rem;
            color: #666;
        }

        .agreement-label input[type="checkbox"] {
            width: 16px;
            height: 16px;
            cursor: pointer;
        }

        .agreement-label a {
            color: #fa8072;
            text-decoration: none;
        }

        .agreement-label a:hover {
            text-decoration: underline;
        }
      `}</style>
    </ModalOverlay>
  );
};

export default AuthModal; 
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import styled from 'styled-components';
import { authService } from '../../services/authService';

const PasswordResetConfirm = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { userId, token } = useParams();
  const navigate = useNavigate();

  console.log('PasswordResetConfirm rendered with:', { userId, token }); // Debug log

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      setIsSubmitting(false);
      return;
    }

    try {
      await authService.resetPassword(userId, token, password);
      setSuccess(true);
      setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container>
      <Card>
        <h2>Reset Password</h2>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success ? (
          <SuccessMessage>Password reset successful! Redirecting...</SuccessMessage>
        ) : (
          <Form onSubmit={handleSubmit}>
            <Input
              type="password"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </Button>
          </Form>
        )}
      </Card>
    </Container>
  );
};

// Styled components
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
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const Button = styled.button`
  padding: 0.5rem;
  background: #fa8072;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  &:disabled {
    opacity: 0.7;
  }
`;

const ErrorMessage = styled.div`
  color: red;
  margin-bottom: 1rem;
`;

const SuccessMessage = styled.div`
  color: green;
  margin-bottom: 1rem;
`;

export default PasswordResetConfirm; 
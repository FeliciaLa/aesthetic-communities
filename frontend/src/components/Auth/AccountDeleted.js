import React, { useEffect } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 2rem;
  text-align: center;
`;

const Message = styled.h2`
  color: #666;
  margin-bottom: 2rem;
`;

const RedirectMessage = styled.p`
  color: #888;
`;

const AccountDeleted = () => {
  useEffect(() => {
    // Redirect to home after 3 seconds
    const timer = setTimeout(() => {
      window.location.replace('/');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Container>
      <Message>Your account has been successfully deleted</Message>
      <RedirectMessage>You will be redirected to the homepage in a few seconds...</RedirectMessage>
    </Container>
  );
};

export default AccountDeleted; 
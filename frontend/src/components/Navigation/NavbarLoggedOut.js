import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const Nav = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: white;
  border-bottom: 1px solid #eee;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
`;

const NavLeft = styled.div`
  .brand {
    font-size: 1.5rem;
    font-weight: bold;
    color: #0066cc;
    text-decoration: none;
  }
`;

const NavRight = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;

  button {
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-weight: 500;
  }

  .login-button {
    border: 1px solid #0066cc;
    background: transparent;
    color: #0066cc;

    &:hover {
      background: #f0f7ff;
    }
  }

  .signup-button {
    border: none;
    background: #0066cc;
    color: white;

    &:hover {
      background: #0052a3;
    }
  }
`;

const NavbarLoggedOut = ({ setShowAuthModal, setInitialAuthMode }) => {
  const handleLoginClick = () => {
    setInitialAuthMode('login');
    setShowAuthModal(true);
  };

  const handleSignUpClick = () => {
    setInitialAuthMode('register');
    setShowAuthModal(true);
  };

  return (
    <Nav>
      <NavLeft>
        <Link to="/" className="brand">
          almas
        </Link>
      </NavLeft>

      <NavRight>
        <button onClick={handleLoginClick} className="login-button">
          Log In
        </button>
        <button onClick={handleSignUpClick} className="signup-button">
          Sign Up
        </button>
      </NavRight>
    </Nav>
  );
};

export default NavbarLoggedOut; 
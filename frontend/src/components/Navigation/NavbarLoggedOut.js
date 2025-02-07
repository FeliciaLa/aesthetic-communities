import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const Nav = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: transparent;
  backdrop-filter: blur(8px);
  z-index: 1000;
`;

const NavLeft = styled.div`
  .brand {
    font-size: 1.5rem;
    font-weight: bold;
    color: #fa8072;
    text-decoration: none;
  }
`;

const NavRight = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;

  .log-in {
    padding: 0.5rem 1.5rem;
    border-radius: 20px;
    background: transparent;
    color: #fa8072;
    border: 1px solid #fa8072;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(250, 128, 114, 0.1);
    }
  }

  .sign-up {
    padding: 0.5rem 1.5rem;
    border-radius: 20px;
    background: #fa8072;
    color: white;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: #ff9288;
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
        <button onClick={handleLoginClick} className="log-in">
          Log In
        </button>
        <button onClick={handleSignUpClick} className="sign-up">
          Sign Up
        </button>
      </NavRight>
    </Nav>
  );
};

export default NavbarLoggedOut; 
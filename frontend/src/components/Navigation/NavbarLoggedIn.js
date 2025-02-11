import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  gap: 1.5rem;

  .nav-link {
    color: #fa8072;
    text-decoration: none;
    font-weight: 500;
    padding: 0.5rem 1.5rem;
    border-radius: 20px;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(250, 128, 114, 0.1);
    }

    &.active {
      background: #fa8072;
      color: white;
    }
  }

  .logout-button {
    padding: 0.5rem 1.5rem;
    border: 1px solid #fa8072;
    border-radius: 20px;
    background: transparent;
    color: #fa8072;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(250, 128, 114, 0.1);
    }
  }
`;

const NavbarLoggedIn = ({ handleLogout }) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <Nav>
      <NavLeft>
        <Link to="/" className="brand">
          almas
        </Link>
      </NavLeft>

      <NavRight>
        <Link 
          to="/communities" 
          className={`nav-link ${isActive('/communities') ? 'active' : ''}`}
        >
          Hubs
        </Link>
        <Link 
          to="/create-community" 
          className={`nav-link ${isActive('/create-community') ? 'active' : ''}`}
        >
          Create Hub
        </Link>
        <Link 
          to="/auth/profile" 
          className={`nav-link ${isActive('/profile') ? 'active' : ''}`}
        >
          Profile
        </Link>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </NavRight>
    </Nav>
  );
};

export default NavbarLoggedIn; 
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  gap: 1.5rem;

  .nav-link {
    color: #333;
    text-decoration: none;
    font-weight: 500;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    transition: all 0.2s ease;

    &:hover {
      background: #f0f7ff;
      color: #0066cc;
    }

    &.active {
      background: #0066cc;
      color: white;
    }
  }

  .logout-button {
    padding: 0.5rem 1rem;
    border: 1px solid #0066cc;
    border-radius: 4px;
    background: transparent;
    color: #0066cc;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: #0066cc;
      color: white;
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
          to="/profile" 
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
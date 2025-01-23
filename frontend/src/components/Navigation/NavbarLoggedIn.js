import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const NavbarLoggedIn = ({ handleLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" className="logo">
          Aesthetic Communities
        </Link>
        <button 
          className="mobile-menu-button"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      <div className={`navbar-menu ${isOpen ? 'is-open' : ''}`}>
        <Link 
          to="/profile" 
          className={`nav-link ${isActive('/profile') ? 'active' : ''}`}
        >
          Profile
        </Link>
        <Link 
          to="/communities" 
          className={`nav-link ${isActive('/communities') ? 'active' : ''}`}
        >
          Communities
        </Link>
        <Link 
          to="/create-community" 
          className={`nav-link ${isActive('/create-community') ? 'active' : ''}`}
        >
          Create Community
        </Link>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>

      <style jsx>{`
        .navbar {
          background: white;
          padding: 1rem 2rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          position: sticky;
          top: 0;
          z-index: 1000;
        }

        .navbar-brand {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo {
          font-size: 1.5rem;
          font-weight: bold;
          color: #0061ff;
          text-decoration: none;
          transition: color 0.3s ease;
        }

        .logo:hover {
          color: #003c9e;
        }

        .navbar-menu {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .nav-link {
          color: #333;
          text-decoration: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          transition: all 0.3s ease;
        }

        .nav-link:hover {
          background: #f5f5f5;
          color: #0061ff;
        }

        .nav-link.active {
          background: #0061ff;
          color: white;
        }

        .logout-button {
          background: #ff4444;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.3s ease;
        }

        .logout-button:hover {
          background: #cc0000;
        }

        .mobile-menu-button {
          display: none;
          flex-direction: column;
          gap: 6px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
        }

        .mobile-menu-button span {
          display: block;
          width: 25px;
          height: 2px;
          background: #333;
          transition: all 0.3s ease;
        }

        @media (max-width: 768px) {
          .mobile-menu-button {
            display: flex;
          }

          .navbar-menu {
            display: none;
            flex-direction: column;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            padding: 1rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }

          .navbar-menu.is-open {
            display: flex;
          }

          .nav-link {
            width: 100%;
            text-align: center;
          }

          .logout-button {
            width: 100%;
            margin-top: 0.5rem;
          }
        }
      `}</style>
    </nav>
  );
};

export default NavbarLoggedIn; 
import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import NavbarLoggedIn from "./components/Navigation/NavbarLoggedIn";
import NavbarLoggedOut from "./components/Navigation/NavbarLoggedOut";
import Profile from "./components/Auth/Profile";
import PrivateRoute from "./components/Auth/PrivateRoute";
import ExploreCommunities from './components/Communities/ExploreCommunities';
import CreateCommunity from './components/Communities/CreateCommunity';
import CommunityDetail from './components/Communities/CommunityDetail';
import CollectionDetailPage from './components/Communities/CollectionDetailPage';
import { MusicProvider } from './contexts/MusicContext';
import AuthModal from './components/Auth/AuthModal';
import PasswordResetConfirm from './components/Auth/PasswordResetConfirm';
import PasswordReset from './components/Auth/PasswordReset';
import ErrorBoundary from './components/ErrorBoundary';
import { authService } from './services/authService';
import { createContext, useContext } from 'react';
import api from './api';
import AccountActivation from './components/Auth/AccountActivation';
import AccountDeleted from './components/Auth/AccountDeleted';

const App = () => {
  console.log('Available Routes:', {
    passwordReset: '/reset-password/:userId/:token',
    activation: '/auth/activate/:registration_id',
    currentPath: window.location.pathname
  });

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [initialAuthMode, setInitialAuthMode] = useState('login');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const message = params.get('message');
    if (message) {
      alert(message); // or use your preferred notification system
      // Clean up URL after showing message
      window.history.replaceState({}, '', '/');
    }
  }, []);

  useEffect(() => {
    if (location.state?.message) {
      alert(location.state.message);
      // Clean up the message from state
      window.history.replaceState({}, '');
    }
  }, [location]);

  const validateAuth = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoggedIn(false);
        setIsLoading(false);
        return;
      }
      
      const response = await api.get('/auth/profile/', {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      
      if (response.status === 200) {
        setIsLoggedIn(true);
      } else {
        throw new Error('Invalid token');
      }
    } catch (error) {
      console.error('Auth validation failed:', error);
      setIsLoggedIn(false);
      authService.logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    validateAuth();
  }, []);

  const handleLoginSuccess = async () => {
    await validateAuth();
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    authService.logout();
    setIsLoggedIn(false);
    navigate('/');
  };

  return (
    <ErrorBoundary>
      <MusicProvider>
        <>
          {isLoggedIn ? (
            <NavbarLoggedIn handleLogout={handleLogout} />
          ) : (
            <NavbarLoggedOut 
              setShowAuthModal={setShowAuthModal} 
              setInitialAuthMode={setInitialAuthMode}
            />
          )}

          <Routes>
            {isLoading ? (
              <Route path="*" element={<div>Loading...</div>} />
            ) : (
              <>
                {/* Test route */}
                <Route path="/test" element={
                  <div style={{ 
                    padding: '20px',
                    textAlign: 'center',
                    marginTop: '50px',
                    backgroundColor: '#f0f0f0',
                    minHeight: '200px',
                    border: '2px solid #ccc'
                  }}>
                    <h1 style={{ color: '#fa8072' }}>Test Route</h1>
                    <p>If you can see this, routing is working correctly!</p>
                    <p>Current path: {window.location.pathname}</p>
                  </div>
                } />

                {/* Auth routes */}
                <Route path="/password-reset" element={<PasswordReset />} />
                <Route path="/reset-password/:userId/:token" element={<PasswordResetConfirm />} />

                {/* Activation routes */}
                <Route path="/auth/activate/:registration_id" element={<AccountActivation />} />
                
                {/* Protected routes */}
                <Route path="/profile" element={
                  <PrivateRoute isLoggedIn={isLoggedIn}>
                    <Profile />
                  </PrivateRoute>
                } />
                
                {/* Community routes */}
                <Route path="/communities/:communityId/resources/:collectionId" element={<CollectionDetailPage />} />
                <Route path="/communities/:id" element={<CommunityDetail />} />
                <Route 
                  path="/communities" 
                  element={
                    <ExploreCommunities 
                      isLoggedIn={isLoggedIn}
                      onAuthClick={() => {
                        setInitialAuthMode('register');
                        setShowAuthModal(true);
                      }}
                    />
                  } 
                />
                
                {/* Home route */}
                <Route path="/" element={<ExploreCommunities isLoggedIn={isLoggedIn} onAuthClick={() => {
                  setInitialAuthMode('register');
                  setShowAuthModal(true);
                }}/>} />

                {/* Account deleted route */}
                <Route path="/account-deleted" element={<AccountDeleted />} />
                
              </>
            )}
          </Routes>

          {showAuthModal && (
            <AuthModal
              initialMode={initialAuthMode}
              onClose={() => setShowAuthModal(false)}
              onLoginSuccess={handleLoginSuccess}
            />
          )}
        </>
      </MusicProvider>
    </ErrorBoundary>
  );
};

export default App;
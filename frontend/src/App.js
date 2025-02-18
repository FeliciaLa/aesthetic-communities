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

const DebugRoute = () => {
  const location = useLocation();
  return (
    <div style={{ 
      position: 'fixed', 
      bottom: 0, 
      right: 0, 
      background: '#f0f0f0', 
      padding: '10px',
      border: '1px solid #ccc',
      zIndex: 9999
    }}>
      <h4>Route Debug</h4>
      <p>Current Path: {location.pathname}</p>
      <p>Available Routes:</p>
      <ul>
        <li>/reset-password/:userId/:token</li>
        <li>/auth/activate/:registration_id</li>
      </ul>
    </div>
  );
};

const App = () => {
  console.log('🔍 APP MOUNTED');
  console.log('🛣️ ROUTES DEBUG:', {
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
    console.log('🔄 APP UPDATED:', {
      path: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash
    });

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
            {console.log('🎯 ROUTES RENDERING', window.location.pathname)}
            {!isLoading && <Route path="*" element={<DebugRoute />} />}
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
                <Route 
                  path="/reset-password/:userId/:token" 
                  element={
                    <>
                      {console.log('⚡ PASSWORD RESET ROUTE MATCHED')}
                      <PasswordResetConfirm />
                    </>
                  } 
                />

                {/* Activation routes */}
                <Route 
                  path="/auth/activate/:registration_id" 
                  element={
                    <>
                      {console.log('🔑 ACTIVATION ROUTE MATCHED')}
                      <AccountActivation />
                    </>
                  } 
                />
                
                {/* Protected routes */}
                <Route path="/profile" element={
                  <PrivateRoute isLoggedIn={isLoggedIn}>
                    <Profile />
                  </PrivateRoute>
                } />
                
                {/* Community routes */}
                <Route path="/create-community" element={<CreateCommunity />} />
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
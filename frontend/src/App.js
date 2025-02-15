import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
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

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [initialAuthMode, setInitialAuthMode] = useState('login');
  const navigate = useNavigate();

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

  if (isLoading) {
    return <div>Loading...</div>;
  }

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
            {/* Test route with debug logs */}
            <Route path="/test" element={
              (() => {
                console.log('Test route rendered');
                return (
                  <div style={{ 
                    padding: '20px',
                    textAlign: 'center',
                    marginTop: '50px',
                    backgroundColor: '#f0f0f0',  // Added background color
                    minHeight: '200px',          // Added minimum height
                    border: '2px solid #ccc'     // Added border
                  }}>
                    <h1 style={{ color: '#fa8072' }}>Test Route</h1>
                    <p>If you can see this, routing is working correctly!</p>
                    <p>Current path: {window.location.pathname}</p>
                  </div>
                );
              })()
            } />
            
            {/* Activation routes */}
            <Route path="/auth/activate/:registration_id" element={<AccountActivation />} />
            
            {/* Auth routes */}
            <Route path="/password-reset" element={<PasswordReset />} />
            <Route path="/password-reset-confirm/:userId/:token" element={<PasswordResetConfirm />} />
            
            {/* Protected routes */}
            <Route
              path="/create-community"
              element={
                <PrivateRoute isLoggedIn={isLoggedIn}>
                  <CreateCommunity />
                </PrivateRoute>
              }
            />
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
            
            {/* Debug catch-all route */}
            <Route path="*" element={
              <div style={{ padding: '20px' }}>
                <h2>Debug Info</h2>
                <p>Current Path: {window.location.pathname}</p>
                <p>Current Search: {window.location.search}</p>
                <p>Current Hash: {window.location.hash}</p>
                <p>Expected Path Format: /auth/activate/[registration_id]</p>
                <p>This page means the route wasn't matched correctly</p>
                <p>All Routes should include:</p>
                <pre>
                  {JSON.stringify({
                    activationRoute: "/auth/activate/:registration_id",
                    currentPath: window.location.pathname,
                    params: window.location.pathname.split('/')
                  }, null, 2)}
                </pre>
              </div>
            } />
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
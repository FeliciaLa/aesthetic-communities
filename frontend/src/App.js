import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
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

const AppContent = () => {
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
    <MusicProvider>
      {isLoggedIn ? (
        <NavbarLoggedIn handleLogout={handleLogout} />
      ) : (
        <NavbarLoggedOut 
          setShowAuthModal={setShowAuthModal} 
          setInitialAuthMode={setInitialAuthMode}
        />
      )}

      <Routes>
        <Route 
          path="/" 
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
        <Route
          path="/create-community"
          element={
            <PrivateRoute isLoggedIn={isLoggedIn}>
              <CreateCommunity />
            </PrivateRoute>
          }
        />
        <Route path="/communities/:id" element={<CommunityDetail />} />
        <Route path="/communities/:communityId/resources/:collectionId" element={<CollectionDetailPage />} />
        <Route path="/profile" element={
          <PrivateRoute isLoggedIn={isLoggedIn}>
            <Profile />
          </PrivateRoute>
        } />
        <Route path="/password-reset" element={<PasswordReset />} />
        <Route path="/password-reset-confirm/:userId/:token" element={<PasswordResetConfirm />} />
        <Route path="/activate/:userId/:token" element={<AccountActivation />} />
      </Routes>

      {showAuthModal && (
        <AuthModal
          initialMode={initialAuthMode}
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </MusicProvider>
  );
};

const App = () => {
  return (
    <Router>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </Router>
  );
};

export default App;
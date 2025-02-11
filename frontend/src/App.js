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

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Update authentication state when localStorage changes
        const handleStorageChange = () => {
            setIsAuthenticated(authService.isAuthenticated());
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const login = async (credentials) => {
        try {
            const response = await authService.login(credentials);
            setIsAuthenticated(true);
            setUser(response.user);
            return response;
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        authService.logout();
        setIsAuthenticated(false);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

const AppContent = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(authService.isAuthenticated());
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [initialAuthMode, setInitialAuthMode] = useState('login');
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication status on mount and token changes
    const checkAuth = () => {
      setIsLoggedIn(authService.isAuthenticated());
    };

    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  // Add console log for state changes
  useEffect(() => {
    console.log('Auth state changed:', isLoggedIn);
  }, [isLoggedIn]);

  const handleAuthClick = () => {
    setInitialAuthMode('register');
    setShowAuthModal(true);
  };

  const handleLogout = () => {
    authService.logout();
    setIsLoggedIn(false);
    navigate('/');
  };

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
              setIsLoggedIn={setIsLoggedIn}
              onAuthClick={handleAuthClick}
            />
          } 
        />
        <Route 
          path="/communities" 
          element={
            <ExploreCommunities 
              setIsLoggedIn={setIsLoggedIn}
              onAuthClick={handleAuthClick}
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
      </Routes>

      {showAuthModal && (
        <AuthModal
          initialMode={initialAuthMode}
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={() => {
            setIsLoggedIn(true);
            setShowAuthModal(false);
          }}
        />
      )}
    </MusicProvider>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <Router>
        <MusicProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </MusicProvider>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
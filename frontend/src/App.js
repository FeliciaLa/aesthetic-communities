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

const AppContent = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [initialAuthMode, setInitialAuthMode] = useState('login');
  const navigate = useNavigate();
  const handleAuthClick = () => {
    setInitialAuthMode('register');
    setShowAuthModal(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
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
        <Route path="/collection/:id" element={<CollectionDetailPage />} />
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
          show={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode={initialAuthMode}
          setIsLoggedIn={setIsLoggedIn}
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
          <AppContent />
        </MusicProvider>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
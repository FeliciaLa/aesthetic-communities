import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import NavbarLoggedIn from "./components/Layout/NavbarLoggedIn";
import NavbarLoggedOut from "./components/Layout/NavbarLoggedOut";
import Register from "./components/Auth/Register";
import Login from "./components/Auth/Login";
import Profile from "./components/Auth/Profile";
import PrivateRoute from "./components/Auth/PrivateRoute";
import Logout from "./components/Auth/Logout";
import CommunityList from './components/Communities/CommunityList';
import CreateCommunity from './components/Communities/CreateCommunity';
import CommunityDetail from './components/Communities/CommunityDetail';
import CollectionDetailPage from './components/Communities/CollectionDetailPage';
import { MusicProvider } from './contexts/MusicContext';

function App() {
  return (
    <MusicProvider>
      <Router>
        <AppContent />
      </Router>
    </MusicProvider>
  );
}

function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    navigate("/login");
  };

  return (
    <div>
      {/* Only show navbar when logged in */}
      {isLoggedIn && <NavbarLoggedIn handleLogout={handleLogout} />}
      
      <Routes>
        <Route path="/" element={isLoggedIn ? <Navigate to="/communities" /> : <Navigate to="/login" />} />
        <Route path="/register" element={<Register />} />
        <Route 
          path="/login" 
          element={<Login setIsLoggedIn={setIsLoggedIn} />} 
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route 
          path="/logout" 
          element={<Logout handleLogout={handleLogout} />} 
        />
        <Route path="/communities" element={<CommunityList />} />
        <Route path="/create-community" element={<CreateCommunity />} />
        <Route path="/communities/:id" element={<CommunityDetail />} />
        <Route path="/resources/categories/:collectionId" element={<CollectionDetailPage />} />
      </Routes>
    </div>
  );
}

export default App;
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
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

function App() {
  
  
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  // Check if token exists when the component mounts or updates
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token); // Set state to true if token exists, else false
  }, []);

  return (
    <Router>
      <AppContent isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
    </Router>
  );
}

function AppContent({ isLoggedIn, setIsLoggedIn }) {
  const navigate = useNavigate(); // Now useNavigate is used within Router context

  // Logout function to clear token and update state
  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false); // Update the state when logging out
    navigate("/login"); // Navigate to login page after logout
  };

  return (
    <div>
      {/* Conditional rendering of navbar based on login status */}
      {isLoggedIn ? (
        <NavbarLoggedIn handleLogout={handleLogout} />
      ) : (
        <NavbarLoggedOut />
      )}
      
      <Routes>
        <Route path="/" element={<h1>Aesthetics Finder</h1>} />
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
      </Routes>
    </div>
  );
}

export default App;
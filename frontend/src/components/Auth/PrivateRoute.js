import React from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token"); // Retrieve token from localStorage

  if (!token) {
    // If no token, redirect to login
    console.warn("Access denied. No token found."); // Debugging
    return <Navigate to="/login" replace />;
  }

  // If token exists, allow access to the protected route
  return children;
};

export default PrivateRoute;

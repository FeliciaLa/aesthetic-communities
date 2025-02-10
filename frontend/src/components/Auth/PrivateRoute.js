import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authService } from '../../services/authService';

const PrivateRoute = ({ children }) => {
    const location = useLocation();
    const isAuthenticated = authService.isAuthenticated();

    if (!isAuthenticated) {
        // Redirect to login while saving the attempted URL
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    return children;
};

export default PrivateRoute;

import React, { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authService } from '../../services/authService';

const PrivateRoute = ({ children }) => {
    const location = useLocation();
    const [isAuthenticated, setIsAuthenticated] = useState(true);
    
    useEffect(() => {
        const checkAuth = async () => {
            const isAuth = await authService.isAuthenticated();
            setIsAuthenticated(isAuth);
        };
        checkAuth();
    }, []);

    if (!isAuthenticated) {
        // Redirect to login while saving the attempted URL
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    return children;
};

export default PrivateRoute;

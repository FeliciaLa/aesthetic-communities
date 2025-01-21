// Logout.js
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Logout = ({ handleLogout }) => {
  const navigate = useNavigate();

  useEffect(() => {
    handleLogout(); // Use the passed down handleLogout function
  }, [handleLogout]);

  return <p>Logging out...</p>;
};

export default Logout;

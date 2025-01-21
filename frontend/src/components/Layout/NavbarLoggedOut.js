import React from "react";
import { Link } from "react-router-dom";

const NavbarLoggedOut = () => {
  return (
    <nav>
      <Link to="/login">Login</Link>
      <Link to="/register">Register</Link>
    </nav>
  );
};

export default NavbarLoggedOut;


import React from "react";
import { Link } from "react-router-dom";

const NavbarLoggedIn = () => {
  return (
    <nav>
      <Link to="/profile">Profile</Link>
      <Link to="/communities">Communities</Link>
      <Link to="/create-community">Create Community</Link>
      <button onClick={() => {
        localStorage.removeItem('token');
        window.location.reload();
      }}>Logout</button>
    </nav>
  );
};

export default NavbarLoggedIn;

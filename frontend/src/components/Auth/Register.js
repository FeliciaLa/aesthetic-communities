import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const Register = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:8000/api/register/", {
        username,
        password,
      });
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Almas</h1>
        <div className="auth-tabs">
          <Link to="/login" className="auth-tab">
            Login
          </Link>
          <Link to="/register" className="auth-tab active">
            Register
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="submit-button">
            Register
          </button>
        </form>
      </div>

      <style jsx>{`
        .auth-container {
          min-height: calc(100vh - 64px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: #f5f5f5;
        }

        .auth-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          width: 100%;
          max-width: 400px;
          overflow: hidden;
        }

        .auth-tabs {
          display: flex;
          border-bottom: 1px solid #e0e0e0;
        }

        .auth-tab {
          flex: 1;
          padding: 1rem;
          text-align: center;
          color: #666;
          text-decoration: none;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .auth-tab:hover {
          background: #f5f5f5;
        }

        .auth-tab.active {
          color: #0061ff;
          border-bottom: 2px solid #0061ff;
        }

        .auth-form {
          padding: 2rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        label {
          display: block;
          margin-bottom: 0.5rem;
          color: #555;
          font-weight: 500;
        }

        input {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.3s ease;
        }

        input:focus {
          outline: none;
          border-color: #0061ff;
        }

        .submit-button {
          width: 100%;
          padding: 0.75rem;
          background: #0061ff;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.3s ease;
        }

        .submit-button:hover {
          background: #0056b3;
        }

        .error-message {
          background: #fff5f5;
          color: #dc3545;
          padding: 0.75rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          font-size: 0.9rem;
          text-align: center;
        }

        .auth-title {
          text-align: center;
          font-size: 2.5rem;
          color: #0061ff;
          margin: 1.5rem 0;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
};

export default Register;
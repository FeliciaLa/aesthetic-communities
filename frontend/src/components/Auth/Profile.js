import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please log in to view your profile");
        navigate("/login");
        return;
      }

      try {
        const response = await axios.get('http://localhost:8000/api/profile/', {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        setProfile(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Failed to fetch profile");
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  if (loading) return <div className="profile-loading">Loading profile...</div>;
  if (error) return <div className="profile-error">{error}</div>;
  if (!profile) return <div>No profile data found</div>;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar">
          {profile.username ? profile.username[0].toUpperCase() : '?'}
        </div>
        <h1>{profile.username}</h1>
      </div>
      
      <div className="profile-content">
        <div className="profile-card">
          <h2>Profile Information</h2>
          <div className="profile-info">
            <div className="info-group">
              <label>Username</label>
              <p>{profile.username}</p>
            </div>
            <div className="info-group">
              <label>Email</label>
              <p>{profile.email || 'No email provided'}</p>
            </div>
            <div className="info-group">
              <label>Member Since</label>
              <p>{profile.date_joined ? new Date(profile.date_joined).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : 'Not available'}</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .profile-container {
          min-height: calc(100vh - 64px); /* Adjust for navbar height */
          background-color: #f5f5f5;
        }

        .profile-header {
          background: linear-gradient(135deg, #0061ff 0%, #60efff 100%);
          color: white;
          padding: 80px 20px;
          text-align: center;
          position: relative;
        }

        .profile-avatar {
          width: 120px;
          height: 120px;
          background: white;
          border-radius: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          color: #0061ff;
          margin: 0 auto 20px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .profile-content {
          max-width: 800px;
          margin: -60px auto 0;
          padding: 20px;
          position: relative;
          z-index: 1;
        }

        .profile-card {
          background: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .profile-info {
          margin-top: 30px;
        }

        .info-group {
          margin-bottom: 25px;
        }

        .info-group:last-child {
          margin-bottom: 0;
        }

        .info-group label {
          display: block;
          color: #666;
          font-size: 0.9rem;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-group p {
          color: #333;
          font-size: 1.1rem;
          margin: 0;
          font-weight: 500;
        }

        h1 {
          margin: 0;
          font-size: 2.5rem;
          font-weight: 600;
        }

        h2 {
          margin: 0;
          color: #333;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .profile-loading, .profile-error {
          text-align: center;
          padding: 40px;
          font-size: 1.2rem;
        }

        .profile-error {
          color: #dc3545;
        }
      `}</style>
    </div>
  );
};

export default Profile;

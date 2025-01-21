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
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        } else {
          setError("Failed to fetch profile");
        }
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  if (loading) return <div>Loading profile...</div>;
  if (error) return <div style={{color: 'red'}}>{error}</div>;
  if (!profile) return <div>No profile data found</div>;

  return (
    <div className="profile-container">
      <h2>Profile</h2>
      <div className="profile-info">
        <p><strong>Username:</strong> {profile.username}</p>
        <p><strong>Email:</strong> {profile.email}</p>
      </div>
    </div>
  );
};

export default Profile;

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import SavedItems from './SavedItems';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createdCommunities, setCreatedCommunities] = useState([]);
  const [joinedCommunities, setJoinedCommunities] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const username = localStorage.getItem('username');

        // Get profile and all communities
        const [profileRes, allCommunitiesRes] = await Promise.all([
          axios.get('http://localhost:8000/api/profile/', {
            headers: { 'Authorization': `Token ${token}` }
          }),
          axios.get('http://localhost:8000/api/communities/', {
            headers: { 'Authorization': `Token ${token}` }
          })
        ]);

        const allCommunities = allCommunitiesRes.data;
        
        // Get created communities
        const created = allCommunities.filter(
          community => community.created_by === username
        );

        // Check membership status for each community
        const membershipChecks = await Promise.all(
          allCommunities.map(community =>
            axios.get(`http://localhost:8000/api/communities/${community.id}/membership/`, {
              headers: { 'Authorization': `Token ${token}` }
            })
          )
        );

        // Filter joined communities based on membership status
        const joined = allCommunities.filter((community, index) => 
          membershipChecks[index].data.is_member && community.created_by !== username
        );

        setProfile(profileRes.data);
        setCreatedCommunities(created);
        setJoinedCommunities(joined);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError('Failed to load profile data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

        <div className="communities-section">
          <div className="profile-card">
            <h2>Your Communities</h2>
            <div className="communities-grid">
              <div className="communities-column">
                <h3>Created Communities</h3>
                {createdCommunities.length === 0 ? (
                  <p className="empty-message">No communities created yet</p>
                ) : (
                  createdCommunities.map(community => (
                    <Link 
                      to={`/communities/${community.id}`} 
                      key={community.id}
                      className="community-card"
                    >
                      {community.banner_image && (
                        <img 
                          src={community.banner_image} 
                          alt={community.name} 
                          className="community-banner"
                        />
                      )}
                      <div className="community-info">
                        <h4>{community.name}</h4>
                        <p>{community.description}</p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
              
              <div className="communities-column">
                <h3>Joined Communities</h3>
                {joinedCommunities.length === 0 ? (
                  <p className="empty-message">No communities joined yet</p>
                ) : (
                  joinedCommunities.map(community => (
                    <Link 
                      to={`/communities/${community.id}`} 
                      key={community.id}
                      className="community-card"
                    >
                      {community.banner_image && (
                        <img 
                          src={community.banner_image} 
                          alt={community.name} 
                          className="community-banner"
                        />
                      )}
                      <div className="community-info">
                        <h4>{community.name}</h4>
                        <p>{community.description}</p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <SavedItems />
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

        .communities-section {
          margin-top: 20px;
        }

        .communities-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 20px;
        }

        .communities-column h3 {
          color: #333;
          margin-bottom: 15px;
          font-size: 1.2rem;
        }

        .community-card {
          display: block;
          text-decoration: none;
          background: #f8f9fa;
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 15px;
          transition: transform 0.2s;
        }

        .community-card:hover {
          transform: translateY(-2px);
        }

        .community-banner {
          width: 100%;
          height: 100px;
          object-fit: cover;
        }

        .community-info {
          padding: 12px;
        }

        .community-info h4 {
          margin: 0;
          color: #333;
          font-size: 1.1rem;
        }

        .community-info p {
          margin: 5px 0 0;
          color: #666;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .empty-message {
          color: #666;
          font-style: italic;
          text-align: center;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
};

export default Profile;
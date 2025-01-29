import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const CommunityList = () => {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCommunities = async () => {
      const token = localStorage.getItem('token');
      console.log('Token:', token); // Debug log

      if (!token) {
        setError('Please log in to view communities');
        navigate('/login');
        return;
      }

      try {
        const response = await axios.get('http://localhost:8000/api/communities/', {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('Communities data:', response.data); // Debug log
        setCommunities(response.data);
      } catch (error) {
        console.error('Error:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
        setError('Failed to fetch communities');
      } finally {
        setLoading(false);
      }
    };

    fetchCommunities();
  }, [navigate]);

  if (loading) return <div className="loading-state">Loading communities...</div>;
  if (error) return <div className="error-state">{error}</div>;
  if (!communities.length) return <div className="empty-state">No communities found</div>;

  return (
    <div className="communities-container">
      <div className="communities-header">
        <h1>Discover Communities</h1>
        <Link to="/create-community" className="create-button">
          Create New Community
        </Link>
      </div>
      
      <div className="communities-grid">
        {communities.map(community => (
          <Link key={community.id} to={`/communities/${community.id}`} className="community-card-link">
            <div className="community-card">
              <div className="community-banner">
                {community.banner_image ? (
                  <img src={community.banner_image} alt={`${community.name} banner`} />
                ) : (
                  <div className="placeholder-banner">
                    {community.name[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className="community-content">
                <h2>{community.name}</h2>
                <p>{community.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <style jsx>{`
        .communities-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 1.5rem;
        }

        .communities-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .communities-header h1 {
          font-size: 1.75rem;
          color: #333;
          margin: 0;
        }

        .create-button {
          background: #0061ff;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          text-decoration: none;
          transition: background 0.3s ease;
          font-size: 0.9rem;
        }

        .create-button:hover {
          background: #0056b3;
        }

        .communities-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1.25rem;
        }

        .community-card-link {
          text-decoration: none;
          color: inherit;
        }

        .community-card {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .community-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 3px 6px rgba(0,0,0,0.15);
        }

        .community-banner {
          height: 80px;
          background: linear-gradient(135deg, #0061ff 0%, #60efff 100%);
          position: relative;
        }

        .community-banner img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .placeholder-banner {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          color: white;
        }

        .community-content {
          padding: 1rem;
        }

        .community-content h2 {
          margin: 0 0 0.25rem 0;
          color: #333;
          font-size: 1.1rem;
        }

        .community-content p {
          margin: 0;
          color: #666;
          font-size: 0.85rem;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .loading-state,
        .error-state,
        .empty-state {
          text-align: center;
          padding: 2rem;
          color: #666;
          font-size: 1rem;
        }

        .error-state {
          color: #dc3545;
        }
      `}</style>
    </div>
  );
};

export default CommunityList; 
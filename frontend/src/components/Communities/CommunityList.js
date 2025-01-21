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

  if (loading) return <div>Loading communities...</div>;
  if (error) return <div style={{color: 'red'}}>{error}</div>;
  if (!communities.length) return <div>No communities found</div>;

  return (
    <div className="communities-list">
      <h1>Communities</h1>
      <div className="communities-grid">
        {communities.map(community => (
          <Link key={community.id} to={`/communities/${community.id}`}>
            <div className="community-card">
              <h2>{community.name}</h2>
              <p>{community.description}</p>
              {community.banner_image && (
                <img src={community.banner_image} alt={`${community.name} banner`} />
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CommunityList; 
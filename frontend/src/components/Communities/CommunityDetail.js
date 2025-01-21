import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import MediaGallery from './MediaGallery';
import ResourceLists from './ResourceLists';
import CommunityForum from './CommunityForum';
import Resources from './Resources';

const CommunityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [community, setCommunity] = useState(null);
  const [activeTab, setActiveTab] = useState('media');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    const fetchCommunity = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Please log in to view this community');
        navigate('/login');
        return;
      }

      if (!id) {
        console.error('No community ID provided');
        setError('Invalid community ID');
        setLoading(false);
        return;
      }

      try {
        const [communityResponse, profileResponse] = await Promise.all([
          axios.get(`http://localhost:8000/api/communities/${id}/`, {
            headers: {
              'Authorization': `Token ${token}`,
              'Content-Type': 'application/json'
            }
          }),
          axios.get('http://localhost:8000/api/profile/', {
            headers: {
              'Authorization': `Token ${token}`,
              'Content-Type': 'application/json'
            }
          })
        ]);

        setCommunity(communityResponse.data);
        // Check if the logged-in user is the creator
        setIsCreator(communityResponse.data.created_by.id === profileResponse.data.id);
        setLoading(false);
      } catch (error) {
        console.error('Error:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
        setError('Failed to fetch community');
        setLoading(false);
      }
    };

    fetchCommunity();
  }, [id, navigate]);

  // Debug log to see what we're passing
  console.log('Community creator:', community?.created_by);

  if (loading) return <div>Loading community...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!community) return <div>Community not found</div>;

  return (
    <div className="community-detail">
      <h1>{community.name}</h1>
      <p>{community.description}</p>
      {community.banner_image && (
        <img 
          src={community.banner_image} 
          alt={`${community.name} banner`}
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      )}
      <div className="community-meta">
        <p>Created by: {community.created_by?.username}</p>
        <p>Created at: {new Date(community.created_at).toLocaleDateString()}</p>
      </div>

      {/* Navigation for different sections */}
      <div className="section-nav">
        <button 
          onClick={() => setActiveTab('media')}
          className={activeTab === 'media' ? 'active' : ''}
        >
          Media Gallery
        </button>
        <button 
          onClick={() => setActiveTab('resources')}
          className={activeTab === 'resources' ? 'active' : ''}
        >
          Resources
        </button>
        <button 
          onClick={() => setActiveTab('forum')}
          className={activeTab === 'forum' ? 'active' : ''}
        >
          Forum
        </button>
      </div>

      {/* Content sections */}
      <div className="section-content">
        {activeTab === 'media' && <MediaGallery communityId={id} isCreator={isCreator} />}
        {activeTab === 'resources' && <Resources communityId={id} />}
        {activeTab === 'forum' && <CommunityForum communityId={id} />}
      </div>

      <style jsx>{`
        .community-detail {
          padding: 20px;
        }
        
        .section-nav {
          display: flex;
          gap: 1rem;
          margin: 2rem 0;
        }
        
        .section-nav button {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          background-color: #f0f0f0;
        }
        
        .section-nav button.active {
          background-color: #007bff;
          color: white;
        }
        
        .section-content {
          margin-top: 2rem;
          padding: 20px;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
};

export default CommunityDetail; 

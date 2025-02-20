import React, { useState, useEffect } from 'react';
import api from '../../api';
import { getFullImageUrl } from '../../utils/imageUtils';

const AnnouncementsDashboard = ({ communityId, isLoggedIn }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [community, setCommunity] = useState(null);
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCreator, setIsCreator] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      } : {
        'Content-Type': 'application/json'
      };
      
      const response = await api.get(`/communities/${communityId}/announcements/`, { headers });
      
      if (Array.isArray(response.data)) {
        setAnnouncements(response.data);
        setError(null);
      } else {
        console.error('Received non-array data:', response.data);
        setError('Invalid data format received');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setError('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (communityId) {
      console.log('Component mounted with communityId:', communityId);
      fetchCommunityData();
      fetchAnnouncements();
    }
  }, [communityId]);

  const fetchCommunityData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      } : {
        'Content-Type': 'application/json'
      };
      
      const response = await api.get(`/communities/${communityId}/`, { headers });
      
      const communityData = {
        ...response.data,
        banner_image: response.data.banner_image ? 
          (response.data.banner_image.startsWith('http') ? 
            response.data.banner_image : 
            getFullImageUrl(response.data.banner_image)) 
          : null
      };
      
      setCommunity(communityData);
      // Check if current user is creator
      const currentUser = response.data.current_username;
      const communityCreator = response.data.creator_name;
      setIsCreator(currentUser === communityCreator);
    } catch (err) {
      console.error('Error fetching community:', err);
      setError('Failed to load community data');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newAnnouncement.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await api.post(
        `/communities/${communityId}/announcements/`,
        { content: newAnnouncement },
        {
          headers: { 
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );
      
      setNewAnnouncement('');
      setError(null);
      // Refresh announcements after posting
      fetchAnnouncements();
    } catch (err) {
      console.error('Error creating announcement:', err);
      setError('Failed to create announcement. Please try again later.');
    }
  };

  return (
    <div style={{
      padding: '1rem',
      background: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      width: '100%',
      maxWidth: '100%',
      marginBottom: '1rem'
    }}>
      <h2 style={{ marginTop: 0 }}>Announcements</h2>
      
      {isCreator && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
          <textarea
            value={newAnnouncement}
            onChange={(e) => setNewAnnouncement(e.target.value)}
            placeholder="Write a new announcement..."
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '0.5rem',
              marginBottom: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              resize: 'vertical'
            }}
          />
          <button 
            type="submit" 
            style={{
              backgroundColor: '#ff6b6b',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Post Announcement
          </button>
        </form>
      )}

      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {loading ? (
          <p>Loading announcements...</p>
        ) : error ? (
          <p style={{ color: '#ff0000', padding: '0.5rem' }}>{error}</p>
        ) : announcements.length === 0 ? (
          <p>No announcements yet.</p>
        ) : (
          announcements.map(announcement => (
            <div 
              key={announcement.id} 
              style={{
                padding: '1rem',
                borderBottom: '1px solid #eee'
              }}
            >
              <p style={{ margin: '0 0 0.5rem 0', whiteSpace: 'pre-wrap' }}>
                {announcement.content}
              </p>
              <small style={{ color: '#666', fontSize: '0.85rem' }}>
                Posted by {announcement.created_by?.username} on {new Date(announcement.created_at).toLocaleDateString()}
              </small>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AnnouncementsDashboard; 
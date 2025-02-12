import React, { useState, useEffect } from 'react';
import api from '../../api';
import { getFullImageUrl } from '../../utils/imageUtils';

const AnnouncementsDashboard = ({ communityId }) => {
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
      
      // First, let's log the request we're about to make
      console.log('About to fetch announcements:', {
        url: `communities/${communityId}/announcements/`,
        token: token ? 'present' : 'missing'
      });

      const response = await api.get(`communities/${communityId}/announcements/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Let's log EXACTLY what we get back
      console.log('API Response:', {
        fullResponse: response,
        data: response.data,
        keys: response.data ? Object.keys(response.data) : null,
        type: typeof response.data
      });

      // If we're getting a user object, let's see what it looks like
      if (response.data && response.data.id && response.data.username) {
        console.error('Received user object instead of announcements:', response.data);
        setError('Received incorrect data type');
        return;
      }

      // Only set announcements if we get an array
      if (Array.isArray(response.data)) {
        setAnnouncements(response.data);
        setError(null);
      } else {
        console.error('Received non-array data:', response.data);
        setError('Invalid data format received');
      }
    } catch (err) {
      console.error('Fetch error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
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
      const response = await api.get(`/communities/${communityId}/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
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
    <div className="announcements-dashboard">
      <h2>Announcements</h2>
      
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          {isCreator && (
            <form onSubmit={handleSubmit}>
              <textarea
                value={newAnnouncement}
                onChange={(e) => setNewAnnouncement(e.target.value)}
                placeholder="Write a new announcement..."
              />
              <button type="submit">Post Announcement</button>
            </form>
          )}
          
          <div className="announcements-list">
            {Array.isArray(announcements) && announcements.length > 0 ? (
              announcements.map((announcement) => {
                // Debug log for each announcement
                console.log('Rendering announcement:', announcement);
                
                return (
                  <div key={announcement.id || Math.random()} className="announcement">
                    {typeof announcement === 'object' ? (
                      <>
                        <p>{announcement.content || 'No content'}</p>
                        {announcement.created_at && (
                          <small>{new Date(announcement.created_at).toLocaleDateString()}</small>
                        )}
                      </>
                    ) : (
                      <p>Invalid announcement format</p>
                    )}
                  </div>
                );
              })
            ) : (
              <p>No announcements yet.</p>
            )}
          </div>
          
          {error && <div className="error-message">{error}</div>}
        </>
      )}
    </div>
  );
};

export default AnnouncementsDashboard; 
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
      
      console.log('Fetching announcements for community:', communityId);
      
      const response = await api.get(`/communities/${communityId}/announcements/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Log the raw response for debugging
      console.log('Announcements response:', {
        status: response.status,
        data: response.data,
        isArray: Array.isArray(response.data)
      });

      // Ensure we're setting an array
      const announcementsList = Array.isArray(response.data) ? response.data : [];
      setAnnouncements(announcementsList);
      setError(null);
    } catch (err) {
      console.error('Announcement fetch error:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      });
      setError('Failed to load announcements');
      setAnnouncements([]); // Reset to empty array on error
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
                  <div key={announcement.id || 'unknown'} className="announcement">
                    <p>{typeof announcement === 'object' ? announcement.content : 'Invalid announcement'}</p>
                    {announcement.created_at && (
                      <small>{new Date(announcement.created_at).toLocaleDateString()}</small>
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
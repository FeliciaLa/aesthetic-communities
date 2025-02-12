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
      const token = localStorage.getItem('token');
      const response = await api.get(`/communities/${communityId}/announcements/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      
      // Debug the response structure
      console.log('Raw announcements response:', response);
      
      // Handle different response structures
      let announcementData;
      if (response.data && typeof response.data === 'object') {
        // If response.data is an object with an announcements property
        announcementData = response.data.announcements || response.data;
      } else {
        // If response.data is the array directly
        announcementData = response.data;
      }
      
      // Ensure we're working with an array
      const announcements = Array.isArray(announcementData) ? announcementData : [];
      console.log('Processed announcements:', announcements);
      
      setAnnouncements(announcements);
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('Detailed error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError('Failed to load announcements');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (communityId) {
      fetchCommunityData();
      fetchAnnouncements();
    }
  }, [communityId]); // Only depend on communityId

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
              announcements.map((announcement) => (
                <div key={announcement.id} className="announcement">
                  <p>{announcement.content || ''}</p>
                  <small>
                    {announcement.created_at ? 
                      new Date(announcement.created_at).toLocaleDateString() : 
                      'No date'}
                  </small>
                  <small>
                    {announcement.created_by?.username || 'Unknown user'}
                  </small>
                </div>
              ))
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
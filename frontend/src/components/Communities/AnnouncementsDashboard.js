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
    <div className="announcements-dashboard">
      <div className="announcements-container">
        <h2>Announcements</h2>
        
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            {isCreator && (
              <form onSubmit={handleSubmit} className="announcement-form">
                <textarea
                  value={newAnnouncement}
                  onChange={(e) => setNewAnnouncement(e.target.value)}
                  placeholder="Write a new announcement..."
                  className="announcement-input"
                />
                <button type="submit" className="post-announcement-btn">
                  Post Announcement
                </button>
              </form>
            )}
            
            <div className="announcements-list">
              {Array.isArray(announcements) && announcements.length > 0 ? (
                announcements.map((announcement) => (
                  <div key={announcement.id || Math.random()} className="announcement-card">
                    <div className="announcement-content">
                      {announcement.content || 'No content'}
                    </div>
                    {announcement.created_at && (
                      <div className="announcement-date">
                        {new Date(announcement.created_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="no-announcements">No announcements yet.</p>
              )}
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .announcements-dashboard {
          padding: 0;
          width: 100%;
        }

        .announcements-container {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          border: 1px solid #eee;
          width: 100%;
        }

        h2 {
          font-size: 1.75rem;
          color: #2c3e50;
          margin: 0 0 20px 0;
          font-weight: 600;
        }

        .announcement-form {
          margin-bottom: 20px;
          width: 100%;
        }

        .announcement-input {
          width: 100%;
          min-height: 100px;
          padding: 16px;
          border: 1px solid #ddd;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 15px;
          resize: vertical;
          box-sizing: border-box;
        }

        .post-announcement-btn {
          background: #fa8072;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 15px;
          transition: all 0.2s ease;
        }

        .post-announcement-btn:hover {
          background: #ff9288;
          transform: translateY(-1px);
        }

        .announcements-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .announcement-card {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          border: 1px solid #eee;
          transition: transform 0.2s ease;
        }

        .announcement-card:hover {
          transform: translateY(-2px);
        }

        .announcement-content {
          color: #334155;
          line-height: 1.6;
          font-size: 15px;
          margin-bottom: 12px;
        }

        .announcement-date {
          color: #94a3b8;
          font-size: 13px;
        }

        .no-announcements {
          color: #94a3b8;
          text-align: center;
          padding: 32px;
          font-size: 15px;
        }

        .loading {
          text-align: center;
          padding: 32px;
          color: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default AnnouncementsDashboard; 
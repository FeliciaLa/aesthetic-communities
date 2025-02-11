import React, { useState, useEffect } from 'react';
import api from '../../api';
import { DEFAULT_AVATAR } from './CommunityFeed';

const AnnouncementsDashboard = ({ communityId }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [isCreator, setIsCreator] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnnouncements();
    checkIsCreator();
  }, [communityId]);

  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching announcements for community:', communityId);
      const response = await api.get(`/api/communities/${communityId}/announcements/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('Announcements response:', response.data);
      setAnnouncements(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching announcements:', err.response?.data || err);
      setError('Failed to load announcements. Please try again later.');
    }
  };

  const checkIsCreator = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Checking creator status for community:', communityId);
      const response = await api.get(`/api/communities/${communityId}/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const currentUser = response.data.current_username;
      const communityCreator = response.data.creator_name;
      console.log('Creator check:', { currentUser, communityCreator });
      setIsCreator(currentUser === communityCreator);
      setError(null);
    } catch (err) {
      console.error('Error checking creator status:', err.response?.data || err);
      setError('Failed to verify creator status. Please try again later.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newAnnouncement.trim()) return;

    try {
      const token = localStorage.getItem('token');
      console.log('Sending announcement:', { content: newAnnouncement });
      const response = await api.post(
        `/api/communities/${communityId}/announcements/`,
        { content: newAnnouncement },
        {
          headers: { 
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('Announcement response:', response.data);
      setNewAnnouncement('');
      setError(null);
      fetchAnnouncements();
    } catch (err) {
      console.error('Error creating announcement:', err.response?.data);
      setError('Failed to create announcement. Please try again later.');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="announcements-dashboard">
      <h2>Announcements</h2>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {isCreator && (
        <form onSubmit={handleSubmit} className="announcement-form">
          <textarea
            value={newAnnouncement}
            onChange={(e) => setNewAnnouncement(e.target.value)}
            placeholder="Write a new announcement..."
            required
          />
          <button type="submit" disabled={!newAnnouncement.trim()}>
            Post Announcement
          </button>
        </form>
      )}

      <div className="announcements-list">
        {announcements.length === 0 ? (
          <p className="no-announcements">No announcements yet.</p>
        ) : (
          announcements.map((announcement) => (
            <div key={announcement.id} className="announcement">
              <div className="announcement-content">
                {announcement.content}
              </div>
              <div className="announcement-meta">
                <span className="announcement-author">
                  Posted by {announcement.created_by}
                </span>
                <span className="announcement-date">
                  {formatDate(announcement.created_at)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .announcements-dashboard {
          padding-right: 80px;
          padding-left: 20px;
          background: white;
          border-radius: 12px;
          padding: 0px;
          margin: 20;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          height: 400px;
          overflow-y: auto;
          width: 100%;
          box-sizing: border-box;
        }

        h2 {
          margin: 0;
          color: #333;
        }

        .announcement-form {
          margin-bottom: 20px;
        }

        .announcement-input {
          width: calc(100% - 24px);
          padding: 12px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          margin-bottom: 10px;
          resize: vertical;
          min-height: 80px;
        }

        .post-button {
          padding: 8px 16px;
          background-color: #ff6b6b;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .post-button:hover {
          background-color: #ff5252;
        }

        .announcement-item {
          padding: 10px;
          border-bottom: 1px solid #eee;
        }

        .announcement-header {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
        }

        .avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          margin-right: 8px;
        }

        .announcement-meta {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .username {
          font-weight: 500;
          font-size: 0.9em;
        }

        .timestamp {
          font-size: 0.8em;
          color: #666;
        }

        .announcement-content {
          color: #333;
          line-height: 1.4;
          font-size: 0.9em;
        }
      `}</style>
    </div>
  );
};

export default AnnouncementsDashboard; 
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DEFAULT_AVATAR } from './CommunityFeed';

const AnnouncementsDashboard = ({ communityId }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
    checkIsCreator();
  }, [communityId]);

  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:8000/api/communities/${communityId}/announcements/`,
        {
          headers: { 'Authorization': `Token ${token}` }
        }
      );
      setAnnouncements(response.data);
    } catch (err) {
      console.error('Error fetching announcements:', err);
    }
  };

  const checkIsCreator = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:8000/api/communities/${communityId}/`,
        {
          headers: { 'Authorization': `Token ${token}` }
        }
      );
      setIsCreator(response.data.is_creator);
    } catch (err) {
      console.error('Error checking creator status:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newAnnouncement.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:8000/api/communities/${communityId}/announcements/`,
        { content: newAnnouncement },
        {
          headers: { 
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setNewAnnouncement('');
      fetchAnnouncements();
    } catch (err) {
      console.error('Error creating announcement:', err.response?.data);
    }
  };

  return (
    <div className="announcements-dashboard">
      <div className="section-header">
        <h3>Announcements</h3>
      </div>
      
      {isCreator && (
        <form onSubmit={handleSubmit} className="announcement-form">
          <textarea
            placeholder="Create a new announcement..."
            value={newAnnouncement}
            onChange={(e) => setNewAnnouncement(e.target.value)}
          />
          <button type="submit">Post Announcement</button>
        </form>
      )}

      <div className="announcements-list">
        {announcements.map(announcement => (
          <div key={announcement.id} className="announcement-item">
            <div className="announcement-header">
              <img 
                src={announcement.created_by?.avatar || DEFAULT_AVATAR} 
                alt="avatar" 
                className="avatar"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = DEFAULT_AVATAR;
                }}
              />
              <div className="announcement-meta">
                <span className="username">{announcement.created_by?.username}</span>
                <span className="timestamp">
                  {new Date(announcement.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="announcement-content">
              {announcement.content}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .announcements-dashboard {
          background: white;
          border-radius: 8px;
          padding: 20px;
          margin: 4rem 2rem 20px 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          max-height: 300px;
          overflow-y: auto;
          width: 20%;
          min-width: 250px;
          flex-shrink: 0;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        h3 {
          margin: 0;
          color: #333;
        }

        .announcement-form {
          margin-bottom: 20px;
        }

        .announcement-form textarea {
          width: calc(100% - 20px);
          min-height: 40px;
          max-height: 80px;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          margin: 0 10px 10px 10px;
          resize: vertical;
        }

        .announcement-form button {
          background: #1DB954;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
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
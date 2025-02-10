import React, { useState, useEffect } from 'react';
import api from '../../api';
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
      const response = await api.get(`/communities/${communityId}/announcements/`);
      setAnnouncements(response.data);
    } catch (err) {
      console.error('Error fetching announcements:', err);
    }
  };

  const checkIsCreator = async () => {
    try {
      const response = await api.get(`/communities/${communityId}/`);
      const currentUser = response.data.current_username;
      const communityCreator = response.data.creator_name;
      setIsCreator(currentUser === communityCreator);
      console.log('Creator check:', {
        currentUser,
        communityCreator,
        isCreator: currentUser === communityCreator
      });
    } catch (err) {
      console.error('Error checking creator status:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newAnnouncement.trim()) return;

    try {
      console.log('Sending announcement:', { content: newAnnouncement });
      const response = await api.post(
        `/communities/${communityId}/announcements/`,
        { content: newAnnouncement },
        {
          headers: { 
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('Announcement response:', response.data);
      setNewAnnouncement('');
      fetchAnnouncements();
    } catch (err) {
      console.error('Error creating announcement:', err.response?.data);
      console.error('Full error:', err);
    }
  };

  return (
    <div className="announcements-dashboard">
      <h2>Announcements</h2>
      {isCreator && (
        <div className="announcement-form">
          <textarea
            value={newAnnouncement}
            onChange={(e) => setNewAnnouncement(e.target.value)}
            placeholder="Create a new announcement..."
            className="announcement-input"
          />
          <button 
            onClick={handleSubmit}
            className="post-button"
          >
            Post Announcement
          </button>
        </div>
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
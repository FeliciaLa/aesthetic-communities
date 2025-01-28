import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DEFAULT_AVATAR = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';

const REACTIONS = [
  { type: 'like', emoji: '👍' },
  { type: 'heart', emoji: '❤️' },
  { type: 'funny', emoji: '😂' },
  { type: 'wow', emoji: '😮' },
  { type: 'sad', emoji: '😢' },
  { type: 'angry', emoji: '😠' }
];

const CommunityFeed = ({ communityId }) => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState({});

  useEffect(() => {
    fetchPosts();
  }, [communityId]);

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:8000/api/communities/${communityId}/forum/posts/`,
        {
          headers: { 'Authorization': `Token ${token}` }
        }
      );
      setPosts(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error:', err.response?.data || err);
      setError('Failed to load posts');
      setLoading(false);
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    console.log('newPost:', newPost);
    console.log('mediaFile:', mediaFile);

    if (!newPost.trim() && !mediaFile) return;

    const formData = new FormData();
    formData.append('content', newPost);
    formData.append('community', communityId);
    if (mediaFile) {
        formData.append('media', mediaFile);
    }

    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(
            `http://localhost:8000/api/resources/categories/`,
            {
                ...formData,
                community_id: communityId
            },
            {
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            }
        );
        console.log('Response:', response.data);
        setNewPost('');
        setMediaFile(null);
        fetchPosts();
    } catch (err) {
        console.error('Error response:', err.response?.data);
        console.error('Full error:', err);
        setError('Failed to create post');
    }
  };

  const handleLike = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:8000/api/forum/posts/${postId}/like/`,
        {},
        {
          headers: { 'Authorization': `Token ${token}` }
        }
      );
      fetchPosts();
    } catch (err) {
      setError('Failed to like post');
    }
  };

  const handleReaction = async (postId, reactionType) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:8000/api/forum/posts/${postId}/react/`,
        { reaction_type: reactionType },
        {
          headers: { 'Authorization': `Token ${token}` }
        }
      );
      fetchPosts();
    } catch (err) {
      setError('Failed to add reaction');
    }
  };

  const handleCommentSubmit = async (postId) => {
    try {
      const comment = comments[postId];
      if (!comment?.trim()) return;

      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:8000/api/forum/posts/${postId}/comments/`,
        { content: comment },
        {
          headers: { 'Authorization': `Token ${token}` }
        }
      );
      
      // Clear the comment input and refresh posts
      setComments(prev => ({ ...prev, [postId]: '' }));
      fetchPosts();
    } catch (err) {
      setError('Failed to add comment');
    }
  };

  return (
    <div className="feed-container">
      <div className="feed-content">
        <div className="feed-header">
          <h2>Community Feed</h2>
        </div>
        
        {/* Post Creation Form */}
        <div className="post-form">
          <form onSubmit={handlePostSubmit}>
            <textarea
              placeholder="What's on your mind?"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
            />
            <div className="form-actions">
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => setMediaFile(e.target.files[0])}
              />
              <button type="submit">Post</button>
            </div>
          </form>
        </div>

        {/* Posts Feed */}
        <div className="posts-feed">
          {posts.map(post => (
            <div key={post.id} className="post">
              <div className="post-header">
                <img 
                  src={post.created_by.avatar || DEFAULT_AVATAR} 
                  alt="avatar" 
                  className="avatar"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = DEFAULT_AVATAR;
                  }}
                />
                <div className="post-meta">
                  <span className="username">{post.created_by.username}</span>
                  <span className="timestamp">
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div className="post-content">
                {post.content}
              </div>
              
              {post.media && post.media_type === 'image' && (
                <div className="post-media">
                  <img src={post.media} alt="Post media" />
                </div>
              )}

              <div className="post-actions">
                <div className="reactions-wrapper">
                  {REACTIONS.map(({ type, emoji }) => (
                    <button 
                      key={type}
                      onClick={() => handleReaction(post.id, type)}
                      className={`reaction-button ${post.user_reactions.includes(type) ? 'active' : ''}`}
                    >
                      <span className="emoji">{emoji}</span>
                      <span className="count">{post.reactions_count[type] || 0}</span>
                    </button>
                  ))}
                </div>
                <div className="comments-section">
                  {post.comments.map(comment => (
                    <div key={comment.id} className="comment">
                      <img 
                        src={comment.created_by.avatar || DEFAULT_AVATAR} 
                        alt="avatar" 
                        className="comment-avatar"
                      />
                      <div className="comment-content">
                        <div className="comment-header">
                          <span className="comment-username">{comment.created_by.username}</span>
                          <span className="comment-timestamp">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p>{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <form 
                className="comment-form" 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCommentSubmit(post.id);
                }}
              >
                <input
                  type="text"
                  className="comment-input"
                  placeholder="Write a comment..."
                  value={comments[post.id] || ''}
                  onChange={(e) => setComments(prev => ({
                    ...prev,
                    [post.id]: e.target.value
                  }))}
                />
                <button type="submit" className="comment-submit">
                  ⇧
                </button>
              </form>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .feed-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .feed-content {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .feed-header {
          padding: 1.5rem;
          border-bottom: 1px solid #eee;
        }

        .feed-header h2 {
          margin: 0;
          font-size: 1.5rem;
          color: #333;
        }

        .post-form {
          padding: 1.5rem;
          border-bottom: 1px solid #eee;
        }

        .posts-feed {
          padding: 1.5rem;
        }

        .post {
          background: white;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .post-content {
          margin: 10px 0;
        }

        .post-media {
          margin: 10px -15px;
          position: relative;
          width: calc(100% + 30px);
          max-height: 500px;
          overflow: hidden;
        }

        .post-media img {
          width: 100%;
          height: auto;
          object-fit: cover;
          display: block;
        }

        .post-header {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
        }

        .post-meta {
          display: flex;
          flex-direction: column;
        }

        .username {
          font-weight: 600;
          color: #333;
        }

        .timestamp {
          font-size: 0.8em;
          color: #666;
        }

        textarea {
          width: 100%;
          min-height: 100px;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          margin-bottom: 10px;
          resize: vertical;
        }

        .form-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        button {
          padding: 8px 16px;
          background: #0061ff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        button:hover {
          background: #0056e0;
        }

        input[type="file"] {
          max-width: 200px;
        }

        /* Custom scrollbar */
        .posts-feed::-webkit-scrollbar {
          width: 8px;
        }

        .posts-feed::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }

        .posts-feed::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }

        .posts-feed::-webkit-scrollbar-thumb:hover {
          background: #555;
        }

        .reactions-wrapper {
          display: flex;
          gap: 4px;
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }

        .reaction-button {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          border: 1px solid #e0e0e0;
          border-radius: 20px;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.9rem;
        }

        .reaction-button:hover {
          background: #f5f5f5;
          transform: translateY(-1px);
        }

        .reaction-button.active {
          background: #e3f2fd;
          border-color: #2196f3;
          color: #1976d2;
        }

        .emoji {
          font-size: 1.2em;
        }

        .count {
          font-size: 0.9em;
          color: #666;
          min-width: 15px;
        }

        .comments-section {
          margin-top: 12px;
          padding-top: 12px;
        }

        .comment-form {
          display: flex;
          gap: 8px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #eee;
          align-items: center;
        }

        .comment-input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 20px;
          font-size: 0.9rem;
        }

        .comment-input:focus {
          outline: none;
          border-color: #2196f3;
          box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
        }

        .comment-submit {
          padding: 8px 12px;
          background: #2196f3;
          color: white;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          font-size: 1.2rem;
          transition: all 0.2s ease;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          font-weight: bold;
        }

        .comment-submit:hover {
          background: #1976d2;
          transform: translateY(-2px);
        }

        .comment {
          display: flex;
          gap: 12px;
          padding: 12px;
          border-radius: 8px;
          background: #f8f9fa;
          margin-bottom: 8px;
        }

        .comment-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
        }

        .comment-content {
          flex: 1;
        }

        .comment-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
        }

        .comment-username {
          font-weight: 600;
          color: #333;
        }

        .comment-timestamp {
          font-size: 0.8em;
          color: #666;
        }
      `}</style>
    </div>
  );
};

export default CommunityFeed; 
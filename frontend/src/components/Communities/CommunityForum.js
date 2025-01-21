import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CommunityForum = ({ communityId }) => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [activePost, setActivePost] = useState(null);

  useEffect(() => {
    fetchPosts();
  }, [communityId]);

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:8000/api/communities/${communityId}/forum/`,
        {
          headers: {
            'Authorization': `Token ${token}`
          }
        }
      );
      setPosts(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load forum posts');
      setLoading(false);
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:8000/api/communities/${communityId}/forum/`,
        newPost,
        {
          headers: {
            'Authorization': `Token ${token}`
          }
        }
      );
      setNewPost({ title: '', content: '' });
      fetchPosts();
    } catch (err) {
      setError('Failed to create post');
    }
  };

  const handleCommentSubmit = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:8000/api/forum/posts/${postId}/comments/`,
        { content: newComment },
        {
          headers: {
            'Authorization': `Token ${token}`
          }
        }
      );
      setNewComment('');
      fetchPosts();
    } catch (err) {
      setError('Failed to add comment');
    }
  };

  if (loading) return <div>Loading forum...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="forum-container">
      <h3>Community Forum</h3>
      
      {/* New Post Form */}
      <div className="new-post-form">
        <h4>Create New Post</h4>
        <form onSubmit={handlePostSubmit}>
          <input
            type="text"
            placeholder="Post Title"
            value={newPost.title}
            onChange={(e) => setNewPost({...newPost, title: e.target.value})}
            required
          />
          <textarea
            placeholder="Post Content"
            value={newPost.content}
            onChange={(e) => setNewPost({...newPost, content: e.target.value})}
            required
          />
          <button type="submit">Create Post</button>
        </form>
      </div>

      {/* Posts List */}
      <div className="posts-list">
        {posts.length === 0 ? (
          <p>No posts yet. Be the first to create a post!</p>
        ) : (
          posts.map(post => (
            <div key={post.id} className="forum-post">
              <h4>{post.title}</h4>
              <p>{post.content}</p>
              <small>Posted by {post.created_by.username} on {new Date(post.created_at).toLocaleDateString()}</small>
              
              {/* Comments Section */}
              <div className="comments-section">
                <h5>Comments</h5>
                {post.comments.length === 0 ? (
                  <p>No comments yet. Be the first to comment!</p>
                ) : (
                  post.comments.map(comment => (
                    <div key={comment.id} className="comment">
                      <p>{comment.content}</p>
                      <small>By {comment.created_by.username} on {new Date(comment.created_at).toLocaleDateString()}</small>
                    </div>
                  ))
                )}
                
                {/* New Comment Form */}
                <div className="new-comment-form">
                  <textarea
                    placeholder="Add a comment..."
                    value={activePost === post.id ? newComment : ''}
                    onChange={(e) => {
                      setNewComment(e.target.value);
                      setActivePost(post.id);
                    }}
                  />
                  <button onClick={() => handleCommentSubmit(post.id)}>Add Comment</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .forum-container {
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }
        
        .new-post-form, .forum-post {
          margin-bottom: 20px;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background-color: white;
        }
        
        input, textarea {
          width: 100%;
          margin-bottom: 10px;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
        
        textarea {
          min-height: 100px;
          resize: vertical;
        }
        
        .comments-section {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid #eee;
        }
        
        .comment {
          margin: 10px 0;
          padding: 10px;
          background-color: #f9f9f9;
          border-radius: 4px;
        }
        
        button {
          padding: 8px 16px;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        
        button:hover {
          background-color: #0056b3;
        }

        .error-message {
          color: red;
          padding: 10px;
          margin: 10px 0;
          border: 1px solid red;
          border-radius: 4px;
          background-color: #fff5f5;
        }

        h3 {
          margin-bottom: 20px;
          color: #333;
        }

        h4 {
          margin: 0 0 15px 0;
          color: #444;
        }

        small {
          color: #666;
          display: block;
          margin: 5px 0;
        }

        .new-comment-form {
          margin-top: 15px;
        }

        .new-comment-form textarea {
          min-height: 60px;
        }
      `}</style>
    </div>
  );
};

export default CommunityForum; 
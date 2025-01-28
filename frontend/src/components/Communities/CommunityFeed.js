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
  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [newContent, setNewContent] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState({});
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    fetchPosts();
    fetchQuestions();
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

  const fetchQuestions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:8000/api/communities/${communityId}/forum/questions/`,
        {
          headers: { 'Authorization': `Token ${token}` }
        }
      );
      setQuestions(response.data);
    } catch (err) {
      console.error('Error:', err.response?.data || err);
      setError('Failed to load questions');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newContent.trim() && !mediaFile) return;

    const formData = new FormData();
    formData.append('content', newContent);
    formData.append('community', communityId);
    if (mediaFile) {
        formData.append('media', mediaFile);
    }

    try {
        const token = localStorage.getItem('token');
        const endpoint = activeTab === 'questions' 
            ? `http://localhost:8000/api/communities/${communityId}/forum/questions/`
            : `http://localhost:8000/api/communities/${communityId}/forum/posts/`;

        const response = await axios.post(
            endpoint,
            formData,
            {
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            }
        );

        // Clear form and refresh
        setNewContent('');
        setMediaFile(null);
        if (activeTab === 'questions') {
            fetchQuestions();
        } else {
            fetchPosts();
        }
    } catch (err) {
        console.error('Error response:', err.response?.data);
        setError(`Failed to create ${activeTab === 'questions' ? 'question' : 'post'}`);
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

  const handleAnswerVote = async (answerId, voteType) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:8000/api/answers/${answerId}/vote/`,
        { vote_type: voteType },
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Refresh questions to get updated votes
      fetchQuestions();
    } catch (err) {
      console.error('Error voting:', err);
      setError('Failed to register vote');
    }
  };

  const handleAnswerSubmit = async (questionId) => {
    try {
      const answer = answers[questionId];
      if (!answer?.trim()) return;

      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:8000/api/questions/${questionId}/answers/`,
        { content: answer },
        {
          headers: { 'Authorization': `Token ${token}` }
        }
      );
      
      // Clear the answer input and refresh questions
      setAnswers(prev => ({ ...prev, [questionId]: '' }));
      fetchQuestions();
    } catch (err) {
      setError('Failed to add answer');
    }
  };

  const handleQuestionVote = async (questionId, voteType) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:8000/api/questions/${questionId}/vote/`,
        { vote_type: voteType },
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Refresh questions to get updated votes
      fetchQuestions();
    } catch (err) {
      console.error('Error voting:', err);
      setError('Failed to register vote');
    }
  };

  return (
    <div className="feed-container">
      <div className="feed-content">
        <div className="feed-header">
          <h2>Community Feed</h2>
          <div className="feed-tabs">
            <button 
              className={`tab-button ${activeTab === 'posts' ? 'active' : ''}`}
              onClick={() => setActiveTab('posts')}
            >
              Posts
            </button>
            <button 
              className={`tab-button ${activeTab === 'questions' ? 'active' : ''}`}
              onClick={() => setActiveTab('questions')}
            >
              Questions
            </button>
          </div>
        </div>
        
        <div className="post-form">
          <form onSubmit={handleSubmit}>
            <textarea
              placeholder={activeTab === 'questions' 
                ? "Ask a question..." 
                : "What's on your mind?"
              }
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
            />
            <div className="form-actions">
              <div className="media-upload">
                <label htmlFor="media-input" className="media-button" title="Add media">
                  <i className="fas fa-image"></i>
                </label>
                <input
                  id="media-input"
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    setMediaFile(file);
                  }}
                  style={{ display: 'none' }}
                />
              </div>
              {mediaFile && (
                <div className="media-preview">
                  {mediaFile.type.startsWith('image/') ? (
                    <img 
                      src={URL.createObjectURL(mediaFile)} 
                      alt="Preview" 
                    />
                  ) : (
                    <video src={URL.createObjectURL(mediaFile)} controls />
                  )}
                  <button 
                    type="button" 
                    className="remove-media"
                    onClick={() => setMediaFile(null)}
                  >
                    ×
                  </button>
                </div>
              )}
              <button type="submit">
                {activeTab === 'questions' ? 'Ask Question' : 'Post'}
              </button>
            </div>
          </form>
        </div>

        <div className="feed-content">
          {activeTab === 'posts' ? (
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
          ) : (
            <div className="questions-feed">
              {questions.map(question => (
                <div key={question.id} className="question-card">
                  <div className="vote-section">
                    <button 
                      onClick={() => handleQuestionVote(question.id, 'up')}
                      className={`vote-button ${question.user_vote === 'up' ? 'active' : ''}`}
                    >
                      ▲
                    </button>
                    <span className="vote-count">{question.votes}</span>
                    <button 
                      onClick={() => handleQuestionVote(question.id, 'down')}
                      className={`vote-button ${question.user_vote === 'down' ? 'active' : ''}`}
                    >
                      ▼
                    </button>
                  </div>
                  <div className="question-content">
                    <div className="question-header">
                      <img 
                        src={question.created_by.avatar || DEFAULT_AVATAR} 
                        alt="avatar" 
                        className="avatar"
                      />
                      <div className="question-meta">
                        <span className="username">{question.created_by.username}</span>
                        <span className="timestamp">
                          {new Date(question.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <p>{question.content}</p>
                    {question.media && (
                      <div className="question-media">
                        <img src={question.media} alt="Question media" />
                      </div>
                    )}
                    
                    {/* Answers Section */}
                    <div className="answers-section">
                      <h4>Answers ({question.answers?.length || 0})</h4>
                      {question.answers?.map(answer => (
                        <div key={answer.id} className="answer">
                          <div className="vote-buttons">
                            <button 
                              onClick={() => handleAnswerVote(answer.id, 'up')}
                              className={answer.user_vote === 'up' ? 'active' : ''}
                            >
                              ▲
                            </button>
                            <span>{answer.votes}</span>
                            <button 
                              onClick={() => handleAnswerVote(answer.id, 'down')}
                              className={answer.user_vote === 'down' ? 'active' : ''}
                            >
                              ▼
                            </button>
                          </div>
                          <div className="answer-content">
                            <div className="answer-header">
                              <span className="username">{answer.created_by.username}</span>
                              <span className="timestamp">
                                {new Date(answer.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p>{answer.content}</p>
                          </div>
                        </div>
                      ))}
                      
                      {/* Answer Form */}
                      <form 
                        className="answer-form"
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleAnswerSubmit(question.id);
                        }}
                      >
                        <textarea
                          placeholder="Write your answer..."
                          value={answers[question.id] || ''}
                          onChange={(e) => setAnswers(prev => ({
                            ...prev,
                            [question.id]: e.target.value
                          }))}
                        />
                        <button type="submit">Submit Answer</button>
                      </form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .feed-container {
          background: white;
          border: 1px solid #e1e1e1;
          border-radius: 12px;
          height: calc(100vh - 300px);
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .feed-content {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }

        .post, .question-card {
          padding: 16px;
          border-bottom: 1px solid #eee;
          margin-bottom: 16px;
        }

        .post-header, .question-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }

        .avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
        }

        .post-content, .question-content {
          font-size: 0.95rem;
          line-height: 1.5;
          margin-bottom: 12px;
        }

        .post-media img, 
        .question-media img,
        .media-preview img,
        .media-preview video {
          max-height: 250px;
          width: auto;
          max-width: 100%;
          object-fit: contain;
          border-radius: 8px;
        }

        .post-form {
          padding: 16px;
          border-bottom: 1px solid #eee;
        }

        .post-form textarea {
          max-height: 120px;
          min-height: 60px;
          font-size: 0.95rem;
        }

        .answers-section {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #eee;
        }

        .answer {
          padding: 8px;
          margin: 8px 0;
          background: #f8f9fa;
          border-radius: 8px;
          font-size: 0.9rem;
        }

        .feed-header {
          padding: 15px 20px;
          border-bottom: 1px solid #e1e1e1;
          background: white;
        }

        .feed-header h2 {
          margin: 0;
          font-size: 1.5rem;
          color: #333;
        }

        .post-form {
          padding: 15px 20px;
          border-bottom: 1px solid #e1e1e1;
          background: white;
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
          align-items: center;
          gap: 10px;
          padding: 10px 0;
          position: relative;
        }

        .media-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #f0f2f5;
          cursor: pointer;
          transition: background 0.2s;
          border: none;
        }

        .media-button:hover {
          background: #e4e6e9;
        }

        .media-button i {
          font-size: 18px;
          color: #666;
        }

        .media-preview {
          margin: 10px 0;
          display: flex;
          justify-content: center;
          position: relative;
          background: #f8f9fa;
          padding: 10px;
          border-radius: 8px;
        }

        .remove-media {
          position: absolute;
          top: 5px;
          right: 5px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.5);
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }

        .remove-media:hover {
          background: rgba(0, 0, 0, 0.7);
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

        /* Custom scrollbar styling */
        .feed-content::-webkit-scrollbar {
          width: 6px;
        }

        .feed-content::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        .feed-content::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 3px;
        }

        .feed-content::-webkit-scrollbar-thumb:hover {
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

        .feed-tabs {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .tab-button {
          padding: 0.5rem 1rem;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 1rem;
          color: #666;
          border-bottom: 2px solid transparent;
        }

        .tab-button.active {
          color: #0061ff;
          border-bottom: 2px solid #0061ff;
        }

        .question {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          border-bottom: 1px solid #eee;
        }

        .question-votes {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .question-votes button {
          border: none;
          background: none;
          cursor: pointer;
          color: #666;
        }

        .question-votes button:hover {
          color: #0061ff;
        }

        .question-content {
          flex: 1;
        }

        .question-card {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          border: 1px solid #ddd;
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .answers-section {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #eee;
        }

        .answer {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          border-bottom: 1px solid #eee;
        }

        .vote-buttons {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 40px;
        }

        .vote-buttons button {
          background: none;
          border: none;
          cursor: pointer;
          color: #666;
          font-size: 1.2rem;
          padding: 0;
        }

        .vote-buttons button.active {
          color: #0061ff;
        }

        .vote-buttons span {
          margin: 4px 0;
          font-weight: bold;
        }

        .answer-content {
          flex: 1;
        }

        .answer-header {
          display: flex;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }

        .username {
          font-weight: bold;
        }

        .timestamp {
          color: #666;
          font-size: 0.9rem;
        }

        .answer-form {
          margin-top: 1rem;
        }

        .answer-form textarea {
          width: 100%;
          min-height: 100px;
          margin-bottom: 0.5rem;
          padding: 0.5rem;
        }

        .question-card {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          border: 1px solid #ddd;
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .vote-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 40px;
        }

        .vote-button {
          background: none;
          border: none;
          cursor: pointer;
          color: #666;
          font-size: 1.2rem;
          padding: 4px;
        }

        .vote-button.active {
          color: #0061ff;
        }

        .vote-count {
          margin: 4px 0;
          font-weight: bold;
        }

        .question-content {
          flex: 1;
        }

        .question-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .username {
          font-weight: bold;
        }

        .timestamp {
          color: #666;
          font-size: 0.9rem;
        }

        .post-form textarea {
          max-height: 150px;
          min-height: 80px;
        }
      `}</style>
    </div>
  );
};

export default CommunityFeed; 
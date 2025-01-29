import React, { useState, useEffect } from 'react';
import axios from 'axios';

export const DEFAULT_AVATAR = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';

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
  const [polls, setPolls] = useState([]);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);

  useEffect(() => {
    fetchPosts();
    fetchQuestions();
  }, [communityId]);

  useEffect(() => {
    if (activeTab === 'polls') {
      fetchPolls();
    }
  }, [activeTab]);

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
      let endpoint;
      
      if (activeTab === 'questions') {
        endpoint = `http://localhost:8000/api/communities/${communityId}/forum/questions/`;
      } else {
        endpoint = `http://localhost:8000/api/communities/${communityId}/forum/posts/`;
      }

      await axios.post(
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

  const handlePollSubmit = async (e) => {
    e.preventDefault();
    const url = `http://localhost:8000/api/communities/${communityId}/forum/polls/`;
    console.log('Submitting poll to:', url);
    console.log('Poll data:', {
      question: pollQuestion,
      options: pollOptions.filter(option => option.trim() !== '')
    });

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        url,
        {
          question: pollQuestion,
          options: pollOptions.filter(option => option.trim() !== '')
        },
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Poll creation response:', response.data);
      
      // Reset form
      setPollQuestion('');
      setPollOptions(['', '']);
      
      // Refresh polls
      fetchPolls();
      
    } catch (error) {
      console.error('Error creating poll:', error.response || error);
    }
  };

  const handlePollVote = async (pollId, optionId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:8000/api/poll-options/${optionId}/vote/`,
        {},
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      fetchPolls();
    } catch (err) {
      console.error('Error voting:', err);
      setError('Failed to register vote');
    }
  };

  const fetchPolls = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:8000/api/communities/${communityId}/forum/polls/`,
        {
          headers: {
            'Authorization': `Token ${token}`
          }
        }
      );
      setPolls(response.data);
    } catch (error) {
      console.error('Error fetching polls:', error);
      setError('Failed to load polls');
    }
  };

  const renderPollsTab = () => {
    return (
      <div className="polls-container">
        <div className="poll-form">
          <form onSubmit={handlePollSubmit}>
            <input
              type="text"
              placeholder="Ask a poll question..."
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              className="poll-question-input"
            />
            <div className="poll-options">
              {pollOptions.map((option, index) => (
                <div key={index} className="poll-option-input">
                  <input
                    type="text"
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...pollOptions];
                      newOptions[index] = e.target.value;
                      setPollOptions(newOptions);
                    }}
                  />
                  {pollOptions.length > 2 && (
                    <button 
                      type="button"
                      onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== index))}
                      className="remove-option"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="poll-form-actions">
              <button 
                type="button" 
                onClick={() => setPollOptions([...pollOptions, ''])}
                className="add-option-btn"
              >
                Add Option
              </button>
              <button type="submit" className="create-poll-btn">Create Poll</button>
            </div>
          </form>
        </div>

        <div className="polls-list">
          {polls.map((poll) => (
            <div key={poll.id} className="poll-card">
              <div className="poll-header">
                <img 
                  src={poll.created_by.avatar || DEFAULT_AVATAR} 
                  alt="avatar" 
                  className="avatar"
                />
                <div className="poll-meta">
                  <span className="username">{poll.created_by.username}</span>
                  <span className="timestamp">
                    {new Date(poll.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <h3 className="poll-question">{poll.question}</h3>
              <div className="poll-options-list">
                {poll.options.map((option) => (
                  <button
                    key={option.id}
                    className={`poll-option ${option.has_voted ? 'voted' : ''}`}
                    onClick={() => handlePollVote(poll.id, option.id)}
                  >
                    <span className="option-text">{option.text}</span>
                    <span className="vote-count">{option.vote_count} votes</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderQuestionsTab = () => {
    return (
      <div className="questions-container">
        <div className="question-form">
          <textarea
            placeholder="Ask a question..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
          />
          <button 
            className="ask-question"
            onClick={(e) => {
              e.preventDefault();
              handleSubmit(e);
            }}
          >
            Ask Question
          </button>
        </div>
        <div className="questions-list">
          {questions.map(question => (
            <div key={question.id} className="question-item">
              <div className="question-main">
                <div className="vote-section">
                  <button 
                    className={`vote-button upvote ${question.user_vote === 'up' ? 'active' : ''}`}
                    onClick={() => handleQuestionVote(question.id, 'up')}
                  >
                    ▲
                  </button>
                  <span className="vote-count">{question.votes || 0}</span>
                  <button 
                    className={`vote-button downvote ${question.user_vote === 'down' ? 'active' : ''}`}
                    onClick={() => handleQuestionVote(question.id, 'down')}
                  >
                    ▼
                  </button>
                </div>
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
                <div className="question-content">
                  {question.content}
                </div>
              </div>
              
              <div className="answers-list">
                {question.answers?.map(answer => (
                  <div key={answer.id} className="answer-item">
                    <div className="vote-section">
                      <button 
                        className={`vote-button upvote ${answer.user_vote === 'up' ? 'active' : ''}`}
                        onClick={() => handleAnswerVote(answer.id, 'up')}
                      >
                        ▲
                      </button>
                      <span className="vote-count">{answer.votes || 0}</span>
                      <button 
                        className={`vote-button downvote ${answer.user_vote === 'down' ? 'active' : ''}`}
                        onClick={() => handleAnswerVote(answer.id, 'down')}
                      >
                        ▼
                      </button>
                    </div>
                    <div className="answer-header">
                      <img 
                        src={answer.created_by.avatar || DEFAULT_AVATAR} 
                        alt="avatar" 
                        className="avatar"
                      />
                      <span className="username">{answer.created_by.username}</span>
                      <span className="timestamp">
                        {new Date(answer.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="answer-content">
                      {answer.content}
                    </div>
                  </div>
                ))}
                <div className="answer-form">
                  <textarea
                    placeholder="Write an answer..."
                    value={answers[question.id] || ''}
                    onChange={(e) => setAnswers(prev => ({
                      ...prev,
                      [question.id]: e.target.value
                    }))}
                  />
                  <button onClick={() => handleAnswerSubmit(question.id)}>
                    Submit Answer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <style jsx>{`
          .questions-container {
            padding: 20px;
          }
          .question-item {
            margin-bottom: 30px;
            border: 1px solid #e1e4e8;
            border-radius: 6px;
            padding: 15px;
          }
          .question-main {
            margin-bottom: 15px;
          }
          .answers-list {
            margin-left: 30px;
            border-left: 2px solid #e1e4e8;
            padding-left: 15px;
          }
          .answer-item {
            margin: 15px 0;
            padding: 10px;
            background: #f6f8fa;
            border-radius: 4px;
          }
          .question-header, .answer-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
          }
          .avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
          }
          .username {
            font-weight: 500;
          }
          .timestamp {
            color: #666;
            font-size: 0.9em;
          }
          .question-content, .answer-content {
            margin: 10px 0;
          }
          .answer-form {
            margin-top: 15px;
          }
          .answer-form textarea {
            width: 100%;
            min-height: 80px;
            margin-bottom: 10px;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
          }
          .answer-form button {
            background: #0366d6;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
          }
          .answer-form button:hover {
            background: #0255b3;
          }
          .vote-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-right: 15px;
          }
          .vote-button {
            background: none;
            border: none;
            cursor: pointer;
            padding: 2px 8px;
            color: #666;
          }
          .vote-button.active {
            color: #0366d6;
          }
          .vote-button:hover {
            color: #0366d6;
          }
          .vote-count {
            margin: 4px 0;
            font-weight: 500;
          }
          .question-main, .answer-item {
            display: flex;
          }
        `}</style>
      </div>
    );
  };

  return (
    <div className="community-feed">
      <div className="feed-header">
        <h2>Community Feed</h2>
        <div className="feed-tabs">
          <button 
            onClick={() => setActiveTab('posts')} 
            className={`tab ${activeTab === 'posts' ? 'active' : ''}`}
          >
            Posts
          </button>
          <button 
            onClick={() => setActiveTab('questions')} 
            className={`tab ${activeTab === 'questions' ? 'active' : ''}`}
          >
            Questions
          </button>
          <button 
            onClick={() => setActiveTab('polls')} 
            className={`tab ${activeTab === 'polls' ? 'active' : ''}`}
          >
            Polls
          </button>
        </div>
      </div>
      <div className="feed-content">
        {activeTab === 'posts' && (
          <>
            <div className="post-form">
              <form onSubmit={handleSubmit}>
                <textarea
                  placeholder="What's on your mind?"
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
                        <img src={URL.createObjectURL(mediaFile)} alt="Preview" />
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
                  <button type="submit">Post</button>
                </div>
              </form>
            </div>
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
          </>
        )}
        {activeTab === 'questions' && renderQuestionsTab()}
        {activeTab === 'polls' && renderPollsTab()}
      </div>

      <style jsx>{`
        .community-feed {
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

        .feed-header {
          position: sticky;
          top: 0;
          background: white;
          z-index: 100;
          padding: 1rem;
          border-bottom: 1px solid #eaeaea;
        }

        .feed-tabs {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
          position: relative;
          z-index: 101;
        }

        .tab {
          padding: 0.5rem 1rem;
          border: none;
          background: none;
          cursor: pointer;
          color: #666;
          font-weight: 500;
          position: relative;
          transition: all 0.2s ease;
        }

        .tab:hover {
          color: #0061ff;
        }

        .tab.active {
          color: #0061ff;
          font-weight: 600;
          background: rgba(0, 97, 255, 0.1);
          border-radius: 4px;
        }

        .tab.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 2px;
          background: #0061ff;
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

        .poll-form {
          padding: 16px;
          border-bottom: 1px solid #eee;
        }

        .poll-question-input {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          margin-bottom: 12px;
          font-size: 0.95rem;
        }

        .poll-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }

        .poll-option-input {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .poll-option-input input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 0.9rem;
        }

        .remove-option {
          padding: 4px 8px;
          border: none;
          background: #ff4444;
          color: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
        }

        .poll-form-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .add-option-btn {
          padding: 8px 16px;
          background: #f0f2f5;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .create-poll-btn {
          padding: 8px 16px;
          background: #0061ff;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .add-option-btn:hover {
          background: #e4e6e9;
        }

        .create-poll-btn:hover {
          background: #0056e0;
        }

        .polls-container {
          padding: 16px;
        }
        .poll-card {
          background: white;
          border: 1px solid #e1e1e1;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
        }
        .poll-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }
        .poll-options-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .poll-option {
          padding: 12px 16px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: #ffffff;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          transition: all 0.2s ease;
          color: #333;
          font-size: 0.95rem;
        }
        .poll-option:hover {
          background: #f0f2f5;
          border-color: #ccc;
        }
        .poll-option.voted {
          background: #e3f2fd;
          border-color: #2196f3;
          color: #1565c0;
          font-weight: 500;
        }
        .vote-count {
          color: #666;
          font-size: 0.9rem;
          margin-left: 8px;
        }
        .poll-question {
          font-size: 1.1rem;
          color: #333;
          margin-bottom: 16px;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

export default CommunityFeed; 
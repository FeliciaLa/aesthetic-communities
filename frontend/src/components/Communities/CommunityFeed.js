import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

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
  const isAuthenticated = !!localStorage.getItem('token');
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
            className="question-form textarea"
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
                    className="answer-form textarea"
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
            width: 100%;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
          }
          .question-main {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            width: 100%;
            max-width: 100%;
          }
          .answers-list {
            width: calc(100% - 40px);
            box-sizing: border-box;
          }
          .answer-item {
            display: flex;
            width: 100%;
            box-sizing: border-box;
            padding: 10px;
          }
          .question-content, .answer-content {
            flex: 1;
            min-width: 0;
            word-wrap: break-word;
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
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 8px;
            resize: vertical;
            box-sizing: border-box;
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
          .question-form textarea {
            width: 100%;
            min-height: 100px;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 8px;
            margin-bottom: 10px;
            resize: vertical;
            box-sizing: border-box;
          }
          .ask-question {
            padding: 8px 16px;
            background: #0061ff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }
          .ask-question:hover {
            background: #0056e0;
          }
        `}</style>
      </div>
    );
  };

  return (
    <div className="community-feed">
      {isAuthenticated ? (
        <form onSubmit={handleSubmit}>
          <div className="feed-section-container">
            <div className="section-header">
              <h3>Community Feed</h3>
            </div>
            
            <div className="feed-content">
              <div className="sticky-header">
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

              <div className="scrollable-content">
                {activeTab === 'posts' && (
                  <>
                    <div className="post-form">
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
                    </div>

                    <div className="posts-list">
                      {posts.map(post => (
                        <div key={post.id} className="post-card">
                          <div className="post-header">
                            <img 
                              src={post.created_by.avatar || DEFAULT_AVATAR} 
                              alt="avatar" 
                              className="avatar"
                            />
                            <div className="post-meta">
                              <span className="username">{post.created_by.username}</span>
                              <span className="timestamp">
                                {new Date(post.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="post-content">{post.content}</div>
                          {post.media && (
                            <div className="post-media">
                              <img src={post.media} alt="Post media" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {activeTab === 'questions' && renderQuestionsTab()}
                {activeTab === 'polls' && renderPollsTab()}
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="auth-prompt">
          <p>Sign in to participate in this community</p>
          <Link to="/login" className="login-button">Sign In</Link>
        </div>
      )}
    </div>
  );
};

export default CommunityFeed; 
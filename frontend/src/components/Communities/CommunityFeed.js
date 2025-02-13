import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import api from '../../api';

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
  const [activeTab, setActiveTab] = useState('questions');
  const [contributions, setContributions] = useState([]);
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
  const [replies, setReplies] = useState([]);

  useEffect(() => {
    fetchContributions();
    fetchQuestions();
  }, [communityId]);

  useEffect(() => {
    if (activeTab === 'polls') {
      fetchPolls();
    }
  }, [activeTab]);

  const fetchContributions = async () => {
    try {
      const response = await api.get(`/communities/${communityId}/forum/posts/`);
      setContributions(response.data);
    } catch (error) {
      console.error('Error fetching contributions:', error);
      setError('Failed to load contributions');
    }
  };

  const fetchQuestions = async () => {
    try {
      const response = await api.get(`/communities/${communityId}/forum/questions/`);
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
      const endpoint = activeTab === 'questions' 
        ? `/communities/${communityId}/forum/questions/`
        : `/communities/${communityId}/forum/posts/`;

      await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setNewContent('');
      setMediaFile(null);
      
      if (activeTab === 'questions') {
        fetchQuestions();
      } else {
        fetchContributions();
      }
    } catch (err) {
      setError(`Failed to create ${activeTab === 'questions' ? 'question' : 'post'}`);
    }
  };

  const handleLike = async (postId) => {
    try {
      await api.post(`/forum/posts/${postId}/like/`);
      fetchContributions();
    } catch (err) {
      setError('Failed to like post');
    }
  };

  const handleReaction = async (postId, reactionType) => {
    try {
      await api.post(`/forum/posts/${postId}/react/`, { reaction_type: reactionType });
      fetchContributions();
    } catch (err) {
      setError('Failed to add reaction');
    }
  };

  const handleCommentSubmit = async (postId) => {
    try {
      const comment = comments[postId];
      if (!comment?.trim()) return;
      
      await api.post(`/forum/posts/${postId}/comments/`, { content: comment });
      setComments(prev => ({ ...prev, [postId]: '' }));
      fetchContributions();
    } catch (err) {
      setError('Failed to add comment');
    }
  };

  const handleQuestionVote = async (questionId, voteType) => {
    try {
      await api.post(`/questions/${questionId}/vote/`, { vote_type: voteType });
    } catch (error) {
      console.error('Error voting:', error);
      fetchQuestions();
      setError('Failed to register vote');
    }
  };

  const handleAnswerVote = async (answerId, voteType) => {
    // Immediately update the vote count and reorder
    const updatedQuestions = questions.map(question => {
      const updatedAnswers = question.answers?.map(answer => {
        if (answer.id === answerId) {
          return {
            ...answer,
            votes: answer.votes + (voteType === 'up' ? 1 : -1)
          };
        }
        return answer;
      });

      // Sort answers by votes if they exist
      if (updatedAnswers) {
        updatedAnswers.sort((a, b) => b.votes - a.votes);
      }

      return {
        ...question,
        answers: updatedAnswers
      };
    });
    
    setQuestions(updatedQuestions);

    try {
      await api.post(`/answers/${answerId}/vote/`, { vote_type: voteType });
    } catch (error) {
      console.error('Error voting:', error);
      fetchQuestions();
    }
  };

  const handleAnswerSubmit = async (questionId) => {
    try {
      const answer = answers[questionId];
      if (!answer?.trim()) return;

      await api.post(`/questions/${questionId}/answers/`, { content: answer });
      
      // Clear the answer input and refresh questions
      setAnswers(prev => ({ ...prev, [questionId]: '' }));
      fetchQuestions();
    } catch (err) {
      setError('Failed to add answer');
    }
  };

  const handlePollSubmit = async (e) => {
    e.preventDefault();
    console.log('Attempting to create poll...');
    
    // Validate inputs
    if (!pollQuestion.trim() || pollOptions.filter(opt => opt.trim()).length < 2) {
      console.log('Validation failed:', {
        question: pollQuestion,
        options: pollOptions
      });
      setError('Please provide a question and at least 2 options');
      return;
    }

    try {
      await api.post(`/communities/${communityId}/forum/polls/`, {
        question: pollQuestion,
        options: pollOptions.filter(option => option.trim() !== '')
      });
      
      // Reset form on success
      setPollQuestion('');
      setPollOptions(['', '']);
      
      // Refresh polls
      fetchPolls();
      
    } catch (error) {
      console.error('Error creating poll:', error);
      setError('Failed to create poll. Please try again.');
    }
  };

  const handlePollVote = async (pollId, optionId) => {
    try {
      await api.post(`/poll-options/${optionId}/vote/`);
      fetchPolls();
    } catch (err) {
      console.error('Error voting:', err);
      setError('Failed to register vote');
    }
  };

  const fetchPolls = async () => {
    try {
      const response = await api.get(`/communities/${communityId}/forum/polls/`);
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
            <button 
              type="button"
              onClick={handlePollSubmit}
              className="create-poll-btn"
            >
              Create Poll
            </button>
          </div>
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
            className="ask-question-button"
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
                    <div className="question-content">
                      {question.content}
                    </div>
                  </div>
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
                  <div className="answer-input-container">
                    <textarea
                      placeholder="Write an answer..."
                      value={answers[question.id] || ''}
                      onChange={(e) => setAnswers(prev => ({
                        ...prev,
                        [question.id]: e.target.value
                      }))}
                      className="answer-form textarea"
                    />
                    <button 
                      onClick={() => handleAnswerSubmit(question.id)}
                      className="submit-arrow"
                    >
                      <i className="fas fa-arrow-up"></i>
                    </button>
                  </div>
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
          .question-header {
            display: flex;
            gap: 12px;
            margin-bottom: 16px;
            width: 100%;
          }
          .question-meta {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .username {
            font-weight: 600;
            color: #2c3e50;
            font-size: 15px;
          }
          .timestamp {
            font-size: 13px;
            color: #94a3b8;
          }
          .question-content {
            margin-top: 8px;
            color: #334155;
            line-height: 1.6;
            font-size: 15px;
          }
          .avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
          }
          .answer-input-container {
            position: relative;
            width: 100%;
            margin-bottom: 24px;
          }
          .answer-form textarea {
            width: 100%;
            min-height: 80px;
            padding: 12px;
            padding-right: 38px;
            border: 1px solid #ddd;
            border-radius: 8px;
            resize: vertical;
          }
          .submit-arrow {
            position: absolute;
            bottom: 8px;
            right: 8px;
            background: white;
            border: 1px solid #fa8072;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            z-index: 1;
          }
          .submit-arrow i {
            color: #fa8072;
            font-size: 0.8rem;
          }
          .submit-arrow:hover {
            background: #fff1f0;
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
          .ask-question-button {
            padding: 8px 16px;
            background: #fa8072;  /* Coral color */
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .ask-question-button:hover {
            background: #ff9288;  /* Lighter coral on hover */
          }
          .add-option-btn,
          .create-poll-btn {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .add-option-btn {
            background: white;
            color: #fa8072;
            border: 1px solid #fa8072;
          }

          .add-option-btn:hover {
            background: #fff1f0;
          }

          .create-poll-btn {
            background: #fa8072;
            color: white;
          }

          .create-poll-btn:hover {
            background: #ff9288;
          }

          .question-form {
            margin-bottom: 24px;
          }
        `}</style>
      </div>
    );
  };

  return (
    <div className="community-feed">
      {isAuthenticated ? (
        <>
          <h2>Community Feed</h2>
          <div className="feed-tabs">
            <button 
              className={`tab ${activeTab === 'questions' ? 'active' : ''}`}
              onClick={() => setActiveTab('questions')}
            >
              Questions
            </button>
            <button 
              className={`tab ${activeTab === 'polls' ? 'active' : ''}`}
              onClick={() => setActiveTab('polls')}
            >
              Polls
            </button>
            <button 
              className={`tab ${activeTab === 'contributions' ? 'active' : ''}`}
              onClick={() => setActiveTab('contributions')}
            >
              Contributions
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            {activeTab === 'contributions' && (
              <>
                <div className="post-input-container">
                  <textarea
                    placeholder="What's on your mind?"
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="post-input"
                  />
                </div>
                <div className="post-actions">
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
                  <button type="submit" className="post-button">Post</button>
                </div>

                <div className="feed-content">
                  {contributions.map((contribution) => (
                    <div key={contribution.id} className="contribution-card">
                      <div className="contribution-header">
                        <div className="user-section">
                          <img 
                            src={contribution.created_by.avatar || DEFAULT_AVATAR} 
                            alt="avatar" 
                            className="avatar"
                          />
                          <div className="user-info">
                            <span className="username">{contribution.created_by.username}</span>
                            <span className="date">
                              {new Date(contribution.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="contribution-body">
                        {contribution.content}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {activeTab === 'questions' && renderQuestionsTab()}
            {activeTab === 'polls' && renderPollsTab()}
          </form>
        </>
      ) : (
        <div className="auth-prompt">
          <p>Sign in to participate in this community</p>
          <Link to="/login" className="login-button">Sign In</Link>
        </div>
      )}

      <style jsx>{`
        .community-feed {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          width: 100%;
          margin-bottom: 20px;
          box-sizing: border-box;
          border: 1px solid #e0e0e0;
          overflow: hidden;
        }

        h2 {
          font-size: 1.75rem;
          font-weight: 600;
          color: #333;
          margin: 0 0 20px 0;
        }

        .feed-tabs {
          margin-bottom: 20px;
        }

        .post-input-container {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 1rem;
          margin: 0;
          width: 100%;
          box-sizing: border-box;
        }

        .post-input {
          width: 100%;
          min-height: 100px;
          padding: 1rem;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          resize: none;
          font-size: 0.95rem;
          background: white;
          transition: border-color 0.2s ease;
          box-sizing: border-box;
        }

        .post-input:focus {
          outline: none;
          border-color: #FF7F6F;
        }

        .post-actions {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .media-upload {
          display: flex;
          align-items: center;
        }

        .media-button {
          padding: 0.5rem 1rem;
          background: #f1f1f1;
          border: 1px solid #e0e0e0;
          border-radius: 20px;
          cursor: pointer;
          color: #666;
          transition: all 0.2s ease;
        }

        .media-button:hover {
          background: #e0e0e0;
        }

        .post-button {
          padding: 0.5rem 1.5rem;
          background: #FF7F6F;
          color: white;
          border: none;
          border-radius: 20px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .post-button:hover {
          background: #ff9288;
          transform: translateY(-1px);
        }

        .post-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .post {
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: white;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
        }

        .post-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .post-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
        }

        .post-info {
          display: flex;
          align-items: center;
        }

        .username {
          font-weight: 500;
          color: #333;
          margin-right: 0.75rem;
        }

        .date {
          color: #666;
          font-size: 0.9rem;
          position: relative;
          padding-left: 1.25rem;
        }

        .date::before {
          content: '+';
          position: absolute;
          left: 0.5rem;
          color: #666;
        }

        .post-content {
          margin-top: 0.5rem;
          color: #333;
          line-height: 1.5;
        }

        .post-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
          padding-top: 0.5rem;
          border-top: 1px solid #eee;
        }

        .reply-button {
          background: none;
          border: none;
          color: #666;
          font-size: 0.9rem;
          padding: 0.25rem 0.5rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .reply-button:hover {
          color: #FF7F6F;
        }

        .replies-container {
          margin-left: 3.5rem;
          margin-top: 1rem;
          padding-left: 1rem;
          border-left: 2px solid #eee;
        }

        .reply-form {
          margin: 10px 0;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
          position: relative;
        }

        .answer-input-container {
          position: relative;
          width: 100%;
        }

        .reply-form textarea {
          width: 100%;
          min-height: 50px;
          max-height: 150px;
          padding: 12px;
          padding-right: 48px;
          border: 1px solid #ddd;
          border-radius: 8px;
          resize: vertical;
          font-size: 14px;
          box-sizing: border-box;
        }

        .submit-arrow {
          position: absolute;
          bottom: 8px;
          right: 8px;
          background: white;
          border: 1px solid #fa8072;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
          z-index: 1;
        }

        .submit-arrow i {
          color: #fa8072;
          font-size: 0.8rem;
        }

        .submit-arrow:hover {
          background: #fff1f0;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .submit-arrow:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .poll-form {
          padding: 20px;
          background: white;
          border-radius: 8px;
        }

        .poll-question-input {
          width: 100%;
          padding: 12px;
          margin-bottom: 16px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
        }

        .poll-options {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 16px;
        }

        .poll-option-input {
          display: flex;
          gap: 8px;
        }

        .poll-option-input input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .poll-form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-start;
        }

        .poll-card {
          background: white;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .poll-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
        }

        .poll-meta {
          display: flex;
          flex-direction: column;
        }

        .username {
          font-weight: 600;
          color: #333;
        }

        .timestamp {
          font-size: 0.9rem;
          color: #666;
        }

        .poll-question {
          font-size: 1.1rem;
          margin: 0 0 16px 0;
          color: #333;
        }

        .poll-options-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .poll-option {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.2s ease;
        }

        .poll-option:hover {
          background: #f8f9fa;
          border-color: #fa8072;
        }

        .poll-option.voted {
          background: #fff1f0;
          border-color: #fa8072;
          color: #fa8072;
        }

        .option-text {
          font-weight: 500;
        }

        .vote-count {
          font-size: 0.9rem;
          color: #666;
        }

        .feed-content {
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }

        .contribution-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          border: 1px solid #eee;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .contribution-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .contribution-header {
          margin-bottom: 16px;
        }

        .user-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #fff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .user-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .username {
          font-weight: 600;
          color: #2c3e50;
          font-size: 15px;
        }

        .date {
          font-size: 13px;
          color: #94a3b8;
        }

        .contribution-body {
          color: #334155;
          line-height: 1.6;
          font-size: 15px;
          padding-left: 56px;
        }
      `}</style>
    </div>
  );
};

export default CommunityFeed;
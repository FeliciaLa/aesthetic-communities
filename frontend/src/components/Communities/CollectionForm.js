import React, { useState } from 'react';
import axios from 'axios';

const CollectionForm = ({ communityId, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    category_type: 'VIDEOS',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      
      const requestData = {
        name: formData.name,
        category_type: formData.category_type,
        description: formData.description,
        community: parseInt(communityId),
        created_by: null
      };

      console.log('Sending data:', requestData);

      const response = await axios.post(
        'http://localhost:8000/api/resources/categories/',
        requestData,
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Response:', response.data);
      onSuccess();
    } catch (err) {
      console.error('API Error:', err.response?.data);
      setError(err.response?.data?.error || 'Failed to create collection');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="collection-form">
      <div className="form-group">
        <label>Collection Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
        />
      </div>

      <div className="form-group">
        <label>Category</label>
        <select
          value={formData.category_type}
          onChange={(e) => setFormData({...formData, category_type: e.target.value})}
          required
        >
          <option value="VIDEOS">Videos</option>
          <option value="BOOKS">Books</option>
          <option value="MOVIES">Movies</option>
          <option value="MUSIC">Music</option>
          <option value="TUTORIALS">Tutorials</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          required
        />
      </div>

      {error && <div className="error-message">{error}</div>}
      <button type="submit" disabled={submitting}>
        {submitting ? 'Creating...' : 'Create Collection'}
      </button>

      <style jsx>{`
        .collection-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        label {
          font-weight: 500;
          color: #444;
        }

        input, select, textarea {
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
        }

        textarea {
          resize: vertical;
        }

        .error-message {
          color: #dc3545;
          font-size: 0.9rem;
        }

        .submit-button {
          padding: 0.5rem 1rem;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
          margin-top: 1rem;
        }

        .submit-button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }

        .submit-button:hover:not(:disabled) {
          background-color: #0056b3;
        }
      `}</style>
    </form>
  );
};

export default CollectionForm; 
import React, { useState } from 'react';
import api from '../../api';

const CollectionForm = ({ communityId, onSuccess, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('community', communityId);
    if (previewFile) {
      formDataToSend.append('preview_image', previewFile);
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await api.post(
        `/resources/categories/`,
        formDataToSend,
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      onSuccess(response.data);
    } catch (err) {
      console.error('API Error:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to create collection');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreviewFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="collection-form">
      <h2>Create Collection</h2>
      
      <div className="form-group">
        <label>Collection Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />
      </div>

      <div className="form-group">
        <label>Preview Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
        />
        {previewUrl && (
          <img 
            src={previewUrl} 
            alt="Preview" 
            style={{ maxWidth: '200px', marginTop: '10px' }} 
          />
        )}
      </div>

      {error && <div className="error-message">{error}</div>}
      
      <div className="button-group">
        <button type="button" className="cancel-button" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="submit-button" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Collection'}
        </button>
      </div>

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

        .cancel-button {
          padding: 0.5rem 1rem;
          background-color: #6c757d;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
          margin-top: 1rem;
        }

        .cancel-button:hover:not(:disabled) {
          background-color: #5a6268;
        }

        .button-group {
          display: flex;
          justify-content: space-between;
        }
      `}</style>
    </form>
  );
};

export default CollectionForm; 
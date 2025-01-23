import React, { useState } from 'react';
import axios from 'axios';

const MediaUploadForm = ({ communityId, onSuccess, onClose }) => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:8000/api/communities/${communityId}/gallery/`,
        formData,
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      onSuccess();
    } catch (err) {
      setError('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error-message">{error}</div>}
      <div className="form-group">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])}
          required
        />
      </div>
      <div className="button-group">
        <button type="button" onClick={onClose}>Cancel</button>
        <button type="submit" disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
      
      <style jsx>{`
        .form-group {
          margin-bottom: 1rem;
        }
        .button-group {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }
        .error-message {
          color: red;
          margin-bottom: 1rem;
        }
      `}</style>
    </form>
  );
};

export default MediaUploadForm; 
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../../api';

const EditCommunityForm = ({ community, onSuccess, onClose }) => {
  const [formData, setFormData] = useState({
    name: community.name,
    description: community.description
  });
  const [bannerImage, setBannerImage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(
        `/communities/${community.id}/update_details/`,
        formData
      );
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error response:', err.response);
      setError(err.response?.data?.detail || 'Failed to update community');
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('banner_image', file);

    try {
      await api.put(
        `/communities/${community.id}/banner/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        }
      );
      onSuccess();
    } catch (err) {
      setError('Failed to upload banner image');
    }
  };

  return (
    <div className="edit-form">
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Community Name</label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>Change Banner Image</label>
          <input 
            type="file"
            accept="image/*"
            onChange={handleBannerUpload}
            className="banner-input"
          />
        </div>

        <div className="button-group">
          <button type="button" className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="save-button">
            Save Changes
          </button>
        </div>
      </form>

      <style jsx>{`
        .edit-form {
          padding: 20px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #333;
        }

        input, textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
        }

        textarea {
          min-height: 100px;
          resize: vertical;
        }

        .button-group {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 20px;
        }

        button {
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .cancel-button {
          background: #f5f5f5;
          border: 1px solid #ddd;
        }

        .save-button {
          background: #0061ff;
          color: white;
          border: none;
        }

        .error-message {
          color: #dc3545;
          margin-bottom: 15px;
        }

        .banner-input {
          margin-top: 10px;
        }
      `}</style>
    </div>
  );
};

export default EditCommunityForm; 
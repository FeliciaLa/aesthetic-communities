import React, { useState } from 'react';
import api from '../../api';

const EditProfileModal = ({ show, onClose, profile, onSuccess }) => {
  const [formData, setFormData] = useState({
    bio: profile?.bio || '',
    avatar: null
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [error, setError] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, avatar: file }));
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const data = new FormData();
    
    data.append('bio', formData.bio);
    if (formData.avatar) {
      data.append('avatar', formData.avatar, formData.avatar.name);
    }

    try {
      const response = await api.patch(
        '/profile/update/',
        data,
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'multipart/form-data',
          }
        }
      );
      
      if (response.data.avatar && !response.data.avatar.startsWith('http')) {
        response.data.avatar = `http://localhost:8000${response.data.avatar}`;
      }
      
      onSuccess(response.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Edit Profile</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell us about yourself"
            />
          </div>

          <div className="form-group">
            <label>Profile Picture</label>
            <input
              type="file"
              onChange={handleImageChange}
              accept="image/*"
            />
            {previewImage && (
              <img 
                src={previewImage} 
                alt="Preview" 
                style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '50%', marginTop: '10px' }} 
              />
            )}
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="button-group">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal; 
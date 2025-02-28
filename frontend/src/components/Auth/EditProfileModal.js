import React, { useState } from 'react';
import styled from 'styled-components';
import api from '../../api';
import { API_BASE_URL } from '../../config';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
`;

const EditProfileModal = ({ show, onClose, profile, onSuccess }) => {
  const [formData, setFormData] = useState({
    bio: profile?.bio || '',
    avatar: null
  });
  const [error, setError] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const navigate = useNavigate();

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
      data.append('avatar', formData.avatar);
    }

    try {
      const response = await api.patch('/profile/update/', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Token ${token}`
        }
      });
      
      // Transform avatar URL if needed
      if (response.data.avatar && !response.data.avatar.startsWith('http')) {
        const baseURLWithoutApi = API_BASE_URL.split('/api')[0];
        response.data.avatar = `${baseURLWithoutApi}${response.data.avatar}`;
      }
      
      onSuccess(response.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    }
  };

  const handleDeleteProfile = async () => {
    if (window.confirm('Are you sure you want to delete your profile? This cannot be undone.')) {
      try {
        const response = await authService.deleteProfile();
        if (response) {
          // First close the modal
          onClose();
          // Small delay to ensure modal is closed
          setTimeout(() => {
            window.location.replace('/account-deleted');
          }, 100);
        }
      } catch (error) {
        // Check if the error is because account was actually deleted
        if (error.response?.status === 401 || error.code === "ERR_NETWORK") {
          // Account was deleted successfully
          onClose();
          setTimeout(() => {
            window.location.replace('/account-deleted');
          }, 100);
        } else {
          setError('Failed to delete profile. Please try again.');
          console.error('Error deleting profile:', error);
        }
      }
    }
  };

  if (!show) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
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

          <div className="modal-footer">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit">
              Save Changes
            </button>
            <button type="button" onClick={handleDeleteProfile} className="delete-button">
              Delete Profile
            </button>
          </div>
        </form>
      </ModalContent>

      <style jsx>{`        .delete-button {
          background: #ff4444;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.2s ease;
          margin-left: auto;  /* This will push it to the right */
        }

        .delete-button:hover {
          background: #cc0000;
        }

        .modal-footer {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }
      `}</style>
    </ModalOverlay>
  );
};

export default EditProfileModal; 

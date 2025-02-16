import React, { useState } from 'react';
import api from '../../api';
import { API_BASE_URL } from '../../config';
import { useNavigate } from 'react-router-dom';
import { Modal, ModalContent } from '../../components/Modal';
import { authService } from '../../services/authService';

const EditProfileModal = ({ show, onClose, profile, onSuccess }) => {
  const [formData, setFormData] = useState({
    bio: profile?.bio || '',
    avatar: null
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [error, setError] = useState(null);
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
        await authService.deleteProfile();
        localStorage.clear();
        navigate('/', { 
          state: { message: 'Your profile has been successfully deleted.' }
        });
      } catch (error) {
        console.error('Error deleting profile:', error);
        setError('Failed to delete profile. Please try again.');
      }
    }
  };

  if (!show) return null;

  return (
    <Modal show={show} onClose={onClose}>
      <ModalContent>
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
            <button onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button onClick={handleSubmit} className="save-button">
              Save Changes
            </button>
            <button 
              onClick={handleDeleteProfile}
              className="delete-button"
            >
              Delete Profile
            </button>
          </div>
        </form>
      </ModalContent>

      <style jsx>{`
        .delete-button {
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
    </Modal>
  );
};

export default EditProfileModal; 
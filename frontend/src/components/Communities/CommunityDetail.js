import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import MediaGallery from './MediaGallery';
import CommunityForum from './CommunityForum';
import Resources from './Resources';
import Modal from '../Common/Modal';
import MediaUploadForm from './MediaUploadForm';
import CollectionForm from './CollectionForm';
import EditCommunityForm from './EditCommunityForm';
import { API_BASE_URL } from '../../config';

const CommunityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [communityData, setCommunityData] = useState({
    name: '',
    description: '',
    createdBy: '',
    createdAt: '',
  });
  const [showCollectionForm, setShowCollectionForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showMediaUploadModal, setShowMediaUploadModal] = useState(false);

  useEffect(() => {
    const fetchCommunity = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Please log in to view this community');
        navigate('/login');
        return;
      }

      if (!id) {
        console.error('No community ID provided');
        setError('Invalid community ID');
        setLoading(false);
        return;
      }

      try {
        const [communityResponse, profileResponse] = await Promise.all([
          axios.get(`http://localhost:8000/api/communities/${id}/`, {
            headers: {
              'Authorization': `Token ${token}`,
              'Content-Type': 'application/json'
            }
          }),
          axios.get('http://localhost:8000/api/profile/', {
            headers: {
              'Authorization': `Token ${token}`,
              'Content-Type': 'application/json'
            }
          })
        ]);

        setCommunity(communityResponse.data);
        // Check if the logged-in user is the creator
        setIsCreator(Boolean(communityResponse.data.is_creator));
        console.log('Community data:', communityResponse.data);
        console.log('Is creator:', communityResponse.data.is_creator);
        setLoading(false);
      } catch (error) {
        console.error('Error:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
        setError('Failed to fetch community');
        setLoading(false);
      }
    };

    fetchCommunity();
  }, [id, navigate]);

  // Debug log whenever isCreator changes
  useEffect(() => {
    console.log('isCreator state updated:', isCreator);
  }, [isCreator]);

  const handleUpdateSuccess = async () => {
    // Refresh community data
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:8000/api/communities/${id}/`,
        {
          headers: {
            'Authorization': `Token ${token}`
          }
        }
      );
      setCommunity(response.data);
    } catch (err) {
      console.error('Error refreshing community data:', err);
    }
  };

  const fetchCommunityData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/communities/${id}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setCommunity(data);
      }
    } catch (error) {
      console.error('Error fetching community:', error);
    }
  };

  const handleBannerUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('banner_image', file);

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:8000/api/communities/${id}/banner/`,
        formData,
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'multipart/form-data',
          }
        }
      );

      // Fetch updated community data after successful upload
      const response = await axios.get(
        `http://localhost:8000/api/communities/${id}/`,
        {
          headers: {
            'Authorization': `Token ${token}`
          }
        }
      );
      
      // Update the community state with new data
      setCommunity(response.data);
      
    } catch (error) {
      console.error('Error uploading banner:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditSuccess = async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(
      `http://localhost:8000/api/communities/${id}/`,
      {
        headers: { 'Authorization': `Token ${token}` }
      }
    );
    setCommunity(response.data);
    setShowEditModal(false);
  };

  if (loading) return <div>Loading community...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!community) return <div>Community not found</div>;

  const { name, description, created_by, created_at } = community;
  const createdBy = created_by?.username;
  const createdAt = new Date(created_at).toLocaleDateString();

  return (
    <div className="community-detail">
      <div className="community-banner">
        {community?.banner_image && (
          <img 
            src={community.banner_image.startsWith('http') 
              ? community.banner_image 
              : `http://localhost:8000${community.banner_image}`}
            alt={community.name} 
            className="banner-image"
          />
        )}
        {isCreator && (
          <button 
            className="edit-community-button"
            onClick={() => setShowEditModal(true)}
          >
            Edit
          </button>
        )}
        <div className="banner-content">
          <div className="banner-header">
            <div className="title-section">
              <h1>{community?.name}</h1>
            </div>
            <p className="description">{community?.description}</p>
            <div className="meta-info">
              <span>Created by {community?.created_by}</span>
              <span className="dot">•</span>
              <span>{new Date(community?.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="community-content">
        <div className="gallery-section">
          <MediaGallery communityId={id} isCreator={isCreator} />
        </div>

        <div className="main-content">
          <div className="content-section">
            <div className="section-box">
              <div className="section-header">
                <h3>Resource Collections</h3>
                {isCreator && (
                  <button 
                    className="add-button"
                    onClick={() => setShowCollectionForm(true)}
                  >
                    <span>+</span> Add Collection
                  </button>
                )}
              </div>
              <Resources communityId={id} />
            </div>
          </div>

          <div className="content-section">
            <div className="section-box">
              <div className="section-header">
                <h3>Community Forum</h3>
              </div>
              <CommunityForum communityId={id} />
            </div>
          </div>
        </div>
      </div>

      {/* Media Upload Modal */}
      <Modal 
        isOpen={showMediaModal} 
        onClose={() => setShowMediaModal(false)}
        title="Add Media"
      >
        <MediaUploadForm 
          communityId={id} 
          onSuccess={() => setShowMediaModal(false)}
        />
      </Modal>

      {/* Collection Creation Modal */}
      <Modal 
        isOpen={showCollectionForm} 
        onClose={() => setShowCollectionForm(false)}
        title="Create Collection"
      >
        <CollectionForm 
          communityId={id} 
          onSuccess={() => {
            setShowCollectionForm(false);
            // Optionally refresh the collections list
            window.location.reload();
          }}
          onClose={() => setShowCollectionForm(false)}
        />
      </Modal>

      {/* Edit Community Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <EditCommunityForm
              community={community}
              onSuccess={handleEditSuccess}
              onClose={() => setShowEditModal(false)}
            />
          </div>
        </div>
      )}

      {showMediaUploadModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add Image</h2>
            <MediaUploadForm
              communityId={id}
              onSuccess={() => {
                setShowMediaUploadModal(false);
                // Refresh the gallery
                fetchCommunityData();
              }}
              onClose={() => setShowMediaUploadModal(false)}
            />
          </div>
        </div>
      )}

      <style jsx="true">{`
        .community-detail {
          margin-top: 60px; /* Add space for the navigation bar */
        }

        .community-banner {
          position: relative;
          height: 400px;
          width: 100%;
          overflow: hidden;
        }

        .banner-content {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 2rem;
          background: linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.7));
          color: white;
        }

        .banner-header {
          position: relative;
          z-index: 1;
        }

        .title-section {
          position: relative;
        }

        h1 {
          font-size: 3.5rem;
          margin: 0;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }

        .description {
          font-size: 1.2rem;
          margin: 0.5rem 0 1rem 0;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.7);
        }

        .meta-info {
          font-size: 1rem;
          opacity: 0.9;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.7);
        }

        .dot {
          margin: 0 0.5rem;
        }

        .edit-community-button {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(255, 255, 255, 0.9);
          border: none;
          padding: 8px 16px;
          border-radius: 20px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.3s ease;
          z-index: 10;
          color: #333;
          font-weight: 500;
          text-shadow: none;
        }

        .edit-community-button:hover {
          background: white;
          transform: translateY(-2px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          color: #000;
        }

        .banner-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .community-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .gallery-section {
          margin-bottom: 3rem;
        }

        .main-content {
          max-width: 1200px;
          margin: 2rem auto;
          padding: 0 2rem;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }

        .section-box {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #f0f0f0;
        }

        .section-header h3 {
          margin: 0;
          color: #333;
          font-size: 1.25rem;
        }

        .add-button {
          background: #0061ff;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          transition: background 0.3s ease;
        }

        .add-button:hover {
          background: #0056b3;
        }

        .add-button span {
          font-size: 1.2rem;
          font-weight: bold;
        }

        .edit-form {
          padding: 20px;
        }

        .banner-input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
        }

        .banner-input:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .upload-status {
          margin-top: 10px;
          color: #666;
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .sections-container {
            grid-template-columns: 1fr;
          }

          .community-banner {
            padding: 3rem 1.5rem;
          }

          .banner-content h1 {
            font-size: 2rem;
          }

          .title-section {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }
      `}</style>
    </div>
  );
};

export default CommunityDetail; 

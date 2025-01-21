import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import MediaGallery from './MediaGallery';
import CommunityForum from './CommunityForum';
import Resources from './Resources';
import Modal from '../common/Modal';
import MediaUploadForm from './MediaUploadForm';
import CollectionForm from './CollectionForm';

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
        setIsCreator(communityResponse.data.created_by.id === profileResponse.data.id);
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

  // Debug log to see what we're passing
  console.log('Community creator:', community?.created_by);

  if (loading) return <div>Loading community...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!community) return <div>Community not found</div>;

  const { name, description, created_by, created_at } = community;
  const createdBy = created_by?.username;
  const createdAt = new Date(created_at).toLocaleDateString();

  return (
    <div className="community-detail">
      <div className="community-header">
        {community.banner_image ? (
          <div className="banner-image" style={{ backgroundImage: `url(${community.banner_image})` }} />
        ) : (
          <div className="banner-placeholder">
            <h1>{name}</h1>
          </div>
        )}
        <div className="community-info">
          <h1>{name}</h1>
          <p className="description">{description}</p>
          <div className="meta-info">
            <span>Created by {createdBy}</span>
            <span>•</span>
            <span>{createdAt}</span>
          </div>
        </div>
      </div>

      <div className="sections-container">
        <section className="section-box">
          <div className="section-header">
            <h3>Media Gallery</h3>
            {isCreator && (
              <button 
                className="add-button"
                onClick={() => setShowMediaModal(true)}
              >
                <span>+</span> Add Media
              </button>
            )}
          </div>
          <MediaGallery communityId={id} isCreator={isCreator} hideUpload={true} />
        </section>

        <section className="section-box">
          <div className="section-header">
            <h3>Resource Collections</h3>
            <button 
              className="add-button"
              onClick={() => setShowCollectionForm(true)}
            >
              <span>+</span> Add Collection
            </button>
          </div>
          <Resources communityId={id} hideForm={true} />
        </section>

        <section className="section-box">
          <div className="section-header">
            <h3>Community Forum</h3>
          </div>
          <CommunityForum communityId={id} />
        </section>
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

      <style jsx>{`
        .community-detail {
          min-height: calc(100vh - 64px);
          background: #f5f5f5;
        }

        .community-header {
          position: relative;
          background: white;
          margin-bottom: 2rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .banner-image {
          height: 300px;
          background-size: cover;
          background-position: center;
          position: relative;
        }

        .banner-placeholder {
          height: 300px;
          background: linear-gradient(135deg, #0061ff 0%, #60efff 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .community-info {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .community-info h1 {
          margin: 0;
          font-size: 2.5rem;
          color: #333;
        }

        .description {
          font-size: 1.1rem;
          color: #666;
          margin: 1rem 0;
          line-height: 1.6;
        }

        .meta-info {
          display: flex;
          gap: 1rem;
          align-items: center;
          color: #666;
          font-size: 0.9rem;
        }

        .sections-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem 2rem;
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

        @media (max-width: 768px) {
          .sections-container {
            grid-template-columns: 1fr;
          }

          .community-info h1 {
            font-size: 2rem;
          }

          .banner-image, .banner-placeholder {
            height: 200px;
          }
        }
      `}</style>
    </div>
  );
};

export default CommunityDetail; 

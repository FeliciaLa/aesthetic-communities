import React, { useState, useEffect, useRef } from 'react';
import api from '../../api';
import FullscreenGallery from './FullscreenGallery';
import MediaUploadForm from './MediaUploadForm';

const MediaGallery = ({ communityId, isCreator, onTabChange }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const scrollContainerRef = useRef(null);
  const [showAddImage, setShowAddImage] = useState(false);
  const [showGalleryView, setShowGalleryView] = useState(false);

  const displayImages = [...images, ...images, ...images, ...images, ...images, ...images];

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('image', file);

      await api.post(
        `/communities/${communityId}/gallery/`,
        formData,
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      // Refresh the images after upload
      fetchImages();
    } catch (err) {
      setError('Failed to upload image');
    }
  };

  const handleImageDelete = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      await api.delete(`/communities/${communityId}/gallery/${imageId}/`);
      fetchImages();
    } catch (err) {
      setError('Failed to delete image');
    }
  };

  const fetchImages = async () => {
    try {
      const response = await api.get(`/communities/${communityId}/gallery/`);
      setImages(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load gallery images');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [communityId]);

  if (loading) return <div className="banner-placeholder">Loading gallery...</div>;
  if (error) return <div className="banner-placeholder error">{error}</div>;
  
  return (
    <div className="section-container">
      <div className="section-header">
        <h3>Media Gallery</h3>
        <div className="gallery-actions">
          <button 
            className="gallery-button"
            onClick={() => setShowAddImage(true)}
          >
            +
          </button>
          <button 
            className="gallery-button"
            onClick={() => onTabChange('gallery')}
          >
            All
          </button>
        </div>
      </div>

      {showAddImage && (
        <div className="modal-overlay">
          <div className="modal-content">
            <MediaUploadForm
              communityId={communityId}
              onSuccess={() => {
                setShowAddImage(false);
                fetchImages();
              }}
              onClose={() => setShowAddImage(false)}
            />
          </div>
        </div>
      )}

      {images.length === 0 ? (
        <div className="collection-placeholder">
          <div className="placeholder-content">
            <i className="far fa-folder"></i>
            <p>No images in the gallery yet</p>
          </div>
        </div>
      ) : (
        <div className="gallery-container">
          <div className="gallery-scroll" ref={scrollContainerRef}>
            <div className="gallery-track">
              {displayImages.map((image, index) => (
                <div 
                  key={`${image.id}-${index}`} 
                  className="gallery-card"
                  onClick={() => setIsFullscreen(true)}
                >
                  <img 
                    src={image.image.startsWith('http') ? image.image : `http://localhost:8000${image.image}`}
                    alt={`Gallery item ${index + 1}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isFullscreen && (
        <FullscreenGallery 
          images={images} 
          onClose={() => setIsFullscreen(false)}
          onDelete={handleImageDelete}
          isCreator={isCreator}
        />
      )}

      <style jsx>{`
        .section-container {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          width: 100%;
          margin: 0;
          box-sizing: border-box;
          border: 1px solid #e0e0e0;
          height: 352px;
          display: flex;
          flex-direction: column;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .section-header h3 {
          font-size: 1.75rem;
          font-weight: 600;
          color: #333;
          margin: 0;
          font-family: inherit;
        }

        .gallery-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .gallery-button {
          padding: 4px 12px;
          background: white;
          color: #fa8072;
          border: 1px solid #fa8072;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          height: 32px;
          width: auto;
        }

        /* Different font sizes for + and All buttons */
        .gallery-button:first-child {
          font-size: 1.2rem;  /* Larger size for the + button */
        }

        .gallery-button:last-child {
          font-size: 0.85rem;  /* Smaller size for the All button, matching other sections */
        }

        .gallery-button:hover {
          background: #ff9288;
          color: white;
          border-color: #ff9288;
        }

        .gallery-container {
          flex: 1;
          position: relative;
          width: 100%;
          overflow: hidden;
          background: #f8f9fa;
          border-radius: 8px;
          padding: 0.5rem;
        }

        .gallery-scroll {
          overflow: hidden;
          width: 100%;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .gallery-track {
          display: flex;
          gap: 1rem;
          animation: scroll 60s linear infinite;
        }

        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-300px * ${images.length}));
          }
        }

        .gallery-card {
          flex: 0 0 300px;
          height: 200px;
          position: relative;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transition: transform 0.3s ease;
          cursor: pointer;
        }

        .gallery-card:hover {
          transform: translateY(-5px);
        }

        .gallery-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .empty-gallery {
          padding: 2rem;
          text-align: center;
          background: #f8f9fa;
          border-radius: 8px;
          color: #666;
        }

        .empty-gallery p {
          margin: 0.5rem 0;
        }

        .media-gallery {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          width: 100%;
          margin: -1rem 0 0 0;
          box-sizing: border-box;
          border: 1px solid #e0e0e0;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
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
        }

        .media-placeholder {
          width: 100%;
          height: 100%;
          background: #f5f5f5;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .placeholder-content {
          text-align: center;
          color: #999;
        }

        .placeholder-content i {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .placeholder-content p {
          margin: 0;
          font-size: 1rem;
        }
      `}</style>
    </div>
  );
};

export default MediaGallery;
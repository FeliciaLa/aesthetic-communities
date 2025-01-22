import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import FullscreenGallery from './FullscreenGallery';

const MediaGallery = ({ communityId, isCreator }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const scrollContainerRef = useRef(null);

  const displayImages = [...images, ...images, ...images, ...images, ...images, ...images];

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('image', file);

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
      
      // Refresh the images after upload
      fetchImages();
    } catch (err) {
      setError('Failed to upload image');
    }
  };

  const handleImageDelete = async (e, imageId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:8000/api/communities/${communityId}/gallery/${imageId}/`,
        {
          headers: { 'Authorization': `Token ${token}` }
        }
      );
      setImages(images.filter(img => img.id !== imageId));
    } catch (err) {
      setError('Failed to delete image');
    }
  };

  const fetchImages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:8000/api/communities/${communityId}/gallery/`,
        {
          headers: { 'Authorization': `Token ${token}` }
        }
      );
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
  if (images.length === 0) return null;

  return (
    <div className="section-container">
      <div className="section-header">
        <h3>Media Gallery</h3>
        <div className="gallery-actions">
          <button 
            className="gallery-button"
            onClick={() => setIsFullscreen(true)}
          >
            View All Photos
          </button>
          {isCreator && (
            <div className="upload-container">
              <label className="gallery-button" htmlFor="gallery-upload">
                + Add Image
              </label>
              <input
                id="gallery-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </div>
          )}
        </div>
      </div>

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
                {isCreator && (
                  <div className="image-overlay">
                    <button 
                      className="delete-button"
                      onClick={(e) => handleImageDelete(e, image.id)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {isFullscreen && (
        <FullscreenGallery 
          images={images} 
          onClose={() => setIsFullscreen(false)}
        />
      )}

      <style jsx="true">{`
        .section-container {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          margin: 3rem 0 2rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .section-header h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #333;
          margin: 0;
        }

        .gallery-actions {
          display: flex;
          gap: 1rem;
        }

        .gallery-button {
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.9rem;
          cursor: pointer;
          background: white;
          color: #0061ff;
          border: 1px solid #0061ff;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: translateY(0);
        }

        .gallery-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 2px 8px rgba(0, 97, 255, 0.2);
          background: #0061ff;
          color: white;
        }

        .gallery-container {
          position: relative;
          margin-top: 1rem;
          overflow: hidden;
          background: #f8f9fa;
          border-radius: 8px;
          padding: 0.5rem;
        }

        .gallery-scroll {
          overflow: hidden;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .gallery-scroll::-webkit-scrollbar {
          display: none;
        }

        .gallery-track {
          display: flex;
          gap: 1rem;
          width: max-content;
          animation: scroll 60s linear infinite;
        }

        .gallery-track:hover {
          animation-play-state: paused;
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

        .image-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .gallery-card:hover .image-overlay {
          opacity: 1;
        }

        .delete-button {
          background: #dc3545;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 20px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.3s ease;
        }

        .delete-button:hover {
          background: #c82333;
        }
      `}</style>
    </div>
  );
};

export default MediaGallery;
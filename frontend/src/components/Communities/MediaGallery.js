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

  const handleImageDelete = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      console.log('Attempting to delete image:', imageId);
      console.log('URL:', `http://localhost:8000/api/communities/${communityId}/gallery/${imageId}/`);
      
      const response = await axios.delete(
        `http://localhost:8000/api/communities/${communityId}/gallery/${imageId}/`,
        {
          headers: { 
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Delete response:', response);

      if (response.status === 204 || response.status === 200) {
        setImages(prevImages => prevImages.filter(img => img.id !== imageId));
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Delete request failed:', err.response || err);
      console.error('Status:', err.response?.status);
      console.error('Data:', err.response?.data);
      alert('Failed to delete image. Please check the console for details.');
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

      {images.length === 0 ? (
        <div className="empty-gallery">
          <p>No images in the gallery yet.</p>
          {isCreator && <p>Click "Add Image" to upload your first image!</p>}
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

      <style>{`
        .section-container {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          margin-top: 2rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          width: 100%;
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
      `}</style>
    </div>
  );
};

export default MediaGallery;
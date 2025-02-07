import React, { useState, useEffect } from 'react';
import api from '../../api';

const FullscreenGallery = ({ images, onClose, onDelete, isCreator, title }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [savedImages, setSavedImages] = useState(new Set());

  const handleSaveImage = async (imageId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.post(
        `/saved/${imageId}/save_image/`,
        {},
        {
          headers: { 
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.status === 'saved') {
        setSavedImages(prev => new Set([...prev, imageId]));
      } else {
        setSavedImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(imageId);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error saving image:', error);
    }
  };

  useEffect(() => {
    const fetchSavedImages = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await api.get(
          '/saved/images/',
          {
            headers: { 'Authorization': `Token ${token}` }
          }
        );
        setSavedImages(new Set(response.data.map(item => item.id)));
      } catch (error) {
        console.error('Error fetching saved images:', error);
      }
    };
    fetchSavedImages();
  }, []);

  return (
    <div className="fullscreen-gallery">
      <div className="modal-header">
        <h2>{title || 'Gallery'}</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="gallery-grid">
        {images.map((image, index) => (
          <div key={`${image.id}-${index}`} className="gallery-item">
            <div className="image-container">
              <img 
                src={image.image.startsWith('http') 
                  ? image.image 
                  : `http://localhost:8000${image.image}`
                }
                alt={`Gallery item ${index + 1}`}
              />
              <div className="image-actions">
                {isCreator && (
                  <button 
                    className="delete-button"
                    onClick={() => onDelete(image.id)}
                  >
                    ×
                  </button>
                )}
                <button 
                  className={`save-button ${savedImages.has(image.id) ? 'saved' : ''}`}
                  onClick={() => handleSaveImage(image.id)}
                  title={savedImages.has(image.id) ? 'Unsave' : 'Save'}
                >
                  {savedImages.has(image.id) ? '★' : '☆'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx="true">{`
        .fullscreen-gallery {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: #f0f8ff;
          z-index: 1000;
          overflow-y: auto;
          padding: 2rem;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 1rem;
          margin-bottom: 1rem;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        }

        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
          padding: 1rem;
        }

        .gallery-item {
          position: relative;
          break-inside: avoid;
          margin-bottom: 1.5rem;
          border-radius: 12px;
          overflow: hidden;
          transition: transform 0.3s ease;
        }

        .gallery-item:hover {
          transform: translateY(-5px);
        }

        .gallery-item img {
          width: 100%;
          height: auto;
          display: block;
          border-radius: 12px;
        }

        .image-actions {
          position: absolute;
          top: 10px;
          right: 10px;
          display: flex;
          gap: 8px;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .image-container:hover .image-actions {
          opacity: 1;
        }

        .save-button {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.9);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          color: #666;
          transition: all 0.2s ease;
        }

        .save-button:hover {
          background: rgba(255, 255, 255, 1);
          transform: scale(1.1);
        }

        .save-button.saved {
          color: #ffd700;
        }

        .delete-button {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.9);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          color: #ff4444;
          transition: all 0.2s ease;
        }

        .delete-button:hover {
          background: rgba(255, 255, 255, 1);
          transform: scale(1.1);
        }

        .close-button {
          background: none;
          border: none;
          font-size: 2rem;
          cursor: pointer;
          color: #333;
        }
      `}</style>
    </div>
  );
};

export default FullscreenGallery; 
import React, { useState } from 'react';

const FullscreenGallery = ({ images, onClose, onDelete, isCreator }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <div className="fullscreen-gallery">
      <div className="modal-header">
        <h2>Gallery</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="gallery-grid">
        {images.map((image, index) => (
          <div key={index} className="gallery-item">
            <img 
              src={image.image.startsWith('http') 
                ? image.image 
                : `http://localhost:8000${image.image}`
              }
              alt={`Gallery item ${index + 1}`}
            />
            {isCreator && (
              <button 
                className="delete-button"
                onClick={() => onDelete(image.id)}
              >
                ×
              </button>
            )}
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

        .delete-button {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          background: rgba(255, 255, 255, 0.9);
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          opacity: 0;
          color: #666;
          font-size: 18px;
          line-height: 1;
          padding: 0;
          font-weight: 500;
        }

        .gallery-item:hover .delete-button {
          opacity: 1;
        }

        .delete-button:hover {
          background: rgba(0, 0, 0, 0.1);
          color: #333;
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
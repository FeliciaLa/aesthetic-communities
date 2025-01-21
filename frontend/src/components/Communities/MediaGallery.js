import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MediaGallery = ({ communityId }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchImages();
  }, [communityId]);

  const fetchImages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:8000/api/communities/${communityId}/gallery/`,
        {
          headers: {
            'Authorization': `Token ${token}`
          }
        }
      );
      setImages(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching images:', err);
      setError('Failed to load images');
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    e.preventDefault();
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:8000/api/communities/${communityId}/gallery/`,
        formData,
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'multipart/form-data',
          }
        }
      );
      fetchImages(); // Refresh the images list
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image');
    }
  };

  if (loading) return <div>Loading gallery...</div>;
  if (error) return <div style={{color: 'red'}}>{error}</div>;

  return (
    <div className="media-gallery">
      <h3>Media Gallery</h3>
      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
      />
      <div className="gallery-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '1rem',
        marginTop: '1rem'
      }}>
        {images.map((image, index) => (
          <div key={index} className="gallery-item">
            <img
              src={image.image}
              alt={`Gallery item ${index + 1}`}
              style={{
                width: '100%',
                height: '200px',
                objectFit: 'cover',
                borderRadius: '4px'
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MediaGallery; 

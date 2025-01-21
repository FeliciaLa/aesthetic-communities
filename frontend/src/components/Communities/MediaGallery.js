import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const MediaGallery = ({ communityId, isCreator }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchImages = useCallback(async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setError('Please log in to view images');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`http://localhost:8000/api/communities/${communityId}/gallery/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setImages(response.data);
    } catch (error) {
      console.error('Error fetching images:', error);
      setError('Failed to load images');
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  useEffect(() => {
    if (communityId) {
      fetchImages();
    }
  }, [communityId, fetchImages]);

  const handleFileSelect = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to upload images');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await axios.post(
        `http://localhost:8000/api/communities/${communityId}/gallery/`,
        formData,
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      setImages([...images, response.data]);
      setSelectedFile(null);
      // Reset the file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="media-gallery">
      {loading ? (
        <div>Loading images...</div>
      ) : error ? (
        <div style={{ color: 'red' }}>{error}</div>
      ) : (
        <>
          {isCreator && (
            <div className="upload-section" style={{ marginBottom: '20px' }}>
              <input type="file" onChange={handleFileSelect} accept="image/*" />
              <button 
                onClick={handleUpload} 
                disabled={!selectedFile || uploading}
                style={{
                  marginLeft: '10px',
                  padding: '5px 10px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px'
                }}
              >
                {uploading ? 'Uploading...' : 'Upload Image'}
              </button>
            </div>
          )}
          
          <div className="gallery-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '20px',
            padding: '20px'
          }}>
            {images.length > 0 ? (
              images.map((image) => (
                <div key={image.id} className="gallery-item" style={{ textAlign: 'center' }}>
                  <img 
                    src={image.image_url}
                    alt={`Uploaded by ${image.uploaded_by}`}
                    style={{
                      width: '100%',
                      height: '200px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '1px solid #ddd'
                    }}
                    onError={(e) => {
                      console.error('Image failed to load:', image.image_url);
                      e.target.src = 'https://via.placeholder.com/200?text=Image+Failed+to+Load';
                    }}
                  />
                  <p style={{ marginTop: '8px' }}>Uploaded by: {image.uploaded_by}</p>
                </div>
              ))
            ) : (
              <div>No images in gallery</div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default MediaGallery; 

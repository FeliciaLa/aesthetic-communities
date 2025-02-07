import React, { useState } from 'react';
import axios from 'axios';

const EditCollectionForm = ({ collection, onSuccess, onClose }) => {
  const [formData, setFormData] = useState({
    name: collection.name,
    description: collection.description,
    preview_image: null
  });
  
  const [previewUrl, setPreviewUrl] = useState(
    collection.preview_image?.startsWith('http') 
      ? collection.preview_image 
      : collection.preview_image 
        ? `http://localhost:8000${collection.preview_image}`
        : null
  );
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, preview_image: file });
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      
      if (formData.preview_image) {
        formDataToSend.append('preview_image', formData.preview_image);
      }

      const response = await axios.patch(
        `http://localhost:8000/api/resources/categories/${collection.id}/`,
        formDataToSend,
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      onSuccess(response.data);
      onClose();
    } catch (err) {
      console.error('API Error:', err.response?.data);
      setError(err.response?.data?.error || 'Failed to update collection');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="collection-form">
      <h2>Edit Collection</h2>
      
      <div className="form-group">
        <label>Collection Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />
      </div>

      <div className="form-group">
        <label>Preview Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
        />
        {previewUrl && (
          <img 
            src={previewUrl} 
            alt="Preview" 
            style={{ maxWidth: '200px', marginTop: '10px' }} 
          />
        )}
      </div>

      {error && <div className="error-message">{error}</div>}
      
      <div className="button-group">
        <button type="button" onClick={onClose}>Cancel</button>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Updating...' : 'Update Collection'}
        </button>
      </div>
    </form>
  );
};

export default EditCollectionForm; 
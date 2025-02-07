import React, { useState, useRef } from 'react';
import api from '../../api';

const MediaUploadForm = ({ communityId, onSuccess, onClose }) => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      setFile(droppedFile);
      setPreviewUrl(URL.createObjectURL(droppedFile));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const token = localStorage.getItem('token');
      await api.post(
        `/communities/${communityId}/gallery/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      onSuccess();
    } catch (err) {
      setError('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-form-container">
      <h2>Upload Image</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div 
          className="upload-area"
          onClick={() => fileInputRef.current.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {previewUrl ? (
            <div className="preview-container">
              <img src={previewUrl} alt="Preview" className="image-preview" />
              <div className="preview-overlay">
                <span>Click or drop to change image</span>
              </div>
            </div>
          ) : (
            <>
              <div className="upload-icon">
                <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p>Drag and drop your image here or click to browse</p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="file-input"
          />
        </div>

        <div className="button-group">
          <button type="button" onClick={onClose} className="cancel-button">
            Cancel
          </button>
          <button 
            type="submit" 
            className="upload-button" 
            disabled={!file || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </form>

      <style jsx>{`
        .upload-form-container {
          padding: 24px;
        }

        h2 {
          margin-bottom: 20px;
          color: #333;
        }

        .upload-area {
          border: 2px dashed #ccc;
          border-radius: 8px;
          padding: 40px 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: #f8f9fa;
          margin-bottom: 20px;
        }

        .upload-area:hover, .upload-area.drag-over {
          border-color: #fa8072;
          background: #fff;
        }

        .upload-icon {
          margin-bottom: 16px;
          color: #666;
        }

        .upload-area p {
          color: #666;
          margin: 0;
        }

        .file-input {
          display: none;
        }

        .preview-container {
          position: relative;
          max-width: 100%;
          max-height: 300px;
          overflow: hidden;
          border-radius: 4px;
        }

        .image-preview {
          width: 100%;
          height: auto;
          max-height: 300px;
          object-fit: contain;
        }

        .preview-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .preview-overlay span {
          color: white;
          font-size: 14px;
        }

        .preview-container:hover .preview-overlay {
          opacity: 1;
        }

        .button-group {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 20px;
        }

        .cancel-button {
          padding: 8px 16px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
          color: #666;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .cancel-button:hover {
          background: #f5f5f5;
        }

        .upload-button {
          padding: 8px 24px;
          border: none;
          border-radius: 4px;
          background: #fa8072;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .upload-button:hover {
          background: #ff9288;
        }

        .upload-button:disabled {
          background: #ffb3aa;
          cursor: not-allowed;
        }

        .error-message {
          color: #dc3545;
          background: #f8d7da;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 16px;
        }
      `}</style>
    </div>
  );
};

export default MediaUploadForm; 
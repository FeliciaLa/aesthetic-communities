import React, { useState, useEffect } from 'react';
import FullscreenGallery from './FullscreenGallery';
import api from '../../api';

const getImageUrl = (image) => {
    return image.startsWith('http') 
        ? image 
        : `${api.defaults.baseURL}${image}`;
};

const GalleryView = ({ communityId, isCreator, communityTitle = 'Gallery' }) => {
    const [images, setImages] = useState([]);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [savedImages, setSavedImages] = useState(new Set());

    useEffect(() => {
        const fetchImages = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await api.get(`/communities/${communityId}/gallery/`, {
                    headers: { 'Authorization': `Token ${token}` }
                });
                setImages(response.data || []);
            } catch (error) {
                console.error('Error fetching images:', error);
                setImages([]);
            }
        };
        fetchImages();
    }, [communityId]);

    useEffect(() => {
        const fetchSavedImages = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await api.get('/saved/images/', {
                    headers: { 'Authorization': `Token ${token}` }
                });
                setSavedImages(new Set(response.data.map(item => item.image_id)));
            } catch (error) {
                console.error('Error fetching saved images:', error);
            }
        };
        fetchSavedImages();
    }, []);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await api.post(
                `/communities/${communityId}/gallery/`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            setImages([...images, response.data]);
        } catch (error) {
            console.error('Error uploading image:', error);
        }
    };

    const handleImageDelete = async (imageId) => {
        try {
            await api.delete(`/communities/${communityId}/gallery/${imageId}/`);
            setImages(images.filter(img => img.id !== imageId));
        } catch (error) {
            console.error('Error deleting image:', error);
        }
    };

    const handleSaveImage = async (imageId) => {
        try {
            const response = await api.post(`/saved/${imageId}/save_image/`);
            
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
            console.error('Error saving image:', error.response?.data || error);
        }
    };

    return (
        <div className="gallery-view">
            <div className="gallery-header">
                <h3>Media Gallery</h3>
                <div className="gallery-actions">
                    {isCreator && (
                        <div className="upload-container">
                            <label className="upload-button" htmlFor="gallery-upload">
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
                    <button 
                        className="expand-button" 
                        onClick={() => setIsFullscreen(true)}
                        title="Expand view"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 14h2v4h4v2H4v-6zm2-4H4V4h6v2H6v4zm14 8h-4v2h6v-6h-2v4zm-4-14v2h4v4h2V4h-6z" fill="currentColor"/>
                        </svg>
                    </button>
                </div>
            </div>

            <div className="gallery-grid">
                {images.map((image, index) => (
                    <div key={`${image.id}-${index}`} className="gallery-item">
                        <div className="image-container">
                            <img 
                                src={getImageUrl(image.image)}
                                alt={`Gallery item ${index + 1}`}
                            />
                            <div className="image-actions">
                                {isCreator && (
                                    <button 
                                        className="delete-button"
                                        onClick={() => handleImageDelete(image.id)}
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

            {isFullscreen && (
                <FullscreenGallery 
                    images={images}
                    onClose={() => setIsFullscreen(false)}
                    onDelete={handleImageDelete}
                    isCreator={isCreator}
                    title={communityTitle ? `${communityTitle} Gallery` : 'Gallery'}
                />
            )}

            <style jsx>{`
                .gallery-view {
                    padding: 2rem;
                    width: 100%;
                    box-sizing: border-box;
                }

                .gallery-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                }

                .gallery-header h3 {
                    font-size: 1.75rem;
                    font-weight: 600;
                    color: #333;
                    margin: 0;
                }

                .gallery-actions {
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                }

                .upload-button {
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 0.9rem;
                    cursor: pointer;
                    background: white;
                    color: #0061ff;
                    border: 1px solid #0061ff;
                    transition: all 0.3s ease;
                }

                .gallery-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 24px;
                    padding: 0;
                }

                .gallery-item {
                    width: 100%;
                }

                .image-container {
                    position: relative;
                    width: 100%;
                    border-radius: 12px;
                    overflow: hidden;
                    background: #f8f9fa;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    transition: transform 0.2s ease;
                }

                .image-container:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
                }

                .gallery-item img {
                    width: 100%;
                    height: auto;
                    display: block;
                    object-fit: contain;
                }

                .image-actions {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    display: flex;
                    gap: 8px;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                    z-index: 10;
                }

                .image-container:hover .image-actions {
                    opacity: 1;
                }

                .save-button, .delete-button {
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
                    transition: all 0.2s ease;
                }

                .save-button {
                    color: #666;
                }

                .delete-button {
                    color: #ff4444;
                }

                .save-button:hover,
                .delete-button:hover {
                    background: rgba(255, 255, 255, 1);
                    transform: scale(1.1);
                }

                .expand-button {
                    padding: 8px;
                    border-radius: 20px;
                    cursor: pointer;
                    background: white;
                    color: #0061ff;
                    border: 1px solid #0061ff;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .expand-button:hover {
                    background: #f0f7ff;
                    transform: scale(1.05);
                }

                @media (max-width: 1200px) {
                    .gallery-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }

                @media (max-width: 768px) {
                    .gallery-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
};

export default GalleryView; 
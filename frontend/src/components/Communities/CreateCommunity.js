import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CreateCommunity = () => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [bannerImage, setBannerImage] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setBannerImage(file);
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        
        if (!token) {
            setError('Please log in to create a community');
            return;
        }

        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);
        if (bannerImage) {
            formData.append('banner_image', bannerImage);
        }

        try {
            const response = await axios.post(
                'http://localhost:8000/api/communities/',
                formData,
                {
                    headers: {
                        'Authorization': `Token ${token}`,
                        'Content-Type': 'multipart/form-data',
                    }
                }
            );
            
            setSuccessMessage('Community created successfully!');
            setTimeout(() => {
                navigate(`/communities/${response.data.id}`);
            }, 2000);
        } catch (error) {
            setError(error.response?.data?.detail || 'Failed to create community');
        }
    };

    return (
        <div className="create-community-container">
            <div className="create-community-card">
                <h2>Create New Community</h2>
                
                {error && <div className="error-message">{error}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}
                
                <form onSubmit={handleSubmit} className="create-community-form">
                    <div className="form-group">
                        <label>Community Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter community name"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe your community..."
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Banner Image</label>
                        <div className="image-upload-container">
                            <input
                                type="file"
                                onChange={handleImageChange}
                                accept="image/*"
                                className="file-input"
                            />
                            {previewImage && (
                                <div className="image-preview">
                                    <img src={previewImage} alt="Preview" />
                                </div>
                            )}
                        </div>
                    </div>

                    <button type="submit" className="submit-button">
                        Create Community
                    </button>
                </form>
            </div>

            <style jsx>{`
                .create-community-container {
                    max-width: 800px;
                    margin: 40px auto;
                    padding: 0 20px;
                }

                .create-community-card {
                    background: white;
                    border-radius: 12px;
                    padding: 40px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }

                h2 {
                    color: #333;
                    margin: 0 0 30px 0;
                    text-align: center;
                    font-size: 2rem;
                }

                .create-community-form {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                label {
                    color: #555;
                    font-weight: 500;
                }

                input, textarea {
                    padding: 12px;
                    border: 2px solid #e0e0e0;
                    border-radius: 8px;
                    font-size: 1rem;
                    transition: border-color 0.3s ease;
                }

                input:focus, textarea:focus {
                    border-color: #0061ff;
                    outline: none;
                }

                textarea {
                    min-height: 120px;
                    resize: vertical;
                }

                .image-upload-container {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .file-input {
                    border: 2px dashed #e0e0e0;
                    padding: 20px;
                    text-align: center;
                    cursor: pointer;
                }

                .image-preview {
                    max-width: 100%;
                    border-radius: 8px;
                    overflow: hidden;
                }

                .image-preview img {
                    width: 100%;
                    height: auto;
                    display: block;
                }

                .submit-button {
                    background: #0061ff;
                    color: white;
                    padding: 14px 28px;
                    border: none;
                    border-radius: 8px;
                    font-size: 1rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background 0.3s ease;
                }

                .submit-button:hover {
                    background: #0056b3;
                }

                .error-message, .success-message {
                    padding: 12px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    text-align: center;
                }

                .error-message {
                    background: #fff5f5;
                    color: #dc3545;
                    border: 1px solid #dc3545;
                }

                .success-message {
                    background: #f0fff4;
                    color: #0f9d58;
                    border: 1px solid #0f9d58;
                }
            `}</style>
        </div>
    );
};

export default CreateCommunity; 
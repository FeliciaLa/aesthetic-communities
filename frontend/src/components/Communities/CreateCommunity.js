import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CreateCommunity = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        banner_image: null,
    });
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                'http://localhost:8000/api/communities/',
                formData,
                {
                    headers: {
                        'Authorization': `Token ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            navigate(`/communities/${response.data.id}`);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create community');
        }
    };

    return (
        <div className="create-community-container">
            <h1>Create a New Community</h1>
            {error && <div className="error-message">{error}</div>}
            
            <form onSubmit={handleSubmit} className="create-community-form">
                <div className="form-group">
                    <label>Community Name</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                        placeholder="Enter community name"
                    />
                </div>

                <div className="form-group">
                    <label>Description</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        required
                        placeholder="Describe your community"
                    />
                </div>

                <div className="form-group">
                    <label>Banner Image</label>
                    <input
                        type="file"
                        onChange={(e) => setFormData({...formData, banner_image: e.target.files[0]})}
                        accept="image/*"
                    />
                </div>

                <button type="submit" className="submit-button">
                    Create Community
                </button>
            </form>

            <style jsx>{`
                .create-community-container {
                    max-width: 800px;
                    margin: 2rem auto;
                    padding: 2rem;
                }

                .create-community-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                label {
                    font-weight: 500;
                }

                input, textarea {
                    padding: 0.75rem;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 1rem;
                }

                textarea {
                    min-height: 150px;
                }

                .submit-button {
                    padding: 1rem;
                    background: #0066cc;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    font-size: 1rem;
                    cursor: pointer;
                }

                .submit-button:hover {
                    background: #0052a3;
                }

                .error-message {
                    color: #dc3545;
                    padding: 1rem;
                    background: #f8d7da;
                    border-radius: 4px;
                    margin-bottom: 1rem;
                }
            `}</style>
        </div>
    );
};

export default CreateCommunity; 
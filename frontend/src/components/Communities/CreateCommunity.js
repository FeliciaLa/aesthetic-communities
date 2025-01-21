import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CreateCommunity = () => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [bannerImage, setBannerImage] = useState(null);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();

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
            setError(''); // Clear any previous errors
            
            // Wait 2 seconds before redirecting so user can see the success message
            setTimeout(() => {
                navigate(`/communities/${response.data.id}`);
            }, 2000);
        } catch (error) {
            setSuccessMessage(''); // Clear any previous success message
            if (error.response?.status === 401) {
                setError('Please log in again');
                navigate('/login');
            } else {
                setError(error.response?.data?.detail || 'Failed to create community');
            }
        }
    };

    return (
        <div>
            <h2>Create New Community</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Name: </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Description: </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Banner Image: </label>
                    <input
                        type="file"
                        onChange={(e) => setBannerImage(e.target.files[0])}
                        accept="image/*"
                    />
                </div>
                <button type="submit">Create Community</button>
            </form>
        </div>
    );
};

export default CreateCommunity; 
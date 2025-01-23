import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Modal from '../Common/Modal';
import MediaGallery from './MediaGallery';
import Resources from './Resources';
import EditCommunityForm from './EditCommunityForm';
import SpotifyPlayer from '../Music/SpotifyPlayer';
import CommunityForum from './CommunityForum';

const CommunityDetail = () => {
    const { id } = useParams();
    const [community, setCommunity] = useState(null);
    const [isCreator, setIsCreator] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [refreshGallery, setRefreshGallery] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const fetchCommunityDetails = async () => {
            try {
                const token = localStorage.getItem('token');
                const currentUserId = localStorage.getItem('userId');
                
                console.log('Current user ID:', currentUserId); // Debug log

                const response = await axios.get(
                    `http://localhost:8000/api/communities/${id}/`,
                    {
                        headers: {
                            'Authorization': `Token ${token}`
                        }
                    }
                );

                setCommunity(response.data);
                
                // Debug logs
                console.log('Community data:', response.data);
                console.log('Created by:', response.data.created_by);
                
                // Check if the current user is the creator
                const isCreatorCheck = response.data.created_by === currentUserId;
                console.log('Is creator check:', { currentUserId, createdBy: response.data.created_by, isCreator: isCreatorCheck });
                
                setIsCreator(isCreatorCheck);
            } catch (error) {
                console.error('Error fetching community:', error);
            }
        };

        fetchCommunityDetails();
    }, [id]);

    console.log('isCreator value:', isCreator);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('image', file);

            await axios.post(
                `http://localhost:8000/api/communities/${id}/gallery/`,
                formData,
                {
                    headers: {
                        'Authorization': `Token ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            
            // Refresh the gallery by forcing a re-render of MediaGallery
            setRefreshGallery(prev => !prev);
        } catch (err) {
            console.error('Failed to upload image:', err);
        }
    };

    useEffect(() => {
        const checkCreator = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    console.log('No token found');
                    return;
                }

                // Get the community info first
                const communityResponse = await axios.get(
                    `http://localhost:8000/api/communities/${id}/`,
                    {
                        headers: { 'Authorization': `Token ${token}` }
                    }
                );
                
                // Get the current user's username from localStorage or another source
                const currentUsername = localStorage.getItem('username'); // or however you store the username
                
                // Compare the username with the community creator
                const communityCreator = communityResponse.data.created_by;
                console.log('Current username:', currentUsername);
                console.log('Community creator:', communityCreator);
                
                setIsCreator(currentUsername === communityCreator);
                
            } catch (error) {
                console.error('Error checking creator status:', error);
                if (error.response) {
                    console.log('Error response:', error.response.data);
                }
            }
        };

        checkCreator();
    }, [id]);

    // Add this console log to track isCreator changes
    useEffect(() => {
        console.log('isCreator value updated:', isCreator);
    }, [isCreator]);

    console.log('isCreator:', isCreator);

    return (
        <div className="community-detail">
            <div className="community-banner">
                <div className="banner-overlay"></div>
                <div className="banner-content">
                    <h1>{community?.name}</h1>
                    <p className="description">{community?.description}</p>
                    <div className="creator-info">
                        Created by {community?.creator_name || 'Unknown'} • {formatDate(community?.created_at)}
                    </div>
                    {isCreator && (
                        <button onClick={() => setShowEditModal(true)} className="edit-button">
                            Edit
                        </button>
                    )}
                </div>
            </div>

            <div className="content-section">
                <div className="main-content">
                    <div className="top-section">
                        <div className="playlist-section">
                            <SpotifyPlayer communityId={id} isCreator={isCreator} />
                        </div>

                        <div className="gallery-section">
                            <MediaGallery 
                                communityId={id} 
                                isCreator={isCreator}
                                setIsFullscreen={setIsFullscreen}
                                isFullscreen={isFullscreen}
                            />
                        </div>
                    </div>

                    <div className="collections-section">
                        <h3>Collections</h3>
                        <Resources communityId={id} />
                    </div>

                    <div className="forum-section">
                        <h3>Community Forum</h3>
                        <CommunityForum communityId={id} />
                    </div>
                </div>
            </div>

            {showEditModal && (
                <Modal 
                    isOpen={showEditModal} 
                    onClose={() => setShowEditModal(false)}
                    title="Edit Community"
                >
                    <EditCommunityForm
                        community={community}
                        onSuccess={(updatedCommunity) => {
                            setCommunity(updatedCommunity);
                            setShowEditModal(false);
                        }}
                        onClose={() => setShowEditModal(false)}
                    />
                </Modal>
            )}

            <style jsx>{`
                .community-detail {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 0 2rem;
                }

                .community-banner {
                    position: relative;
                    height: 400px;
                    margin-top: 64px;
                    background-image: url(${community?.banner_image || '/default-banner.jpg'});
                    background-size: cover;
                    background-position: center;
                    color: white;
                    display: flex;
                    align-items: flex-end;
                    padding: 40px 24px;
                }

                .banner-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.7));
                }

                .banner-content {
                    position: relative;
                    z-index: 1;
                    max-width: 1200px;
                    margin: 0 auto;
                    width: 100%;
                }

                .banner-content h1 {
                    margin: 0;
                    font-size: 3.5rem;
                    font-weight: bold;
                    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
                }

                .description {
                    margin: 16px 0;
                    font-size: 1.2rem;
                    max-width: 600px;
                    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
                }

                .creator-info {
                    font-size: 0.9rem;
                    opacity: 0.8;
                    margin-top: 8px;
                    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
                }

                .edit-button {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    padding: 6px 16px;
                    background: rgba(0, 0, 0, 0.4);
                    color: white;
                    border: 1px solid rgba(255, 255, 255, 0.6);
                    border-radius: 20px;
                    cursor: pointer;
                    backdrop-filter: blur(5px);
                    transition: all 0.3s ease;
                    font-size: 0.9rem;
                    z-index: 10;
                }

                .edit-button:hover {
                    background: rgba(0, 0, 0, 0.6);
                    border-color: white;
                }

                .content-section {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 0 1rem;
                }

                .top-section {
                    display: flex;
                    gap: 4rem;
                    margin-top: 2rem;
                }

                .playlist-section {
                    flex: 0 0 auto;
                    width: 350px;
                    margin-left: -1rem;
                }

                .gallery-section {
                    flex: 1;
                }

                .gallery-container {
                    width: 100%;
                    overflow: hidden;
                    border-radius: 8px;
                }

                .music-section,
                .media-gallery-section,
                .resource-collections,
                .forum-section {
                    background: white;
                    border-radius: 12px;
                    padding: 24px;
                    margin-bottom: 24px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }

                .music-section {
                    position: sticky;
                    top: 24px;
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                }

                .section-header h3 {
                    font-size: 1.5rem;
                    color: #333;
                    margin: 0;
                }

                .header-actions {
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                }

                .add-image-button {
                    color: #0061ff;
                    background: none;
                    border: none;
                    font-weight: 500;
                    cursor: pointer;
                    padding: 8px 16px;
                    border-radius: 4px;
                    transition: background 0.2s ease;
                }

                .add-image-button:hover {
                    background: rgba(0, 97, 255, 0.1);
                }

                .view-all-button {
                    color: #0061ff;
                    background: none;
                    border: none;
                    font-weight: 500;
                    cursor: pointer;
                    padding: 8px 16px;
                    border-radius: 4px;
                    transition: background 0.2s ease;
                }

                .view-all-button:hover {
                    background: rgba(0, 97, 255, 0.1);
                }
            `}</style>
        </div>
    );
};

export default CommunityDetail;

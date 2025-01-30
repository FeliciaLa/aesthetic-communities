import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Modal from '../Common/Modal';
import MediaGallery from './MediaGallery';
import Resources from './Resources';
import EditCommunityForm from './EditCommunityForm';
import SpotifyPlayer from '../Music/SpotifyPlayer';
import CommunityFeed from './CommunityFeed';
import JoinCommunityButton from './JoinCommunityButton';
import AnnouncementsDashboard from './AnnouncementsDashboard';
import RecommendedProducts from './RecommendedProducts';
import FullscreenGallery from './FullscreenGallery';
import GalleryView from './GalleryView';

const CommunityDetail = () => {
    const { id } = useParams();
    const [community, setCommunity] = useState(null);
    const [isCreator, setIsCreator] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [refreshGallery, setRefreshGallery] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [images, setImages] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showAddImage, setShowAddImage] = useState(false);

    useEffect(() => {
        const fetchCommunityDetails = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(
                    `http://localhost:8000/api/communities/${id}/`,
                    {
                        headers: { 'Authorization': `Token ${token}` }
                    }
                );
                setCommunity(response.data);
                const currentUser = response.data.current_username;
                const communityCreator = response.data.creator_name;
                setIsCreator(currentUser === communityCreator);
                
                console.log('Community creator:', communityCreator);
                console.log('Current user:', currentUser);
                console.log('Setting isCreator to:', currentUser === communityCreator);
            } catch (err) {
                console.error('Error fetching community:', err);
                setError('Failed to load community');
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

    const fetchImages = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://localhost:8000/api/communities/${id}/gallery/`,
                {
                    headers: { 'Authorization': `Token ${token}` }
                }
            );
            setImages(response.data);
        } catch (err) {
            console.error('Error fetching images:', err);
        }
    };

    useEffect(() => {
        if (activeTab === 'gallery') {
            fetchImages();
        }
    }, [activeTab, id]);

    const handleImageDelete = async (imageId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(
                `http://localhost:8000/api/communities/${id}/gallery/${imageId}/`,
                {
                    headers: { 'Authorization': `Token ${token}` }
                }
            );
            setImages(prevImages => prevImages.filter(img => img.id !== imageId));
        } catch (err) {
            console.error('Failed to delete image:', err);
        }
    };

    const handleImageClick = (index) => {
        setIsFullscreen(true);
        setActiveTab('gallery');
    };

    return (
        <div className="community-detail">
            <button 
                className="toggle-button"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                title={isSidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
            >
                <span>{isSidebarOpen ? '→' : '←'}</span>
            </button>

            <div className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                <div className="sidebar-item">
                    <AnnouncementsDashboard communityId={id} />
                </div>
                <div className="sidebar-item">
                    <SpotifyPlayer communityId={id} />
                </div>
            </div>

            <div className="community-banner">
                <div className="banner-overlay"></div>
                <div className="banner-content">
                    <h1>{community?.name}</h1>
                    <p className="description">{community?.description}</p>
                    <div className="creator-info">
                        Created by {community?.creator_name || 'Unknown'} • {formatDate(community?.created_at)}
                    </div>
                    <div className="banner-actions">
                        {isCreator ? (
                            <button onClick={() => setShowEditModal(true)} className="edit-button">
                                Edit
                            </button>
                        ) : (
                            <JoinCommunityButton communityId={id} />
                        )}
                    </div>
                </div>
            </div>

            <div className="community-tabs">
                <button 
                    className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    Overview
                </button>
                <button 
                    className={`tab ${activeTab === 'feed' ? 'active' : ''}`}
                    onClick={() => setActiveTab('feed')}
                >
                    Feed
                </button>
                <button 
                    className={`tab ${activeTab === 'gallery' ? 'active' : ''}`}
                    onClick={() => setActiveTab('gallery')}
                >
                    Gallery
                </button>
                <button 
                    className={`tab ${activeTab === 'resources' ? 'active' : ''}`}
                    onClick={() => setActiveTab('resources')}
                >
                    Resources
                </button>
                <button 
                    className={`tab ${activeTab === 'products' ? 'active' : ''}`}
                    onClick={() => setActiveTab('products')}
                >
                    Products
                </button>
            </div>

            <div className="tab-content">
                {activeTab === 'overview' && (
                    <div className="overview-layout">
                        <div className="side-column">
                            <MediaGallery communityId={id} isCreator={isCreator} />
                            <Resources communityId={id} />
                        </div>
                        <div className="main-column">
                            <CommunityFeed communityId={id} />
                        </div>
                        <div className="products-column">
                            <RecommendedProducts communityId={id} />
                        </div>

                        <style jsx>{`
                            .overview-layout {
                                display: grid;
                                grid-template-columns: 1fr 1fr;
                                grid-template-areas: 
                                    "side feed"
                                    "products products";
                                gap: 2rem;
                                padding: 0.5rem 0.5rem;
                                max-width: 4000px;
                                margin: 0 auto;
                                align-items: start;
                            }

                            .side-column {
                                grid-area: side;
                                display: flex;
                                flex-direction: column;
                                gap: 22px;
                            }

                            .main-column {
                                grid-area: feed;
                                height: 522px;
                            }

                            .products-column {
                                grid-area: products;
                                margin-top: 2rem;
                            }

                            .main-column::-webkit-scrollbar {
                                width: 6px;
                            }

                            .main-column::-webkit-scrollbar-track {
                                background: #f1f1f1;
                                border-radius: 3px;
                            }

                            .main-column::-webkit-scrollbar-thumb {
                                background: #888;
                                border-radius: 3px;
                            }

                            .main-column::-webkit-scrollbar-thumb:hover {
                                background: #555;
                            }

                            @media (max-width: 1024px) {
                                .overview-layout {
                                    grid-template-columns: 1fr;
                                }

                                .main-column {
                                    position: static;
                                    height: auto;
                                    order: -1;
                                }
                            }
                        `}</style>
                    </div>
                )}
                
                {activeTab === 'feed' && (
                    <CommunityFeed communityId={id} />
                )}
                
                {activeTab === 'gallery' && (
                    <GalleryView 
                        communityId={id} 
                        isCreator={isCreator}
                        communityTitle={community?.name || community?.title}
                    />
                )}
                
                {activeTab === 'resources' && (
                    <Resources communityId={id} />
                )}
                
                {activeTab === 'products' && (
                    <RecommendedProducts communityId={id} />
                )}
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
                    padding-right: ${isSidebarOpen ? '300px' : '0'};
                    transition: padding-right 0.3s ease;
                }

                .community-banner {
                    position: relative;
                    height: 300px;
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

                .community-tabs {
                    display: flex;
                    gap: 1rem;
                    padding: 1rem;
                    background: white;
                    border-bottom: 1px solid #eaeaea;
                    margin: 1rem 0;
                }

                .tab {
                    padding: 0.75rem 1.5rem;
                    border: none;
                    background: none;
                    cursor: pointer;
                    color: #666;
                    font-weight: 500;
                    position: relative;
                    transition: all 0.2s ease;
                }

                .tab:hover {
                    color: #0061ff;
                }

                .tab.active {
                    color: #0061ff;
                    font-weight: 600;
                    background: rgba(0, 97, 255, 0.1);
                    border-radius: 4px;
                }

                .tab-content {
                    padding: 1rem;
                }

                .sidebar {
                    position: fixed;
                    right: 0;
                    top: 0;
                    height: 100vh;
                    background: white;
                    box-shadow: -2px 0 5px rgba(0,0,0,0.1);
                    transition: transform 0.3s ease;
                    z-index: 100;
                    width: 300px;
                    padding: 80px 0 20px 0;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .sidebar-item {
                    padding: 0 20px;
                    width: 100%;
                    box-sizing: border-box;
                }

                .sidebar.closed {
                    transform: translateX(100%);
                }

                .sidebar.open {
                    transform: translateX(0);
                }

                .toggle-button {
                    position: fixed;
                    right: ${isSidebarOpen ? '300px' : '0'};
                    top: 300px;
                    background: #0061ff;
                    color: white;
                    border: none;
                    border-radius: ${isSidebarOpen ? '8px 0 0 8px' : '8px'};
                    padding: 16px 12px;
                    cursor: pointer;
                    box-shadow: -2px 0 10px rgba(0,0,0,0.2);
                    transition: all 0.3s ease;
                    z-index: 1001;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    min-width: 40px;
                    font-size: 1.2rem;
                }

                .toggle-button:hover {
                    background: #0056b3;
                    padding-left: ${isSidebarOpen ? '12px' : '20px'};
                    transform: translateX(${isSidebarOpen ? '0' : '-5px'});
                }

                .toggle-button .arrow {
                    font-size: 1.2rem;
                    line-height: 1;
                }

                .toggle-button .label {
                    display: ${isSidebarOpen ? 'none' : 'block'};
                    font-size: 0.9rem;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }

                .toggle-button:hover .label {
                    opacity: 1;
                }

                .container {
                    width: 100%;
                    max-width: 3000px;
                    margin: 0 auto;
                    padding: 0 1rem;
                }
            `}</style>
        </div>
    );
};

export default CommunityDetail;
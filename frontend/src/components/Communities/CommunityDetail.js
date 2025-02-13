import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api';
import Modal from '../Common/Modal';
import MediaGallery from './MediaGallery';
import Resources from './Resources';
import EditCommunityForm from './EditCommunityForm';
import SpotifyPlayer from '../Music/SpotifyPlayer';
import CommunityFeed from './CommunityFeed';
import JoinCommunityButton from './JoinCommunityButton';
import AnnouncementsDashboard from './AnnouncementsDashboard';
import RecommendedProducts from './RecommendedProducts';
import GalleryView from './GalleryView';
import { getFullImageUrl } from '../../utils/imageUtils';
import { ErrorBoundary } from 'react-error-boundary';

const CommunityDetail = () => {
    const { id } = useParams();
    const [community, setCommunity] = useState(null);
    const [isCreator, setIsCreator] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [images, setImages] = useState([]);

    useEffect(() => {
        console.log('Community ID:', id);
        console.log('API Base URL:', api.defaults.baseURL);
    }, [id]);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) {
                setError('Invalid community ID');
                setLoading(false);
                return;
            }

            try {
                const token = localStorage.getItem('token');
                const username = localStorage.getItem('username');
                
                if (!token) {
                    setError('Authentication required to view this community');
                    setLoading(false);
                    return;
                }

                const headers = {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json'
                };

                // Debug authorization
                console.log('Auth check:', {
                    hasToken: !!token,
                    headers: headers
                });

                // Add this before the API call
                console.log('Making request to:', {
                    fullUrl: `${api.defaults.baseURL}/communities/${id}/`,
                    token: token ? 'present' : 'missing',
                    headers: headers
                });

                const response = await api.get(`/communities/${id}/`, {
                    headers: headers,
                    withCredentials: true
                });

                // Enhanced error logging
                console.log('Response details:', {
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers,
                    data: response.data,
                    baseURL: api.defaults.baseURL,
                    fullPath: response.config.url
                });

                const communityData = response.data;
                setCommunity(communityData);

                if (communityData.created_by === username) {
                    setIsCreator(true);
                    console.log('Setting isCreator to true - User is creator', {
                        username,
                        created_by: communityData.created_by
                    });
                } else {
                    setIsCreator(false);
                    console.log('Setting isCreator to false - User is not creator', {
                        username,
                        created_by: communityData.created_by
                    });
                }
            } catch (error) {
                console.error('Error fetching community:', error);
                setError('Failed to load community');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    useEffect(() => {
        console.log('Community state:', community);
    }, [community]);

    // Add a new useEffect to track isCreator changes
    useEffect(() => {
        console.log('isCreator state changed:', {
            isCreator,
            communityId: id
        });
    }, [isCreator, id]);

    useEffect(() => {
        // Debug localStorage contents
        console.log('LocalStorage Debug:', {
            username: localStorage.getItem('username'),
            token: localStorage.getItem('token') ? 'present' : 'missing',
            userId: localStorage.getItem('userId'),
            allKeys: Object.keys(localStorage),
            timestamp: new Date().toISOString()
        });
    }, []);

    if (loading) return <div className="loading">Loading...</div>;
    if (error) return <div className="error-message">{error}</div>;
    if (!community) return <div className="not-found">Community not found</div>;

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
            const formData = new FormData();
            formData.append('image', file);

            await api.post(
                `/communities/${id}/gallery/`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
        } catch (err) {
            console.error('Failed to upload image:', err);
        }
    };

    const handleImageDelete = async (imageId) => {
        try {
            await api.delete(`/communities/${id}/gallery/${imageId}/`);
        } catch (err) {
            console.error('Failed to delete image:', err);
        }
    };

    const handleImageClick = (index) => {
        // Implementation needed
    };

    const handleEditSuccess = async () => {
        setShowEditModal(false);
        try {
            const response = await api.get(`/communities/${id}`);
            setCommunity(response.data);
        } catch (error) {
            console.error('Error refreshing community:', error);
        }
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
                <ErrorBoundary fallback={<div>Failed to load announcements</div>}>
                    <div className="sidebar-item">
                        <AnnouncementsDashboard communityId={id} />
                    </div>
                </ErrorBoundary>
                <div className="sidebar-item">
                    <ErrorBoundary fallback={<div>Failed to load Spotify player</div>}>
                        <SpotifyPlayer communityId={id} isCreator={isCreator} />
                    </ErrorBoundary>
                </div>
            </div>

            <div className="community-banner">
                <div className="community-header">
                    <div className="title-section">
                        <div className="header-content">
                            <div className="title-row">
                                <h1>{community?.name}</h1>
                                {isCreator && (
                                    <button 
                                        onClick={() => setShowEditModal(true)}
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.2)',
                                            border: '1px solid rgba(255, 255, 255, 0.6)',
                                            color: 'white',
                                            padding: '6px 16px',
                                            borderRadius: '20px',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            backdropFilter: 'blur(5px)',
                                            transition: 'all 0.2s ease',
                                            marginLeft: '1rem'
                                        }}
                                    >
                                        Edit
                                    </button>
                                )}
                            </div>
                            <p className="description">{community?.description}</p>
                            <p className="creator-info">Created by {community?.created_by}</p>
                        </div>
                    </div>
                </div>
                <div className="banner-overlay"></div>
                <div className="banner-content">
                    <div className="banner-actions">
                        {!isCreator && <JoinCommunityButton communityId={id} />}
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
                            <ErrorBoundary fallback={<div>Failed to load gallery</div>}>
                                <MediaGallery 
                                    communityId={id} 
                                    isCreator={isCreator}
                                    onTabChange={setActiveTab}
                                />
                            </ErrorBoundary>
                            <Resources 
                                communityId={id} 
                                isCreator={isCreator}
                                onTabChange={setActiveTab}
                            />
                            <RecommendedProducts 
                                communityId={id} 
                                isCreator={isCreator} 
                                onTabChange={setActiveTab}
                            />
                        </div>
                        <div className="main-column">
                            <CommunityFeed communityId={id} />
                        </div>
                    </div>
                )}
                
                {activeTab === 'feed' && <CommunityFeed communityId={id} />}
                
                {activeTab === 'gallery' && (
                    <GalleryView 
                        communityId={id} 
                        isCreator={isCreator}
                        communityTitle={community?.name || community?.title}
                    />
                )}
                
                {activeTab === 'resources' && (
                    <Resources 
                        communityId={id} 
                        isCreator={isCreator}
                        onTabChange={setActiveTab}
                    />
                )}
                
                {activeTab === 'products' && (
                    <RecommendedProducts 
                        communityId={id} 
                        isCreator={isCreator} 
                        onTabChange={setActiveTab}
                    />
                )}
            </div>

            {showEditModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <EditCommunityForm
                            community={community}
                            onSuccess={handleEditSuccess}
                            onClose={() => setShowEditModal(false)}
                        />
                    </div>
                </div>
            )}

            <style jsx>{`
                .community-detail {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 0;
                    padding-right: ${isSidebarOpen ? '300px' : '0'};
                    transition: padding-right 0.3s ease;
                }

                .community-banner {
                    position: relative;
                    width: 100vw;
                    height: 300px;
                    margin: 0;
                    margin-left: calc(-50vw + 50%);
                    left: 0;
                    right: 0;
                    background-image: url(${community?.banner_image || '/default-banner.jpg'});
                    background-size: cover;
                    background-position: center;
                    color: white;
                    display: flex;
                    align-items: flex-end;
                    padding: 40px 24px;
                    transform: translateX(0);
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
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    padding: 2rem;
                    z-index: 1;
                    max-width: 1200px;
                    margin: 0 auto;
                    width: 100%;
                    color: white;
                    background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
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

                .community-tabs {
                    display: flex;
                    gap: 1rem;
                    padding: 1rem;
                    background: white;
                    border-bottom: 1px solid #eaeaea;
                    margin-bottom: 24px;
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
                    color: #fa8072;
                }

                .tab.active {
                    color: #fa8072;
                    font-weight: 600;
                    background: rgba(250, 128, 114, 0.1);
                    border-radius: 4px;
                }

                .tab-content {
                    padding: 0;
                    margin: 0;
                    margin-top: 0;
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
                    background: #fa8072;
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
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                }

                .feed-content {
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    padding: 20px;
                }

                :global(.community-feed) {
                    width: 100%;
                }

                .overview-layout {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    grid-template-areas: "side feed";
                    gap: 2rem;
                    padding: 0 1rem 0 0;
                    margin: 0 auto;
                    align-items: start;
                }

                .side-column {
                    grid-area: side;
                    display: flex;
                    flex-direction: column;
                    gap: 22px;
                    width: 100%;
                }

                .main-column {
                    grid-area: feed;
                    width: 100%;
                    min-width: 0;
                }

                @media (max-width: 1024px) {
                    .overview-layout {
                        grid-template-columns: 1fr;
                        grid-template-areas: 
                            "feed"
                            "side";
                    }

                    .main-column {
                        position: static;
                        height: auto;
                        order: -1;
                    }
                }

                :global(body) {
                    margin: 0;
                    padding: 0;
                    overflow-x: hidden;
                }

                :global(#root) {
                    margin: 0;
                    padding: 0;
                }

                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }

                .modal-content {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    max-width: 500px;
                    width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                }

                .community-header {
                    position: relative;
                    z-index: 10;
                    width: 100%;
                    padding: 2rem;
                }

                .title-section {
                    max-width: 1200px;
                    margin: 0 auto;
                }

                .header-content {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 1rem;
                }

                .title-row {
                    display: flex;
                    align-items: center;
                    width: 100%;
                }

                .title-row h1 {
                    margin: 0;
                    color: white;
                    font-size: 2.5rem;
                }

                .description {
                    color: white;
                    font-size: 1.1rem;
                    margin: 0;
                    max-width: 800px;
                }

                .creator-info {
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 0.9rem;
                    margin: 0;
                }
            `}</style>
        </div>
    );
};

export default CommunityDetail;
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
import styled from 'styled-components';

const Section = styled.div`
  margin-bottom: 2rem;
`;

const ProductPlaceholder = styled.div`
  background: #f5f5f5;
  padding: 2rem;
  border-radius: 8px;
  margin: 1rem 0;
  text-align: center;
  border: 2px dashed #ddd;
`;

const CommunityDetail = () => {
    const { id } = useParams();
    const [community, setCommunity] = useState(null);
    const [isCreator, setIsCreator] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
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
                // Simple GET request without any headers
                const response = await api.get(`/communities/${id}/`);
                setCommunity(response.data);

                // Only check creator status if logged in
                const username = localStorage.getItem('username');
                if (username) {
                    setIsCreator(response.data.created_by === username);
                }

                setLoading(false);
            } catch (error) {
                console.error('Error fetching community:', error);
                setError('Failed to load community');
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
                        <AnnouncementsDashboard communityId={id} isLoggedIn={isLoggedIn} />
                    </div>
                </ErrorBoundary>
                <div className="sidebar-item">
                    <ErrorBoundary fallback={<div>Failed to load Spotify player</div>}>
                        <SpotifyPlayer communityId={id} isCreator={isCreator} isLoggedIn={isLoggedIn} />
                    </ErrorBoundary>
                </div>
            </div>

            <div className="community-banner">
                <div className="community-header">
                    <div className="title-section">
                        <div className="title-wrapper">
                            <h1>{community?.name}</h1>
                            {isCreator && (
                                <button 
                                    className="edit-button"
                                    onClick={() => {
                                        console.log('Edit button clicked');
                                        setShowEditModal(true);
                                    }}
                                >
                                    ⋮
                                </button>
                            )}
                        </div>
                        <p className="description">{community?.description}</p>
                        <p className="creator-info">
                            Created by <span className="creator-name">{community?.created_by || 'Unknown'}</span>
                        </p>
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
                                    isLoggedIn={isLoggedIn}
                                    onTabChange={setActiveTab}
                                />
                            </ErrorBoundary>
                            <Resources 
                                communityId={id} 
                                isCreator={isCreator}
                                isLoggedIn={isLoggedIn}
                                onTabChange={setActiveTab}
                            />
                            <RecommendedProducts 
                                communityId={id} 
                                isCreator={isCreator}
                                isLoggedIn={isLoggedIn} 
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
                    width: 100vw;
                    margin: 0;
                    padding: 0;
                    padding-right: ${isSidebarOpen ? '300px' : '0'};
                    transition: padding-right 0.3s ease;
                    overflow-x: hidden;
                    position: relative;
                    margin-left: calc((-100vw + 100%) / 2);
                    margin-right: calc((-100vw + 100%) / 2);
                }

                .community-banner {
                    position: relative;
                    width: 100%;
                    min-height: 300px;
                    background-image: url(${community?.banner_image || '/default-banner.jpg'});
                    background-size: cover;
                    background-position: center;
                    color: white;
                    padding: 3rem 2rem;
                    display: flex;
                    align-items: flex-end;
                    justify-content: flex-start;
                    background-color: rgba(0, 0, 0, 0.5);
                    background-blend-mode: overlay;
                }

                .community-header {
                    position: relative;
                    z-index: 2;
                    width: 100%;
                    max-width: 1200px;
                    margin: 0;
                    padding: 0;
                    text-align: left;
                }

                .title-section {
                    max-width: 800px;
                    text-align: left;
                    margin: 0;
                    padding: 0;
                }

                .title-wrapper {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.4rem;
                    margin-bottom: 1rem;
                }

                h1 {
                    margin: 0;
                    font-size: 3rem;
                    font-weight: bold;
                    color: white;
                    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
                }

                .description {
                    font-size: 1.25rem;
                    margin: 1rem 0;
                    max-width: 600px;
                    line-height: 1.5;
                    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
                }

                .creator-info {
                    font-size: 1rem;
                    opacity: 0.9;
                    margin: 0;
                    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
                }

                .edit-button {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 2.5rem;
                    padding: 0;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: inline-flex;
                    align-items: center;
                    line-height: 1;
                    position: relative;
                    top: -2px;
                }

                .edit-button:hover {
                    transform: scale(1.1);
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
                    padding: 0 2rem;
                    margin: 0 auto;
                    align-items: start;
                }

                .side-column {
                    grid-area: side;
                    display: flex;
                    flex-direction: column;
                    gap: 22px;
                    width: 100%;
                    margin-bottom: 2rem;
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

                .section-container {
                    background: white;
                    border-radius: 12px;
                    padding: 1.5rem;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    width: 100%;
                    margin: 0;
                    margin-bottom: 2rem;
                    box-sizing: border-box;
                    border: 1px solid #e0e0e0;
                    height: 352px;
                    display: flex;
                    flex-direction: column;
                }
            `}</style>
        </div>
    );
};

export default CommunityDetail;
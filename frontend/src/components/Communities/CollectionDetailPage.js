import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import './CollectionDetailPage.css';
import AddResourceForm from './AddResourceForm';

const CollectionDetailPage = () => {
    const { collectionId } = useParams();
    const navigate = useNavigate();
    const [collection, setCollection] = useState(null);
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        total_resources: 0,
        total_votes: 0,
        total_views: 0
    });
    const [previews, setPreviews] = useState({});
    const [showAddResource, setShowAddResource] = useState(false);
    const [showActionsMenu, setShowActionsMenu] = useState(false);
    const [savedResources, setSavedResources] = useState(new Set());

    const fetchCollection = async () => {
        try {
            const response = await api.get(`/resources/categories/${collectionId}/`);
            setCollection(response.data);
        } catch (err) {
            console.error('Error fetching collection:', err);
            setError('Failed to load collection');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await api.get(
                `/resources/categories/${collectionId}/stats/`,
                {
                    headers: { 'Authorization': `Token ${token}` }
                }
            );
            console.log('Stats API response:', response.data);
            setStats(response.data);
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    };

    const incrementCategoryViews = async () => {
        try {
            const token = localStorage.getItem('token');
            await api.post(
                `/resources/categories/${collectionId}/view/`,
                {},
                {
                    headers: { 'Authorization': `Token ${token}` }
                }
            );
            fetchStats();
        } catch (err) {
            console.error('Error incrementing category views:', err);
        }
    };

    const checkSavedResources = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await api.get(
                '/saved/resources/',
                {
                    headers: { 'Authorization': `Token ${token}` }
                }
            );
            const savedResourceIds = new Set(response.data.map(item => item.resource_id));
            setSavedResources(savedResourceIds);
        } catch (error) {
            console.error('Error checking saved resources:', error);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            if (collectionId) {
                await fetchCollection();
                await fetchResources();
                await fetchStats();
                await incrementCategoryViews();
                await checkSavedResources();
            }
        };
        fetchData();
    }, [collectionId]);

    const fetchResources = async () => {
        try {
            const response = await api.get('/resources/', {
                params: { category_id: collectionId }
            });
            
            console.log('Resource data:', response.data);
            const sortedResources = response.data.sort((a, b) => (b.votes || 0) - (a.votes || 0));
            setResources(sortedResources);
            
            const previewPromises = response.data.map(async (resource) => {
                const previewUrl = await getPreviewImage(resource.url);
                return [resource.id, previewUrl];
            });
            
            const previewResults = await Promise.all(previewPromises);
            const previewMap = Object.fromEntries(previewResults);
            setPreviews(previewMap);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching resources:', err);
            setError('Failed to load resources');
            setLoading(false);
        }
    };

    const getPreviewImage = async (url) => {
        try {
            // YouTube URL handling
            if (url.includes('youtube.com') || url.includes('youtu.be')) {
                const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
                if (videoId) {
                    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
                }
            }
            
            // IMDB URL handling - removed since it's unreliable
            
            const token = localStorage.getItem('token');
            const response = await api.get(
                `/preview/?url=${encodeURIComponent(url)}`,
                {
                    headers: { 
                        'Authorization': `Token ${token}`
                    },
                    timeout: 5000
                }
            );
            
            if (response.data.image) {
                return response.data.image;
            }
        } catch (error) {
            console.error('Failed to fetch preview:', error);
            return '/default-banner.jpg';
        }
        
        return '/default-banner.jpg';
    };

    const handleVote = async (resourceId, voteType) => {
        try {
            const response = await api.post(
                `/resources/${resourceId}/vote/`,
                { vote_type: voteType }
            );

            // Update and sort resources immediately
            setResources(prevResources => {
                const updatedResources = prevResources.map(resource => {
                    if (resource.id === resourceId) {
                        return {
                            ...resource,
                            votes: response.data.votes,
                            user_vote: response.data.user_vote
                        };
                    }
                    return resource;
                });
                
                // Sort the updated resources by votes
                return updatedResources.sort((a, b) => (b.votes || 0) - (a.votes || 0));
            });

            // Update the stats after voting
            fetchStats();
        } catch (err) {
            console.error('Error voting:', err);
        }
    };

    const handleVisit = async (resourceId) => {
        try {
            await api.post(`/resources/${resourceId}/view/`);
            fetchStats();
        } catch (err) {
            console.error('Error incrementing views:', err);
        }
    };

    const getTopResource = (resources) => {
        if (!resources.length) return null;
        return resources.reduce((max, resource) => 
            (resource.votes || 0) > (max.votes || 0) ? resource : max
        );
    };

    const handleBackClick = () => {
        if (collection?.community_id) {
            navigate(`/communities/${collection.community_id}`);
        } else {
            navigate(-1);
        }
    };

    const handleActionsClick = (e) => {
        e.stopPropagation();
        console.log('Actions clicked');
        setShowActionsMenu(!showActionsMenu);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showActionsMenu) {
                setShowActionsMenu(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [showActionsMenu]);

    const handleSaveResource = async (resourceId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await api.post(
                `/saved/${resourceId}/save_resource/`,
                {},
                {
                    headers: { 'Authorization': `Token ${token}` }
                }
            );
            
            if (response.data.status === 'saved') {
                setSavedResources(prev => new Set([...prev, resourceId]));
            } else {
                setSavedResources(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(resourceId);
                    return newSet;
                });
            }
        } catch (error) {
            console.error('Error saving resource:', error);
        }
    };

    if (loading) return <div>Loading resources...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="resource-page">
            <div className="resource-header">
                {collection?.preview_image && (
                    <div className="header-background">
                        <img 
                            src={collection.preview_image.startsWith('http') 
                                ? collection.preview_image 
                                : `${api.defaults.baseURL}${collection.preview_image}`}
                            alt={collection.name}
                        />
                    </div>
                )}
                <div className="resource-header-content">
                    <button onClick={handleBackClick} className="back-button">
                        <span>←</span> Back to the Community
                    </button>
                    <div className="header-text">
                        <h1 className="collection-title">{collection?.name}</h1>
                        <p className="collection-description">{collection?.description}</p>
                    </div>
                    <div className="stats-container">
                        <div className="stat-box">
                            <span className="stat-number">{stats?.total_resources || 0}</span>
                            <span className="stat-label">RESOURCES</span>
                        </div>
                        <div className="stat-box">
                            <span className="stat-number">{stats?.total_votes || 0}</span>
                            <span className="stat-label">VOTES</span>
                        </div>
                        <div className="stat-box">
                            <span className="stat-number">{stats?.total_views || 0}</span>
                            <span className="stat-label">VIEWS</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="content-wrapper">
                <div className="actions-container">
                    <div style={{ marginLeft: 'auto' }}>
                        <button 
                            className="add-resource-button"
                            onClick={() => setShowAddResource(true)}
                        >
                            + Add Resource
                        </button>
                    </div>
                </div>

                {showAddResource && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <AddResourceForm
                                categoryId={collectionId}
                                onSuccess={(newResource) => {
                                    setShowAddResource(false);
                                    fetchResources();
                                }}
                                onClose={() => setShowAddResource(false)}
                            />
                        </div>
                    </div>
                )}

                <div className="resources">
                    {resources.length === 0 ? (
                        <div className="no-resources">
                            <p>No resources yet. Add some!</p>
                            <button 
                                className="add-resource-button"
                                onClick={() => setShowAddResource(true)}
                            >
                                + Add Resource
                            </button>
                        </div>
                    ) : (
                        <div className="resources-grid">
                            {resources.map(resource => {
                                const isTopResource = resource.id === getTopResource(resources)?.id;
                                return (
                                    <div 
                                        key={resource.id} 
                                        className={`resource-list-item ${isTopResource ? 'top-resource' : ''}`}
                                    >
                                        {isTopResource && (
                                            <div className="top-badge">
                                                🏆 Community Favourite
                                            </div>
                                        )}
                                        <div className="vote-section">
                                            <button 
                                                className={`vote-button upvote ${resource.user_vote === 'up' ? 'active' : ''}`}
                                                onClick={() => handleVote(resource.id, 'up')}
                                            >
                                                ▲
                                            </button>
                                            <span className="vote-count">{resource.votes || 0}</span>
                                            <button 
                                                className={`vote-button downvote ${resource.user_vote === 'down' ? 'active' : ''}`}
                                                onClick={() => handleVote(resource.id, 'down')}
                                            >
                                                ▼
                                            </button>
                                        </div>
                                        <div className="resource-thumbnail">
                                            <img 
                                                src={previews[resource.id] || '/default-banner.jpg'}
                                                alt={resource.title}
                                                onError={(e) => {
                                                    e.target.src = '/default-banner.jpg';
                                                }}
                                            />
                                        </div>
                                        <div className="resource-details">
                                            <h3 className="resource-title">{resource.title}</h3>
                                            {resource.remark && (
                                                <p className="resource-remarks">{resource.remark}</p>
                                            )}
                                            <a 
                                                href={resource.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="visit-button"
                                                onClick={() => handleVisit(resource.id)}
                                            >
                                                Visit Resource
                                            </a>
                                        </div>
                                        <div className="resource-actions">
                                            <button 
                                                onClick={() => handleSaveResource(resource.id)}
                                                className={`save-button ${savedResources.has(resource.id) ? 'saved' : ''}`}
                                                title={savedResources.has(resource.id) ? 'Unsave Resource' : 'Save Resource'}
                                            >
                                                {savedResources.has(resource.id) ? '★' : '☆'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .resource-page {
                    margin-top: -70px; /* Adjust this value based on your navbar height */
                }

                .resource-header {
                    position: relative;
                    height: 400px;
                    overflow: hidden;
                    border-radius: 0; /* Remove border radius */
                    margin: 0; /* Remove any margin */
                }

                .content-wrapper {
                    position: relative;
                    z-index: 2;
                    padding: 0 2rem;
                    margin-top: 0;
                }

                .save-button {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.2);
                    border: 2px solid white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    color: white;
                    transition: all 0.2s ease;
                }

                .save-button:hover {
                    background: rgba(255, 255, 255, 0.3);
                    transform: scale(1.05);
                }

                .save-button.saved {
                    color: #ffd700;
                    border-color: #ffd700;
                }

                .header-background {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                }

                .header-background::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);  // Dark overlay
                }

                .header-background img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;  // This maintains aspect ratio
                    object-position: center;  // Centers the image
                }

                .resource-header-content {
                    position: relative;
                    z-index: 1;
                    padding: 2rem;
                    color: white;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    gap: 3rem;  // Increased gap to move stats lower
                }

                .back-button {
                    position: absolute;
                    top: 1rem;
                    left: 1rem;
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.9rem;
                    padding: 0.5rem;
                    opacity: 0.8;
                    transition: all 0.2s;
                }

                .back-button:hover {
                    opacity: 1;
                    background: #fa8072; /* Base coral */
                }

                .header-text {
                    text-align: center;
                    max-width: 800px;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }

                .collection-title {
                    font-size: 2.5rem;
                    margin: 0 0 1rem 0;
                    font-weight: bold;
                }

                .collection-description {
                    font-size: 1.1rem;
                    opacity: 0.9;
                    margin: 0;
                    line-height: 1.5;
                }

                .stats-container {
                    display: flex;
                    justify-content: center;
                    gap: 0.75rem;  // Reduced gap between stat boxes
                }

                .stat-box {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    background: rgba(255, 255, 255, 0.1);
                    padding: 0.25rem 0.5rem;  // Reduced padding
                    border-radius: 4px;
                    min-width: 60px;  // Reduced min-width
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }

                .stat-number {
                    font-size: 0.85rem;  // Reduced from 0.95rem
                    font-weight: bold;
                    margin-bottom: 0.1rem;
                    color: white;
                }

                .stat-label {
                    font-size: 0.6rem;  // Reduced from 0.65rem
                    text-transform: uppercase;
                    opacity: 0.8;
                    color: white;
                }

                .banner {
                    position: relative;
                    padding: 2rem;
                    color: white;
                    text-align: center;
                    background: rgba(0, 0, 0, 0.5);
                    margin-bottom: 2rem;
                }

                .top-resource {
                    margin-bottom: 2rem;
                    padding: 1.5rem;
                    background: linear-gradient(135deg, #fffbeb, #fef3c7);
                    border-radius: 12px;
                    position: relative;
                    border: 1px solid #fcd34d;
                }

                .top-badge {
                    position: absolute;
                    top: -12px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #f59e0b;
                    color: white;
                    padding: 4px 16px;
                    border-radius: 20px;
                    font-weight: 600;
                    font-size: 0.9rem;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    z-index: 1;
                }

                .resource-list-item.top-resource {
                    background: linear-gradient(135deg, #fffbeb, #fef3c7);
                    border: 1px solid #fcd34d;
                    position: relative;
                }

                .resource-list-item {
                    display: flex;
                    gap: 1.5rem;
                    padding: 1rem;
                    background: white;
                    border: 1px solid #eaeaea;
                    border-radius: 8px;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }

                .resource-list-item:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }

                .resource-thumbnail {
                    flex-shrink: 0;
                    width: 180px;
                    height: 120px;
                    border-radius: 6px;
                    overflow: hidden;
                }

                .resource-thumbnail img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .resource-details {
                    flex-grow: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .resource-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: #1a1a1a;
                    margin: 0 0 0.5rem 0;
                }

                .visit-button {
                    align-self: flex-start;
                    padding: 0.5rem 1rem;
                    background: white;
                    color: #fa8072; /* Base coral */
                    border: 1px solid #fa8072; /* Base coral border */
                    text-decoration: none;
                    border-radius: 4px;
                    font-size: 0.9rem;
                    transition: all 0.2s;
                }

                .visit-button:hover {
                    background: #ff9288; /* Lighter coral */
                    color: white;
                    border-color: #ff9288;
                }

                .vote-section {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 0.5rem;
                    gap: 0.25rem;
                }

                .vote-button {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: #666;
                    font-size: 1.2rem;
                    padding: 4px;
                    transition: color 0.2s ease;
                }

                .vote-button:hover {
                    color: #333;
                }

                .vote-button.active.upvote {
                    color: #2ecc71;
                }

                .vote-button.active.downvote {
                    color: #e74c3c;
                }

                .vote-count {
                    font-weight: 600;
                    color: #333;
                }

                @media (max-width: 640px) {
                    .resource-list-item {
                        flex-direction: column;
                    }

                    .resource-thumbnail {
                        width: 100%;
                        height: 160px;
                    }
                }

                .resources-grid {
                    display: flex;
                    flex-direction: column;  // Changed from grid to column flex
                    gap: 1.5rem;
                    padding: 1rem;
                    max-width: 1000px;  // Optional: keeps the list from getting too wide
                    margin: 0 auto;     // Optional: centers the list
                }

                .resource-list-item {
                    display: flex;
                    gap: 1.5rem;
                    padding: 1rem;
                    background: white;
                    border: 1px solid #eaeaea;
                    border-radius: 8px;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }

                .resource-list-item:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }

                .resource-list-item.top-resource {
                    background: linear-gradient(135deg, #fffbeb, #fef3c7);
                    border: 1px solid #fcd34d;
                    position: relative;
                }

                .actions-container {
                    display: flex;
                    padding: 1rem 0;
                    margin-bottom: 2rem;
                }

                .actions-button {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    color: #666;
                    cursor: pointer;
                    padding: 0.5rem;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background-color 0.2s;
                }

                .actions-button:hover {
                    background: rgba(0, 0, 0, 0.05);
                    color: #333;
                }

                .actions-wrapper {
                    position: relative;
                }

                .actions-menu {
                    position: absolute;
                    top: 100%;
                    right: 0;
                    background: white;
                    border-radius: 4px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    z-index: 100;
                    min-width: 150px;
                }

                .actions-menu button {
                    display: block;
                    width: 100%;
                    padding: 0.75rem 1rem;
                    text-align: left;
                    border: none;
                    background: none;
                    cursor: pointer;
                    color: #333;
                    font-size: 0.9rem;
                }

                .actions-menu button:hover {
                    background: #f5f5f5;
                }

                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }

                .modal-content {
                    background: white;
                    padding: 2rem;
                    border-radius: 8px;
                    max-width: 500px;
                    width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                }

                .add-resource-button {
                    background: white;
                    color: #fa8072;
                    border: 1px solid #fa8072;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .add-resource-button:hover {
                    background: #ff9288;
                    color: white;
                    border-color: #ff9288;
                }

                .no-resources {
                    text-align: center;
                    padding: 3rem;
                    background: #f8f9fa;
                    border-radius: 8px;
                    margin: 2rem 0;
                }

                .no-resources p {
                    margin-bottom: 1.5rem;
                    color: #666;
                }

                .resource-remarks {
                    color: #666;
                    font-size: 0.9rem;
                    margin: 0.5rem 0 1rem 0;
                    line-height: 1.4;
                }

                .resource-actions {
                    display: flex;
                    align-items: flex-start;
                    padding: 0.5rem;
                }

                .resource-actions .save-button {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: white;
                    border: 1px solid #fa8072;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    color: #fa8072;
                    transition: all 0.2s;
                    position: relative;
                }

                .resource-actions .save-button:hover {
                    background: #ff9288;
                    color: white;
                    border-color: #ff9288;
                }

                .resource-actions .save-button.saved {
                    color: #ffd700;
                    border-color: #ffd700;
                }
            `}</style>
        </div>
    );
};

export default CollectionDetailPage;
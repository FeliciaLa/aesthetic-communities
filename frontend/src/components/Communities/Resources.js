import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './Resources.css';
import CollectionForm from './CollectionForm';
import EditCollectionForm from './EditCollectionForm';
import CollectionDetailPage from './CollectionDetailPage';
import AddResourceForm from './AddResourceForm';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

const Resources = ({ communityId, isCreator, onTabChange }) => {
    const [collections, setCollections] = useState([]);
    const [selectedCollection, setSelectedCollection] = useState(null);
    const [showAddCollection, setShowAddCollection] = useState(false);
    const [showEditCollection, setShowEditCollection] = useState(false);
    const [editingCollection, setEditingCollection] = useState(null);
    const [error, setError] = useState(null);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [stats, setStats] = useState({
        total_resources: 0,
        total_votes: 0,
        total_views: 0
    });
    const navigate = useNavigate();

    const fetchCollections = async () => {
        try {
            const token = localStorage.getItem('token');
            console.log('Fetching collections for community:', communityId);
            
            const response = await axios.get(
                'http://localhost:8000/api/resources/categories/',
                {
                    params: { community_id: communityId },
                    headers: { 
                        'Authorization': `Token ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.log('Collections response:', response.data);
            setCollections(response.data);
        } catch (err) {
            console.error('Error fetching collections:', err.response || err);
            setError(err.response?.data?.error || 'Failed to fetch collections');
        }
    };

    useEffect(() => {
        if (communityId) {
            fetchCollections();
        }
    }, [communityId]);

    useEffect(() => {
        const handleClickOutside = () => setActiveDropdown(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const handleActionsClick = (collectionId) => {
        if (activeDropdown === collectionId) {
            setActiveDropdown(null);
        } else {
            setActiveDropdown(collectionId);
        }
    };

    const handleEditClick = (collection) => {
        setEditingCollection(collection);
        setShowEditCollection(true);
        setActiveDropdown(null);
    };

    const handleEditSuccess = (updatedCollection) => {
        setCollections(prevCollections => 
            prevCollections.map(coll => 
                coll.id === updatedCollection.id ? updatedCollection : coll
            )
        );
        setShowEditCollection(false);
        setEditingCollection(null);
    };

    const handleCollectionSuccess = (newCollection) => {
        setCollections(prevCollections => [...prevCollections, newCollection]);
        setShowAddCollection(false);
    };

    const handleDeleteClick = async (collectionId) => {
        if (window.confirm('Are you sure you want to delete this collection?')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(
                    `http://localhost:8000/api/resources/categories/${collectionId}/`,
                    {
                        headers: { 'Authorization': `Token ${token}` }
                    }
                );
                fetchCollections();
                setActiveDropdown(null);
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to delete collection');
            }
        }
    };

    const handleCollectionClick = (collection, e) => {
        // Prevent navigation if clicking the edit button
        if (e.target.className === 'edit-button') {
            return;
        }
        navigate(`/communities/${communityId}/resources/${collection.id}`);
    };

    const handleStatsUpdate = useCallback((newStats) => {
        console.log('Received new stats:', newStats);
        setStats(newStats);
    }, []);

    // Add this useEffect to monitor stats changes
    useEffect(() => {
        console.log('Stats updated:', stats);
    }, [stats]);

    const handleAllClick = () => {
        if (onTabChange) {
            onTabChange('resources');
        }
    };

    const ResourceCollections = ({ collections, isCreator, onEdit }) => {
        return (
            <div className="collections-container">
                <div className="collections-header">
                    <h3>Resource Collections</h3>
                    <div className="header-buttons">
                        {isCreator && (
                            <button 
                                className="add-collection-button"
                                onClick={() => setShowAddCollection(true)}
                            >
                                +
                            </button>
                        )}
                        <button 
                            className="all-collections-button"
                            onClick={handleAllClick}
                        >
                            All
                        </button>
                    </div>
                </div>
                {collections.length === 0 ? (
                    <div className="collection-placeholder">
                        <div className="placeholder-content">
                            <i className="far fa-folder-open"></i>
                            <p>No collections yet</p>
                        </div>
                    </div>
                ) : (
                    <div className="collections-scroll">
                        {collections.map(collection => (
                            <div 
                                key={collection.id} 
                                className="collection-card"
                                onClick={(e) => handleCollectionClick(collection, e)}
                            >
                                {collection.preview_image && (
                                    <img
                                        src={collection.preview_image.startsWith('http') 
                                            ? collection.preview_image 
                                            : `http://localhost:8000${collection.preview_image}`}
                                        alt={collection.name}
                                        className="collection-preview"
                                    />
                                )}
                                {!collection.preview_image && (
                                    <div className="collection-preview-placeholder">
                                        No preview image
                                    </div>
                                )}
                                <div className="collection-info">
                                    <h3>{collection.name}</h3>
                                    <p>{collection.description}</p>
                                </div>
                                {isCreator && (
                                    <button 
                                        className="edit-button" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEdit(collection);
                                        }}
                                    >
                                        Edit
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <style jsx>{`
                    .collections-container {
                        position: relative;
                        width: 100%;
                        margin: 0;
                    }

                    .collections-header {
                        margin-bottom: 16px;
                    }

                    .collections-scroll {
                        display: flex;
                        gap: 20px;
                        overflow-x: auto;
                        padding: 10px 0;
                        -webkit-overflow-scrolling: touch;
                        scrollbar-width: thin;
                        scrollbar-color: #888 #f1f1f1;
                    }

                    .collection-card {
                        flex: 0 0 300px;
                        border: 1px solid #eee;
                        border-radius: 8px;
                        overflow: hidden;
                        background: white;
                        position: relative;
                        cursor: pointer;
                        transition: transform 0.2s, box-shadow 0.2s;
                    }

                    .collection-card:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    }

                    .collection-preview {
                        width: 100%;
                        height: 200px;
                        object-fit: cover;
                    }

                    .collection-preview-placeholder {
                        width: 100%;
                        height: 200px;
                        background: #f5f5f5;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #999;
                    }

                    .collection-info {
                        padding: 15px;
                    }

                    .collection-info h3 {
                        margin: 0 0 10px 0;
                        font-size: 1.2rem;
                    }

                    .collection-info p {
                        margin: 0;
                        color: #666;
                        font-size: 0.9rem;
                    }

                    .edit-button {
                        position: absolute;
                        top: 10px;
                        right: 10px;
                        background: rgba(0, 0, 0, 0.5);
                        color: white;
                        border: none;
                        padding: 5px 10px;
                        border-radius: 4px;
                        cursor: pointer;
                        transition: background 0.2s;
                        z-index: 1;
                    }

                    .edit-button:hover {
                        background: rgba(0, 0, 0, 0.7);
                    }

                    .collection-placeholder {
                        width: 300px;
                        height: 200px;
                        background: #f5f5f5;
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-top: 0.25rem;
                    }

                    .placeholder-content {
                        text-align: center;
                        color: #999;
                        padding: 20px;
                    }

                    .placeholder-content i {
                        font-size: 3rem;
                        margin-bottom: 1rem;
                        display: block;
                    }

                    .placeholder-content p {
                        margin: 5px 0;
                        font-size: 0.9rem;
                    }

                    /* Add this to target the Recommended Products section */
                    :global(.recommended-products) {
                        margin-top: 0.25rem;
                    }
                `}</style>
            </div>
        );
    };

    return (
        <div className="resources-container">
            <ResourceCollections collections={collections} isCreator={isCreator} onEdit={handleEditClick} />

            {showAddCollection && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <CollectionForm
                            communityId={communityId}
                            onSuccess={handleCollectionSuccess}
                            onClose={() => setShowAddCollection(false)}
                        />
                    </div>
                </div>
            )}

            {selectedCollection && (
                <>
                    <div className="banner">
                        <Link to="/communities" className="back-button">
                            ← Back to the Community
                        </Link>
                        <h1>{selectedCollection.name}</h1>
                        <p>{selectedCollection.description}</p>
                    </div>
                    
                    <CollectionDetailPage
                        collectionId={selectedCollection.id}
                        onStatsUpdate={handleStatsUpdate}
                    />
                </>
            )}

            {showEditCollection && editingCollection && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <EditCollectionForm
                            collection={editingCollection}
                            onSuccess={handleEditSuccess}
                            onClose={() => {
                                setShowEditCollection(false);
                                setEditingCollection(null);
                            }}
                        />
                    </div>
                </div>
            )}

            {error && <div className="error-message">{error}</div>}
        </div>
    );
};

export default Resources; 
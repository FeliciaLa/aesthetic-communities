import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './Resources.css';
import CollectionForm from './CollectionForm';
import EditCollectionForm from './EditCollectionForm';
import CollectionDetailPage from './CollectionDetailPage';
import AddResourceForm from './AddResourceForm';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

const Resources = ({ communityId, isOwner }) => {
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

    const handleCollectionClick = (collectionId) => {
        navigate(`/resources/categories/${collectionId}`);
    };

    const handleStatsUpdate = useCallback((newStats) => {
        console.log('Received new stats:', newStats);
        setStats(newStats);
    }, []);

    // Add this useEffect to monitor stats changes
    useEffect(() => {
        console.log('Stats updated:', stats);
    }, [stats]);

    return (
        <div className="resources-container">
            <div className="collections-header">
                <h3>Resource Collections</h3>
                <button 
                    className="add-collection-button"
                    onClick={() => setShowAddCollection(true)}
                >
                    <span>+</span> Add Collection
                </button>
            </div>
            <div className="collections-grid">
                {collections.map(collection => (
                    <div 
                        key={collection.id} 
                        className="collection-card"
                        onClick={() => handleCollectionClick(collection.id)}
                    >
                        {collection.preview_image && (
                            <img 
                                src={collection.preview_image} 
                                alt={collection.name}
                                className="collection-preview"
                            />
                        )}
                        <h3>{collection.name}</h3>
                        <p>{collection.description}</p>
                        
                        <div className="collection-actions">
                            <button 
                                className="actions-button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleActionsClick(collection.id);
                                }}
                            >
                                ⋮
                            </button>
                            {activeDropdown === collection.id && (
                                <div className="actions-dropdown show">
                                    <button onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditClick(collection);
                                    }}>
                                        Edit
                                    </button>
                                    <button 
                                        className="delete"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteClick(collection.id);
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

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
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Resources.css';
import CollectionForm from './CollectionForm';
import EditCollectionForm from './EditCollectionForm';
import ResourceList from './ResourceList';
import AddResourceForm from './AddResourceForm';

const Resources = ({ communityId }) => {
    const [collections, setCollections] = useState([]);
    const [selectedCollection, setSelectedCollection] = useState(null);
    const [showAddCollection, setShowAddCollection] = useState(false);
    const [showEditCollection, setShowEditCollection] = useState(false);
    const [editingCollection, setEditingCollection] = useState(null);
    const [error, setError] = useState(null);
    const [showAddResource, setShowAddResource] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);

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

    const handleEditClick = (collection) => {
        setEditingCollection(collection);
        setShowEditCollection(true);
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
                
                // Remove the deleted collection from state
                setCollections(prevCollections => 
                    prevCollections.filter(collection => collection.id !== collectionId)
                );
            } catch (err) {
                console.error('Error deleting collection:', err);
                setError('Failed to delete collection');
            }
        }
    };

    const handleCollectionClick = (collection) => {
        setSelectedCollection(collection);
    };

    const handleAddResourceClick = () => {
        setShowAddResource(true);
    };

    const handleActionsClick = (e, collectionId) => {
        e.stopPropagation();
        setActiveDropdown(activeDropdown === collectionId ? null : collectionId);
    };

    return (
        <div className="resources-container">
            <button 
                className="add-collection-button"
                onClick={() => setShowAddCollection(true)}
            >
                + Add Collection
            </button>

            <div className="collections-grid">
                {collections.map(collection => (
                    <div 
                        key={collection.id} 
                        className={`collection-card ${selectedCollection?.id === collection.id ? 'selected' : ''}`}
                        onClick={() => handleCollectionClick(collection)}
                    >
                        {collection.preview_image && (
                            <img 
                                src={collection.preview_image} 
                                alt={collection.name} 
                                className="collection-preview"
                            />
                        )}
                        <div className="collection-actions">
                            <button 
                                className="actions-button"
                                onClick={(e) => handleActionsClick(e, collection.id)}
                            >
                                Actions
                            </button>
                            <div className={`actions-dropdown ${activeDropdown === collection.id ? 'show' : ''}`}>
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
                        </div>
                        <h3>{collection.name}</h3>
                        <p>{collection.description}</p>
                    </div>
                ))}
            </div>

            {selectedCollection && (
                <div className="resources-list">
                    <h2>{selectedCollection.name} Resources</h2>
                    <button 
                        className="add-resource-button"
                        onClick={handleAddResourceClick}
                    >
                        + Add Resource
                    </button>
                    <ResourceList 
                        collectionId={selectedCollection.id}
                        onClose={() => setSelectedCollection(null)}
                    />
                </div>
            )}

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

            {showAddResource && selectedCollection && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <AddResourceForm
                            categoryId={selectedCollection.id}
                            onSuccess={(newResource) => {
                                // Update the ResourceList component
                                setShowAddResource(false);
                            }}
                            onClose={() => setShowAddResource(false)}
                        />
                    </div>
                </div>
            )}

            {error && <div className="error-message">{error}</div>}
        </div>
    );
};

export default Resources; 
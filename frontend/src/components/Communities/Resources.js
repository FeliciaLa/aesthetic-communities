import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Resources.css';

const Resources = ({ communityId }) => {
    const [categories, setCategories] = useState([]);
    const [resources, setResources] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newResource, setNewResource] = useState({
        title: '',
        description: '',
        url: '',
        author: ''
    });

    const fetchCategories = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://localhost:8000/api/resources/categories/`,
                {
                    params: { community_id: communityId },
                    headers: { 
                        'Authorization': `Token ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            console.log('Categories fetched:', response.data); // Debug log
            setCategories(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching categories:', err);
            setError('Failed to fetch categories');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, [communityId]);

    useEffect(() => {
        if (selectedCategory) {
            console.log('Selected category changed:', selectedCategory); // Debug log
            fetchResources(selectedCategory.id);
        }
    }, [selectedCategory]);

    const fetchResources = async (categoryId) => {
        try {
            const token = localStorage.getItem('token');
            console.log('Fetching resources for category:', categoryId); // Debug log
            console.log('Token:', token); // Debug log
            
            const response = await axios.get(
                `http://localhost:8000/api/resources/`,
                {
                    params: { category_id: categoryId },
                    headers: { 
                        'Authorization': `Token ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            console.log('Resources response:', response.data); // Debug log
            setResources(response.data);
        } catch (err) {
            console.error('Error details:', err.response?.data || err.message); // More detailed error
            setError('Failed to fetch resources');
        }
    };

    const handleAddResource = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                'http://localhost:8000/api/resources/',
                {
                    ...newResource,
                    category: selectedCategory.id
                },
                {
                    headers: { 
                        'Authorization': `Token ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            setResources([...resources, response.data]);
            setNewResource({ title: '', description: '', url: '', author: '' });
        } catch (err) {
            console.error('Error adding resource:', err);
            setError('Failed to add resource');
        }
    };

    if (loading) return <div>Loading categories...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="resources-section">
            <div className="resources-sidebar">
                <h3>Collections</h3>
                <div className="collection-list">
                    <h4>Collection List</h4>
                    {categories.length > 0 ? (
                        categories.map(category => (
                            <div
                                key={category.id}
                                className={`collection-item ${selectedCategory?.id === category.id ? 'selected' : ''}`}
                                onClick={() => setSelectedCategory(category)}
                            >
                                {category.name}
                            </div>
                        ))
                    ) : (
                        <div>No collections available</div>
                    )}
                </div>
            </div>

            <div className="resources-content">
                {selectedCategory ? (
                    <>
                        <h2>{selectedCategory.name}</h2>
                        <p>{selectedCategory.description}</p>

                        <div className="add-resource-section">
                            <h3>Add New {selectedCategory.category_type.toLowerCase()}</h3>
                            <form onSubmit={handleAddResource} className="add-resource-form">
                                <input
                                    type="text"
                                    placeholder="Title"
                                    value={newResource.title}
                                    onChange={(e) => setNewResource({...newResource, title: e.target.value})}
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Author/Creator"
                                    value={newResource.author}
                                    onChange={(e) => setNewResource({...newResource, author: e.target.value})}
                                />
                                <textarea
                                    placeholder="Description"
                                    value={newResource.description}
                                    onChange={(e) => setNewResource({...newResource, description: e.target.value})}
                                />
                                <input
                                    type="url"
                                    placeholder="URL (e.g., IMDB link, purchase link, video URL)"
                                    value={newResource.url}
                                    onChange={(e) => setNewResource({...newResource, url: e.target.value})}
                                />
                                <button type="submit">Add {selectedCategory.category_type.slice(0, -1)}</button>
                            </form>
                        </div>

                        <div className="resources-list">
                            <h3>{selectedCategory.name} List</h3>
                            {resources.length > 0 ? (
                                <div className="resource-grid">
                                    {resources.map(resource => (
                                        <div key={resource.id} className="resource-card">
                                            <h4>{resource.title}</h4>
                                            {resource.author && <p className="author">By: {resource.author}</p>}
                                            <p className="description">{resource.description}</p>
                                            {resource.url && (
                                                <a href={resource.url} target="_blank" rel="noopener noreferrer" className="resource-link">
                                                    View {selectedCategory.category_type.slice(0, -1)}
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p>No items in this collection yet</p>
                            )}
                        </div>
                    </>
                ) : (
                    <div>Select a collection to view and add items</div>
                )}
            </div>
        </div>
    );
};

export default Resources; 
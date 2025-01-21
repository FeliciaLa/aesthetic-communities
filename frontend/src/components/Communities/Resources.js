import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Resources = ({ communityId }) => {
    const [categories, setCategories] = useState([]);
    const [resources, setResources] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchCategories();
    }, [communityId]);

    useEffect(() => {
        if (selectedCategory) {
            fetchResources(selectedCategory.id);
        }
    }, [selectedCategory]);

    const fetchCategories = async () => {
        try {
            console.log('Fetching categories for community:', communityId);
            const response = await axios.get(`/api/communities/${communityId}/resources/categories/`);
            console.log('Response:', response.data);
            setCategories(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching categories:', err);
            setError('Failed to load categories');
            setLoading(false);
        }
    };

    const fetchResources = async (categoryId) => {
        try {
            const response = await axios.get(`/api/communities/${communityId}/resources/?category_id=${categoryId}`);
            setResources(response.data);
        } catch (err) {
            setError('Failed to load resources');
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="resources-container">
            <div className="categories-sidebar">
                <h3>Resource Categories</h3>
                {categories.map(category => (
                    <div 
                        key={category.id}
                        className={`category-item ${category.is_preset ? 'preset' : ''} 
                                 ${selectedCategory?.id === category.id ? 'selected' : ''}`}
                        onClick={() => setSelectedCategory(category)}
                    >
                        {category.name}
                    </div>
                ))}
            </div>

            <div className="resources-content">
                {selectedCategory ? (
                    <>
                        <h2>{selectedCategory.name}</h2>
                        <p>{selectedCategory.description}</p>
                        
                        <div className="resources-grid">
                            {resources.map(resource => (
                                <div key={resource.id} className="resource-card">
                                    <h3>{resource.title}</h3>
                                    <p>{resource.description}</p>
                                    {resource.resource_type === 'LINK' && (
                                        <a href={resource.url} target="_blank" rel="noopener noreferrer">
                                            Visit Link
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="select-category-message">
                        Select a category to view resources
                    </div>
                )}
            </div>

            <style jsx>{`
                .resources-container {
                    display: flex;
                    gap: 2rem;
                    padding: 20px;
                }

                .categories-sidebar {
                    width: 250px;
                    background: #f5f5f5;
                    padding: 20px;
                    border-radius: 8px;
                }

                .category-item {
                    padding: 10px;
                    margin: 5px 0;
                    cursor: pointer;
                    border-radius: 4px;
                    transition: all 0.2s;
                }

                .category-item:hover {
                    background: #e0e0e0;
                }

                .category-item.selected {
                    background: #007bff;
                    color: white;
                }

                .preset {
                    border-left: 3px solid #007bff;
                }

                .resources-content {
                    flex: 1;
                    padding: 20px;
                }

                .resources-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                    gap: 20px;
                    margin-top: 20px;
                }

                .resource-card {
                    padding: 15px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    background: white;
                }

                .select-category-message {
                    text-align: center;
                    color: #666;
                    margin-top: 40px;
                }
            `}</style>
        </div>
    );
};

export default Resources; 
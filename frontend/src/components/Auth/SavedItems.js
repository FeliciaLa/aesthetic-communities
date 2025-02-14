import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

// Add these styled components at the top of your file, after the imports
const CollectionPreview = styled.div`
    width: 100%;
    height: 150px;
    overflow: hidden;
    border-radius: 8px;
    margin-bottom: 12px;
    
    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
`;

const PreviewImage = styled.img`
    width: 100%;
    height: 100%;
    object-fit: cover;
`;

const PlaceholderImage = styled.div`
    width: 100%;
    height: 100%;
    background-color: #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #666;
    font-size: 14px;
`;

const SavedCollection = styled.div`
    background: white;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const CollectionsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
    padding: 20px 0;
`;

const ResourcesGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
    padding: 20px 0;
`;

const SavedResource = styled.div`
    background: white;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const FALLBACK_IMAGE = '/default-product.png';

const SavedItems = () => {
    const [activeTab, setActiveTab] = useState('images');
    const [savedImages, setSavedImages] = useState([]);
    const [savedResources, setSavedResources] = useState([]);
    const [savedProducts, setSavedProducts] = useState([]);
    const [savedCollections, setSavedCollections] = useState([]);
    const [previews, setPreviews] = useState({});
    const [collectionPreviews, setCollectionPreviews] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const getPreviewImage = async (url) => {
        try {
            // YouTube URL handling
            if (url.includes('youtube.com') || url.includes('youtu.be')) {
                const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
                if (videoId) {
                    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
                }
            }
            
            const token = localStorage.getItem('token');
            const response = await api.get(
                `preview/?url=${encodeURIComponent(url)}`,
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

    const fetchSavedItems = async () => {
        try {
            // Fetch saved images
            const imagesRes = await api.get('saved/images/', {
                headers: { 'Authorization': `Token ${localStorage.getItem('token')}` }
            });
            setSavedImages(imagesRes.data);

            // Fetch saved products
            const productsRes = await api.get('saved/products/', {
                headers: { 'Authorization': `Token ${localStorage.getItem('token')}` }
            });
            setSavedProducts(productsRes.data);

            // Fetch saved collections
            const collectionsRes = await api.get('saved/collections/', {
                headers: { 'Authorization': `Token ${localStorage.getItem('token')}` }
            });
            console.log('Saved collections data:', collectionsRes.data);
            setSavedCollections(collectionsRes.data);

            // Fetch saved resources
            const resourcesRes = await api.get('saved/resources/', {
                headers: { 'Authorization': `Token ${localStorage.getItem('token')}` }
            });
            console.log('Saved resources:', resourcesRes.data);
            setSavedResources(resourcesRes.data);

            // Get previews for resources
            const previewPromises = resourcesRes.data.map(async (resource) => {
                console.log('Getting preview for URL:', resource.url);
                const previewUrl = await getPreviewImage(resource.url);
                console.log('Preview URL result:', previewUrl);
                return [resource.id, previewUrl];
            });
            
            const previewResults = await Promise.all(previewPromises);
            console.log('Preview results:', previewResults);
            const previewMap = Object.fromEntries(previewResults);
            setPreviews(previewMap);
        } catch (error) {
            console.error('Error fetching saved items:', error);
            setError('Failed to load saved items');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSavedItems();
    }, []);

    return (
        <div className="saved-items-section">
            <div className="profile-card">
                <h2 style={{ textAlign: 'left', marginBottom: '1rem' }}>Saved Items</h2>
                
                <div className="tabs">
                    <button 
                        className={`tab ${activeTab === 'images' ? 'active' : ''}`}
                        onClick={() => setActiveTab('images')}
                    >
                        Images
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

                <div className="saved-items-content">
                    {activeTab === 'images' && (
                        <div className="saved-images-grid">
                            {savedImages.length === 0 ? (
                                <p className="empty-message">No saved images yet</p>
                            ) : (
                                savedImages.map(savedImage => (
                                    <div key={savedImage.id} className="saved-image">
                                        <img 
                                            src={savedImage.image_url.startsWith('http') 
                                                ? savedImage.image_url 
                                                : `${process.env.REACT_APP_API_URL}${savedImage.image_url}`
                                            }
                                            alt={`Image from ${savedImage.community_name}`}
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = FALLBACK_IMAGE;
                                            }}
                                            className="saved-image-preview"
                                        />
                                        <div className="image-overlay">
                                            <Link 
                                                to={`/communities/${savedImage.community_id}`}
                                                className="community-link"
                                            >
                                                {savedImage.community_name}
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'resources' && (
                        <div className="saved-resources-container">
                            {/* Collections Section */}
                            <div className="saved-collections">
                                <h3>Saved Collections</h3>
                                <CollectionsGrid>
                                    {savedCollections.length === 0 ? (
                                        <p className="empty-message">No saved collections yet</p>
                                    ) : (
                                        savedCollections.map(collection => (
                                            <SavedCollection key={collection.id}>
                                                <CollectionPreview>
                                                    {collection.preview_image ? (
                                                        <img
                                                            src={collection.preview_image}
                                                            alt={collection.name}
                                                            className="collection-preview-image"
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = '/default-banner.jpg';
                                                            }}
                                                        />
                                                    ) : (
                                                        <PlaceholderImage>
                                                            No preview image
                                                        </PlaceholderImage>
                                                    )}
                                                </CollectionPreview>
                                                <h3>{collection.name}</h3>
                                                <p>{collection.description}</p>
                                                <p>{collection.resource_count} resources</p>
                                                <Link 
                                                    to={`/communities/${collection.community}/collections/${collection.id}`}
                                                    className="view-collection-button"
                                                >
                                                    View Collection
                                                </Link>
                                            </SavedCollection>
                                        ))
                                    )}
                                </CollectionsGrid>
                            </div>

                            {/* Resources Section */}
                            <div className="saved-resources">
                                <h3>Saved Resources</h3>
                                <ResourcesGrid>
                                    {savedResources.length === 0 ? (
                                        <p className="empty-message">No saved resources yet</p>
                                    ) : (
                                        savedResources.map(resource => (
                                            <SavedResource key={resource.id}>
                                                <div className="resource-preview">
                                                    <img 
                                                        src={previews[resource.id] || '/default-banner.jpg'}
                                                        alt={resource.title}
                                                        className="resource-preview-image"
                                                        onError={(e) => {
                                                            e.target.src = '/default-banner.jpg';
                                                        }}
                                                    />
                                                </div>
                                                <h4>{resource.title}</h4>
                                                <p className="collection-name">{resource.collection_name}</p>
                                                <a 
                                                    href={resource.url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="visit-resource-button"
                                                >
                                                    Visit Resource
                                                </a>
                                            </SavedResource>
                                        ))
                                    )}
                                </ResourcesGrid>
                            </div>
                        </div>
                    )}

                    {activeTab === 'products' && (
                        <div className="saved-products-grid">
                            {savedProducts.length === 0 ? (
                                <p className="empty-message">No saved products yet</p>
                            ) : (
                                savedProducts.map(product => (
                                    <ProductCard key={product.id} product={product} />
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .saved-items-section {
                    border-top: none;
                }

                .tabs {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                    border-bottom: none;
                }

                .tab {
                    padding: 0.5rem 1.5rem;
                    border: none;
                    background: none;
                    cursor: pointer;
                    border-bottom: 2px solid transparent;
                    transition: all 0.3s ease;
                }

                .tab.active {
                    border-bottom-color: #0061ff;
                    color: #0061ff;
                }

                .saved-images-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                    gap: 1.5rem;
                    padding: 1rem;
                }

                .saved-resources-container {
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                }

                .saved-collections, .saved-resources {
                    background: white;
                    border-radius: 8px;
                    padding: 1.5rem;
                }

                .collections-grid, .resources-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                    gap: 1.5rem;
                    margin-top: 1rem;
                }

                .saved-collection, .saved-resource {
                    background: white;
                    border: 1px solid #eee;
                    border-radius: 8px;
                    padding: 1.5rem;
                    transition: transform 0.2s ease;
                }

                .saved-collection:hover, .saved-resource:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }

                .collection-stats {
                    display: flex;
                    gap: 1rem;
                    margin: 0.5rem 0;
                    color: #666;
                    font-size: 0.9rem;
                }

                .view-collection-button, .visit-resource-button {
                    display: inline-block;
                    padding: 0.5rem 1rem;
                    background: #0061ff;
                    color: white;
                    text-decoration: none;
                    border-radius: 4px;
                    margin-top: 1rem;
                    font-size: 0.9rem;
                    transition: background 0.2s ease;
                }

                .view-collection-button:hover, .visit-resource-button:hover {
                    background: #0056e0;
                }

                .h3 {
                    margin: 0 0 1rem 0;
                    color: #333;
                }

                .community-name, .collection-name {
                    color: #666;
                    font-size: 0.9rem;
                    margin: 0.5rem 0;
                }

                .saved-products-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                    gap: 1.5rem;
                }

                .collection-tag, .catalogue-tag {
                    display: inline-block;
                    padding: 0.25rem 0.5rem;
                    background: #f0f0f0;
                    border-radius: 4px;
                    font-size: 0.8rem;
                    color: #666;
                    margin: 0.5rem 0;
                }

                .saved-image {
                    position: relative;
                    border-radius: 8px;
                    overflow: hidden;
                    aspect-ratio: 1;
                }

                .saved-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .image-overlay {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: rgba(0, 0, 0, 0.7);
                    padding: 0.5rem;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }

                .saved-image:hover .image-overlay {
                    opacity: 1;
                }

                .community-link {
                    color: white;
                    text-decoration: none;
                    font-size: 0.9rem;
                }

                .community-link:hover {
                    text-decoration: underline;
                }

                .empty-message {
                    text-align: center;
                    color: #666;
                    padding: 0.5rem;
                }

                .saved-product {
                    border: 1px solid #eee;
                    border-radius: 8px;
                    overflow: hidden;
                    background: white;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }

                .saved-product:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }

                .product-image {
                    width: 100%;
                    height: 200px;
                    overflow: hidden;
                }

                .product-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .product-info {
                    padding: 1rem;
                }

                .product-info h4 {
                    margin: 0 0 0.5rem 0;
                    font-size: 1.1rem;
                    color: #333;
                }

                .view-product-button {
                    display: inline-block;
                    padding: 0.5rem 1rem;
                    background: #fa8072;
                    color: white;
                    text-decoration: none;
                    border-radius: 4px;
                    margin-top: 0.5rem;
                    font-size: 0.9rem;
                    transition: background 0.2s ease;
                }

                .view-product-button:hover {
                    background: #ff9288;
                }

                .resource-preview {
                    width: 100%;
                    height: 150px;
                    overflow: hidden;
                    border-radius: 8px;
                    margin-bottom: 0.5rem;
                }

                .resource-preview-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                h2 {
                    text-align: left;
                    margin-bottom: 1rem;
                }
            `}</style>
        </div>
    );
};

const ProductCard = ({ product }) => {
    const [imageUrl, setImageUrl] = useState(null);

    useEffect(() => {
        const fetchPreview = async () => {
            try {
                // First try client-side extraction
                const response = await fetch(product.url);
                const text = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(text, 'text/html');
                
                // Try to find meta og:image first
                let img = doc.querySelector('meta[property="og:image"]');
                if (img) {
                    setImageUrl(img.getAttribute('content'));
                    return;
                }

                // If client-side fails, try server-side proxy
                const token = localStorage.getItem('token');
                const proxyResponse = await api.get(
                    `preview/?url=${encodeURIComponent(product.url)}`,
                    {
                        params: { url: product.url },
                        headers: { 'Authorization': `Token ${token}` }
                    }
                );

                if (proxyResponse.data.image_url) {
                    setImageUrl(proxyResponse.data.image_url);
                } else {
                    setImageUrl(FALLBACK_IMAGE);
                }

            } catch (err) {
                console.error('Error fetching image:', err);
                setImageUrl(FALLBACK_IMAGE);
            }
        };

        fetchPreview();
    }, [product.url]);

    return (
        <div className="saved-product">
            <div className="product-image">
                <img 
                    src={imageUrl || FALLBACK_IMAGE} 
                    alt={product.title}
                    onError={(e) => {
                        e.target.src = FALLBACK_IMAGE;
                    }}
                />
            </div>
            <div className="product-info">
                <h4>{product.title}</h4>
                <span className="catalogue-tag">{product.catalogue_name}</span>
                <a 
                    href={product.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="view-product-button"
                >
                    View Product
                </a>
            </div>
        </div>
    );
};

export default SavedItems; 
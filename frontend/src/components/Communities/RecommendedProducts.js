import React, { useState, useEffect } from 'react';
import api from '../../api';
import './RecommendedProducts.css';
import AddProductModal from './AddProductModal';

const RecommendedProducts = ({ communityId, isCreator, onTabChange }) => {
    const [products, setProducts] = useState([]);
    const [catalogues, setCatalogues] = useState([]);
    const [activeCatalogue, setActiveCatalogue] = useState('all');
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [savedProducts, setSavedProducts] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const FALLBACK_IMAGE = '/default-product.png';

    useEffect(() => {
        fetchProducts();
    }, [communityId, activeCatalogue]);

    const fetchProducts = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await api.get(
                `/communities/${communityId}/products/`,
                {
                    headers: { 'Authorization': `Token ${token}` }
                }
            );
            setProducts(response.data);
            
            // Extract unique catalogue names
            const uniqueCatalogues = [...new Set(response.data.map(product => product.catalogue_name))];
            setCatalogues(uniqueCatalogues);
            
            setLoading(false);
        } catch (err) {
            console.error('Error fetching products:', err);
            setError('Failed to load products');
            setLoading(false);
        }
    };

    const handleAddProduct = async (productData) => {
        try {
            await api.post(`/communities/${communityId}/products/`, {
                title: productData.title,
                url: productData.url,
                comment: productData.comment,
                catalogue_name: productData.catalogue_name,
                community: communityId
            });
            fetchProducts();
            setShowAddProduct(false);
        } catch (err) {
            console.error('Error adding product:', err);
            throw new Error('Failed to add product');
        }
    };

    const handleSaveProduct = async (productId) => {
        try {
            const response = await api.post(`/saved/${productId}/save_product/`);
            
            if (response.data.status === 'saved') {
                setSavedProducts(prev => new Set([...prev, productId]));
            } else {
                setSavedProducts(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(productId);
                    return newSet;
                });
            }
        } catch (error) {
            console.error('Error saving product:', error);
        }
    };

    useEffect(() => {
        const fetchSavedProducts = async () => {
            try {
                console.log('Fetching saved products...'); // Debug log
                const response = await api.get('/saved/products/');
                console.log('Fetched saved products:', response.data); // Debug log
                setSavedProducts(new Set(response.data.map(item => item.product_id)));
            } catch (error) {
                console.error('Error fetching saved products:', 
                    error.response?.data || error.message);
            }
        };

        fetchSavedProducts();
    }, []);

    const ProductCard = ({ product }) => {
        const [imageUrl, setImageUrl] = useState(null);
        const [loading, setLoading] = useState(true);

        useEffect(() => {
            const fetchPreview = async () => {
                if (!product.url) {
                    setLoading(false);
                    return;
                }

                try {
                    // Special handling for known domains
                    if (product.url.includes('youtube.com') || product.url.includes('youtu.be')) {
                        const videoId = product.url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
                        if (videoId) {
                            setImageUrl(`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`);
                            setLoading(false);
                            return;
                        }
                    }

                    // Try multiple approaches to get the image
                    const token = localStorage.getItem('token');
                    let attempts = [
                        // First attempt: Direct preview API
                        async () => {
                            const response = await api.get(
                                `/preview/?url=${encodeURIComponent(product.url)}`,
                                {
                                    headers: { 'Authorization': `Token ${token}` }
                                }
                            );
                            return response.data.image;
                        },
                        // Second attempt: Try metadata API
                        async () => {
                            const response = await api.post(
                                `/products/fetch-metadata/`,
                                { url: product.url },
                                {
                                    headers: {
                                        'Authorization': `Token ${token}`,
                                        'Content-Type': 'application/json'
                                    }
                                }
                            );
                            return response.data.image_url;
                        }
                    ];

                    for (let attempt of attempts) {
                        try {
                            const image = await attempt();
                            if (image) {
                                setImageUrl(image);
                                setLoading(false);
                                return;
                            }
                        } catch (err) {
                            console.log('Attempt failed, trying next method...');
                        }
                    }

                    // If all attempts fail, set default image
                    setImageUrl(FALLBACK_IMAGE);

                } catch (err) {
                    console.error('Error fetching image:', err);
                    setImageUrl(FALLBACK_IMAGE);
                } finally {
                    setLoading(false);
                }
            };

            fetchPreview();
        }, [product.url]);

        return (
            <div className="product-card">
                <div className="product-image-container">
                    {loading ? (
                        <div className="product-image-placeholder">
                            <div className="loading-spinner"></div>
                        </div>
                    ) : imageUrl ? (
                        <img 
                            src={imageUrl} 
                            alt={product.title} 
                            className="product-image"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = FALLBACK_IMAGE;
                            }}
                        />
                    ) : (
                        <div className="product-image-placeholder">
                            No image available
                        </div>
                    )}
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            handleSaveProduct(product.id);
                        }}
                        className={`save-button ${savedProducts.has(product.id) ? 'saved' : ''}`}
                        title={savedProducts.has(product.id) ? 'Unsave Product' : 'Save Product'}
                    >
                        {savedProducts.has(product.id) ? '★' : '☆'}
                    </button>
                </div>
                <div className="product-info">
                    <h3>{product.title}</h3>
                    <p className="product-category">{product.catalogue_name}</p>
                    {product.comment && (
                        <p className="product-description">{product.comment}</p>
                    )}
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

    const handleAllClick = () => {
        setActiveCatalogue('all');
        if (onTabChange) {
            onTabChange('products');
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="recommended-products">
            <div className="products-header">
                <h3>Recommended Products</h3>
                <div className="header-buttons">
                    {isCreator && (
                        <button 
                            className="add-product-button"
                            onClick={() => setShowAddProduct(true)}
                        >
                            +
                        </button>
                    )}
                    <button 
                        className="all-button"
                        onClick={handleAllClick}
                    >
                        All
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading-spinner" />
            ) : error ? (
                <div className="error-message">{error}</div>
            ) : products.length === 0 ? (
                <div className="product-placeholder">
                    <div className="placeholder-content">
                        <i className="far fa-box"></i>
                        <p>No products added yet</p>
                    </div>
                </div>
            ) : (
                <div className="products-container">
                    <div className="products-scroll">
                        {products.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </div>
            )}

            {showAddProduct && (
                <AddProductModal
                    catalogues={catalogues}
                    onSubmit={handleAddProduct}
                    onClose={() => setShowAddProduct(false)}
                />
            )}
        </div>
    );
};

export default RecommendedProducts; 
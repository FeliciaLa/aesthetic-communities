import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RecommendedProducts.css';
import AddProductModal from './AddProductModal';
import api from '../../../api';

const RecommendedProducts = ({ communityId, isCreator, onTabChange }) => {
    const [products, setProducts] = useState([]);
    const [catalogues, setCatalogues] = useState([]);
    const [activeCatalogue, setActiveCatalogue] = useState('all');
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [savedProducts, setSavedProducts] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchProducts();
    }, [communityId, activeCatalogue]);

    const fetchProducts = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://localhost:8000/api/communities/${communityId}/products/`,
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
                            const response = await axios.get(
                                `http://localhost:8000/api/preview/?url=${encodeURIComponent(product.url)}`,
                                {
                                    headers: { 'Authorization': `Token ${token}` }
                                }
                            );
                            return response.data.image;
                        },
                        // Second attempt: Try metadata API
                        async () => {
                            const response = await axios.post(
                                `http://localhost:8000/api/products/fetch-metadata/`,
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
                    setImageUrl('/default-product.jpg');

                } catch (err) {
                    console.error('Error fetching image:', err);
                    setImageUrl('/default-product.jpg');
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
                            onError={() => setImageUrl('/default-product.jpg')}
                        />
                    ) : (
                        <div className="product-image-placeholder">
                            No image available
                        </div>
                    )}
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
        <div style={{ padding: '0 0 2rem 0' }}>
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

                <div className="catalogue-tabs">
                    {catalogues.map(catalogue => (
                        <button
                            key={catalogue}
                            className={`tab ${activeCatalogue === catalogue ? 'active' : ''}`}
                            onClick={() => setActiveCatalogue(catalogue)}
                        >
                            {catalogue}
                        </button>
                    ))}
                </div>

                <div className="products-grid">
                    {products.length === 0 ? (
                        <div className="product-placeholder">
                            <div className="placeholder-content">
                                <i className="fas fa-box"></i>
                                <p>No products added yet</p>
                            </div>
                        </div>
                    ) : (
                        products
                            .filter(product => activeCatalogue === 'all' || product.catalogue_name === activeCatalogue)
                            .map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))
                    )}
                </div>

                {showAddProduct && (
                    <AddProductModal
                        catalogues={catalogues}
                        onSubmit={handleAddProduct}
                        onClose={() => setShowAddProduct(false)}
                    />
                )}
            </div>

            <style jsx>{`
                .recommended-products {
                    background: white;
                    border-radius: 12px;
                    padding: 1.5rem;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    width: 100%;
                    margin: -1rem 0 0 0;
                    box-sizing: border-box;
                    border: 1px solid #e0e0e0;
                }

                .products-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.1rem;
                }

                .products-header h3 {
                    font-size: 1.75rem;
                    font-weight: 600;
                    color: #333;
                    margin: 0;
                    font-family: inherit;
                }

                .add-product-button {
                    padding: 0.5rem 1rem;
                    background: #0061ff;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }

                .catalogue-tabs {
                    display: flex;
                    gap: 1rem;
                    margin: 0 0 1.5rem 0;
                    overflow-x: auto;
                    padding: 0.5rem 0;
                    -ms-overflow-style: none;  /* Hide scrollbar IE and Edge */
                    scrollbar-width: none;  /* Hide scrollbar Firefox */
                }

                .catalogue-tabs::-webkit-scrollbar {
                    display: none;  /* Hide scrollbar Chrome, Safari, Opera */
                }

                .tab {
                    padding: 0.5rem 1.5rem;
                    border: 1px solid #e0e0e0;
                    border-radius: 20px;
                    background-color: #f5f5f5;  /* Light gray background */
                    cursor: pointer;
                    white-space: nowrap;
                    transition: all 0.2s ease;
                    font-size: 14px;
                    color: #333;
                }

                .tab:hover {
                    background-color: #e0e0e0;
                }

                .tab.active {
                    background-color: #0061ff;
                    color: white;
                    border-color: #0061ff;
                    font-weight: 500;
                }

                .products-grid {
                    display: flex;
                    gap: 2rem;
                    overflow-x: auto;
                    padding: 0.5rem 0;
                    scroll-behavior: smooth;
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }

                .products-grid::-webkit-scrollbar {
                    display: none;
                }

                .product-card {
                    background: white;
                    border-radius: 8px;
                    padding: 1rem;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    position: relative;
                }

                .product-image-container {
                    width: 100%;
                    height: 200px;
                    background: #f5f5f5;
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 8px;
                }

                .product-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .product-image-placeholder {
                    color: #999;
                    font-size: 0.9rem;
                }

                .placeholder-content {
                    text-align: center;
                    color: #999;
                }

                .placeholder-content i {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                }

                .placeholder-content p {
                    margin: 0;
                    font-size: 1rem;
                }

                .product-info {
                    margin-top: 1rem;
                }

                .product-card:hover {
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }

                .product-card h3 {
                    margin: 0;
                    font-size: 1.1rem;
                    color: #333;
                }

                .catalogue-tag {
                    display: inline-block;
                    background: #f0f0f0;
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.8rem;
                    color: #666;
                    width: fit-content;
                }

                .product-comment {
                    color: #666;
                    font-size: 0.9rem;
                    margin: 0;
                }

                .view-product-button {
                    display: inline-block;
                    padding: 8px 16px;
                    background: #0061ff;
                    color: white;
                    text-decoration: none;
                    border-radius: 4px;
                    margin-top: 1rem;
                }

                .error-message {
                    color: #dc3545;
                    background: #f8d7da;
                    padding: 1rem;
                    border-radius: 4px;
                    margin-bottom: 1rem;
                }

                .product-actions {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                }

                .product-image:hover .product-actions {
                    opacity: 1;
                }

                .save-button {
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.9);
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                    color: #666;
                    transition: all 0.2s ease;
                }

                .save-button:hover {
                    background: rgba(255, 255, 255, 1);
                    transform: scale(1.1);
                }

                .save-button.saved {
                    color: #ffd700;
                }

                .loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid #f3f3f3;
                    border-top: 3px solid #0061ff;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default RecommendedProducts; 
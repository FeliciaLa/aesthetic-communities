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

                <div className="products-container">
                    <div className="products-scroll">
                        {products.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
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

                .products-container {
                    position: relative;
                    width: 100%;
                    margin: 0;
                    overflow: hidden;
                }

                .products-scroll {
                    display: flex;
                    gap: 20px;
                    overflow-x: auto;
                    padding: 10px 0;
                    -webkit-overflow-scrolling: touch;
                    scrollbar-width: thin;
                    scrollbar-color: #fa8072 #f1f1f1;
                }

                .products-scroll::-webkit-scrollbar {
                    height: 6px;
                }

                .products-scroll::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 3px;
                }

                .products-scroll::-webkit-scrollbar-thumb {
                    background: #fa8072;
                    border-radius: 3px;
                }

                .product-card {
                    flex: 0 0 300px;
                    border: 1px solid #eee;
                    border-radius: 8px;
                    overflow: hidden;
                    background: white;
                    position: relative;
                    cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                }

                .product-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
                    background: #fa8072;
                    color: white;
                    text-decoration: none;
                    border-radius: 4px;
                    margin-top: 1rem;
                    transition: background 0.2s ease;
                }

                .view-product-button:hover {
                    background: #ff9288;
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
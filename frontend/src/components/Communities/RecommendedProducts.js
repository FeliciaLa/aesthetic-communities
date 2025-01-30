import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AddProductModal from './AddProductModal';

const RecommendedProducts = ({ communityId, isCreator }) => {
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
            const token = localStorage.getItem('token');
            await axios.post(
                `http://localhost:8000/api/communities/${communityId}/products/`,
                {
                    title: productData.title,
                    url: productData.url,
                    comment: productData.comment,
                    catalogue_name: productData.catalogue_name,
                    community: communityId
                },
                {
                    headers: { 'Authorization': `Token ${token}` }
                }
            );
            fetchProducts();
            setShowAddProduct(false);
        } catch (err) {
            console.error('Error adding product:', err);
            throw new Error('Failed to add product');
        }
    };

    const handleSaveProduct = async (productId) => {
        try {
            console.log('Save button clicked for product:', productId);
            const token = localStorage.getItem('token');
            
            // Add error checking for token
            if (!token) {
                console.error('No authentication token found');
                return;
            }

            const baseURL = 'http://localhost:8000';
            const response = await axios.post(
                `${baseURL}/api/saved/${productId}/save_product/`,
                {},
                {
                    headers: { 
                        'Authorization': `Token ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.log('Save product response:', response.data);
            
            if (response.data.status === 'saved') {
                setSavedProducts(prev => new Set([...prev, productId]));
                console.log('Product saved successfully');
            } else {
                setSavedProducts(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(productId);
                    return newSet;
                });
                console.log('Product unsaved successfully');
            }
        } catch (error) {
            console.error('Error saving product:', error);
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
            } else if (error.request) {
                console.error('No response received:', error.request);
            } else {
                console.error('Error setting up request:', error.message);
            }
        }
    };

    useEffect(() => {
        const fetchSavedProducts = async () => {
            try {
                console.log('Fetching saved products...'); // Debug log
                const token = localStorage.getItem('token');
                const response = await axios.get(
                    'http://localhost:8000/api/saved/products/',
                    {
                        headers: { 'Authorization': `Token ${token}` }
                    }
                );
                
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
                    const proxyResponse = await axios.get(
                        `http://localhost:8000/api/url-preview/`,
                        {
                            params: { url: product.url },
                            headers: { 'Authorization': `Token ${token}` }
                        }
                    );

                    if (proxyResponse.data.image_url) {
                        setImageUrl(proxyResponse.data.image_url);
                    } else {
                        setImageUrl('/default-product.jpg');
                    }

                } catch (err) {
                    console.error('Error fetching image:', err);
                    setImageUrl('/default-product.jpg');
                }
            };

            fetchPreview();
        }, [product.url]);

        return (
            <div className="product-card">
                <div className="product-image">
                    <img 
                        src={imageUrl || '/default-product.jpg'} 
                        alt={product.title}
                        onError={(e) => {
                            e.target.src = '/default-product.jpg';
                        }}
                    />
                    <div className="product-actions">
                        <button 
                            className={`save-button ${savedProducts.has(product.id) ? 'saved' : ''}`}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Save button clicked for product:', product.id); // Debug log
                                handleSaveProduct(product.id);
                            }}
                            title={savedProducts.has(product.id) ? 'Unsave' : 'Save'}
                        >
                            {savedProducts.has(product.id) ? '★' : '☆'}
                        </button>
                    </div>
                </div>
                <h3>{product.title}</h3>
                <span className="catalogue-tag">{product.catalogue_name}</span>
                {product.comment && (
                    <p className="product-comment">{product.comment}</p>
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
        );
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="recommended-products">
            <div className="products-header">
                <h3>Recommended Products</h3>
                {isCreator && (
                    <button 
                        onClick={() => setShowAddProduct(true)}
                        className="add-product-button"
                    >
                        Add Product
                    </button>
                )}
            </div>

            <div className="catalogue-tabs">
                <button
                    className={`tab ${activeCatalogue === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveCatalogue('all')}
                >
                    All
                </button>
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
                {products
                    .filter(product => activeCatalogue === 'all' || product.catalogue_name === activeCatalogue)
                    .map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
            </div>

            {showAddProduct && (
                <AddProductModal
                    catalogues={catalogues}
                    onSubmit={handleAddProduct}
                    onClose={() => setShowAddProduct(false)}
                />
            )}

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
                    margin-bottom: 1rem;
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
                    min-width: 250px;
                    flex: 0 0 auto;
                }

                .product-image {
                    width: 100%;
                    height: 200px;
                    overflow: hidden;
                    border-radius: 8px;
                    margin-bottom: 1rem;
                    position: relative;
                }

                .product-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.3s ease;
                }

                .product-card:hover .product-image img {
                    transform: scale(1.05);
                }

                .product-card {
                    border: 1px solid #eee;
                    border-radius: 8px;
                    padding: 1rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    transition: box-shadow 0.3s ease;
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
                    padding: 0.5rem 1rem;
                    background: #0061ff;
                    color: white;
                    text-decoration: none;
                    border-radius: 4px;
                    text-align: center;
                    margin-top: auto;
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
            `}</style>
        </div>
    );
};

export default RecommendedProducts; 
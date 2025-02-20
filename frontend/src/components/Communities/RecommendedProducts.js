import React, { useState, useEffect } from 'react';
import api from '../../api';
import './RecommendedProducts.css';
import AddProductModal from './AddProductModal';
import styled from 'styled-components';

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
            const headers = token ? {
                'Authorization': `Token ${token}`,
                'Content-Type': 'application/json'
            } : {
                'Content-Type': 'application/json'
            };
            
            const response = await api.get(
                `/communities/${communityId}/products/`,
                { headers }
            );
            setProducts(response.data);
            
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
            <StyledProductCard>
                <div className="product-image-container">
                    {imageUrl ? (
                        <img 
                            src={imageUrl} 
                            alt={product.title} 
                            className="product-image"
                            onError={(e) => e.target.src = FALLBACK_IMAGE}
                        />
                    ) : (
                        <div className="product-image-placeholder">Loading...</div>
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
            </StyledProductCard>
        );
    };

    const StyledProductCard = styled.div`
        border: 1px solid #ddd;
        border-radius: 8px;
        overflow: hidden;
        transition: transform 0.3s ease;
        background: white;
        height: 100%;
        display: flex;
        flex-direction: column;

        &:hover {
            transform: translateY(-4px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .product-image-container {
            position: relative;
            width: 100%;
            height: 200px;
        }

        .product-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .product-image-placeholder {
            width: 100%;
            height: 100%;
            background: #f5f5f5;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #999;
        }

        .save-button {
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

        .save-button:hover {
            background: rgba(0, 0, 0, 0.7);
        }

        .product-info {
            padding: 15px;
            flex-grow: 1;
            display: flex;
            flex-direction: column;
        }

        h3 {
            margin: 0 0 10px 0;
            font-size: 1.1rem;
            color: #333;
        }

        .price {
            display: block;
            color: #fa8072;
            font-weight: bold;
            margin-bottom: 10px;
        }

        .view-product {
            display: inline-block;
            padding: 8px 16px;
            background: #fa8072;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin-top: auto;
            align-self: flex-start;
            transition: background 0.3s ease;

            &:hover {
                background: #ff9288;
            }
        }
    `;

    const ProductsGrid = styled.div`
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 20px;
        margin-top: 20px;
    `;

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
                        <ProductsGrid>
                            {products.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </ProductsGrid>
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
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
    const [offset, setOffset] = useState(0);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

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
        const [previewUrl, setPreviewUrl] = useState(null);

        useEffect(() => {
            const fetchImagePreview = async () => {
                if (!product.url) {
                    setPreviewUrl(null);
                    return;
                }

                try {
                    const token = localStorage.getItem('token');
                    const response = await api.get(
                        `/preview/?url=${encodeURIComponent(product.url)}`,
                        {
                            headers: { 
                                'Authorization': `Token ${token}`
                            },
                            timeout: 5000
                        }
                    );
                    
                    if (response.data.image) {
                        setPreviewUrl(response.data.image);
                    }
                } catch (err) {
                    console.error('Failed to fetch image preview:', err);
                    setPreviewUrl(FALLBACK_IMAGE);
                }
            };

            fetchImagePreview();
        }, [product.url]);

        return (
            <StyledProductCard>
                <div className="product-image-container">
                    {previewUrl ? (
                        <img 
                            src={previewUrl} 
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
                    >
                        {savedProducts.has(product.id) ? '★' : '☆'}
                    </button>
                </div>
                <div className="product-info">
                    <h3>{product.title}</h3>
                    <p className="product-category">{product.catalogue_name}</p>
                    <a 
                        href={product.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="view-product"
                    >
                        View Product
                    </a>
                </div>
            </StyledProductCard>
        );
    };

    const ProductsContainer = styled.div`
        position: relative;
        width: 100%;
        margin: 0;
        overflow: hidden;
    `;

    const ProductsScroll = styled.div`
        display: flex;
        gap: 20px;
        overflow-x: auto;
        padding: 10px 0;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: thin;
        scrollbar-color: #fa8072 #f1f1f1;

        &::-webkit-scrollbar {
            height: 6px;
        }

        &::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 3px;
        }

        &::-webkit-scrollbar-thumb {
            background: #fa8072;
            border-radius: 3px;
        }
    `;

    const StyledProductCard = styled.div`
        flex: 0 0 180px;
        border: 1px solid #ddd;
        border-radius: 8px;
        overflow: hidden;
        transition: transform 0.3s ease;
        background: white;
        height: 240px;
        display: flex;
        flex-direction: column;

        .product-image-container {
            position: relative;
            width: 100%;
            height: 120px;
            overflow: hidden;
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
            padding: 12px;
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 4px;
            max-height: 120px;
        }

        h3 {
            margin: 0;
            font-size: 0.9rem;
            font-weight: 500;
            line-height: 1.2;
            max-height: 2.4em;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
        }

        .product-category {
            font-size: 0.8rem;
            color: #666;
            margin: 0;
        }

        .view-product {
            margin-top: auto;
            padding: 6px 0;
            font-size: 0.8rem;
            color: #fa8072;
            text-decoration: none;
        }
    `;

    const handleAllClick = () => {
        setActiveCatalogue('all');
        if (onTabChange) {
            onTabChange('products');
        }
    };

    const handlePrevClick = () => {
        const newOffset = offset + 240;
        setOffset(Math.min(newOffset, 0));
        setCanScrollRight(true);
        setCanScrollLeft(newOffset < 0);
    };

    const handleNextClick = () => {
        const newOffset = offset - 240;
        const maxOffset = -(products.length * 240 - window.innerWidth + 40);
        setOffset(Math.max(newOffset, maxOffset));
        setCanScrollLeft(true);
        setCanScrollRight(newOffset > maxOffset);
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
                <ProductsContainer>
                    <ProductsScroll>
                        {products.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </ProductsScroll>
                </ProductsContainer>
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
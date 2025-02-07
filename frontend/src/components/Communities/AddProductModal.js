import React, { useState, useEffect } from 'react';
import api from '../../api';

const AddProductModal = ({ catalogues, onSubmit, onClose }) => {
    const [formData, setFormData] = useState({
        title: '',
        url: '',
        comment: '',
        catalogue_name: ''
    });
    const [newCatalogue, setNewCatalogue] = useState('');
    const [error, setError] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Fetch image preview when URL changes
    useEffect(() => {
        const fetchImagePreview = async () => {
            if (!formData.url) {
                setPreviewUrl(null);
                return;
            }

            try {
                const token = localStorage.getItem('token');
                const response = await api.get(
                    `/preview/?url=${encodeURIComponent(formData.url)}`,
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
                setPreviewUrl(null);
            }
        };

        const timeoutId = setTimeout(fetchImagePreview, 500);
        return () => clearTimeout(timeoutId);
    }, [formData.url]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const submitData = {
                ...formData,
                catalogue_name: formData.catalogue_name === 'new' ? newCatalogue : formData.catalogue_name,
                image_url: previewUrl
            };
            await onSubmit(submitData);
            onClose();
        } catch (err) {
            setError('Failed to add product');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2>Add New Product</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Link</label>
                        <input
                            type="url"
                            value={formData.url}
                            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                            placeholder="Enter product URL"
                            required
                        />
                    </div>

                    {previewUrl && (
                        <div className="preview-container">
                            <img src={previewUrl} alt="Product preview" className="image-preview" />
                        </div>
                    )}

                    <div className="form-group">
                        <label>Catalogue Name</label>
                        <select
                            value={formData.catalogue_name}
                            onChange={(e) => setFormData({ ...formData, catalogue_name: e.target.value })}
                            required
                        >
                            <option value="">Select a catalogue</option>
                            {catalogues.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                            <option value="new">+ Add new catalogue</option>
                        </select>
                        
                        {formData.catalogue_name === 'new' && (
                            <input
                                type="text"
                                value={newCatalogue}
                                onChange={(e) => setNewCatalogue(e.target.value)}
                                placeholder="Enter new catalogue name"
                                className="new-catalogue-input"
                                required
                            />
                        )}
                    </div>

                    <div className="form-group">
                        <label>Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Comment (Optional)</label>
                        <textarea
                            value={formData.comment}
                            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <div className="button-group">
                        <button type="button" onClick={onClose} className="cancel-button">
                            Cancel
                        </button>
                        <button type="submit" className="submit-button" disabled={submitting}>
                            {submitting ? 'Adding...' : 'Add Product'}
                        </button>
                    </div>
                </form>
            </div>

            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }

                .modal-content {
                    background: white;
                    padding: 2rem;
                    border-radius: 8px;
                    width: 90%;
                    max-width: 500px;
                    max-height: 90vh;
                    overflow-y: auto;
                }

                .preview-container {
                    margin: 15px 0;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    overflow: hidden;
                }

                .image-preview {
                    width: 100%;
                    height: auto;
                    max-height: 200px;
                    object-fit: contain;
                    display: block;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                }

                label {
                    font-weight: 500;
                    color: #333;
                }

                input, select, textarea {
                    padding: 0.5rem;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 1rem;
                }

                .new-catalogue-input {
                    margin-top: 0.5rem;
                }

                textarea {
                    min-height: 100px;
                    resize: vertical;
                }

                .button-group {
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                    margin-top: 1rem;
                }

                .cancel-button {
                    padding: 0.5rem 1rem;
                    background: #f5f5f5;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    cursor: pointer;
                }

                .submit-button {
                    padding: 0.5rem 1rem;
                    background: #0061ff;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }

                .submit-button:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .error-message {
                    color: #dc3545;
                    background: #f8d7da;
                    padding: 0.5rem;
                    border-radius: 4px;
                    margin-bottom: 1rem;
                }
            `}</style>
        </div>
    );
};

export default AddProductModal; 
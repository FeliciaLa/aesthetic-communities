import React, { useState } from 'react';
import axios from 'axios';

const AddResourceForm = ({ categoryId, onSuccess, onClose }) => {
    const [formData, setFormData] = useState({
        title: '',
        url: '',
        remark: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const requestData = {
                ...formData,
                category: categoryId
            };
            
            const response = await axios.post(
                'http://localhost:8000/api/resources/',
                requestData,
                {
                    headers: {
                        'Authorization': `Token ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            onSuccess(response.data);
            onClose();
        } catch (err) {
            console.error('API Error:', err.response?.data);
            setError(err.response?.data?.detail || err.response?.data?.error || 'Failed to create resource');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="resource-form">
            <h2>Add New Resource</h2>
            
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
                <label>URL</label>
                <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    required
                />
            </div>

            <div className="form-group">
                <label>Remark (Optional)</label>
                <textarea
                    value={formData.remark}
                    onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                />
            </div>

            {error && <div className="error-message">{error}</div>}
            
            <div className="button-group">
                <button type="button" onClick={onClose} className="cancel-button">
                    Cancel
                </button>
                <button type="submit" disabled={submitting} className="submit-button">
                    {submitting ? 'Creating...' : 'Create Resource'}
                </button>
            </div>
        </form>
    );
};

export default AddResourceForm; 
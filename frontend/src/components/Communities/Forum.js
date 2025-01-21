import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Forum.css';

const Forum = ({ communityId }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newPost, setNewPost] = useState({
        title: '',
        content: ''
    });

    const fetchPosts = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://localhost:8000/api/forum/posts/`,
                {
                    params: { community_id: communityId },
                    headers: { 'Authorization': `Token ${token}` }
                }
            );
            setPosts(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching posts:', err);
            setError('Failed to fetch posts');
            setLoading(false);
        }
    };

    const handleSubmitPost = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                'http://localhost:8000/api/forum/posts/',
                {
                    ...newPost,
                    community: communityId
                },
                {
                    headers: { 
                        'Authorization': `Token ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            setPosts([response.data, ...posts]);
            setNewPost({ title: '', content: '' });
        } catch (err) {
            console.error('Error creating post:', err);
            setError('Failed to create post');
        }
    };

    useEffect(() => {
        fetchPosts();
    }, [communityId]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="forum-container">
            <div className="create-post-section">
                <h3>Create New Post</h3>
                <form onSubmit={handleSubmitPost} className="post-form">
                    <input
                        type="text"
                        placeholder="Post Title"
                        value={newPost.title}
                        onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                        required
                    />
                    <textarea
                        placeholder="Write your post here..."
                        value={newPost.content}
                        onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                        required
                    />
                    <button type="submit">Create Post</button>
                </form>
            </div>

            <div className="posts-list">
                <h3>Forum Posts</h3>
                {posts.length > 0 ? (
                    posts.map(post => (
                        <div key={post.id} className="post-card">
                            <h4>{post.title}</h4>
                            <p>{post.content}</p>
                            <div className="post-meta">
                                <span>Posted by: {post.created_by}</span>
                                <span>Posted on: {new Date(post.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No posts yet. Be the first to post!</p>
                )}
            </div>
        </div>
    );
};

export default Forum; 
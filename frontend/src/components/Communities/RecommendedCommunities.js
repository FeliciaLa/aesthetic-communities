import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import './RecommendedCommunities.css';

const RecommendedCommunities = () => {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchRecommendations();
    }, []);

    const fetchRecommendations = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                'http://localhost:8000/api/communities/recommended/',
                { headers: { 'Authorization': `Token ${token}` } }
            );

            // Transform the banner_image URLs just like in ExploreCommunities
            const recommendationsWithFullUrls = response.data.map(community => ({
                ...community,
                banner_image: community.banner_image ? 
                    (community.banner_image.startsWith('http') ? 
                        community.banner_image : 
                        `http://localhost:8000${community.banner_image}`
                    ) : null
            }));

            setRecommendations(recommendationsWithFullUrls);
            setLoading(false);
        } catch (error) {
            console.error('Error details:', error);
            setError('Failed to load recommendations');
            setLoading(false);
        }
    };

    return (
        <div className="recommendations-section">
            <h2 style={{ padding: '0 1.5rem', marginBottom: '1rem' }}>Recommended for You</h2>
            <CommunitiesGrid>
                {loading ? (
                    <div className="message-container">Loading recommendations...</div>
                ) : error ? (
                    <div className="message-container error">{error}</div>
                ) : recommendations.length === 0 ? (
                    <div className="message-container">
                        <p>No recommendations available yet.</p>
                        <p>Join some communities to get personalized recommendations!</p>
                    </div>
                ) : (
                    recommendations.map(community => (
                        <Link to={`/communities/${community.id}`} key={community.id}>
                            <CommunityCard>
                                <div className="community-banner">
                                    {community.banner_image ? (
                                        <img src={community.banner_image} alt={community.name} />
                                    ) : (
                                        <div className="placeholder-banner">
                                            {community.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="community-content">
                                    <h2>{community.name}</h2>
                                    <p>{community.description}</p>
                                    <div className="community-stats">
                                        <span>{community.member_count || 0} members</span>
                                        <span>Created {new Date(community.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </CommunityCard>
                        </Link>
                    ))
                )}
            </CommunitiesGrid>
        </div>
    );
};

const CommunitiesGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
    padding: 0 1.5rem;
    margin-bottom: 2rem;

    @media (max-width: 1024px) {
        grid-template-columns: repeat(2, 1fr);
    }

    @media (max-width: 640px) {
        grid-template-columns: 1fr;
    }
`;

const CommunityCard = styled.div`
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;

    &:hover {
        transform: translateY(-3px);
        box-shadow: 0 3px 6px rgba(0,0,0,0.15);
    }

    .community-banner {
        height: 120px;
        background: #f0f0f0;
        position: relative;
        overflow: hidden;

        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .placeholder-banner {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            color: #666;
            background: #e0e0e0;
        }
    }

    .community-content {
        padding: 1rem;

        h2 {
            margin: 0 0 0.5rem;
            font-size: 1.2rem;
        }

        p {
            color: #666;
            font-size: 0.9rem;
            margin: 0 0 1rem;
        }

        .community-stats {
            display: flex;
            justify-content: space-between;
            font-size: 0.8rem;
            color: #888;
        }
    }
`;

export default RecommendedCommunities; 
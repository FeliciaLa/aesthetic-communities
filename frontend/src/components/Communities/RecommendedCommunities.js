import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { ChevronLeft, ChevronRight } from 'react-feather';
import './RecommendedCommunities.css';

const CarouselContainer = styled.div`
  position: relative;
  width: 100%;
  margin-bottom: 2rem;
  overflow: hidden;
  background: #f8f9fa;
  border-radius: 8px;
`;

const CarouselTrack = styled.div`
  display: flex;
  gap: 1.5rem;
  padding: 1rem;
  padding-left: ${props => props.offset < 0 ? '2.5rem' : '0'};
  padding-right: 2.5rem;
  transition: transform 0.3s ease;
  transform: translateX(${props => props.offset}px);
  
  > a {
    flex: 0 0 300px;
    width: 300px;
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
            align-items: center;
            font-size: 0.8rem;
            color: #888;

            .view-hub {
                padding: 4px 12px;
                border: 1px solid #fa8072;
                border-radius: 4px;
                background: transparent;
                color: #fa8072;
                font-size: 0.8rem;
                cursor: pointer;
                transition: all 0.2s ease;

                &:hover {
                    background: #f5f5f5;
                }
            }
        }
    }
`;

const CarouselButton = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: white;
  border: 1px solid #ddd;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);

  &:hover {
    background: #f8f8f8;
  }

  &.prev {
    left: 10px;
  }

  &.next {
    right: 10px;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const RecommendedCommunities = () => {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [offset, setOffset] = useState(0);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    useEffect(() => {
        fetchRecommendations();
    }, []);

    const fetchRecommendations = async () => {
        try {
            const response = await api.get('/communities/recommended/');

            const recommendationsWithFullUrls = response.data.map(community => ({
                ...community,
                banner_image: community.banner_image ? 
                    (community.banner_image.startsWith('http') ? 
                        community.banner_image : 
                        `${api.defaults.baseURL}${community.banner_image}`
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

    const handlePrevClick = () => {
        const newOffset = offset + 300;
        setOffset(Math.min(newOffset, 0));
        setCanScrollRight(true);
        setCanScrollLeft(newOffset < 0);
    };

    const handleNextClick = () => {
        const maxOffset = -(recommendations.length * 300 - window.innerWidth + 100);
        const newOffset = offset - 300;
        setOffset(Math.max(newOffset, maxOffset));
        setCanScrollLeft(true);
        setCanScrollRight(newOffset > maxOffset);
    };

    if (loading) return <div className="message-container">Loading recommendations...</div>;
    if (error) return <div className="message-container error">{error}</div>;
    if (recommendations.length === 0) {
        return (
            <div className="message-container">
                <p>No recommendations available yet.</p>
                <p>Join some communities to get personalized recommendations!</p>
            </div>
        );
    }

    return (
        <div className="recommendations-section">
            <h2 style={{ padding: '0 1.5rem', marginBottom: '1rem' }}>Recommended for You</h2>
            <CarouselContainer>
                <CarouselButton 
                    className="prev" 
                    onClick={handlePrevClick}
                    disabled={!canScrollLeft}
                >
                    <ChevronLeft size={20} />
                </CarouselButton>
                <CarouselTrack offset={offset}>
                    {recommendations.map(community => (
                        <Link 
                            to={`/communities/${community.id}`} 
                            key={community.id}
                            style={{ textDecoration: 'none', color: 'inherit' }}
                        >
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
                                        <button className="view-hub">View Hub</button>
                                    </div>
                                </div>
                            </CommunityCard>
                        </Link>
                    ))}
                </CarouselTrack>
                <CarouselButton 
                    className="next" 
                    onClick={handleNextClick}
                    disabled={!canScrollRight}
                >
                    <ChevronRight size={20} />
                </CarouselButton>
            </CarouselContainer>
        </div>
    );
};

export default RecommendedCommunities; 
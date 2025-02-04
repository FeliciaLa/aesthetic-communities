import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { ChevronDown, Search, ChevronLeft, ChevronRight } from 'react-feather';
import ErrorBoundary from '../ErrorBoundary';
import RecommendedCommunities from './RecommendedCommunities';

// Styled Components
const Container = styled.div`
  .explore-container {
    margin-top: ${props => props.isLoggedIn ? '20px' : 0};
    padding-top: ${props => props.isLoggedIn ? '20px' : 0};
  }
`;

const ExploreHeader = styled.div`
  padding: 40px 20px;
  background: linear-gradient(135deg, #0061ff 0%, #60efff 100%);
  color: white;
  text-align: center;
  margin-bottom: 30px;
  margin-top: 64px;

  h1 {
    font-size: 2.5rem;
    margin-bottom: 10px;
  }

  p {
    font-size: 1.2rem;
    margin-bottom: 25px;
    opacity: 0.9;
  }
`;

const SearchContainer = styled.div`
  position: relative;
  max-width: 800px;
  margin: 0 auto;
  
  svg {
    position: absolute;
    left: 25px;
    top: 50%;
    transform: translateY(-50%);
    color: #666;
    width: 20px;
    height: 20px;
  }
  
  input {
    width: 100%;
    padding: 20px 60px;
    border-radius: 30px;
    border: none;
    font-size: 18px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    transition: all 0.3s ease;
    
    &:focus {
      box-shadow: 0 6px 20px rgba(0,0,0,0.15);
      outline: none;
    }
  }
`;

const ViewSelector = styled.div`
  position: relative;
  display: inline-block;
  margin-bottom: 0;
  padding: 0;
`;

const DropdownButton = styled.button`
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  color: #333;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 150px;
  justify-content: space-between;
  height: 38px;
  
  &:hover {
    background: #f8f8f8;
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  z-index: 1000;
  min-width: 150px;
  
  button {
    display: block;
    width: 100%;
    padding: 8px 16px;
    border: none;
    background: none;
    text-align: left;
    cursor: pointer;
    color: #333;
    
    &:hover {
      background: #f0f0f0;
    }
    
    &.active {
      color: #0061ff;
      background: #f0f7ff;
    }
  }
`;

const ViewOptions = styled.div`
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  padding: 0 1.5rem;
`;

const CommunitiesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  padding: 0 6rem;
  margin: 0 3rem;
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

const LoadMoreContainer = styled.div`
  text-align: center;
  margin: 2rem 0;

  button {
    padding: 12px 24px;
    background: #0061ff;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    cursor: pointer;
    transition: background 0.2s ease;

    &:hover {
      background: #0056b3;
    }
  }
`;

const BottomAuthPrompt = styled.div`
  text-align: center;
  padding: 2rem;
  margin-top: 3rem;
  border-top: 1px solid #eee;
  background: #f8f9fa;

  p {
    font-size: 1.2rem;
    color: #666;
    margin-bottom: 1.5rem;
  }

  .login-button {
    padding: 0.75rem 2rem;
    font-size: 1.1rem;
    background: #0061ff;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.3s ease;

    &:hover {
      background: #0056b3;
    }
  }
`;

const CarouselContainer = styled.div`
  position: relative;
  padding: 0 6rem;
  margin: 0 6rem 2rem 6rem;
  overflow: hidden;
  background: #f8f9fa;
  border-radius: 8px;
`;

const CarouselTrack = styled.div`
  display: flex;
  gap: 1.5rem;
  padding: 1rem 0;
  animation: scroll 60s linear infinite;
  
  @keyframes scroll {
    0% {
      transform: translateX(calc(-350px * ${props => props.itemCount / 2}));
    }
    100% {
      transform: translateX(0);
    }
  }

  &:hover {
    animation-play-state: paused;
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
    left: 0;
  }

  &.next {
    right: 0;
  }
`;

const ExploreCommunities = ({ setIsLoggedIn, onAuthClick }) => {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeView, setActiveView] = useState('trending');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(9);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  const searchPlaceholders = [
    "Search hubs by keyword",
    "Try searching 'minimalist'",
    "Search for 'cottagecore'",
    "Looking for 'cyberpunk'?",
    "Find 'dark academia' hubs",
    "Explore 'Paris' inspired hubs",
    "Discover 'vintage' communities"
  ];

  const viewOptions = {
    trending: 'Trending',
    newest: 'Newest',
    oldest: 'Oldest',
    biggest: 'Most Members',
    smallest: 'Least Members'
  };

  const fetchCommunities = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Token ${token}` } : {};
      
      const response = await axios.get(
        'http://localhost:8000/api/communities/',
        { headers }
      );
      
      const communitiesWithFullUrls = response.data.map(community => ({
        ...community,
        banner_image: community.banner_image ? 
          (community.banner_image.startsWith('http') ? 
            community.banner_image : 
            `http://localhost:8000${community.banner_image}`
          ) : null
      }));

      setCommunities(communitiesWithFullUrls);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching communities:', err);
      setError('Failed to fetch communities');
      setLoading(false);
    }
  };

  const refreshCommunities = useCallback(() => {
    fetchCommunities();
  }, []);

  useEffect(() => {
    refreshCommunities();
  }, [refreshCommunities]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((current) => 
        current === searchPlaceholders.length - 1 ? 0 : current + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [searchPlaceholders.length]);

  const handleAuthClick = () => {
    onAuthClick();
  };

  const loadMore = () => {
    setDisplayLimit(prev => prev + 9);
  };

  const getFilteredCommunities = () => {
    let filtered = [...communities];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(community =>
        community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        community.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply view filter
    switch (activeView) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'biggest':
        filtered.sort((a, b) => b.member_count - a.member_count);
        break;
      case 'smallest':
        filtered.sort((a, b) => a.member_count - b.member_count);
        break;
      case 'trending':
      default:
        // Add your trending logic here if needed
        break;
    }
    
    return filtered;
  };

  // Get the filtered communities once
  const filteredCommunities = getFilteredCommunities();

  const isLoggedIn = !!localStorage.getItem('token');

  return (
    <ErrorBoundary>
      <Container isLoggedIn={isLoggedIn}>
        <ExploreHeader>
          <h1>Explore Aesthetic Hubs</h1>
          <p>Get inspired, find your community, and craft your unique aesthetic</p>
          <SearchContainer>
            <Search />
            <input
              type="text"
              placeholder={searchPlaceholders[placeholderIndex]}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchContainer>
        </ExploreHeader>

        {!isLoggedIn ? (
          // Logged out view
          <>
            {/* Trending Carousel */}
            <h2 style={{ padding: '0 6rem', margin: '0 3rem 1rem 3rem' }}>Trending Hubs</h2>
            <CarouselContainer>
              <CarouselTrack itemCount={communities.length}>
                {[...communities, ...communities]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .slice(0, 12)
                  .map(community => (
                    <Link 
                      to={`/communities/${community.id}`} 
                      key={community.id}
                      style={{ flex: '0 0 350px' }}
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
                            <span>{community.member_count} members</span>
                            <span>Created {new Date(community.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </CommunityCard>
                    </Link>
                  ))}
              </CarouselTrack>
            </CarouselContainer>

            {/* All Hubs Section */}
            <h2 style={{ padding: '0 6rem', margin: '0 3rem 1rem 3rem' }}>All Hubs</h2>
            <CommunitiesGrid>
              {communities
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(community => (
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
                          <span>{community.member_count} members</span>
                          <span>Created {new Date(community.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </CommunityCard>
                  </Link>
                ))}
            </CommunitiesGrid>

            <BottomAuthPrompt>
              <p>Join almas to create and participate in communities</p>
              <button onClick={handleAuthClick} className="login-button">
                Get Started
              </button>
            </BottomAuthPrompt>
          </>
        ) : (
          <>
            <RecommendedCommunities />
          </>
        )}
      </Container>
    </ErrorBoundary>
  );
};

export default ExploreCommunities;
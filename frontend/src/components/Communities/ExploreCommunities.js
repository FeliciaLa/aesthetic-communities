import React, { useState, useEffect, useCallback } from 'react';
import './ExploreCommunities.css';
import api from '../../api';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { ChevronDown, Search, ChevronLeft, ChevronRight } from 'react-feather';
import ErrorBoundary from '../ErrorBoundary';
import RecommendedCommunities from './RecommendedCommunities';

// Styled Components
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 10px;
  width: 100%;
  box-sizing: border-box;

  .explore-container {
    margin-top: ${props => props.isLoggedIn ? '20px' : '40px'};
    padding-top: ${props => props.isLoggedIn ? '20px' : '40px'};
  }
`;

const ExploreHeader = styled.div`
  width: 100vw;
  position: relative;
  left: 50%;
  right: 50%;
  margin-left: -50vw;
  margin-right: -50vw;
  padding: 50px 0;
  color: white;
  text-align: center;
  margin-bottom: 30px;
  margin-top: 0;
  z-index: 10;
  background-image: 
    linear-gradient(90deg, 
      rgba(0, 0, 0, 0.5) 0%, 
      rgba(0, 0, 0, 0.3) 100%),
    url('/Bannerbackground.png');
  background-size: cover;
  background-position: center;

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
  max-width: 610px;
  margin: 0 auto;
  width: 70%;
  margin-right: auto;
  margin-left: 25%;
  
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
  width: 100%;
  margin-bottom: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const StyledLink = styled(Link)`
  text-decoration: none;
  color: inherit;
`;

const CommunityCard = ({ community }) => (
  <div className="community-card">
    <div className="community-banner">
      {community.banner_image ? (
        <img 
          src={community.banner_image} 
          alt={community.name}
          onError={(e) => {
            e.target.onerror = null;
            e.target.parentElement.innerHTML = `
              <div class="placeholder-banner">
                ${community.name.charAt(0).toUpperCase()}
              </div>
            `;
          }}
        />
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
      </div>
    </div>
  </div>
);

const LoadMoreContainer = styled.div`
  text-align: center;
  margin: 2rem 0;

  button {
    padding: 12px 24px;
    background: #fa8072;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    cursor: pointer;
    transition: background 0.2s ease;

    &:hover {
      background: #ff9288;
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
  width: 100%;
  margin-bottom: 2rem;
  overflow: hidden;
  background: #f8f9fa;
  border-radius: 8px;
`;

const CarouselTrack = styled.div`
  display: flex;
  gap: 1.5rem;
  padding: 1rem 0;
  animation: scroll 60s linear infinite;
  
  > a {
    flex: 0 0 300px;
    width: 300px;
  }
  
  @keyframes scroll {
    0% {
      transform: translateX(calc(-300px * ${props => props.itemCount / 2}));
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

const GetStartedSection = styled.div`
  background: #fff;
  padding: 2rem;
  text-align: center;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  margin: 2rem 0;

  h3 {
    color: #333;
    font-size: 1.2rem;
    margin-bottom: 1.5rem;
  }

  button {
    background: #fa8072;
    color: white;
    border: none;
    padding: 0.75rem 2rem;
    border-radius: 20px;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: #ff9288;
    }
  }
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 2rem auto 1rem auto;
  padding: 0 1.5rem;

  h2 {
    margin: 0;
  }
`;

const getImageUrl = (image) => {
  return image.startsWith('http') 
    ? image 
    : `${api.defaults.baseURL}${image}`;
};

const ExploreCommunities = ({ setIsLoggedIn, onAuthClick }) => {
  const [communities, setCommunities] = useState([]);
  const [trendingCommunities, setTrendingCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeView, setActiveView] = useState('alphabetical');
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
    alphabetical: 'A to Z',
    trending: 'Trending',
    newest: 'Newest',
    oldest: 'Oldest',
    biggest: 'Most Members',
    smallest: 'Least Members'
  };

  const fetchCommunities = async () => {
    try {
      console.log('Fetching all communities...');
      const response = await api.get('/communities/');
      console.log('All communities response:', response.data);
      
      const transformedCommunities = response.data.map(community => ({
        ...community,
        banner_image: community.banner_image ? 
          `https://aesthetic-communities-production.up.railway.app/media/${community.banner_image}` : null
      }));
      
      console.log('Transformed communities:', transformedCommunities);
      setCommunities(transformedCommunities);
    } catch (error) {
      console.error('Error fetching communities:', error);
      setError('Failed to load communities');
    }
  };

  const fetchTrendingCommunities = async () => {
    try {
      console.log('Fetching trending communities...');
      const response = await api.get('/communities/trending/');
      
      if (response.data && response.data.length > 0) {
        const transformedCommunities = response.data.map(community => ({
          ...community,
          banner_image: community.banner_image ? 
            `https://aesthetic-communities-production.up.railway.app/media/${community.banner_image}` : null
        }));
        
        setTrendingCommunities(transformedCommunities);
      } else {
        const fallbackTrending = communities
          .sort((a, b) => (b.member_count || 0) - (a.member_count || 0))
          .slice(0, 5);
        setTrendingCommunities(fallbackTrending);
      }
    } catch (error) {
      console.error('Error fetching trending communities:', error);
      const fallbackTrending = communities
        .sort((a, b) => (b.member_count || 0) - (a.member_count || 0))
        .slice(0, 5);
      setTrendingCommunities(fallbackTrending);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([
        fetchCommunities(),
        fetchTrendingCommunities()
      ]);
      setLoading(false);
    };
    fetchData();
  }, []);

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
        // Add your trending logic here if needed
        break;
      case 'alphabetical':
      default:
        filtered.sort((a, b) => a.name.localeCompare(b.name));
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
            <h2 style={{ maxWidth: '1200px', margin: '0 auto 1rem auto', padding: '0 1.5rem' }}>Trending Hubs</h2>
            <CarouselContainer>
              <CarouselTrack itemCount={10}>
                {trendingCommunities
                  .concat(trendingCommunities) // Duplicate for infinite scroll
                  .map(community => (
                    <StyledLink to={`/communities/${community.id}`} key={`${community.id}-${Math.random()}`}>
                      <CommunityCard community={community} />
                    </StyledLink>
                  ))}
              </CarouselTrack>
            </CarouselContainer>

            {/* All Hubs Section */}
            <SectionHeader>
              <h2>All Hubs</h2>
              <ViewOptions>
                <ViewSelector>
                  <DropdownButton onClick={() => setDropdownOpen(!dropdownOpen)}>
                    {viewOptions[activeView]}
                    <ChevronDown size={16} />
                  </DropdownButton>
                  {dropdownOpen && (
                    <DropdownMenu>
                      {Object.entries(viewOptions).map(([key, label]) => (
                        <button
                          key={key}
                          className={activeView === key ? 'active' : ''}
                          onClick={() => {
                            setActiveView(key);
                            setDropdownOpen(false);
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </DropdownMenu>
                  )}
                </ViewSelector>
              </ViewOptions>
            </SectionHeader>
            <CommunitiesGrid>
              {communities
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(community => (
                  <StyledLink to={`/communities/${community.id}`} key={community.id}>
                    <CommunityCard community={community} />
                  </StyledLink>
                ))}
            </CommunitiesGrid>

            <GetStartedSection>
              <h3>Join almas to create and participate in communities</h3>
              <button onClick={handleAuthClick}>Get Started</button>
            </GetStartedSection>
          </>
        ) : (
          <>
            <RecommendedCommunities />
            
            {/* Trending Section */}
            <h2 style={{ maxWidth: '1200px', margin: '2rem auto 1rem auto', padding: '0 1.5rem' }}>Trending Hubs</h2>
            <CarouselContainer>
              <CarouselTrack itemCount={trendingCommunities.length * 2}>
                {trendingCommunities.length > 0 ? (
                  [...trendingCommunities, ...trendingCommunities].map((community, index) => (
                    <StyledLink 
                      to={`/communities/${community.id}`} 
                      key={`${community.id}-${index}`}
                    >
                      <CommunityCard community={community} />
                    </StyledLink>
                  ))
                ) : (
                  <div>Loading trending communities...</div>
                )}
              </CarouselTrack>
            </CarouselContainer>

            {/* All Hubs Section */}
            <SectionHeader>
              <h2>All Hubs</h2>
              <ViewOptions>
                <ViewSelector>
                  <DropdownButton onClick={() => setDropdownOpen(!dropdownOpen)}>
                    {viewOptions[activeView]}
                    <ChevronDown size={16} />
                  </DropdownButton>
                  {dropdownOpen && (
                    <DropdownMenu>
                      {Object.entries(viewOptions).map(([key, label]) => (
                        <button
                          key={key}
                          className={activeView === key ? 'active' : ''}
                          onClick={() => {
                            setActiveView(key);
                            setDropdownOpen(false);
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </DropdownMenu>
                  )}
                </ViewSelector>
              </ViewOptions>
            </SectionHeader>
            <CommunitiesGrid>
              {getFilteredCommunities()
                .slice(0, displayLimit)
                .map(community => (
                  <StyledLink to={`/communities/${community.id}`} key={community.id}>
                    <CommunityCard community={community} />
                  </StyledLink>
                ))}
            </CommunitiesGrid>

            {filteredCommunities.length > displayLimit && (
              <LoadMoreContainer>
                <button onClick={loadMore}>Load More</button>
              </LoadMoreContainer>
            )}
          </>
        )}
      </Container>
    </ErrorBoundary>
  );
};

export default ExploreCommunities;
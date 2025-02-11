import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import styled from 'styled-components';
import { DEFAULT_AVATAR } from '../Communities/CommunityFeed';
import EditProfileModal from './EditProfileModal';
import api from '../../api';
import SavedItems from './SavedItems';
import { API_BASE_URL } from '../../config';
import { getFullImageUrl } from '../../utils/imageUtils';

const ProfileCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  width: 100%;
  margin: 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-align: center;

  .profile-info {
    position: relative;
    margin-bottom: 1.5rem;
    padding-bottom: 1.5rem;
  }

  .profile-avatar {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    margin: 0 auto 1rem;
    overflow: hidden;
    background: #f0f0f0;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .edit-profile-button {
    position: absolute;
    top: 0;
    right: 0;
    background: #FF7F6F;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.2s ease;

    &:hover {
      background: #ff9288;
    }
  }

  .hubs-section {
    text-align: left;
    margin-bottom: 2rem;
    border: none;
  }

  .communities-content,
  .communities-grid,
  .empty-community {
    border: none;
  }

  .community-banner {
    height: 120px;
    background: #f0f0f0;
    position: relative;
    overflow: hidden;
    border-radius: 8px 8px 0 0;
    margin: -1.5rem -1.5rem 1rem -1.5rem;

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
`;

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createdCommunities, setCreatedCommunities] = useState([]);
  const [joinedCommunities, setJoinedCommunities] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [bio, setBio] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [activeCommunitiesTab, setActiveCommunitiesTab] = useState('joined');
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeSavedTab, setActiveSavedTab] = useState('images');
  const [savedImages, setSavedImages] = useState([]);
  const [savedResources, setSavedResources] = useState([]);
  const [savedProducts, setSavedProducts] = useState([]);
  const navigate = useNavigate();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const formData = new FormData();
    
    formData.append('bio', bio);
    if (profilePicture) {
      formData.append('avatar', profilePicture);
    }

    try {
      const response = await api.patch(
        '/auth/profile/update/',
        formData,
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'multipart/form-data',
          }
        }
      );
      
      setProfile(response.data);
      setBio(response.data.bio || '');
      setEditMode(false);
      
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err.response?.data || err.message);
      setError('Failed to update profile');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/');
          return;
        }

        const [profileRes, allCommunitiesRes] = await Promise.all([
          api.get('/auth/profile/', {
            headers: {
              'Authorization': `Token ${token}`
            }
          }),
          api.get('/communities/')
        ]);

        // Transform the communities data
        const baseURLWithoutApi = API_BASE_URL.split('/api')[0];
        const allCommunities = allCommunitiesRes.data.map(community => ({
          ...community,
          banner_image: community.banner_image
            ? (community.banner_image.startsWith('http')
              ? community.banner_image
              : `${baseURLWithoutApi}${community.banner_image}`)
            : null
        }));

        // Filter communities
        const username = localStorage.getItem('username');
        const created = allCommunities.filter(
          community => community.created_by === username
        );

        // Check membership status
        const membershipChecks = await Promise.all(
          allCommunities.map(community =>
            api.get(`/communities/${community.id}/membership/`)
          )
        );

        const joined = allCommunities.filter((community, index) => 
          membershipChecks[index].data.is_member && community.created_by !== username
        );

        setCreatedCommunities(created);
        setJoinedCommunities(joined);
        setProfile(profileRes.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Failed to load profile');
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  if (loading) return <div className="profile-loading">Loading profile...</div>;
  if (error) return <div className="profile-error">{error}</div>;
  if (!profile) return <div>No profile data found</div>;

  return (
    <div className="profile-container">
      <div className="profile-layout">
        <ProfileCard>
          <div className="profile-info">
            <div className="profile-avatar">
              {previewImage || profile?.avatar ? (
                <img 
                  src={previewImage || profile.avatar} 
                  alt={profile.username}
                  onError={(e) => {
                    console.log('Image load error:', previewImage || profile.avatar); // Debug log
                    e.target.onerror = null;
                    e.target.src = DEFAULT_AVATAR; // Fallback to default image
                  }}
                />
              ) : (
                <img src={DEFAULT_AVATAR} alt="Default profile" />
              )}
            </div>
            <h1>{profile?.username}</h1>
            <p>{profile?.bio || "Hi, I'm " + profile?.username + "!"}</p>
            <button 
              onClick={() => setShowEditModal(true)} 
              className="edit-profile-button"
            >
              Edit Profile
            </button>
          </div>

          <div className="hubs-section">
            <h2>Your Hubs</h2>
            <div className="tabs">
              <button 
                className={`tab ${activeCommunitiesTab === 'joined' ? 'active' : ''}`}
                onClick={() => setActiveCommunitiesTab('joined')}
              >
                Joined
              </button>
              <button 
                className={`tab ${activeCommunitiesTab === 'created' ? 'active' : ''}`}
                onClick={() => setActiveCommunitiesTab('created')}
              >
                Created
              </button>
            </div>

            <div className="communities-content">
              {activeCommunitiesTab === 'joined' && (
                <div className="communities-grid">
                  {joinedCommunities?.length === 0 ? (
                    <div className="empty-community">
                      <h3>No hubs joined yet</h3>
                      <p>Join hubs to connect with others and share inspiration</p>
                      <Link to="/communities" className="explore-button">
                        Explore Hubs
                      </Link>
                    </div>
                  ) : (
                    joinedCommunities?.map(community => (
                      <Link 
                        to={`/communities/${community.id}`} 
                        key={community.id}
                        className="community-card"
                      >
                        <div className="community-banner">
                          {community.banner_image ? (
                            <img 
                              src={community.banner_image} 
                              alt={community.name}
                              onError={(e) => {
                                e.target.onerror = null; // Prevent infinite loop
                                e.target.style.display = 'none'; // Hide broken image
                                // Show placeholder instead
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
                        <h3>{community.name}</h3>
                        <p>{community.description}</p>
                      </Link>
                    ))
                  )}
                </div>
              )}

              {activeCommunitiesTab === 'created' && (
                <div className="communities-grid">
                  {createdCommunities?.length === 0 ? (
                    <div className="empty-community">
                      <h3>No hubs created yet</h3>
                      <p>Create your first hub to connect with others</p>
                      <Link to="/create-community" className="create-button">
                        Create Hub
                      </Link>
                    </div>
                  ) : (
                    createdCommunities?.map(community => (
                      <Link 
                        to={`/communities/${community.id}`} 
                        key={community.id}
                        className="community-card"
                      >
                        <div className="community-banner">
                          {community.banner_image ? (
                            <img 
                              src={community.banner_image} 
                              alt={community.name}
                              onError={(e) => {
                                e.target.onerror = null; // Prevent infinite loop
                                e.target.style.display = 'none'; // Hide broken image
                                // Show placeholder instead
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
                        <h3>{community.name}</h3>
                        <p>{community.description}</p>
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="saved-items-section">
            <SavedItems /> 
          </div>
        </ProfileCard>
      </div>

      {showEditModal && (
        <EditProfileModal
          show={showEditModal}
          onClose={() => setShowEditModal(false)}
          profile={profile}
          onSuccess={(updatedProfile) => {
            setProfile(updatedProfile);
            setShowEditModal(false);
          }}
        />
      )}

      <style jsx>{`
        .profile-container {
          min-height: calc(100vh - 64px);
          background-color: #f5f5f5;
          padding: 2rem;
        }

        .profile-layout {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }

        .profile-card {
          width: 100%;
          min-width: 0;
          height: 100%;
        }

        .content-card {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          height: 100%;
          width: 100%;
          overflow: hidden;
        }

        .content-card h2 {
          font-size: 1.5rem;
          color: #333;
          margin-bottom: 0.5rem;
        }

        .tabs {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .tab {
          padding: 0.5rem 1.5rem;
          border: none;
          background: none;
          cursor: pointer;
          color: #666;
          border-bottom: 2px solid transparent;
          transition: all 0.3s ease;
          outline: none;
        }

        .tab:focus {
          outline: none;
          box-shadow: none;
        }

        .tab.active {
          background-color: #FF7F6F;
          color: white !important;
          border-radius: 20px;
          border-bottom: none;
        }

        .tab:hover {
          background-color: #FF7F6F;
          color: white;
        }

        .communities-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .community-card {
          background: white;
          border: 1px solid #eee;
          border-radius: 8px;
          padding: 1.5rem;
          text-decoration: none;
          color: inherit;
          transition: transform 0.2s ease;
        }

        .community-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .empty-message {
          text-align: center;
          color: #666;
          padding: 0.5rem;
        }

        .empty-community {
          text-align: center;
          border: 1px dashed #eee;
          background: #fafafa;
          padding: 2rem;
          border-radius: 8px;
        }

        .empty-community h3 {
          color: #333;
          margin-bottom: 0.5rem;
        }

        .empty-community p {
          color: #666;
          margin-bottom: 1.5rem;
        }

        .explore-button {
          display: inline-block;
          padding: 0.5rem 1.5rem;
          background: #FF7F6F;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          transition: background 0.2s ease;
        }

        .explore-button:hover {
          background: #ff9288;
        }

        .create-button {
          display: inline-block;
          padding: 0.5rem 1.5rem;
          background: #FF7F6F;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          transition: background 0.2s ease;
        }

        .create-button:hover {
          background: #ff9288;
        }

        .empty-saved {
          text-align: center;
          border: 1px dashed #eee;
          background: #fafafa;
          padding: 2rem;
          border-radius: 8px;
          margin: 1rem;
        }

        .empty-saved h3 {
          color: #333;
          margin-bottom: 0.5rem;
        }

        .empty-saved p {
          color: #666;
          margin-bottom: 1.5rem;
        }

        .saved-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
          padding: 1rem;
        }

        .tabs {
          display: flex;
          border-bottom: 1px solid #eee;
          margin-bottom: 1rem;
        }

        .tab {
          padding: 0.5rem 1rem;
          border: none;
          background: none;
          cursor: pointer;
          color: #666;
          border-bottom: 2px solid transparent;
          transition: all 0.2s ease;
        }

        .tab.active {
          color: #FF7F6F;
          border-bottom-color: #FF7F6F;
        }

        .tab:hover {
          color: #FF7F6F;
        }

        .community-banner {
          height: 120px;
          background: #f0f0f0;
          position: relative;
          overflow: hidden;
          border-radius: 8px 8px 0 0;
          margin: -1.5rem -1.5rem 1rem -1.5rem;

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
      `}</style>
    </div>
  );
};

export default Profile;
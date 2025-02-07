import React, { useState, useEffect } from 'react';
import api from '../../api';

// Use a data URL for the default avatar to avoid external service dependencies
const DEFAULT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjRTJFOEYwIi8+CjxwYXRoIGQ9Ik0yNSAxOUMyNi42NTY5IDE5IDI4IDIwLjM0MzEgMjggMjJDMjggMjMuNjU2OSAyNi42NTY5IDI1IDI1IDI1QzIzLjM0MzEgMjUgMjIgMjMuNjU2OSAyMiAyMkMyMiAyMC4zNDMxIDIzLjM0MzEgMTkgMjUgMTlaIiBmaWxsPSIjQTBBRkJBIi8+CjxwYXRoIGQ9Ik0zMyAzM0MzMyAyOS42ODYzIDI5LjMxMzcgMjcgMjUgMjdDMjAuNjg2MyAyNyAxNyAyOS42ODYzIDE3IDMzSDMzWiIgZmlsbD0iI0EwQUZCQSIvPgo8L3N2Zz4K';

const MembersList = ({ communityId }) => {
    const [members, setMembers] = useState([]);
    const [creator, setCreator] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await api.get(
                    `/communities/${communityId}/members/`
                );
                setCreator(response.data.creator);
                setMembers(response.data.members);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching members:', err);
                setError('Failed to load members');
                setLoading(false);
            }
        };

        fetchMembers();
    }, [communityId]);

    if (loading) return <div>Loading members...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="members-container">
            {creator && (
                <div className="members-section">
                    <h3>Community Creator</h3>
                    <div className="creator-card">
                        <img 
                            src={creator.avatar || DEFAULT_AVATAR}
                            alt={`${creator.username}'s avatar`}
                            className="member-avatar"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = DEFAULT_AVATAR;
                            }}
                        />
                        <div className="member-info">
                            <h4>{creator.username}</h4>
                            <span className="role">Creator</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="members-section">
                <h3>Members ({members.length})</h3>
                <div className="members-grid">
                    {members.map(member => (
                        <div key={member.id} className="member-card">
                            <img 
                                src={member.avatar || DEFAULT_AVATAR}
                                alt={`${member.username}'s avatar`}
                                className="member-avatar"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = DEFAULT_AVATAR;
                                }}
                            />
                            <div className="member-info">
                                <h4>{member.username}</h4>
                                <span className="join-date">
                                    Joined {new Date(member.date_joined).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style jsx>{`
                .members-container {
                    padding: 20px;
                }
                .members-section {
                    margin-bottom: 30px;
                }
                .members-section h3 {
                    margin-bottom: 20px;
                    color: #333;
                    font-size: 1.2rem;
                }
                .creator-card {
                    display: flex;
                    align-items: center;
                    padding: 15px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    margin-bottom: 20px;
                    border: 2px solid #0061ff;
                }
                .members-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                    gap: 20px;
                }
                .member-card {
                    display: flex;
                    align-items: center;
                    padding: 15px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    transition: transform 0.2s ease;
                }
                .member-card:hover {
                    transform: translateY(-2px);
                }
                .member-avatar {
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    margin-right: 15px;
                    object-fit: cover;
                    background-color: #f0f2f5;
                }
                .member-info {
                    flex: 1;
                }
                .member-info h4 {
                    margin: 0;
                    font-size: 1rem;
                    color: #333;
                }
                .role {
                    font-size: 0.8rem;
                    color: #0061ff;
                    font-weight: 500;
                }
                .join-date {
                    font-size: 0.8rem;
                    color: #666;
                }
            `}</style>
        </div>
    );
};

export default MembersList; 
import React, { useState, useEffect } from 'react';
import api from '../../api';

const JoinCommunityButton = ({ communityId, isLoggedIn }) => {
    const [isMember, setIsMember] = useState(false);
    const [loading, setLoading] = useState(true);

    const checkMembershipStatus = async () => {
        if (!isLoggedIn) {
            setLoading(false);
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            const response = await api.get(`/communities/${communityId}/membership/`, {
                headers: { 
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            setIsMember(response.data.is_member);
            setLoading(false);
        } catch (error) {
            console.error('Error checking membership:', error);
            setLoading(false);
        }
    };

    const handleMembership = async () => {
        try {
            const token = localStorage.getItem('token');
            const action = isMember ? 'leave' : 'join';
            await api.post(`/communities/${communityId}/membership/`, 
                { action },
                {
                    headers: { 
                        'Authorization': `Token ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            setIsMember(!isMember);
        } catch (error) {
            console.error('Error updating membership:', error);
        }
    };

    useEffect(() => {
        checkMembershipStatus();
    }, [communityId]);

    if (loading || !isLoggedIn) return null;

    return (
        <button 
            onClick={handleMembership}
            className={`membership-button ${isMember ? 'leave' : 'join'}`}
        >
            {isMember ? 'Leave Community' : 'Join Community'}

            <style jsx>{`
                .membership-button {
                    padding: 8px 32px;
                    min-width: 180px;
                    border-radius: 20px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .join {
                    background: #fa8072; /* Base coral */
                    color: white;
                    border: none;
                }

                .join:hover {
                    background: #ff9288; /* Lighter coral */
                }

                .leave {
                    background: white;
                    color: #fa8072; /* Base coral */
                    border: 1px solid #fa8072; /* Base coral */
                }

                .leave:hover {
                    background: #fa8072; /* Base coral */
                    color: white;
                }
            `}</style>
        </button>
    );
};

export default JoinCommunityButton; 
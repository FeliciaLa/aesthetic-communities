import React, { useState, useEffect } from 'react';
import axios from 'axios';

const JoinCommunityButton = ({ communityId }) => {
    const [isMember, setIsMember] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkMembershipStatus();
    }, [communityId]);

    const checkMembershipStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://localhost:8000/api/communities/${communityId}/membership/`,
                {
                    headers: { 'Authorization': `Token ${token}` }
                }
            );
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
            
            await axios.post(
                `http://localhost:8000/api/communities/${communityId}/membership/`,
                { action },
                {
                    headers: { 'Authorization': `Token ${token}` }
                }
            );
            
            setIsMember(!isMember);
        } catch (error) {
            console.error('Error updating membership:', error);
        }
    };

    if (loading) return null;

    return (
        <button 
            onClick={handleMembership}
            className={`membership-button ${isMember ? 'leave' : 'join'}`}
        >
            {isMember ? 'Leave Community' : 'Join Community'}

            <style jsx>{`
                .membership-button {
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .join {
                    background: #0061ff;
                    color: white;
                    border: none;
                }

                .join:hover {
                    background: #0056b3;
                }

                .leave {
                    background: white;
                    color: #dc3545;
                    border: 1px solid #dc3545;
                }

                .leave:hover {
                    background: #dc3545;
                    color: white;
                }
            `}</style>
        </button>
    );
};

export default JoinCommunityButton; 
import api from '../api';

export const musicService = {
    async getSpotifyPlaylist(communityId) {
        try {
            const token = localStorage.getItem('token');
            const response = await api.get(`/communities/${communityId}/spotify-playlist/`, {
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('Music service response:', response.data);
            return Array.isArray(response.data) ? response.data[0] : response.data;
        } catch (error) {
            console.error('Music service error:', {
                status: error.response?.status,
                data: error.response?.data,
                url: error.config?.url
            });
            throw error;
        }
    },

    async setSpotifyPlaylist(communityId, spotifyUrl) {
        const response = await api.post(
            `/communities/${communityId}/spotify-playlist/`,
            { 
                spotify_playlist_url: spotifyUrl,
                community: communityId 
            }
        );
        return response.data;
    },

    async updateSpotifyPlaylist(communityId, playlistId, spotifyUrl) {
        const response = await api.put(
            `/communities/${communityId}/spotify-playlist/${playlistId}/`,
            { 
                spotify_playlist_url: spotifyUrl,
                community: communityId 
            }
        );
        return response.data;
    }
};

export default musicService;
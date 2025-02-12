import api from '../api';

export const musicService = {
    async getSpotifyPlaylist(communityId) {
        try {
            const token = localStorage.getItem('token');
            const endpoint = `/communities/${communityId}/spotify-playlist/`;
            
            console.log('Spotify request configuration:', {
                endpoint,
                baseURL: api.defaults.baseURL,
                token: token ? 'Present' : 'Missing',
                fullUrl: `${api.defaults.baseURL}${endpoint}`
            });

            const response = await api.get(endpoint, {
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Spotify response:', response);
            return Array.isArray(response.data) ? response.data[0] : response.data;
        } catch (error) {
            console.error('Spotify request failed:', {
                endpoint: `/communities/${communityId}/spotify-playlist/`,
                actualUrl: error.config?.url,  // This will show what URL was actually used
                baseURL: error.config?.baseURL,
                status: error.response?.status,
                data: error.response?.data
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
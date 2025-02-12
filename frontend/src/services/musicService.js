import api from '../api';
import { API_BASE_URL } from '../config';

console.log('Music Service Configuration:', {
    API_BASE_URL,
    apiDefaultsBaseURL: api.defaults.baseURL,
    fullExample: `${api.defaults.baseURL}/communities/123/spotify-playlist/`
});

export const musicService = {
    async getSpotifyPlaylist(communityId) {
        try {
            const token = localStorage.getItem('token');
            const endpoint = `communities/${communityId}/spotify-playlist/`;
            
            console.log('Making Spotify request:', {
                endpoint,
                baseURL: api.defaults.baseURL,
                token: token ? 'Present' : 'Missing'
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
                endpoint: `communities/${communityId}/spotify-playlist/`,
                actualUrl: error.config?.url,
                baseURL: error.config?.baseURL,
                status: error.response?.status,
                data: error.response?.data
            });
            throw error;
        }
    },

    async setSpotifyPlaylist(communityId, spotifyUrl) {
        const token = localStorage.getItem('token');
        const response = await api.post(
            `communities/${communityId}/spotify-playlist/`,
            { 
                spotify_playlist_url: spotifyUrl,
                community: communityId 
            },
            {
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    },

    async updateSpotifyPlaylist(communityId, playlistId, spotifyUrl) {
        const token = localStorage.getItem('token');
        const response = await api.put(
            `communities/${communityId}/spotify-playlist/${playlistId}/`,
            { 
                spotify_playlist_url: spotifyUrl,
                community: communityId 
            },
            {
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    }
};

export default musicService;
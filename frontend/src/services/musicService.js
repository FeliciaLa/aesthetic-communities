import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export const musicService = {
    async getSpotifyPlaylist(communityId) {
        const response = await axios.get(
            `${API_URL}/communities/${communityId}/spotify-playlist/`,
            {
                headers: {
                    'Authorization': `Token ${localStorage.getItem('token')}`
                }
            }
        );
        return Array.isArray(response.data) ? response.data[0] : response.data;
    },

    async setSpotifyPlaylist(communityId, spotifyUrl) {
        const response = await axios.post(
            `${API_URL}/communities/${communityId}/spotify-playlist/`,
            { 
                spotify_playlist_url: spotifyUrl,
                community: communityId 
            },
            {
                headers: {
                    'Authorization': `Token ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    },

    async updateSpotifyPlaylist(communityId, playlistId, spotifyUrl) {
        const response = await axios.put(
            `${API_URL}/communities/${communityId}/spotify-playlist/${playlistId}/`,
            { 
                spotify_playlist_url: spotifyUrl,
                community: communityId 
            },
            {
                headers: {
                    'Authorization': `Token ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    }
};

export default musicService;
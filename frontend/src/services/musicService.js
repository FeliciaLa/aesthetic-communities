import api from '../api';

export const musicService = {
    async getSpotifyPlaylist(communityId) {
        const response = await api.get(`/communities/${communityId}/spotify-playlist/`);
        return Array.isArray(response.data) ? response.data[0] : response.data;
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
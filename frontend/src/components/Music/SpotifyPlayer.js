import React, { useState, useEffect } from 'react';
import api from '../../api';

const SpotifyPlayer = ({ communityId, isCreator }) => {
    const [playlist, setPlaylist] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [playlistUrl, setPlaylistUrl] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchPlaylist = async () => {
        if (!communityId) {
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            console.log('Fetching playlist for community:', communityId);
            
            // Using the correct endpoint
            const response = await api.get(`/communities/${communityId}/spotify-playlist/`, {
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Playlist response:', response.data);

            if (response.data && response.data.spotify_playlist_url) {
                setPlaylist(response.data.spotify_playlist_url);
            } else {
                setPlaylist(null);
            }
        } catch (err) {
            if (err.response?.status === 404) {
                // No playlist exists yet - not an error
                setPlaylist(null);
            } else {
                console.error('Error fetching playlist:', err);
                setError('Unable to load playlist');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlaylist();
    }, [communityId]);

    const cleanSpotifyUrl = (url) => {
        if (!url) return '';
        const playlistId = url.match(/playlist\/([a-zA-Z0-9]+)/)?.[1];
        if (!playlistId) return '';
        return `https://open.spotify.com/playlist/${playlistId}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const cleanedUrl = cleanSpotifyUrl(playlistUrl);
        if (!cleanedUrl) {
            setError('Please enter a valid Spotify playlist URL');
            return;
        }

        try {
            if (playlist?.id) {
                await api.put(
                    `/communities/${communityId}/spotify/${playlist.id}/`,
                    { spotify_playlist_url: cleanedUrl }
                );
            } else {
                await api.post(
                    `/communities/${communityId}/spotify/`,
                    { spotify_playlist_url: cleanedUrl }
                );
            }

            await fetchPlaylist();
            
            setShowForm(false);
            setPlaylistUrl('');
            setError('');
        } catch (err) {
            console.error('Error handling playlist:', err);
            const errorMessage = err.response?.data?.error || 
                               err.response?.data?.spotify_playlist_url?.[0] ||
                               'Failed to handle playlist. Please check the URL and try again.';
            setError(errorMessage);
        }
    };

    const getSpotifyEmbedUrl = (url) => {
        const playlistId = url.split('/playlist/')[1]?.split('?')[0];
        if (!playlistId) return '';
        return `https://open.spotify.com/embed/playlist/${playlistId}`;
    };

    // Function to render the Spotify embed
    const renderSpotifyEmbed = (url) => {
        if (!url) {
            console.log('No URL provided to renderSpotifyEmbed'); // Debug log
            return null;
        }
        
        try {
            console.log('Attempting to render playlist URL:', url); // Debug log
            const embedUrl = url.replace('open.spotify.com', 'open.spotify.com/embed');
            
            return (
                <iframe
                    src={embedUrl}
                    width="100%"
                    height="380"
                    frameBorder="0"
                    allowtransparency="true"
                    allow="encrypted-media"
                    title="Spotify Playlist"
                />
            );
        } catch (error) {
            console.error('Error rendering Spotify embed:', error);
            return null;
        }
    };

    // Simple loading and error states
    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    // If no playlist and user is creator, show add button
    if (!playlist && isCreator) {
        return (
            <div className="spotify-player">
                <h2>Community Playlist</h2>
                <button onClick={() => setShowForm(true)}>
                    Add Playlist
                </button>
            </div>
        );
    }

    // If no playlist and user is not creator, show message
    if (!playlist) {
        return (
            <div className="spotify-player">
                <h2>Community Playlist</h2>
                <p>No playlist has been added yet.</p>
            </div>
        );
    }

    // Show the playlist if we have one
    return (
        <div className="spotify-player">
            <h2>Community Playlist</h2>
            <iframe
                src={`https://open.spotify.com/embed/playlist/${playlist.split('/').pop()}`}
                width="100%"
                height="380"
                frameBorder="0"
                allowtransparency="true"
                allow="encrypted-media"
            ></iframe>
        </div>
    );
};

export default SpotifyPlayer; 
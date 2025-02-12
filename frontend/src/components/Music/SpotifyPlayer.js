import React, { useState, useEffect } from 'react';
import { musicService } from '../../services/musicService';

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
            console.log('Fetching playlist for community:', communityId);
            const data = await musicService.getSpotifyPlaylist(communityId);
            console.log('Playlist data received:', data);

            if (data && data.spotify_playlist_url) {
                setPlaylist(data.spotify_playlist_url);
            } else {
                setPlaylist(null);
            }
            setError(null);
        } catch (err) {
            console.error('Spotify fetch error:', {
                message: err.message,
                status: err.response?.status,
                url: err.config?.url,
                baseURL: err.config?.baseURL,
                fullUrl: `${err.config?.baseURL}${err.config?.url}`
            });
            
            if (err.response?.status === 404) {
                setPlaylist(null);
            } else {
                setError('Unable to load playlist');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (communityId) {
            fetchPlaylist();
        }
    }, [communityId]);

    const cleanSpotifyUrl = (url) => {
        if (!url) return '';
        const playlistId = url.match(/playlist\/([a-zA-Z0-9]+)/)?.[1];
        if (!playlistId) return '';
        return `https://open.spotify.com/playlist/${playlistId}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const cleanedUrl = cleanSpotifyUrl(playlistUrl);
            if (!cleanedUrl) {
                setError('Please enter a valid Spotify playlist URL');
                return;
            }

            if (playlist?.id) {
                await musicService.updateSpotifyPlaylist(communityId, playlist.id, cleanedUrl);
            } else {
                await musicService.setSpotifyPlaylist(communityId, cleanedUrl);
            }

            await fetchPlaylist();
            setShowForm(false);
            setPlaylistUrl('');
            setError('');
        } catch (err) {
            console.error('Error updating playlist:', err);
            setError('Failed to update playlist');
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
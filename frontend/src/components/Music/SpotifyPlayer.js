import React, { useState, useEffect } from 'react';
import { musicService } from '../../services/musicService';

const SpotifyPlayer = ({ communityId, isCreator }) => {
    const [playlist, setPlaylist] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [playlistUrl, setPlaylistUrl] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    // Add immediate logging when component renders
    console.log('SpotifyPlayer mounted:', {
        communityId,
        isCreator,
        loading,
        hasPlaylist: !!playlist
    });

    useEffect(() => {
        console.log('SpotifyPlayer state updated:', {
            communityId,
            isCreator,
            loading,
            hasPlaylist: !!playlist,
            showForm
        });
    }, [communityId, isCreator, loading, playlist, showForm]);

    const fetchPlaylist = async () => {
        if (!communityId) {
            setLoading(false);
            return;
        }

        try {
            console.log('Fetching playlist for community:', communityId);
            const data = await musicService.getSpotifyPlaylist(communityId);
            console.log('Playlist data received:', data);

            if (data) {
                setPlaylist(data);
            } else {
                setPlaylist(null);
            }
            setError(null);
        } catch (err) {
            console.error('Spotify fetch error:', err);
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
            // Validate URL format first
            if (!playlistUrl || typeof playlistUrl !== 'string') {
                setError('Please enter a valid Spotify playlist URL');
                return;
            }

            // Extract playlist ID from URL
            let playlistId;
            try {
                const url = new URL(playlistUrl);
                playlistId = url.pathname.split('/').pop();
            } catch (urlError) {
                console.error('URL parsing error:', urlError);
                setError('Invalid Spotify URL format');
                return;
            }

            if (!playlistId) {
                setError('Could not extract playlist ID from URL');
                return;
            }

            console.log('Submitting playlist:', {
                url: playlistUrl,
                playlistId: playlistId,
                communityId: communityId
            });

            const response = await musicService.addSpotifyPlaylist(communityId, playlistId);
            setPlaylist(response);
            setShowForm(false);
            setPlaylistUrl('');
            setError('');
        } catch (err) {
            console.error('Error adding playlist:', err);
            setError('Failed to add playlist. Please check the URL and try again.');
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

    // If no playlist and user is creator, show add button and form
    if (!playlist && isCreator) {
        console.log('Should show Add Playlist button:', {
            playlist: playlist,
            isCreator: isCreator
        });
        return (
            <div className="spotify-player">
                <h2>Community Playlist</h2>
                {showForm ? (
                    <form onSubmit={handleSubmit}>
                        <input
                            type="text"
                            value={playlistUrl}
                            onChange={(e) => setPlaylistUrl(e.target.value)}
                            placeholder="Enter Spotify playlist URL"
                            required
                        />
                        <button type="submit">Submit</button>
                    </form>
                ) : (
                    <button onClick={() => setShowForm(true)}>
                        Add Playlist
                    </button>
                )}
                {error && <div className="error">{error}</div>}
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
import React, { useState, useEffect, useCallback } from 'react';
import { musicService } from '../../services/musicService';
import axios from 'axios';

const SpotifyPlayer = ({ communityId, isCreator }) => {
    const [playlist, setPlaylist] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [playlistUrl, setPlaylistUrl] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchPlaylist = async () => {
        try {
            const data = await musicService.getSpotifyPlaylist(communityId);
            setPlaylist(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching playlist:', error);
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
        setError('');

        const cleanedUrl = cleanSpotifyUrl(playlistUrl);
        if (!cleanedUrl) {
            setError('Please enter a valid Spotify playlist URL');
            return;
        }

        try {
            console.log('Submitting playlist:', {
                communityId,
                playlistId: playlist?.id,
                url: cleanedUrl
            });

            if (playlist?.id) {
                await musicService.updateSpotifyPlaylist(
                    communityId,
                    playlist.id,
                    cleanedUrl
                );
            } else {
                await musicService.setSpotifyPlaylist(communityId, cleanedUrl);
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

    return (
        <div className="section-container">
            <div className="section-header">
                <h3>Community Playlist</h3>
                {console.log('Debug values:', {
                    isCreator,
                    hasPlaylist: Boolean(playlist?.spotify_playlist_url),
                    playlistUrl: playlist?.spotify_playlist_url
                })}
                {isCreator && !showForm && (
                    <button 
                        className="add-playlist-button"
                        onClick={() => setShowForm(true)}
                    >
                        {playlist ? 'Update Playlist' : 'Add Spotify Playlist'}
                    </button>
                )}
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : (
                <>
                    {error && (
                        <div className="error-message">
                            {error}
                            <button className="close-error" onClick={() => setError('')}>×</button>
                        </div>
                    )}

                    {showForm ? (
                        <form onSubmit={handleSubmit} className="playlist-form">
                            <input
                                type="text"
                                value={playlistUrl}
                                onChange={(e) => setPlaylistUrl(e.target.value)}
                                placeholder="Enter Spotify playlist URL"
                                className="playlist-input"
                                required
                            />
                            <div className="form-buttons">
                                <button type="submit" className="submit-button">
                                    {playlist ? 'Update' : 'Add'} Playlist
                                </button>
                                <button 
                                    type="button" 
                                    className="cancel-button"
                                    onClick={() => {
                                        setShowForm(false);
                                        setError('');
                                        setPlaylistUrl('');
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    ) : (
                        <>
                            {playlist?.spotify_playlist_url ? (
                                <div className="playlist-container">
                                    <iframe
                                        src={playlist.spotify_playlist_url.replace('open.spotify.com', 'open.spotify.com/embed')}
                                        width="100%"
                                        height="380"
                                        frameBorder="0"
                                        allowtransparency="true"
                                        allow="encrypted-media"
                                        title="Spotify Playlist"
                                    />
                                </div>
                            ) : (
                                <div className="empty-playlist">
                                    <p>No playlist has been added to this community yet.</p>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

            <style jsx>{`
                .section-container {
                    background: white;
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 20px;
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .edit-button, .add-playlist-button {
                    padding: 8px 16px;
                    background: #1DB954;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                }

                .edit-button:hover, .add-playlist-button:hover {
                    background: #1ed760;
                }

                .playlist-container {
                    margin-top: 20px;
                }

                .playlist-actions {
                    margin-top: 15px;
                    display: flex;
                    justify-content: flex-end;
                }

                .empty-playlist {
                    text-align: center;
                    padding: 40px 20px;
                    background: #f8f9fa;
                    border-radius: 8px;
                    color: #666;
                }

                .empty-playlist p {
                    margin-bottom: 20px;
                }

                .playlist-form {
                    margin-top: 20px;
                }

                .playlist-input {
                    width: 100%;
                    padding: 10px;
                    margin-bottom: 15px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 14px;
                }

                .form-buttons {
                    display: flex;
                    gap: 10px;
                }

                .submit-button, .cancel-button {
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                }

                .submit-button {
                    background: #1DB954;
                    color: white;
                    border: none;
                }

                .cancel-button {
                    background: white;
                    border: 1px solid #ddd;
                }

                .error-message {
                    background-color: #fee;
                    border: 1px solid #fcc;
                    color: #c00;
                    padding: 10px;
                    margin: 10px 0;
                    border-radius: 4px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .close-error {
                    background: none;
                    border: none;
                    color: #c00;
                    cursor: pointer;
                    font-size: 18px;
                }
            `}</style>
        </div>
    );
};

export default SpotifyPlayer; 
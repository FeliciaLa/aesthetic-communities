import React, { useState, useEffect } from 'react';
import { musicService } from '../../services/musicService';

const SpotifyPlayer = ({ communityId, isCreator }) => {
    const [playlist, setPlaylist] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [playlistUrl, setPlaylistUrl] = useState('');
    const [error, setError] = useState('');

    const fetchPlaylist = async () => {
        try {
            const data = await musicService.getSpotifyPlaylist(communityId);
            setPlaylist(data);
        } catch (error) {
            console.error('Error fetching playlist:', error);
        }
    };

    useEffect(() => {
        if (communityId) {
            fetchPlaylist();
        }
    }, [communityId]);

    const handleSubmit = async () => {
        try {
            await musicService.setSpotifyPlaylist(communityId, playlistUrl);
            fetchPlaylist();
            setShowForm(false);
            setPlaylistUrl('');
        } catch (error) {
            setError('Failed to add playlist. Please check the URL and try again.');
        }
    };

    const getSpotifyEmbedUrl = (url) => {
        const playlistId = url.split('/playlist/')[1]?.split('?')[0];
        if (!playlistId) return '';
        return `https://open.spotify.com/embed/playlist/${playlistId}`;
    };

    return (
        <div className="section-container">
            <div className="section-header">
                <h3>Community Playlist</h3>
                {!playlist && isCreator && (
                    <button 
                        className="add-playlist-button"
                        onClick={() => setShowForm(true)}
                    >
                        Add Spotify Playlist
                    </button>
                )}
            </div>

            {showForm && (
                <div className="playlist-form">
                    <input
                        type="text"
                        className="playlist-input"
                        placeholder="Paste Spotify playlist URL"
                        value={playlistUrl}
                        onChange={(e) => setPlaylistUrl(e.target.value)}
                    />
                    <div className="form-buttons">
                        <button 
                            className="submit-button"
                            onClick={handleSubmit}
                        >
                            Add Playlist
                        </button>
                        <button 
                            className="cancel-button"
                            onClick={() => {
                                setShowForm(false);
                                setPlaylistUrl('');
                                setError('');
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {error && (
                <div className="error-message">
                    {error}
                    <button 
                        className="close-error"
                        onClick={() => setError('')}
                    >
                        ×
                    </button>
                </div>
            )}

            {playlist && playlist.spotify_playlist_url && (
                <div className="player-container">
                    <iframe
                        src={getSpotifyEmbedUrl(playlist.spotify_playlist_url)}
                        width="100%"
                        height="380"
                        frameBorder="0"
                        allow="encrypted-media"
                        title="Spotify Playlist"
                    />
                </div>
            )}

            <style jsx>{`
                .section-container {
                    background: white;
                    border-radius: 12px;
                    padding: 1.5rem;
                    margin-bottom: 2rem;
                    margin-top: 1rem;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    width: 100%;
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                }

                .section-header h3 {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: #333;
                    margin: 0;
                }

                .spotify-player {
                    width: 100%;
                }

                .player-container {
                    margin-top: 16px;
                    border-radius: 8px;
                    overflow: hidden;
                    background: #f8f8f8;
                }

                .player-container iframe {
                    border-radius: 8px;
                }

                .add-playlist-button {
                    width: 100%;
                    padding: 10px;
                    background: #1DB954;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: background-color 0.2s;
                }

                .playlist-form {
                    margin-top: 12px;
                }

                .playlist-input {
                    width: 100%;
                    padding: 8px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    margin-bottom: 8px;
                }

                .form-buttons {
                    display: flex;
                    gap: 8px;
                }

                .submit-button, .cancel-button {
                    padding: 8px 12px;
                    border-radius: 4px;
                    border: none;
                    cursor: pointer;
                    font-size: 14px;
                }

                .submit-button {
                    background: #1DB954;
                    color: white;
                    flex: 1;
                }

                .cancel-button {
                    background: #f5f5f5;
                    color: #666;
                }

                .error-message {
                    background: #fee;
                    color: #c00;
                    padding: 8px;
                    border-radius: 4px;
                    margin-bottom: 12px;
                    font-size: 14px;
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
                    padding: 0 4px;
                }
            `}</style>
        </div>
    );
};

export default SpotifyPlayer; 
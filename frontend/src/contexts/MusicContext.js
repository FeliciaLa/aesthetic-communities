import React, { createContext, useContext, useState } from 'react';

const MusicContext = createContext();

export const MusicProvider = ({ children }) => {
    const [currentTrack, setCurrentTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.5);

    const value = {
        currentTrack,
        setCurrentTrack,
        isPlaying,
        setIsPlaying,
        volume,
        setVolume
    };

    return (
        <MusicContext.Provider value={value}>
            {children}
        </MusicContext.Provider>
    );
};

export const useMusic = () => {
    const context = useContext(MusicContext);
    if (context === undefined) {
        throw new Error('useMusic must be used within a MusicProvider');
    }
    return context;
}; 
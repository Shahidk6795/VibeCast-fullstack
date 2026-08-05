import React, { useContext, useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { PlayerContext } from "../context/PlayerContext";
import { MoreVertical } from "lucide-react";
import AddToPlaylistModal from "@/components/AddToPlaylistModal";
import { API_URL } from "../config.js";
import { FastAverageColor } from "fast-average-color";

const formatTime = (sec) => {
  if (!sec) return "0:00";
  const minutes = Math.floor(sec / 60);
  const seconds = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const ArtistPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { artistName } = useParams();
  const decodedArtistName = decodeURIComponent(artistName);

  const [dbArtistData, setDbArtistData] = useState(null);
  const [displaySongs, setDisplaySongs] = useState([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
  
  const [themeDetails, setThemeDetails] = useState({
    themeFrom: "#121212", 
    themeAccent: "#1db954", 
    genre: "Top Hits & Trending Melodies."
  });

  const {
    playPlaylist, playPause, isPlaying, currentSongIndex,
    playlist, duration, setMiniPlayerVisible, isShuffle, toggleShuffle
  } = useContext(PlayerContext);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchDynamicTracks = async () => {
      try {
        const res = await fetch(`${API_URL}/api/tracks/artist/${encodeURIComponent(decodedArtistName)}`);
        if (res.ok) {
          const tracks = await res.json();
          if (Array.isArray(tracks)) {
            const formattedTracks = tracks.map(track => {
              let isRecent = true;
              if (track.created_at) {
                const uploadDate = new Date(track.created_at);
                const diffDays = Math.ceil(Math.abs(new Date() - uploadDate) / (1000 * 60 * 60 * 24));
                isRecent = diffDays <= 7;
              }
              return {
                id: track.id, 
                name: track.title, 
                path: track.audio_url, 
                image: track.cover_url,
                duration: track.duration || "--:--", 
                durationDisplay: isRecent ? "New 🟢" : "Added", 
                artist: track.artist
              };
            });

            const uniqueTracks = formattedTracks.filter((track, index, self) =>
              index === self.findIndex((t) => t.name === track.name)
            );

            setDisplaySongs(uniqueTracks);
          }
        }
      } catch (error) { console.error("Failed to fetch tracks:", error); }
    };

    const fetchArtistDetails = async () => {
      try {
        const res = await fetch(`${API_URL}/api/artists/name/${encodeURIComponent(decodedArtistName)}`);
        if (res.ok) {
          const data = await res.json();
          setDbArtistData(data);
          if (data.genre) {
            setThemeDetails(prev => ({ ...prev, genre: data.genre }));
          }
        }
      } catch (error) { console.error("Failed to fetch artist details:", error); }
    };

    fetchDynamicTracks();
    fetchArtistDetails();
  }, [decodedArtistName]);

  const finalQuote = dbArtistData?.quote || "Discover the top hits and latest drops. 🎵";
  const finalImage = location.state?.image || dbArtistData?.image_url || "https://ik.imagekit.io/VibeCast/images/default-artist.jpg";

  useEffect(() => {
    if (!finalImage) return;

    const fac = new FastAverageColor();
    
    fac.getColorAsync(finalImage, { algorithm: 'dominant' })
      .then(color => {
        setThemeDetails(prev => ({
          ...prev,
          themeFrom: color.hex,
          themeAccent: color.isLight ? '#121212' : color.hex 
        }));
      })
      .catch(e => {
        console.error("Color extraction failed. Using fallback colors.", e);
      });
      
    return () => fac.destroy();
  }, [finalImage]);

  const handlePlayPause = useCallback(() => {
    if (!displaySongs.length) return;
    
    const isCurrentArtistPlaying = playlist && playlist.length > 0 && playlist[0]?.artist === decodedArtistName;

    if (!isCurrentArtistPlaying) {
      playPlaylist(displaySongs, 0);
    } else {
      playPause();
    }
    
    if (setMiniPlayerVisible) setMiniPlayerVisible(true);
  }, [displaySongs, playlist, decodedArtistName, playPlaylist, playPause, setMiniPlayerVisible]);

  const selectSong = useCallback((index) => {
    playPlaylist(displaySongs, index, true);
    if (setMiniPlayerVisible) setMiniPlayerVisible(true);
  }, [displaySongs, playPlaylist, setMiniPlayerVisible]);

  const goBack = () => { navigate("/"); };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === "Space" && document.activeElement.tagName !== "INPUT") {
        event.preventDefault();
        event.stopImmediatePropagation();
        handlePlayPause();
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [handlePlayPause]);

  return (
    <div 
      className="min-h-screen text-white flex flex-col items-center overflow-hidden bg-black select-none cursor-default transition-colors duration-700"
      style={{
        "--theme-from": themeDetails.themeFrom,
        "--theme-accent": themeDetails.themeAccent
      }}
    >
      <style>{`
        .artist-header { background-image: linear-gradient(to bottom, var(--theme-from), #121212); }
        .artist-accent-text { color: var(--theme-accent); }
        .clear-bg-on-hover:hover { background-color: rgba(255, 255, 255, 0.1); }
        .clear-bg-active { background-color: rgba(255, 255, 255, 0.2); }
        .clear-bg-strip { background-color: rgba(18, 18, 18, 0.1); }
      `}</style>

      <div className="w-full h-80 pt-16 relative artist-header z-10 shadow-lg transition-all duration-700">
        <button onClick={goBack} className="absolute top-4 left-4 p-2 rounded-full bg-black/50 hover:bg-black/70 z-30 transition-transform hover:scale-110 cursor-pointer">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
        <div className="flex items-end max-w-5xl mx-auto h-full px-6 pb-8">
          <img
            src={finalImage}
            alt={decodedArtistName}
            crossOrigin="anonymous"
            className="w-56 h-56 shadow-[0_20px_50px_rgba(0,0,0,0.5)] object-cover rounded-full mr-6 border-4 border-white/10 pointer-events-none"
          />
          <div>
            <p className="text-sm font-bold uppercase text-white/80 flex items-center gap-1">
              <span className="bg-[#1db954] text-black px-2 py-0.5 rounded text-[10px] font-extrabold">VERIFIED</span> Artist
            </p>
            <h1 className="text-7xl font-black mb-1 drop-shadow-lg capitalize">{decodedArtistName}</h1>
            <p className="text-lg font-medium text-white/90 mt-2 italic">
                "{finalQuote}"
            </p>
            <p className="text-sm font-normal text-white/60 mt-1">
              {displaySongs.length} {displaySongs.length === 1 ? 'song' : 'songs'} • {themeDetails.genre}
            </p>
          </div>
        </div>
      </div>

      <div className="w-full min-h-screen relative z-10 pt-8 px-6 pb-24 bg-gradient-to-b from-[#121212] via-black to-black">
        <div className="max-w-5xl mx-auto relative z-20">
          
          <div className="flex items-center mb-6">
            <button onClick={handlePlayPause} className="w-16 h-16 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black flex items-center justify-center shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
              {isPlaying && playlist.length > 0 && playlist[0]?.artist === decodedArtistName ? (
                <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
              ) : (
                <svg className="w-8 h-8 fill-current pl-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              )}
            </button>
            <button onClick={toggleShuffle} className={`ml-4 font-semibold hover:text-white transition cursor-pointer tracking-widest ${isShuffle ? "text-[#1db954]" : "text-gray-400"}`}>
              SHUFFLE
            </button>
          </div>

          <div className="grid grid-cols-[16px_48px_1fr_90px] gap-4 py-2 border-b border-gray-700/50 text-gray-400 text-xs uppercase font-semibold mb-2 clear-bg-strip pointer-events-none">
            <div>#</div><div></div><div>Title</div><div className="text-right">Time</div>
          </div>

          {displaySongs.map((song, idx) => {
            const isCurrentSong = playlist.length > 0 && playlist[currentSongIndex]?.name === song.name;

            return (
              <div key={idx} onClick={() => selectSong(idx)} className={`group grid grid-cols-[16px_48px_1fr_90px] items-center gap-4 px-2 py-2 rounded-md cursor-default transition duration-200 clear-bg-on-hover ${isCurrentSong ? "clear-bg-active text-white" : "text-gray-400"}`}>
                <div className="font-medium text-sm text-center">
                  {isCurrentSong && isPlaying ? (
                    <span className="text-[#1db954] animate-pulse"><svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 24 24"><path d="M7 19v-14h3v14h-3zm8 0V5h3v14h-3z" /></svg></span>
                  ) : (
                    <span className="group-hover:hidden">{idx + 1}</span>
                  )}
                  <svg className="w-4 h-4 hidden group-hover:block text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                </div>
                
                <img src={song.image} alt={song.name} className="w-12 h-12 object-cover rounded shadow-md pointer-events-none" />
                
                <div className="flex flex-col truncate">
                  <span className={`text-base font-semibold truncate ${isCurrentSong ? 'text-[#1db954]' : 'text-white'}`}>{song.name}</span>
                  <span className="text-sm font-light text-gray-400 group-hover:text-gray-300">{song.artist}</span>
                </div>
                
                <div className="flex justify-end items-center gap-3 text-sm text-gray-400">
                  <span>
                    {isCurrentSong
                      ? formatTime(duration)
                      : song.duration
                    }
                  </span>

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSong(song);
                      setIsModalOpen(true);
                    }}
                    className="hidden group-hover:block cursor-pointer hover:text-white"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
          
          {displaySongs.length === 0 && (
             <div className="text-center py-10"><p className="text-gray-400">No tracks found for this artist.</p></div>
          )}
        </div>
      </div>

      <AddToPlaylistModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        track={selectedSong}
      />
    </div>
  );
};

export default ArtistPage;
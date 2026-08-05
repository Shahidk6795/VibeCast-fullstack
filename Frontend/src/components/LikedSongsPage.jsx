import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { PlayerContext } from "../context/PlayerContext";
import { Heart, ArrowLeft, Clock, MoreVertical } from "lucide-react"; 
import AddToPlaylistModal from "@/components/AddToPlaylistModal"; 
import { API_URL } from "../config.js";

const formatTime = (sec) => {
  if (!sec) return "0:00";
  const minutes = Math.floor(sec / 60);
  const seconds = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const LikedSongsPage = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  
  const { 
    playPlaylist, 
    playPause, 
    isPlaying, 
    playlist,
    currentSongIndex, 
    duration,
    isShuffle, 
    toggleShuffle,
    setMiniPlayerVisible 
  } = useContext(PlayerContext);
  
  const [likedSongs, setLikedSongs] = useState([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
  
  const email = user?.primaryEmailAddress?.emailAddress;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fetchLikedSongs = useCallback(async () => {
    if (!email) return;
    try {
      const res = await fetch(`${API_URL}/api/likes/${email}`);
      if (res.ok) {
        const data = await res.json();
        setLikedSongs(data);
      }
    } catch (e) {
      console.error("Failed to fetch liked songs", e);
    }
  }, [email]);

  useEffect(() => {
    fetchLikedSongs();
    window.addEventListener('vibecast_likes_updated', fetchLikedSongs);
    return () => window.removeEventListener('vibecast_likes_updated', fetchLikedSongs);
  }, [email, fetchLikedSongs]);

  const formattedSongs = useMemo(() => {
    return likedSongs.map(song => ({
      name: song.name || song.title,
      artist: song.artist,
      path: song.path || song.audio_url,
      image: song.image || song.cover_url,
      id: song.track_id || song.id,
      duration: song.duration || "--:--" 
    }));
  }, [likedSongs]);

  const handlePlayPause = useCallback(() => {
    if (!formattedSongs.length) return;
    
    if (!playlist.length || playlist[0].name !== formattedSongs[0]?.name) {
      playPlaylist(formattedSongs, 0);
    } else {
      playPause();
    }
    
    if (setMiniPlayerVisible) setMiniPlayerVisible(true);
  }, [formattedSongs, playlist, playPlaylist, playPause, setMiniPlayerVisible]);

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
  }, [playlist, handlePlayPause]);

  const handlePlaySingle = (index) => {
    playPlaylist(formattedSongs, index, true);
    if (setMiniPlayerVisible) setMiniPlayerVisible(true);
  };

  const removeLike = async (e, song) => {
    e.stopPropagation(); 
    try {
      const response = await fetch(`${API_URL}/api/likes`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, audio_url: song.path || song.audio_url }),
      });

      if (response.ok) {
        fetchLikedSongs();
        window.dispatchEvent(new Event('vibecast_likes_updated'));
      }
    } catch (error) {
      console.error("Error removing like:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#121212] via-black to-black text-white pb-32 cursor-default select-none">
      
      <div className="relative pt-24 pb-8 px-6 md:px-10 bg-gradient-to-b from-indigo-900 to-[#121212] flex items-end gap-6 shadow-lg">
        <button 
          onClick={() => navigate(-1)} 
          className="absolute top-24 left-6 md:left-10 p-2 bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-md transition-transform hover:scale-110 cursor-pointer"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>

        <div className="w-40 h-40 md:w-52 md:h-52 bg-gradient-to-br from-indigo-500 to-purple-600 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-center mt-12 rounded-sm border-4 border-white/10 pointer-events-none">
          <Heart className="w-20 h-20 text-white" fill="white" />
        </div>

        <div className="flex flex-col gap-2 z-10">
          <p className="text-sm font-bold uppercase tracking-widest text-white/80">Playlist</p>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter drop-shadow-lg">Liked Songs</h1>
          <div className="flex items-center gap-2 text-sm text-gray-300 font-medium mt-2">
            <img src={user?.imageUrl} alt="User" className="w-6 h-6 rounded-full border border-black" />
            <span className="text-white font-bold">{user?.firstName}</span>
            <span>•</span>
            <span>{likedSongs.length} songs</span>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-10 mt-6 max-w-5xl mx-auto">
        
        <div className="flex items-center mb-6">
          <button 
            onClick={handlePlayPause} 
            className="w-16 h-16 rounded-full bg-[#1db954] text-black flex items-center justify-center shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer"
          >
            {isPlaying && playlist.length && playlist[0].name === formattedSongs[0]?.name ? (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
            ) : (
              <svg className="w-8 h-8 pl-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>
          
          <button 
            onClick={toggleShuffle} 
            className={`ml-4 font-semibold hover:text-white transition cursor-pointer tracking-widest ${isShuffle ? "text-[#1db954]" : "text-gray-400"}`}
          >
            SHUFFLE
          </button>
        </div>

        <div className="grid grid-cols-[16px_48px_1fr_60px_80px] gap-4 py-2 px-2 border-b border-gray-700/50 text-gray-400 text-xs uppercase font-semibold mb-2 pointer-events-none">
          <div className="text-center">#</div>
          <div></div>
          <div>Title</div>
          <div className="text-right"><Clock className="w-4 h-4 ml-auto" /></div>
          <div></div>
        </div>

        <div className="flex flex-col">
          {formattedSongs.map((song, index) => {
            const isCurrentSong = playlist.length && playlist[currentSongIndex]?.name === song.name;

            return (
              <div 
                key={index} 
                onClick={() => handlePlaySingle(index)}
                className={`group grid grid-cols-[16px_48px_1fr_60px_80px] items-center gap-4 px-2 py-2 rounded-md cursor-default transition duration-200 hover:bg-white/10 ${isCurrentSong ? 'bg-white/5 text-white' : 'text-gray-400'}`}
              >
                <div className="text-center font-medium text-sm">
                  {isCurrentSong && isPlaying ? (
                    <span className="text-[#1db954] animate-pulse">
                      <svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 24 24"><path d="M7 19v-14h3v14h-3zm8 0V5h3v14h-3z" /></svg>
                    </span>
                  ) : (
                    <>
                      <span className="group-hover:hidden">{index + 1}</span>
                      <svg className="w-4 h-4 hidden group-hover:block text-white mx-auto" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </>
                  )}
                </div>

                <img src={song.image} alt={song.name} className="w-12 h-12 object-cover rounded shadow-md pointer-events-none" />
                
                <div className="flex flex-col truncate">
                  <span className={`text-base font-semibold truncate ${isCurrentSong ? 'text-[#1db954]' : 'text-white'}`}>
                    {song.name}
                  </span>
                  <span className="text-sm font-light text-gray-400 group-hover:text-gray-300 truncate">
                    {song.artist}
                  </span>
                </div>

                <div className="text-right text-sm text-gray-400">
                  {isCurrentSong
                    ? formatTime(duration)
                    : song.duration
                  }
                </div>

                <div className="flex justify-end items-center gap-1">
                  <button 
                    onClick={(e) => removeLike(e, song)} 
                    className="text-[#1db954] hover:text-red-500 hover:scale-110 transition-all cursor-pointer p-2 flex items-center justify-center"
                    title="Remove from Liked Songs"
                  >
                    <Heart className="w-5 h-5 fill-current" />
                  </button>
                  
                  <button 
                     onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSong(song);
                        setIsModalOpen(true);
                     }}
                     className="hidden group-hover:block cursor-pointer text-gray-400 hover:text-white p-2 transition-all"
                   >
                     <MoreVertical className="w-5 h-5" />
                   </button>
                </div>
              </div>
            );
          })}

          {formattedSongs.length === 0 && (
            <div className="text-center text-gray-500 mt-10 py-10">
              No liked songs yet. Start exploring and hit the heart!
            </div>
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

export default LikedSongsPage;
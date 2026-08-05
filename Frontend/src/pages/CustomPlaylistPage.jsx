import React, { useState, useEffect, useContext, useRef, useCallback, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { PlayerContext } from "../context/PlayerContext";
import { useUser } from "@clerk/clerk-react";
import { ArrowLeft, Clock, Music, Trash2, Camera, Pencil } from "lucide-react"; 
import { API_URL } from '../config.js';

const formatTime = (sec) => {
  if (!sec) return "0:00";
  const minutes = Math.floor(sec / 60);
  const seconds = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const CustomPlaylistPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  
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
  
  const [songs, setSongs] = useState([]);
  const [playlistCover, setPlaylistCover] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [localPlaylistName, setLocalPlaylistName] = useState(location.state?.name || "Custom Playlist");
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(localPlaylistName);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fetchPlaylistSongs = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/playlists/${id}/songs`);
      if (res.ok) {
        const data = await res.json();
        setSongs(data);
      }
    } catch (e) {
      console.error("Failed to fetch custom playlist songs", e);
    }
  }, [id]);

  const fetchPlaylistDetails = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/playlists/details/${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.cover_url) setPlaylistCover(data.cover_url);
        if (data.name) {
          setLocalPlaylistName(data.name);
          setEditNameValue(data.name);
        }
      }
    } catch (e) {
      console.error("Failed to fetch playlist details", e);
    }
  }, [id]);

  useEffect(() => {
    fetchPlaylistSongs();
    fetchPlaylistDetails();
  }, [fetchPlaylistSongs, fetchPlaylistDetails]);

  const handleCoverUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('coverImage', file);

    try {
      const res = await fetch(`${API_URL}/api/playlists/${id}/cover`, {
        method: 'POST',
        body: formData,
      });
      
      if (res.ok) {
        const data = await res.json();
        setPlaylistCover(data.cover_url);
      }
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveName = async () => {
    const trimmedName = editNameValue.trim();
    
    if (!trimmedName || trimmedName === localPlaylistName) {
      setIsEditingName(false);
      setEditNameValue(localPlaylistName);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/playlists/${id}/name`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName })
      });
      
      if (res.ok) {
        setLocalPlaylistName(trimmedName);
        setIsEditingName(false);
        window.dispatchEvent(new Event('vibecast_playlists_updated'));
      }
    } catch (error) {
      console.error("Failed to update playlist name", error);
    }
  };

  const formattedSongs = useMemo(() => {
    return songs.map(song => ({
      name: song.title || song.name,
      artist: song.artist,
      path: song.audio_url || song.path,
      image: song.cover_url || song.image,
      id: song.id,
      duration: song.duration || "--:--" 
    }));
  }, [songs]);

  const handlePlayPause = useCallback(() => {
    if (!formattedSongs.length) return;
    
    if (!playlist || playlist.length === 0 || playlist[0].name !== formattedSongs[0]?.name) {
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
  }, [handlePlayPause]);

  const handlePlaySingle = useCallback((index) => {
    playPlaylist(formattedSongs, index, true);
    if (setMiniPlayerVisible) setMiniPlayerVisible(true);
  }, [playPlaylist, formattedSongs, setMiniPlayerVisible]);

  const removeSong = async (e, songId) => {
    e.stopPropagation(); 
    try {
      const response = await fetch(`${API_URL}/api/playlists/songs/${songId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSongs(songs.filter(song => song.id !== songId));
      }
    } catch (error) {
      console.error("Error removing song:", error);
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

        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef} 
          onChange={handleCoverUpload} 
          className="hidden" 
        />

        <div 
          onClick={() => fileInputRef.current.click()}
          className="group relative w-40 h-40 md:w-52 md:h-52 flex-shrink-0 bg-[#282828] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-center mt-12 rounded-sm border-4 border-white/10 overflow-hidden cursor-pointer"
        >
          {playlistCover ? (
             <img src={playlistCover} alt="Cover" className="w-full h-full object-cover group-hover:brightness-50 transition-all" />
          ) : songs.length > 0 ? (
             <img src={songs[0].cover_url} alt="Cover" className="w-full h-full object-cover group-hover:brightness-50 transition-all" />
          ) : (
             <Music className="w-20 h-20 text-white/30 group-hover:opacity-50 transition-all" />
          )}

          <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
            {isUploading ? (
              <div className="w-8 h-8 border-4 border-[#1db954] border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Camera className="w-10 h-10 text-white mb-2" />
                <span className="text-white font-bold text-sm">Choose Photo</span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 z-10 w-full overflow-hidden">
          <p className="text-sm font-bold uppercase tracking-widest text-white/80">Playlist</p>
          
          {isEditingName ? (
            <input 
              type="text"
              value={editNameValue}
              onChange={(e) => setEditNameValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              onBlur={handleSaveName}
              autoFocus
              className="text-5xl md:text-7xl font-black text-white bg-black/30 border-b-2 border-[#1db954] outline-none rounded px-2 py-1 w-full max-w-2xl transition-all"
            />
          ) : (
            <div 
              className="group/title flex items-center gap-3 cursor-pointer w-max"
              onClick={() => setIsEditingName(true)}
              title="Click to edit name"
            >
              <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter drop-shadow-lg truncate">
                {localPlaylistName}
              </h1>
              <button className="opacity-0 group-hover/title:opacity-100 transition-opacity text-gray-300 hover:text-white p-2">
                <Pencil className="w-6 h-6 md:w-8 md:h-8" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-300 font-medium mt-2">
            {user?.imageUrl && <img src={user.imageUrl} alt="User" className="w-6 h-6 rounded-full border border-black" />}
            <span className="text-white font-bold">{user?.firstName || "User"}</span>
            <span>•</span>
            <span>{songs.length} {songs.length === 1 ? 'song' : 'songs'}</span>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-10 mt-6 max-w-5xl mx-auto">
        
        <div className="flex items-center mb-6">
          <button 
            onClick={handlePlayPause} 
            className="w-16 h-16 rounded-full bg-[#1db954] text-black flex items-center justify-center shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer"
          >
            {isPlaying && playlist && playlist.length > 0 && playlist[0].name === formattedSongs[0]?.name ? (
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

        <div className="grid grid-cols-[16px_48px_1fr_60px_40px] gap-4 py-2 px-2 border-b border-gray-700/50 text-gray-400 text-xs uppercase font-semibold mb-2 pointer-events-none">
          <div className="text-center">#</div>
          <div></div>
          <div>Title</div>
          <div className="text-right"><Clock className="w-4 h-4 ml-auto" /></div>
          <div></div>
        </div>

        <div className="flex flex-col">
          {formattedSongs.map((song, index) => {
            const isCurrentSong = playlist && playlist.length > 0 && playlist[currentSongIndex]?.name === song.name;

            return (
              <div 
                key={song.id} 
                onClick={() => handlePlaySingle(index)}
                className={`group grid grid-cols-[16px_48px_1fr_60px_40px] items-center gap-4 px-2 py-2 rounded-md cursor-default transition duration-200 hover:bg-white/10 ${isCurrentSong ? 'bg-white/5 text-white' : 'text-gray-400'}`}
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

                <div className="text-center">
                  <button 
                    onClick={(e) => removeSong(e, song.id)} 
                    className="text-gray-400 hover:text-red-500 hover:scale-110 opacity-0 group-hover:opacity-100 transition-all cursor-pointer p-2 flex items-center justify-center w-full"
                    title="Remove from playlist"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}

          {formattedSongs.length === 0 && (
            <div className="text-center text-gray-500 mt-10 py-10">
              This playlist is empty. Add some songs!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomPlaylistPage;
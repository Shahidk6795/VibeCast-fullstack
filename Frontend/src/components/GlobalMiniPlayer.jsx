import React, { useContext, useEffect, useState, useCallback } from "react";
import { PlayerContext } from "../context/PlayerContext";
import { Shuffle, SkipBack, Play, Pause, SkipForward, Volume2, VolumeX, Heart, PlusCircle } from "lucide-react"; 
import { useUser } from "@clerk/clerk-react"; 
import AddToPlaylistModal from './AddToPlaylistModal'; 

const formatTime = (sec) => {
  if (!sec || isNaN(sec)) return "0:00";
  const minutes = Math.floor(sec / 60);
  const seconds = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const GlobalMiniPlayer = () => {
  const { user } = useUser(); 
  const [isLiked, setIsLiked] = useState(false); 
  const [isLiking, setIsLiking] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [dragTime, setDragTime] = useState(null);

  const {
    playlist,
    currentSongIndex,
    isPlaying,
    playPause,
    nextSong,
    prevSong,
    progress,
    duration,
    seekSong,
    isShuffle,
    toggleShuffle,
    volume,
    setVolume
  } = useContext(PlayerContext);

  const currentSong = playlist?.[currentSongIndex];
  const currentAudioUrl = currentSong?.audio_url || currentSong?.path;

  useEffect(() => {
    setIsLiking(false);
    
    if (!currentAudioUrl || !user?.primaryEmailAddress?.emailAddress) {
      setIsLiked(false);
      return;
    }

    // FIX: Prevents memory leaks if user skips songs faster than the server can respond
    let isMounted = true; 

    const checkLikeStatus = async () => {
      try {
        const email = user.primaryEmailAddress.emailAddress;
        const res = await fetch('http://localhost:5000/api/likes/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, audio_url: currentAudioUrl }) 
        });
        const data = await res.json();
        
        if (isMounted) setIsLiked(data.isLiked); 
      } catch (e) {
        console.error("Failed to check like status", e);
      }
    };
    
    checkLikeStatus();

    return () => {
      isMounted = false;
    };
  }, [currentAudioUrl, user]);


  useEffect(() => {
    if (playlist && playlist.length > 0) {
      window.focus(); 
      if (document.activeElement && document.activeElement.tagName === "BUTTON") {
         document.activeElement.blur();
      }
    }
  }, [playlist]); 

  const handleLikeSong = useCallback(async (e) => {
    e.stopPropagation(); 

    if (!user) {
      alert("Please sign in to save songs to your library!");
      return;
    }
    
    if (isLiking) return; 
    setIsLiking(true); 

    const email = user.primaryEmailAddress.emailAddress;

    try {
      if (isLiked) {
        const response = await fetch('http://localhost:5000/api/likes', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, audio_url: currentAudioUrl }),
        });

        if (response.ok) {
           setIsLiked(false); 
           window.dispatchEvent(new Event('vibecast_likes_updated'));
        } else {
           const errData = await response.json();
           console.error("Unlike Failed:", errData);
           alert("Server refused to Unlike. Check console!");
        }
      } else {
        const response = await fetch('http://localhost:5000/api/likes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, audio_url: currentAudioUrl }),
        });

        if (response.ok) {
           setIsLiked(true); 
           window.dispatchEvent(new Event('vibecast_likes_updated'));
        } else {
           const errData = await response.json();
           console.error("Like Failed:", errData);
           alert(`Server refused to Like: ${errData.error || "Unknown Error"}`);
        }
      }
    } catch (error) {
      console.error("Network error connecting to backend:", error);
      alert("Cannot connect to server. Is Node running?");
    } finally {
      setIsLiking(false); 
    }
  }, [user, isLiked, isLiking, currentAudioUrl]);

  if (!playlist?.length || !currentSong) return null;

  return (
    <>
      <div className="fixed bottom-[74px] md:bottom-0 left-0 right-0 h-24 bg-black/95 backdrop-blur-md z-50 flex items-center justify-between px-6 shadow-2xl border-t border-gray-800 transition-all duration-300">
        
        <div className="hidden md:flex items-center w-[30%] min-w-[200px]">
          <img
            src={currentSong.cover_url || currentSong.image}
            alt={currentSong.title || currentSong.name}
            className="w-14 h-14 object-cover rounded mr-4 shadow-lg animate-pulse-slow"
          />
          <div className="flex flex-col truncate">
            <span className="font-semibold text-white truncate hover:underline cursor-pointer">
              {currentSong.title || currentSong.name}
            </span>
            <span className="text-xs text-gray-400 hover:text-white transition">
              {currentSong.artist || "Unknown Artist"}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center w-full md:w-[40%] max-w-lg">
          
          <div className="md:hidden text-xs text-gray-300 mb-1 truncate w-64 text-center">
            <span className="text-white font-bold">{currentSong.title || currentSong.name}</span> • {currentSong.artist}
          </div>

          <div className="flex items-center gap-6 mb-2">
            <button 
              onClick={() => toggleShuffle()} 
              className={`transition ${isShuffle ? "text-[#1db954]" : "text-gray-400 hover:text-white"}`}
              title="Shuffle"
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button onClick={() => prevSong()} className="text-gray-300 hover:text-white transition">
              <SkipBack className="w-5 h-5" fill="currentColor" />
            </button>

            <button
              onClick={() => playPause()}
              className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            <button onClick={() => nextSong()} className="text-gray-300 hover:text-white transition">
              <SkipForward className="w-5 h-5" fill="currentColor" />
            </button>

            <button 
              onClick={handleLikeSong} 
              disabled={isLiking}
              className={`transition transform hover:scale-110 ${isLiked ? "text-[#1db954]" : "text-gray-400 hover:text-white"} ${isLiking ? "opacity-50 cursor-not-allowed" : ""}`}
              title="Save to Library"
            >
              <Heart className="w-4 h-4" fill={isLiked ? "#1db954" : "none"} />
            </button>

            <button 
              onClick={() => setIsPlaylistModalOpen(true)}
              className="text-gray-400 hover:text-white transition transform hover:scale-110"
              title="Add to Playlist"
            >
              <PlusCircle className="w-5 h-5" />
            </button>
          </div>

          <div className="w-full flex items-center gap-2 text-xs text-gray-400 font-mono">
            <span className="w-10 text-right">{formatTime(dragTime !== null ? dragTime : progress)}</span>
            
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={dragTime !== null ? dragTime : progress}
              onChange={(e) => setDragTime(Number(e.target.value))}
              onMouseUp={() => {
                if (dragTime !== null) seekSong(dragTime);
                setDragTime(null);
              }}
              onTouchEnd={() => {
                if (dragTime !== null) seekSong(dragTime);
                setDragTime(null);
              }}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[#1db954] hover:h-1.5 transition-all"
            />
            
            <span className="w-10">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="hidden md:flex items-center justify-end w-[30%] pr-4 gap-2">
          <button onClick={() => setVolume(volume === 0 ? 1 : 0)}>
             {volume === 0 ? (
               <VolumeX className="w-5 h-5 text-gray-400" />
             ) : (
               <Volume2 className="w-5 h-5 text-gray-400" />
             )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-white hover:accent-[#1db954]"
          />
        </div>
      </div>

      <AddToPlaylistModal 
        isOpen={isPlaylistModalOpen} 
        onClose={() => setIsPlaylistModalOpen(false)} 
        track={currentSong} 
      />
    </>
  );
};

export default GlobalMiniPlayer;
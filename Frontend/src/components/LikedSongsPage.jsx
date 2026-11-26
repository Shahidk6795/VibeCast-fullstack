import React, { useState, useEffect, useContext, useCallback, useMemo, useRef } from 'react';
import { AuthContext } from "../context/AuthContext";
import { PlayerContext } from "../context/PlayerContext";
import AddToPlaylistModal from "@/components/AddToPlaylistModal";
import { Heart, Trash2, ArrowLeft, Clock, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from "../config.js";

const formatTime = (sec) => {
  if (!sec || isNaN(sec)) return "0:00";
  const minutes = Math.floor(sec / 60);
  const seconds = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const LikedSongsPage = () => {
  const { user, token, isLoaded, openAuthModal } = useContext(AuthContext) || {};
  const {
    playPlaylist,
    playPause,
    isPlaying,
    currentSongIndex,
    playlist,
    duration,
    isShuffle,
    toggleShuffle,
    setMiniPlayerVisible
  } = useContext(PlayerContext) || {};

  const navigate = useNavigate();

  const [likedSongs, setLikedSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);

  const email = user?.email || "";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fetchLikedSongs = useCallback(async () => {
    if (!email || !token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/likes/${encodeURIComponent(email)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLikedSongs(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error loading liked songs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [email, token]);

  useEffect(() => {
    if (isLoaded) {
      if (email && token) {
        fetchLikedSongs();
      } else {
        setIsLoading(false);
      }
    }
  }, [isLoaded, email, token, fetchLikedSongs]);

  useEffect(() => {
    const handleUpdate = () => {
      if (email && token) fetchLikedSongs();
    };
    window.addEventListener('vibecast_likes_updated', handleUpdate);
    return () => window.removeEventListener('vibecast_likes_updated', handleUpdate);
  }, [email, token, fetchLikedSongs]);

  const handleUnlike = async (e, song) => {
    e.stopPropagation();
    if (!email || !token) return;

    const audioUrl = song.path || song.audio_url;

    try {
      const res = await fetch(`${API_URL}/api/likes`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          email,
          audio_url: audioUrl
        })
      });

      if (res.ok) {
        setLikedSongs(prev => prev.filter(s => (s.path || s.audio_url) !== audioUrl));
        window.dispatchEvent(new Event('vibecast_likes_updated'));
      }
    } catch (error) {
      console.error("Failed to unlike song:", error);
    }
  };

  const formattedTracks = useMemo(() => {
    return likedSongs.map((s) => ({
      id: s.id,
      name: s.name || s.title,
      artist: s.artist || "Unknown Artist",
      path: s.path || s.audio_url,
      image: s.image || s.cover_url || "https://placehold.co/400x400/181818/ffffff?text=Track",
      duration: s.duration || "--:--"
    }));
  }, [likedSongs]);

  const currentPlayingSong = playlist?.[currentSongIndex];
  const isLikedPlaylistActive = Boolean(
    playlist?.length > 0 &&
    currentPlayingSong &&
    formattedTracks.some((t) => t.path === (currentPlayingSong.path || currentPlayingSong.audio_url))
  );

  const handlePlayPause = useCallback(() => {
    if (!formattedTracks.length) return;

    if (isLikedPlaylistActive) {
      playPause?.();
    } else {
      playPlaylist?.(formattedTracks, 0, true);
      setMiniPlayerVisible?.(true);
    }
  }, [formattedTracks, isLikedPlaylistActive, playPause, playPlaylist, setMiniPlayerVisible]);

  // Bulletproof Spacebar listener (matches ArtistPage & CustomPlaylistPage)
  const playPauseRef = useRef(handlePlayPause);

  useEffect(() => {
    playPauseRef.current = handlePlayPause;
  }, [handlePlayPause]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      if (e.code === "Space" || e.key === " ") {
        if (e.repeat) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        playPauseRef.current?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, []);

  const selectSong = useCallback((index) => {
    playPlaylist?.(formattedTracks, index, true);
    setMiniPlayerVisible?.(true);
  }, [formattedTracks, playPlaylist, setMiniPlayerVisible]);

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#1db954] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!email || !token) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#450af5] to-[#c4efd9]/40 flex items-center justify-center shadow-2xl mb-2">
          <Heart className="w-10 h-10 text-white fill-white" />
        </div>
        <h2 className="text-2xl font-black">Sign in to view Liked Songs</h2>
        <p className="text-gray-400 text-sm max-w-md">
          Your saved tracks are linked to your VibeCast account.
        </p>
        <button
          type="button"
          onClick={() => openAuthModal?.()}
          className="px-7 py-3 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black font-extrabold text-sm transition hover:scale-105 cursor-pointer"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white flex flex-col items-center bg-black pb-28 select-none cursor-default">
      <style>{`
        .clear-bg-on-hover:hover { background-color: rgba(255, 255, 255, 0.1); }
        .clear-bg-active { background-color: rgba(255, 255, 255, 0.18); }
      `}</style>

      {/* Full-width Gradient Header */}
      <div className="w-full pt-20 pb-8 relative z-10 shadow-lg bg-gradient-to-b from-[#450af5] via-[#2c0b7a] to-[#121212]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="absolute top-6 left-4 md:left-6 p-2.5 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md z-30 transition-transform hover:scale-110 cursor-pointer"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>

        <div className="flex flex-col sm:flex-row items-center sm:items-end max-w-5xl mx-auto px-6 gap-6 pt-6">
          <div className="w-44 h-44 sm:w-56 sm:h-56 rounded-xl bg-gradient-to-br from-[#450af5] via-[#6d28d9] to-[#c4efd9]/50 shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex items-center justify-center border border-white/15 flex-shrink-0 relative overflow-hidden">
            <Heart className="w-20 h-20 sm:w-24 sm:h-24 text-white fill-white drop-shadow-xl" />
          </div>

          <div className="text-center sm:text-left">
            <p className="text-xs font-bold uppercase tracking-widest text-white/80 mb-1">
              Playlist
            </p>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black mb-3 tracking-tight drop-shadow-lg">
              Liked Songs
            </h1>
            <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-gray-200 font-medium">
              {user?.imageUrl && (
                <img
                  src={user.imageUrl}
                  alt={user?.name || "User"}
                  className="w-6 h-6 rounded-full object-cover border border-white/20"
                />
              )}
              <span className="font-bold text-white">{user?.name || "Music Lover"}</span>
              <span>•</span>
              <span className="text-gray-300">
                {likedSongs.length} {likedSongs.length === 1 ? "song" : "songs"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tracklist Section */}
      <div className="w-full flex-1 pt-8 px-6 bg-gradient-to-b from-[#121212] via-black to-black">
        <div className="max-w-5xl mx-auto">

          {/* Action Bar */}
          {likedSongs.length > 0 && (
            <div className="flex items-center mb-8">
              <button
                type="button"
                onClick={handlePlayPause}
                className="w-16 h-16 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black flex items-center justify-center shadow-[0_0_25px_rgba(29,185,84,0.35)] hover:scale-105 transition-all duration-300 cursor-pointer"
              >
                {isPlaying && isLikedPlaylistActive ? (
                  <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                ) : (
                  <svg className="w-8 h-8 fill-current pl-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                )}
              </button>

              <button
                type="button"
                onClick={toggleShuffle}
                className={`ml-5 font-semibold hover:text-white transition cursor-pointer tracking-widest text-sm ${
                  isShuffle ? "text-[#1db954]" : "text-gray-400"
                }`}
              >
                SHUFFLE
              </button>
            </div>
          )}

          {likedSongs.length === 0 ? (
            <div className="text-center py-20 bg-[#121212] rounded-2xl border border-white/5">
              <Heart className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">No liked songs yet</h3>
              <p className="text-sm text-gray-400">Tap the heart icon on any playing track to save it here.</p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="grid grid-cols-[20px_48px_1fr_110px] gap-4 py-2 px-2 border-b border-gray-700/50 text-gray-400 text-xs uppercase font-semibold mb-2 pointer-events-none">
                <div className="text-center">#</div>
                <div></div>
                <div>Title</div>
                <div className="text-right pr-2">
                  <Clock className="w-4 h-4 ml-auto" />
                </div>
              </div>

              {/* Song Rows */}
              <div className="flex flex-col gap-1">
                {formattedTracks.map((song, idx) => {
                  const isCurrentSong =
                    (currentPlayingSong?.path || currentPlayingSong?.audio_url) === song.path;

                  return (
                    <div
                      key={song.id || `${song.path}-${idx}`}
                      onClick={() => selectSong(idx)}
                      className={`group grid grid-cols-[20px_48px_1fr_110px] items-center gap-4 px-2 py-2.5 rounded-md cursor-pointer transition duration-200 clear-bg-on-hover ${
                        isCurrentSong ? "clear-bg-active text-white" : "text-gray-400"
                      }`}
                    >
                      <div className="font-medium text-sm text-center flex justify-center items-center">
                        {isCurrentSong && isPlaying ? (
                          <img
                            src="https://ik.imagekit.io/vibecast/images/equaliser-animated-green.f93a2ef4.gif"
                            alt="Playing"
                            className="w-4 h-4"
                          />
                        ) : (
                          <>
                            <span className="group-hover:hidden">{idx + 1}</span>
                            <svg
                              className="w-4 h-4 hidden group-hover:block text-white"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </>
                        )}
                      </div>

                      <img
                        src={song.image}
                        alt={song.name}
                        className="w-12 h-12 object-cover rounded shadow-md pointer-events-none"
                      />

                      <div className="flex flex-col truncate">
                        <span
                          className={`text-base font-semibold truncate ${
                            isCurrentSong ? "text-[#1db954]" : "text-white"
                          }`}
                        >
                          {song.name}
                        </span>
                        <span className="text-sm font-light text-gray-400 group-hover:text-gray-300 truncate">
                          {song.artist}
                        </span>
                      </div>

                      <div className="flex justify-end items-center gap-2.5 text-sm text-gray-400">
                        <span className="font-mono text-xs sm:text-sm">
                          {isCurrentSong ? formatTime(duration) : song.duration}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => handleUnlike(e, song)}
                          className="p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                          title="Remove from Liked Songs"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSong(song);
                            setIsModalOpen(true);
                          }}
                          className="p-1 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition cursor-pointer"
                          title="Add to Playlist"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
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
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from "../context/AuthContext";
import { PlayerContext } from "../context/PlayerContext";
import { Heart, Play, Trash2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from "../config.js";

const LikedSongsPage = () => {
  const { user, token, isLoaded, openAuthModal } = useContext(AuthContext) || {};
  const { playPlaylist, isPlaying, currentSongIndex, playlist, playPause } = useContext(PlayerContext) || {};
  const navigate = useNavigate();

  const [likedSongs, setLikedSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const email = user?.email || "";

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

  const formattedTracks = likedSongs.map(s => ({
    name: s.name || s.title,
    artist: s.artist,
    path: s.path || s.audio_url,
    image: s.image || s.cover_url || "https://placehold.co/400x400/181818/ffffff?text=Track",
    duration: s.duration
  }));

  const currentPlayingSong = playlist?.[currentSongIndex];
  const isCurrentPlaylistPlaying = isPlaying && formattedTracks.some(t => t.path === currentPlayingSong?.path);

  const handlePlayAll = () => {
    if (formattedTracks.length === 0) return;
    if (isCurrentPlaylistPlaying) {
      playPause();
    } else {
      playPlaylist(formattedTracks, 0);
    }
  };

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
        <Heart className="w-14 h-14 text-[#1db954]" />
        <h2 className="text-2xl font-bold">Sign in to view Liked Songs</h2>
        <p className="text-gray-400 text-sm max-w-md">
          Your saved tracks are linked to your VibeCast account.
        </p>
        <button
          type="button"
          onClick={() => openAuthModal?.()}
          className="px-6 py-3 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black font-bold text-sm transition"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-10 pt-24 pb-32">
      <div className="max-w-5xl mx-auto">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 mb-8 bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-transparent p-6 sm:p-8 rounded-3xl border border-white/10">
          <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl bg-gradient-to-tr from-[#1db954] to-emerald-300 flex items-center justify-center shadow-2xl flex-shrink-0">
            <Heart className="w-16 h-16 sm:w-20 sm:h-20 text-black fill-black" />
          </div>

          <div className="text-center sm:text-left flex-1">
            <span className="text-xs font-bold uppercase tracking-widest text-[#1db954]">Playlist</span>
            <h1 className="text-4xl sm:text-6xl font-black mt-1 mb-2 tracking-tight">Liked Songs</h1>
            <p className="text-sm text-gray-300 font-medium">
              {user?.name || "Music Lover"} • {likedSongs.length} {likedSongs.length === 1 ? "song" : "songs"}
            </p>
          </div>

          {likedSongs.length > 0 && (
            <button
              type="button"
              onClick={handlePlayAll}
              className="w-14 h-14 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black flex items-center justify-center shadow-lg hover:scale-105 transition transform flex-shrink-0"
            >
              {isCurrentPlaylistPlaying ? (
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
              ) : (
                <Play className="w-6 h-6 fill-current ml-0.5" />
              )}
            </button>
          )}
        </div>

        {likedSongs.length === 0 ? (
          <div className="text-center py-20 bg-[#121212] rounded-2xl border border-white/5">
            <Heart className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">No liked songs yet</h3>
            <p className="text-sm text-gray-400">Tap the heart icon on any playing track to save it here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {likedSongs.map((song, idx) => {
              const songPath = song.path || song.audio_url;
              const songName = song.name || song.title;
              const songImage = song.image || song.cover_url || "https://placehold.co/400x400/181818/ffffff?text=Track";
              const isCurrent = currentPlayingSong?.path === songPath;
              return (
                <div
                  key={song.id || idx}
                  onClick={() => playPlaylist(formattedTracks, idx)}
                  className={`group flex items-center justify-between gap-4 p-3 rounded-xl cursor-pointer transition ${
                    isCurrent ? "bg-white/15" : "bg-[#181818] hover:bg-[#242424]"
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <span className="w-6 text-center text-sm font-medium text-gray-400">
                      {idx + 1}
                    </span>
                    <img
                      src={songImage}
                      alt={songName}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className={`font-semibold text-sm truncate ${isCurrent ? "text-[#1db954]" : "text-white"}`}>
                        {songName}
                      </h4>
                      <p className="text-xs text-gray-400 truncate">{song.artist}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-400 hidden sm:block">{song.duration || "0:00"}</span>
                    <button
                      type="button"
                      onClick={(e) => handleUnlike(e, song)}
                      className="p-2 text-gray-400 hover:text-red-500 transition rounded-full hover:bg-white/5"
                      title="Remove from Liked Songs"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LikedSongsPage;
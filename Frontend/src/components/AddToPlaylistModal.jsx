import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from "../context/AuthContext";
import { X, Plus, Music, Check } from 'lucide-react';
import { API_URL } from "../config.js";

const AddToPlaylistModal = ({ isOpen, onClose, track }) => {
  const { user, token, openAuthModal } = useContext(AuthContext) || {};
  const [playlists, setPlaylists] = useState([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState(null);

  const email = user?.email || "";

  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }), [token]);

  const fetchPlaylists = useCallback(async () => {
    if (!email || !token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/playlists/${encodeURIComponent(email)}`, {
        headers: authHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setPlaylists(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching playlists:", error);
    } finally {
      setIsLoading(false);
    }
  }, [email, token, authHeaders]);

  useEffect(() => {
    if (isOpen && email && token) {
      fetchPlaylists();
      setMessage(null);
    }
  }, [isOpen, email, token, fetchPlaylists]);

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim() || !email || !token) return;

    setIsCreating(true);
    try {
      const res = await fetch(`${API_URL}/api/playlists`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          name: newPlaylistName.trim(),
          email
        })
      });

      if (res.ok) {
        const created = await res.json();
        setPlaylists(prev => [created, ...prev]);
        setNewPlaylistName('');
        setMessage({ type: 'success', text: `Created "${created.name}"!` });

        if (track) {
          await handleAddToPlaylist(created.id, created.name);
        }
      } else {
        setMessage({ type: 'error', text: "Failed to create playlist" });
      }
    } catch (error) {
      console.error("Create playlist error:", error);
      setMessage({ type: 'error', text: "Network error" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddToPlaylist = async (playlistId, playlistName) => {
    if (!track || !token) return;

    const audioUrl = track.audio_url || track.path;
    const title = track.title || track.name;
    const artist = track.artist || "Unknown Artist";
    const coverUrl = track.cover_url || track.image || "https://placehold.co/400x400/181818/ffffff?text=Track";
    const duration = track.duration || "0:00";

    if (!audioUrl || !title) {
      setMessage({ type: 'error', text: "Invalid track data" });
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          title,
          artist,
          audio_url: audioUrl,
          cover_url: coverUrl,
          duration
        })
      });

      if (res.ok) {
        setMessage({ type: 'success', text: `Added to "${playlistName}"` });
        window.dispatchEvent(new Event('vibecast_playlists_updated'));
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.error || "Could not add track" });
      }
    } catch (error) {
      console.error("Add track error:", error);
      setMessage({ type: 'error', text: "Network error" });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#181818] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl text-white relative animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-white transition"
        >
          <X className="w-6 h-6" />
        </button>

        <h3 className="text-xl font-bold mb-1">Add to Playlist</h3>
        {track && (
          <p className="text-sm text-gray-400 truncate mb-6">
            Track: <span className="text-white font-medium">{track.title || track.name}</span>
          </p>
        )}

        {message && (
          <div className={`p-3 rounded-xl mb-4 text-sm font-medium flex items-center gap-2 ${
            message.type === 'success' ? 'bg-[#1db954]/20 text-[#1db954]' : 'bg-red-500/20 text-red-400'
          }`}>
            {message.type === 'success' && <Check className="w-4 h-4" />}
            {message.text}
          </div>
        )}

        {!email || !token ? (
          <div className="text-center py-6 space-y-4">
            <p className="text-sm text-gray-400">Sign in to save tracks to your playlists.</p>
            <button
              type="button"
              onClick={() => {
                onClose();
                openAuthModal?.();
              }}
              className="px-6 py-2.5 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black font-bold text-sm transition"
            >
              Sign In
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleCreatePlaylist} className="flex gap-2 mb-6">
              <input
                type="text"
                placeholder="New playlist name..."
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="flex-1 bg-[#282828] border border-transparent focus:border-[#1db954] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition"
              />
              <button
                type="submit"
                disabled={isCreating || !newPlaylistName.trim()}
                className="bg-[#1db954] hover:bg-[#1ed760] disabled:opacity-50 text-black font-bold px-4 py-2.5 rounded-xl flex items-center gap-1 text-sm transition"
              >
                <Plus className="w-4 h-4" /> Create
              </button>
            </form>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {isLoading ? (
                <div className="text-center py-6 text-gray-500 text-sm">Loading playlists...</div>
              ) : playlists.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-sm">No playlists yet. Create one above!</div>
              ) : (
                playlists.map((pl) => (
                  <button
                    type="button"
                    key={pl.id}
                    onClick={() => handleAddToPlaylist(pl.id, pl.name)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#242424] hover:bg-[#333333] transition text-left group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#121212] flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {pl.cover_url ? (
                        <img src={pl.cover_url} alt={pl.name} className="w-full h-full object-cover" />
                      ) : (
                        <Music className="w-5 h-5 text-gray-400 group-hover:text-[#1db954] transition" />
                      )}
                    </div>
                    <div className="flex-1 truncate">
                      <h4 className="font-semibold text-sm text-white group-hover:text-[#1db954] transition truncate">
                        {pl.name}
                      </h4>
                      <p className="text-xs text-gray-400">{pl.track_count || 0} tracks</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AddToPlaylistModal;
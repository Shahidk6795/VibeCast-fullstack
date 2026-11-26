import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from "../context/AuthContext";
import { Plus, ListMusic, Trash2, Music, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from "../config.js";

const PlaylistManager = () => {
  const { user, token, openAuthModal } = useContext(AuthContext) || {};
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

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
      console.error("Failed to load playlists:", error);
    } finally {
      setIsLoading(false);
    }
  }, [email, token, authHeaders]);

  useEffect(() => {
    if (email && token) {
      fetchPlaylists();
    } else {
      setPlaylists([]);
    }
  }, [email, token, fetchPlaylists]);

  useEffect(() => {
    const handleUpdate = () => {
      if (email && token) fetchPlaylists();
    };
    window.addEventListener('vibecast_playlists_updated', handleUpdate);
    return () => window.removeEventListener('vibecast_playlists_updated', handleUpdate);
  }, [email, token, fetchPlaylists]);

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !email || !token) return;
    setIsCreating(true);
    try {
      const res = await fetch(`${API_URL}/api/playlists`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          name: newName.trim(),
          email
        })
      });

      if (res.ok) {
        const created = await res.json();
        setPlaylists(prev => [created, ...prev]);
        setNewName('');
        setIsCreateModalOpen(false);
      }
    } catch (error) {
      console.error("Error creating playlist:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeletePlaylist = async (e, id) => {
    e.stopPropagation();
    if (!token) return;
    if (!window.confirm("Are you sure you want to delete this playlist?")) return;

    try {
      const res = await fetch(`${API_URL}/api/playlists/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });

      if (res.ok) {
        setPlaylists(prev => prev.filter(p => p.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete playlist:", error);
    }
  };

  if (!email || !token) {
    return (
      <div
        onClick={() => openAuthModal?.()}
        className="w-44 h-44 rounded-2xl bg-[#181818] hover:bg-[#222222] border border-white/5 p-4 flex flex-col justify-between cursor-pointer transition group flex-shrink-0"
      >
        <div className="w-10 h-10 rounded-full bg-[#282828] group-hover:bg-[#1db954] flex items-center justify-center transition">
          <ListMusic className="w-5 h-5 text-gray-400 group-hover:text-black transition" />
        </div>
        <div>
          <h4 className="font-bold text-white text-sm">Playlists</h4>
          <p className="text-xs text-gray-400 mt-0.5">Sign in to view</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="w-44 h-44 rounded-2xl bg-[#181818] hover:bg-[#242424] border border-dashed border-white/20 hover:border-[#1db954] flex flex-col items-center justify-center gap-2 transition cursor-pointer flex-shrink-0 group"
        >
          <div className="w-12 h-12 rounded-full bg-[#282828] group-hover:bg-[#1db954] flex items-center justify-center transition">
            <Plus className="w-6 h-6 text-gray-300 group-hover:text-black transition" />
          </div>
          <span className="text-sm font-bold text-gray-300 group-hover:text-white transition">New Playlist</span>
        </button>

        {isLoading ? (
          <div className="w-44 h-44 rounded-2xl bg-[#181818] flex items-center justify-center flex-shrink-0">
            <div className="w-6 h-6 border-2 border-[#1db954] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          playlists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => navigate(`/playlist/${pl.id}`, { state: { playlist: pl } })}
              className="w-44 h-44 rounded-2xl bg-[#181818] hover:bg-[#242424] border border-white/5 p-4 flex flex-col justify-between cursor-pointer transition group relative flex-shrink-0 overflow-hidden shadow-lg"
            >
              <div className="w-full h-24 rounded-xl bg-[#121212] overflow-hidden relative flex items-center justify-center">
                {pl.cover_url ? (
                  <img src={pl.cover_url} alt={pl.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                ) : (
                  <Music className="w-8 h-8 text-gray-600 group-hover:text-[#1db954] transition" />
                )}

                <button
                  type="button"
                  onClick={(e) => handleDeletePlaylist(e, pl.id)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                  title="Delete Playlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-2">
                <h4 className="font-bold text-white text-sm truncate group-hover:text-[#1db954] transition">
                  {pl.name}
                </h4>
                <p className="text-xs text-gray-400">{pl.track_count || 0} tracks</p>
              </div>
            </div>
          ))
        )}
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsCreateModalOpen(false)}>
          <div
            className="bg-[#181818] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl text-white relative animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold mb-4">Create Playlist</h3>
            <form onSubmit={handleCreatePlaylist}>
              <input
                type="text"
                placeholder="Playlist name..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-[#282828] border border-transparent focus:border-[#1db954] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none mb-4 transition"
                autoFocus
              />
              <button
                type="submit"
                disabled={isCreating || !newName.trim()}
                className="w-full bg-[#1db954] hover:bg-[#1ed760] disabled:opacity-50 text-black font-bold py-3 rounded-xl text-sm transition"
              >
                {isCreating ? "Creating..." : "Create"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default PlaylistManager;
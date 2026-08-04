import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Plus, X, Music, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PlaylistManager = () => {
  const { user, isLoaded } = useUser();
  const [playlists, setPlaylists] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const email = user?.primaryEmailAddress?.emailAddress;

  const fetchPlaylists = async () => {
    if (!email) return;
    try {
      const response = await fetch(`http://localhost:5000/api/playlists/${encodeURIComponent(email)}`);
      if (response.ok) {
        const data = await response.json();
        setPlaylists(data);
      }
    } catch (error) {
      console.error("Error fetching playlists:", error);
    }
  };

  useEffect(() => {
    if (isLoaded && email) {
      fetchPlaylists();
    }
  }, [isLoaded, email]);

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim() || !email) return;
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: newPlaylistName.trim() })
      });
      if (response.ok) {
        setNewPlaylistName("");
        setIsModalOpen(false);
        fetchPlaylists(); 
      }
    } catch (error) {
      console.error("Error creating playlist:", error);
    }
    setIsLoading(false);
  };

  const handleDeletePlaylist = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this playlist?")) return;
    try {
      const response = await fetch(`http://localhost:5000/api/playlists/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setPlaylists(playlists.filter(p => p.id !== id));
      }
    } catch (error) {
      console.error("Error deleting playlist:", error);
    }
  };

  if (!isLoaded || !email) return null;

  return (
    <>
      <div 
        onClick={() => setIsModalOpen(true)}
        className="group relative flex flex-col items-center justify-center p-3 sm:p-4 w-32 sm:w-44 h-48 sm:h-56 rounded-xl border-2 border-dashed border-white/20 hover:border-[#1db954] bg-[#181818]/40 hover:bg-[#282828] flex-shrink-0 cursor-pointer transition-all duration-300"
      >
        <div className="w-12 h-12 rounded-full bg-white/5 group-hover:bg-[#1db954]/20 flex items-center justify-center mb-3 transition-colors">
          <Plus className="w-6 h-6 text-gray-400 group-hover:text-[#1db954]" />
        </div>
        <p className="text-sm font-bold text-gray-400 group-hover:text-white transition-colors">New Playlist</p>
      </div>

      {playlists.map((playlist) => (
        <div 
          key={playlist.id}
          onClick={() => navigate(`/playlist/${playlist.id}`, { state: { name: playlist.name } })}
          className="group/card relative flex flex-col p-3 sm:p-4 w-32 sm:w-44 h-48 sm:h-56 rounded-xl shadow-2xl border-2 border-transparent hover:border-[#1db954] bg-[#181818]/80 hover:bg-[#282828] flex-shrink-0 cursor-pointer transition-all duration-300 hover:-translate-y-1 backdrop-blur-sm"
        >
          <div className="relative w-full aspect-square mb-3 shadow-lg rounded-md overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-800 to-black flex items-center justify-center">
            <Music className="w-12 h-12 text-white/30 group-hover/card:scale-110 transition-transform duration-500" />
            
            <button 
              onClick={(e) => handleDeletePlaylist(playlist.id, e)}
              className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full opacity-0 group-hover/card:opacity-100 hover:bg-red-500 transition-all text-white"
              title="Delete Playlist"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="text-left z-10">
            <p className="text-sm sm:text-base font-bold text-white truncate group-hover/card:text-[#1db954] transition-colors">
              {playlist.name}
            </p>
            <p className="text-xs sm:text-sm text-gray-400 truncate mt-1">
              By You
            </p>
          </div>
        </div>
      ))}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#181818] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Name your playlist</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <input 
              type="text" 
              placeholder="e.g. Late Night Drives"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              className="w-full bg-[#282828] border border-transparent focus:border-[#1db954] rounded-xl px-4 py-3 text-white outline-none mb-6"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-full text-white font-bold hover:bg-white/5 transition-colors">Cancel</button>
              <button onClick={handleCreatePlaylist} disabled={!newPlaylistName.trim() || isLoading} className="px-5 py-2.5 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black font-bold transition-colors disabled:opacity-50">
                {isLoading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PlaylistManager;
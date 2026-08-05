import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { X, ListMusic, Check } from 'lucide-react';
import { API_URL } from '../config.js';

const AddToPlaylistModal = ({ isOpen, onClose, track }) => {
  const { user } = useUser();
  const [playlists, setPlaylists] = useState([]);
  const [addedTo, setAddedTo] = useState(null);

  const email = user?.primaryEmailAddress?.emailAddress;

  useEffect(() => {
    if (isOpen && email) {
      // FIX 1: Replaced localhost with API_URL
      fetch(`${API_URL}/api/playlists/${encodeURIComponent(email)}`)
        .then(res => res.json())
        .then(data => setPlaylists(data))
        .catch(err => console.error(err));
    }
  }, [isOpen, email]);

  const handleAddToPlaylist = async (playlistId) => {
    try {
      // FIX 2: Replaced localhost with API_URL
      const response = await fetch(`${API_URL}/api/playlists/songs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playlist_id: playlistId,
          title: track.name || track.title,
          artist: track.artist,
          audio_url: track.path || track.audio_url,
          cover_url: track.image || track.cover_url,
          duration: track.duration || "--:--" 
        })
      });

      if (response.ok) {
        setAddedTo(playlistId);
        setTimeout(() => {
          setAddedTo(null);
          onClose();
        }, 1000);
      }
    } catch (error) {
      console.error("Error adding to playlist:", error);
    }
  };

  if (!isOpen || !track) return null;

  const displayImage = track.image || track.cover_url;
  const displayName = track.name || track.title;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-[#181818] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Add to Playlist</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex items-center gap-4 mb-6 p-3 bg-white/5 rounded-xl">
          <img src={displayImage} alt={displayName} className="w-12 h-12 rounded object-cover" />
          <div className="overflow-hidden">
            <p className="text-white font-bold truncate">{displayName}</p>
            <p className="text-gray-400 text-sm truncate">{track.artist}</p>
          </div>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-hide">
          {playlists.length === 0 ? (
            <p className="text-gray-500 text-sm italic text-center py-4">No custom playlists found. Go create one!</p>
          ) : (
            playlists.map((playlist) => (
              <div 
                key={playlist.id}
                onClick={() => handleAddToPlaylist(playlist.id)}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-[#282828] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#282828] group-hover:bg-[#383838] rounded flex items-center justify-center">
                    <ListMusic className="w-5 h-5 text-gray-400" />
                  </div>
                  <span className="text-white font-medium">{playlist.name}</span>
                </div>
                {addedTo === playlist.id && <Check className="w-5 h-5 text-[#1db954]" />}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AddToPlaylistModal;
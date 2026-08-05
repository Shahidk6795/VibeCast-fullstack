/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Upload, Disc, CheckCircle, AlertCircle, UserPlus, Music, Trash2 } from 'lucide-react';
import { API_URL } from './config.js';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('tracks'); 
  const [dbArtists, setDbArtists] = useState([]); 
  const [dbTracks, setDbTracks] = useState([]);
  const [status, setStatus] = useState({ type: '', message: '' });

  const [editPopup, setEditPopup] = useState({ 
    isOpen: false,
    trackId: null,
    title: '',
    currentArtist: '',
    currentAudioUrl: '',
    currentCoverUrl: ''
  });
  
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    trackId: null,
    title: ''
  });

  const [deleteArtistConfirm, setDeleteArtistConfirm] = useState({
    isOpen: false,
    artistId: null,
    name: ''
  });
  
  const [filterCategory, setFilterCategory] = useState('All');

  const displayedTracks = dbTracks.filter(track => {
    if (filterCategory === 'All') return true;
    
    if (filterCategory === 'Unassigned_Both') {
      return (!track.artist || track.artist.trim() === '') && (!track.mood || track.mood === '' || track.mood === 'None');
    }
    if (filterCategory === 'Unassigned_Artist') {
      return !track.artist || track.artist.trim() === '';
    }
    if (filterCategory === 'Unassigned_Playlist') {
      return !track.mood || track.mood === '' || track.mood === 'None';
    }
    
    if (['workout', 'relax', 'romantic'].includes(filterCategory)) {
      return track.mood === filterCategory;
    }

    return track.artist.toLowerCase().includes(filterCategory.toLowerCase());
  });

  const [trackData, setTrackData] = useState({ 
    title: '', 
    artist: '', 
    featured_artists: '', 
    audio_url: '', 
    cover_url: '',
    mood: '' 
  });
  
  const [newArtistData, setNewArtistData] = useState({ name: '', image_url: '', quote: '' });

  useEffect(() => {
    fetchArtists();
    fetchTracks();
  }, []);

  const fetchArtists = async () => {
    try {
      // FIX 1: Replaced localhost with API_URL
      const res = await fetch(`${API_URL}/api/artists`);
      if (res.ok) setDbArtists(await res.json());
    } catch (err) { console.error("Failed to load artists", err); }
  };

  const fetchTracks = async () => {
    try {
      // FIX 2: Replaced localhost with API_URL and fixed missing 'const res = await'
      const res = await fetch(`${API_URL}/api/tracks`);
      if (res.ok) setDbTracks(await res.json());
    } catch (err) { console.error("Failed to load tracks", err); }
  };

  const showStatus = (type, message) => {
    setStatus({ type, message });
    setTimeout(() => setStatus({ type: '', message: '' }), 4000);
  };

  const handleTrackChange = (e) => setTrackData({ ...trackData, [e.target.name]: e.target.value });
  const handleArtistChange = (e) => setNewArtistData({ ...newArtistData, [e.target.name]: e.target.value });

  const getAudioDuration = (url) => {
    return new Promise((resolve) => {
      const audio = new Audio(url);
      audio.addEventListener('loadedmetadata', () => {
        const minutes = Math.floor(audio.duration / 60);
        const seconds = Math.floor(audio.duration % 60).toString().padStart(2, '0');
        resolve(`${minutes}:${seconds}`);
      });
      audio.addEventListener('error', () => resolve(null));
    });
  };

  const handleTrackSubmit = async (e) => {
    e.preventDefault();
    showStatus('success', 'Processing track metadata...');

    const finalArtistString = trackData.featured_artists.trim() 
      ? `${trackData.artist}, ${trackData.featured_artists}` : trackData.artist;

    const songDuration = await getAudioDuration(trackData.audio_url);

    const payload = { 
      title: trackData.title, 
      artist: finalArtistString, 
      audio_url: trackData.audio_url, 
      cover_url: trackData.cover_url,
      mood: trackData.mood,
      duration: songDuration 
    };

    try {
      // FIX 3: Replaced localhost with API_URL
      const response = await fetch(`${API_URL}/api/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        showStatus('success', `Track "${trackData.title}" uploaded!`);
        setTrackData({ title: '', artist: '', featured_artists: '', audio_url: '', cover_url: '', mood: '' }); 
        fetchTracks(); 
      } else { 
        const data = await response.json();
        showStatus('error', data.error || 'Failed to save track.'); 
      }
    } catch (error) { 
      showStatus('error', 'Database error.'); 
    }
  };

  const handleArtistSubmit = async (e) => {
    e.preventDefault();
    try {
      // FIX 4: Replaced localhost with API_URL
      const response = await fetch(`${API_URL}/api/artists`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newArtistData),
      });

      if (response.ok) {
        showStatus('success', `Artist added!`);
        setNewArtistData({ name: '', image_url: '', quote: '' });
        fetchArtists();
      } else { showStatus('error', 'Failed to add artist.'); }
    } catch (error) { showStatus('error', 'Database error.'); }
  };

  const saveTrackUpdate = async () => {
    try {
      // FIX 5: Replaced localhost with API_URL
      const response = await fetch(`${API_URL}/api/tracks/admin/${editPopup.trackId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          collaborator: editPopup.currentArtist,
          audio_url: editPopup.currentAudioUrl,
          cover_url: editPopup.currentCoverUrl
        })
      });
      
      if (response.ok) {
        setEditPopup({ isOpen: false, trackId: null, title: '', currentArtist: '', currentAudioUrl: '', currentCoverUrl: '' });
        showStatus('success', 'Track updated successfully!');
        fetchTracks();
      } else {
        showStatus('error', 'Failed to update track.');
      }
    } catch (error) {
      showStatus('error', 'Server error.');
    }
  };

  const openDeleteConfirm = () => {
    setDeleteConfirm({
      isOpen: true,
      trackId: editPopup.trackId,
      title: editPopup.title
    });
  };

  const executeDelete = async () => {
    try {
      // FIX 6: Replaced localhost with API_URL
      const response = await fetch(`${API_URL}/api/tracks/admin/${deleteConfirm.trackId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showStatus('success', `Song deleted successfully!`);
        setDeleteConfirm({ isOpen: false, trackId: null, title: '' });
        setEditPopup({ isOpen: false, trackId: null, title: '', currentArtist: '', currentAudioUrl: '', currentCoverUrl: '' });
        fetchTracks();
      } else {
        showStatus('error', 'Failed to delete track.');
      }
    } catch (error) {
      showStatus('error', 'Server error.');
    }
  };

  const executeArtistDelete = async () => {
    try {
      // FIX 7: Replaced localhost with API_URL
      const response = await fetch(`${API_URL}/api/artists/${deleteArtistConfirm.artistId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showStatus('success', `Artist deleted successfully!`);
        setDeleteArtistConfirm({ isOpen: false, artistId: null, name: '' });
        fetchArtists();
        fetchTracks(); 
      } else {
        showStatus('error', 'Failed to delete artist.');
      }
    } catch (error) {
      showStatus('error', 'Server error.');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-12 px-6">
      <div className="max-w-2xl mx-auto">
        
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[#1db954] to-emerald-300 inline-flex items-center gap-3">
            <Disc className="w-10 h-10 text-[#1db954]" />
            VibeCast Studio
          </h1>
        </div>

        {status.message && (
          <div className={`fixed top-24 right-6 z-50 flex items-center gap-2 px-6 py-3 rounded-lg shadow-2xl animate-fade-in ${status.type === 'success' ? 'bg-[#1db954] text-black' : 'bg-red-500 text-white'}`}>
            {status.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-bold">{status.message}</span>
          </div>
        )}

        <div className="flex gap-4 mb-8 bg-[#181818] p-2 rounded-xl flex-wrap">
          <button onClick={() => setActiveTab('tracks')} className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'tracks' ? 'bg-[#282828] text-[#1db954] shadow-md' : 'text-gray-400 hover:text-white'}`}>
            <Upload className="w-5 h-5" /> Upload Track
          </button>
          <button onClick={() => setActiveTab('artists')} className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'artists' ? 'bg-[#282828] text-[#1db954] shadow-md' : 'text-gray-400 hover:text-white'}`}>
            <UserPlus className="w-5 h-5" /> Manage Artists
          </button>
          <button onClick={() => setActiveTab('manage')} className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'manage' ? 'bg-[#282828] text-[#1db954] shadow-md' : 'text-gray-400 hover:text-white'}`}>
            <Music className="w-5 h-5" /> Manage Music
          </button>
        </div>

        {/* --- Track Upload Tab --- */}
        {activeTab === 'tracks' && (
          <div className="bg-[#181818] rounded-2xl p-8 border border-white/10 shadow-xl">
             <form onSubmit={handleTrackSubmit} className="flex flex-col gap-5">
              <div>
                <label className="text-sm font-bold text-gray-300 mb-2 block">1. Select Main Artist</label>
                <select name="artist" value={trackData.artist} onChange={handleTrackChange} className="w-full bg-[#282828] text-white rounded-lg p-3.5 border border-transparent focus:border-[#1db954] outline-none">
                  <option value="">-- Choose Database Artist --</option>
                  {dbArtists.map((artist) => (<option key={artist.id} value={artist.name}>{artist.name}</option>))}
                </select>
              </div>
              <div>
                <label className="text-sm font-bold text-gray-300 mb-2 block">1b. Co-Artists (Comma Separated)</label>
                <input name="featured_artists" value={trackData.featured_artists} onChange={handleTrackChange} className="w-full bg-[#282828] text-white rounded-lg p-3.5 border border-transparent focus:border-[#1db954] outline-none" />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-300 mb-2 block">2. Song Title</label>
                <input name="title" value={trackData.title} onChange={handleTrackChange} required className="w-full bg-[#282828] text-white rounded-lg p-3.5 border border-transparent focus:border-[#1db954] outline-none" />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-300 mb-2 block">3. Audio URL</label>
                <input name="audio_url" value={trackData.audio_url} onChange={handleTrackChange} required className="w-full bg-[#282828] text-white rounded-lg p-3.5 border border-transparent focus:border-[#1db954] outline-none font-mono text-sm" />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-300 mb-2 block">4. Cover Art URL</label>
                <input name="cover_url" value={trackData.cover_url} onChange={handleTrackChange} required className="w-full bg-[#282828] text-white rounded-lg p-3.5 border border-transparent focus:border-[#1db954] outline-none font-mono text-sm" />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-300 mb-2 block">5. Mood Playlist (Optional)</label>
                <select name="mood" value={trackData.mood} onChange={handleTrackChange} className="w-full bg-[#282828] text-white rounded-lg p-3.5 border border-transparent focus:border-[#1db954] outline-none">
                  <option value="">None (Standard Library)</option>
                  <option value="workout">Workout</option>
                  <option value="relax">Relax</option>
                  <option value="romantic">Romantic</option>
                </select>
              </div>
              <button type="submit" className="mt-4 w-full bg-[#1db954] text-black font-extrabold text-lg py-4 rounded-full hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                <Upload className="w-6 h-6" /> Add Song
              </button>
            </form>
          </div>
        )}

        {/* Add / Manage Artists Tab */}
        {activeTab === 'artists' && (
          <div className="flex flex-col gap-6">
            <div className="bg-[#181818] rounded-2xl p-8 border border-white/10 shadow-xl">
              <h2 className="text-2xl font-bold mb-6">Add New Artist</h2>
              <form onSubmit={handleArtistSubmit} className="flex flex-col gap-5">
                <input name="name" placeholder="Artist Name" value={newArtistData.name} onChange={handleArtistChange} required className="w-full bg-[#282828] text-white rounded-lg p-3.5" />
                <input name="image_url" placeholder="Image URL" value={newArtistData.image_url} onChange={handleArtistChange} required className="w-full bg-[#282828] text-white rounded-lg p-3.5" />
                <input name="quote" placeholder="Theme Quote" value={newArtistData.quote} onChange={handleArtistChange} className="w-full bg-[#282828] text-white rounded-lg p-3.5" />
                <button type="submit" className="w-full bg-[#1db954] text-black font-bold py-3 rounded-full hover:scale-[1.02] transition-transform">Save Artist</button>
              </form>
            </div>

            <div className="bg-[#181818] rounded-2xl p-8 border border-white/10 shadow-xl">
              <h2 className="text-2xl font-bold mb-6">Existing Artists</h2>
              <div className="max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {dbArtists.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No artists found in database.</p>
                ) : (
                  dbArtists.map(artist => (
                    <div key={artist.id} className="bg-[#282828] p-4 mb-2 rounded-lg flex justify-between items-center group">
                      <div className="flex items-center gap-4 overflow-hidden">
                        <img 
                          src={artist.image_url} 
                          alt="artist" 
                          className="w-12 h-12 rounded-full object-cover shadow-md" 
                          loading="lazy"
                          onError={(e) => { 
                            e.currentTarget.onerror = null; 
                            e.currentTarget.src = "https://placehold.co/100x100/181818/1db954?text=Artist"; 
                          }}
                        />
                        <div className="flex flex-col">
                          <p className="font-bold truncate text-white">{artist.name}</p>
                          <p className="text-gray-400 text-xs truncate">ID: {artist.id}</p>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => setDeleteArtistConfirm({ isOpen: true, artistId: artist.id, name: artist.name })}
                        className="text-red-500 bg-red-500/10 px-4 py-1.5 rounded-full hover:bg-red-600 hover:text-white text-sm font-bold transition-all ml-2 flex-shrink-0"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- Manage Music Tab --- */}
        {activeTab === 'manage' && (
          <div className="bg-[#181818] rounded-2xl p-8 border border-white/10 shadow-xl">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
               <h2 className="text-2xl font-bold">Existing Tracks</h2>
               
               <select 
                 value={filterCategory} 
                 onChange={(e) => setFilterCategory(e.target.value)} 
                 className="bg-[#282828] text-white p-2.5 rounded-lg outline-none focus:ring-1 focus:ring-[#1db954] w-full sm:w-auto text-sm"
               >
                 {/* 🟢 FIX: Better dropdown organization */}
                 <option value="All">All Uploaded Songs</option>
                 
                 <optgroup label="Missing Data">
                   <option value="Unassigned_Both">No Artist AND No Playlist</option>
                   <option value="Unassigned_Artist">Missing Artist Only</option>
                   <option value="Unassigned_Playlist">Missing Playlist Only</option>
                 </optgroup>
                 
                 <optgroup label="Mood Playlists">
                   <option value="workout">Workout</option>
                   <option value="relax">Relax</option>
                   <option value="romantic">Romantic</option>
                 </optgroup>
                 
                 <optgroup label="Filter by Artist">
                   {dbArtists.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                 </optgroup>
               </select>
             </div>
             
             <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
             {displayedTracks.length === 0 ? (
               <p className="text-gray-400 text-center py-8">No tracks found in this category.</p>
             ) : (
               displayedTracks.map(track => (
                 <div key={track.id} className="bg-[#282828] p-4 mb-2 rounded-lg flex justify-between items-center group">
                   <div className="flex items-center gap-3 overflow-hidden">
                     <img 
                       src={track.cover_url} 
                       alt="cover" 
                       className="w-10 h-10 rounded object-cover" 
                       loading="lazy"
                       onError={(e) => { 
                         e.currentTarget.onerror = null; 
                         e.currentTarget.src = "https://placehold.co/100x100/181818/1db954?text=VibeCast"; 
                       }}
                     />
                     <div className="flex flex-col">
                       <p className="font-bold truncate text-white text-sm">{track.title}</p>
                       <p className="text-gray-400 text-xs truncate">{track.artist} {track.mood ? `• ${track.mood}` : ''}</p>
                     </div>
                   </div>
                   
                   <button 
                     onClick={() => setEditPopup({ 
                       isOpen: true, 
                       trackId: track.id, 
                       title: track.title,
                       currentArtist: track.artist,
                       currentAudioUrl: track.audio_url,
                       currentCoverUrl: track.cover_url
                     })} 
                     className="text-[#1db954] bg-[#1db954]/10 px-4 py-1.5 rounded-full hover:bg-[#1db954] hover:text-black text-sm font-bold transition-all ml-2 flex-shrink-0"
                   >
                     Edit
                   </button>
                 </div>
               ))
             )}
             </div>
          </div>
        )}
      </div>

      {/* --- The Edit Track Modal --- */}
      {editPopup.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-40 px-4">
          <div className="bg-[#181818] p-6 rounded-xl border border-white/10 w-full max-w-md shadow-2xl">
            <h3 className="text-xl text-white font-bold mb-4">Edit "{editPopup.title}"</h3>
            
            <div className="flex flex-col gap-4 mb-6">
              <div>
                <label className="text-xs font-bold text-gray-400 mb-1 block">Collaborators / Artist String</label>
                <input type="text" value={editPopup.currentArtist} onChange={(e) => setEditPopup({...editPopup, currentArtist: e.target.value})} className="w-full bg-black border border-white/20 text-white px-3 py-2 rounded-lg outline-none focus:border-[#1db954]" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 mb-1 block">Audio URL</label>
                <input type="text" value={editPopup.currentAudioUrl} onChange={(e) => setEditPopup({...editPopup, currentAudioUrl: e.target.value})} className="w-full bg-black border border-white/20 text-white px-3 py-2 rounded-lg outline-none focus:border-[#1db954] font-mono text-xs" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 mb-1 block">Cover Image URL</label>
                <input type="text" value={editPopup.currentCoverUrl} onChange={(e) => setEditPopup({...editPopup, currentCoverUrl: e.target.value})} className="w-full bg-black border border-white/20 text-white px-3 py-2 rounded-lg outline-none focus:border-[#1db954] font-mono text-xs" />
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-white/10 pt-4">
              <button onClick={openDeleteConfirm} className="text-red-500 hover:text-red-400 font-bold text-sm flex items-center gap-1 transition-colors">
                <Trash2 className="w-4 h-4" /> Delete Song
              </button>
              
              <div className="flex gap-3">
                <button onClick={() => setEditPopup({ isOpen: false, trackId: null, title: '', currentArtist: '', currentAudioUrl: '', currentCoverUrl: '' })} className="text-gray-400 hover:text-white text-sm font-medium transition-colors">Cancel</button>
                <button onClick={saveTrackUpdate} className="bg-[#1db954] text-black px-4 py-2 rounded-lg font-bold hover:scale-105 transition-transform">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Track Delete Confirmation Modal --- */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 px-4">
          <div className="bg-[#181818] p-8 rounded-2xl border border-red-500/20 w-full max-w-sm shadow-[0_0_50px_rgba(220,38,38,0.15)] text-center transform animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-2xl text-white font-bold mb-2">Delete Song?</h3>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
              Are you absolutely sure you want to permanently delete <span className="text-white font-bold">"{deleteConfirm.title}"</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteConfirm({ isOpen: false, trackId: null, title: '' })} className="px-6 py-2.5 rounded-full font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors">Cancel</button>
              <button onClick={executeDelete} className="px-6 py-2.5 rounded-full font-bold bg-red-600 text-white hover:bg-red-700 hover:scale-105 hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Artist Delete Confirmation Modal */}
      {deleteArtistConfirm.isOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 px-4">
          <div className="bg-[#181818] p-8 rounded-2xl border border-red-500/20 w-full max-w-sm shadow-[0_0_50px_rgba(220,38,38,0.15)] text-center transform animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-2xl text-white font-bold mb-2">Delete Artist?</h3>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
              Are you sure you want to delete <span className="text-white font-bold">"{deleteArtistConfirm.name}"</span>? 
              <br/><br/>
              <span className="text-red-400 font-bold">Warning:</span> If your MySQL database is set up with cascading deletes, this will also wipe out all their songs!
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteArtistConfirm({ isOpen: false, artistId: null, name: '' })} className="px-6 py-2.5 rounded-full font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors">Cancel</button>
              <button onClick={executeArtistDelete} className="px-6 py-2.5 rounded-full font-bold bg-red-600 text-white hover:bg-red-700 hover:scale-105 hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
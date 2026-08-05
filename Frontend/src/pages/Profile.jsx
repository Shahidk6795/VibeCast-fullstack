import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useUser, useClerk, UserProfile } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { LogOut, ShieldAlert, Clock, Settings, Play, Music, Power } from "lucide-react";
import { PlayerContext } from "../context/PlayerContext";
import { API_URL } from "../config.js";

const Profile = () => {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const { playPlaylist } = useContext(PlayerContext) || {};

  const [activeTab, setActiveTab] = useState("history");
  const [recentSongs, setRecentSongs] = useState([]);
  
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const email = user?.primaryEmailAddress?.emailAddress;
  const isAdmin = email === import.meta.env.VITE_ADMIN_EMAIL;

  useEffect(() => {
    if (!email) return;

    const fetchUserData = async () => {
      const history = JSON.parse(localStorage.getItem('vibecast_history')) || [];
      setRecentSongs(history);
    };

    fetchUserData();
  }, [email]);

  const fetchMaintenanceStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/settings`);
      if (res.ok) {
        const data = await res.json();
        setMaintenanceMode(data.maintenance_mode);
      }
    } catch {
      console.error("Failed to load settings");
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchMaintenanceStatus();
    }
  }, [isAdmin, fetchMaintenanceStatus]);

  const toggleMaintenance = async () => {
    setIsSwitching(true);
    const newState = !maintenanceMode;
    try {
      const res = await fetch(`${API_URL}/api/settings/maintenance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: newState })
      });
      if (res.ok) {
        setMaintenanceMode(newState);
      }
    } catch {
      console.error("Failed to update maintenance setting");
    } finally {
      setIsSwitching(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="w-12 h-12 border-4 border-[#1db954] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const handlePlaySong = (song) => {
    if (playPlaylist) {
      playPlaylist([{
        name: song.title || song.name,
        artist: song.artist,
        path: song.audio_url || song.path,
        image: song.cover_url || song.image
      }], 0);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-10 pt-24 pb-32">
      <div className="max-w-6xl mx-auto space-y-10">
        
        <div className="flex flex-col md:flex-row items-center gap-8 relative">
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-pink-500/20 blur-[100px] rounded-full pointer-events-none"></div>
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#1db954]/20 blur-[100px] rounded-full pointer-events-none"></div>

          <div className="relative w-36 h-36 md:w-48 md:h-48 rounded-full p-1 bg-gradient-to-tr from-pink-500 to-[#1db954] shadow-2xl flex-shrink-0">
            <img 
              src={user?.imageUrl || "https://placehold.co/400x400/181818/ffffff?text=User"} 
              alt="Profile" 
              className="w-full h-full object-cover rounded-full border-4 border-black" 
            />
          </div>
          
          <div className="text-center md:text-left flex-1 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-300 mb-3 uppercase tracking-wider backdrop-blur-md">
              {isAdmin ? (
                <><ShieldAlert className="w-4 h-4 text-[#1db954]" /> Admin Account</>
              ) : (
                <><Music className="w-4 h-4 text-pink-400" /> VibeCast Member</>
              )}
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-2 tracking-tight text-white drop-shadow-md">
              {user?.firstName || "Music Lover"} {user?.lastName || ""}
            </h1>
            <p className="text-gray-400 font-medium text-lg">
              {email}
            </p>
          </div>
        </div>

        {isAdmin && (
          <div className="rounded-2xl border border-[#1db954]/30 bg-[#1db954]/10 p-6 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-sm">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#1db954]" /> Admin Dashboard
              </h2>
              <p className="text-gray-400 text-sm mt-1">Manage global tracks and application status.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <button 
                onClick={toggleMaintenance}
                disabled={isSwitching}
                className={`flex-1 sm:flex-none px-6 py-3 font-bold rounded-full transition-all flex items-center justify-center gap-2 ${
                  maintenanceMode 
                  ? 'bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500 hover:text-white' 
                  : 'bg-black/50 text-gray-300 border border-white/10 hover:bg-white hover:text-black'
                }`}
              >
                <Power className="w-4 h-4" />
                {maintenanceMode ? 'Maintenance: ON' : 'Maintenance: OFF'}
              </button>
              <button 
                onClick={() => navigate('/Admin')}
                className="flex-1 sm:flex-none px-6 py-3 bg-[#1db954] hover:bg-[#1ed760] text-black font-bold rounded-full transition-transform transform hover:scale-105 flex items-center justify-center"
              >
                Upload Music
              </button>
            </div>
          </div>
        )}

        <div className="flex space-x-8 border-b border-white/10 overflow-x-auto scrollbar-hide">
          <button 
            onClick={() => setActiveTab('history')}
            className={`pb-4 text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'history' ? 'text-white border-b-2 border-[#1db954]' : 'text-gray-500 hover:text-white'}`}
          >
            <Clock className="w-4 h-4" /> Recently Played
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`pb-4 text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'settings' ? 'text-white border-b-2 border-blue-500' : 'text-gray-500 hover:text-white'}`}
          >
            <Settings className="w-4 h-4" /> Account Settings
          </button>
        </div>

        <div className="min-h-[400px]">
          
          {activeTab === 'history' && (
            <div className="animate-fade-in">
              {recentSongs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentSongs.map((song, idx) => (
                    <div key={idx} className="flex items-center gap-4 bg-[#181818] hover:bg-[#282828] p-3 rounded-xl group transition-colors border border-white/5 cursor-pointer" onClick={() => handlePlaySong(song)}>
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <img src={song.cover_url || song.image} alt={song.title || song.name} className="w-full h-full object-cover rounded-md" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-md transition-opacity">
                          <Play className="w-6 h-6 text-white fill-white" />
                        </div>
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <h4 className="text-white font-bold truncate">{song.title || song.name}</h4>
                        <p className="text-gray-400 text-sm truncate">{song.artist}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-[#121212] rounded-2xl border border-white/5">
                  <Clock className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">No Listening History</h3>
                  <p className="text-gray-500">Songs you play will automatically appear here.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="animate-fade-in flex justify-center w-full">
               <div className="w-full max-w-4xl bg-[#181818] rounded-2xl overflow-hidden p-2">
                 <UserProfile 
                   routing="hash"
                   appearance={{
                     elements: {
                       rootBox: "w-full",
                       cardBox: "w-full shadow-none bg-transparent rounded-none",
                       navbar: "hidden md:flex",
                     }
                   }}
                 />
               </div>
            </div>
          )}
        </div>

        <div className="flex justify-center pt-10 border-t border-white/10 mt-10">
          <button 
            onClick={() => signOut({ redirectUrl: '/' })} 
            className="flex items-center gap-2 px-8 py-3 bg-[#181818] hover:bg-red-500/10 text-gray-400 hover:text-red-500 border border-white/5 hover:border-red-500/30 rounded-full transition-all duration-300 font-bold"
          >
            <LogOut className="w-5 h-5" />
            Sign Out Securely
          </button>
        </div>

      </div>
    </div>
  );
};

export default Profile;
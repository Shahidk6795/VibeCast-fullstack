import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from "../context/AuthContext";
import { Heart, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from "../config.js";

const LikedSongsCard = () => {
  const { user, token, openAuthModal } = useContext(AuthContext) || {};
  const navigate = useNavigate();
  const [likedCount, setLikedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const email = user?.email || "";

  const fetchLikedCount = useCallback(async () => {
    if (!email || !token) {
      setLikedCount(0);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/likes/${encodeURIComponent(email)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLikedCount(Array.isArray(data) ? data.length : 0);
      }
    } catch (error) {
      console.error("Failed to fetch liked songs count:", error);
    } finally {
      setIsLoading(false);
    }
  }, [email, token]);

  useEffect(() => {
    fetchLikedCount();
  }, [fetchLikedCount]);

  useEffect(() => {
    const handleUpdate = () => {
      fetchLikedCount();
    };
    window.addEventListener('vibecast_likes_updated', handleUpdate);
    return () => window.removeEventListener('vibecast_likes_updated', handleUpdate);
  }, [fetchLikedCount]);

  const handleClick = () => {
    if (!email || !token) {
      openAuthModal?.();
      return;
    }
    navigate('/liked-songs');
  };

  return (
    <div
      onClick={handleClick}
      className="w-44 h-44 rounded-2xl bg-gradient-to-br from-indigo-900/60 via-purple-900/40 to-[#181818] hover:from-indigo-800/70 hover:via-purple-800/50 border border-white/10 hover:border-[#1db954]/50 p-4 flex flex-col justify-between cursor-pointer transition group relative flex-shrink-0 overflow-hidden shadow-lg"
    >
      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#1db954] to-emerald-300 flex items-center justify-center shadow-md">
        <Heart className="w-5 h-5 text-black fill-black" />
      </div>

      <div>
        <h4 className="font-bold text-white text-sm group-hover:text-[#1db954] transition">
          Liked Songs
        </h4>
        <p className="text-xs text-gray-300 mt-0.5">
          {!email || !token
            ? "Sign in to view"
            : isLoading
            ? "Loading..."
            : `${likedCount} ${likedCount === 1 ? "song" : "songs"}`}
        </p>
      </div>

      <div className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-[#1db954] flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 shadow-lg">
        <Play className="w-4 h-4 text-black fill-black ml-0.5" />
      </div>
    </div>
  );
};

export default LikedSongsCard;
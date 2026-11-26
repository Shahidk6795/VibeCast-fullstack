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
    const handleUpdate = () => fetchLikedCount();
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
      className="w-64 sm:w-72 h-44 rounded-2xl bg-gradient-to-br from-[#450af5] via-[#6d28d9] to-[#c4efd9]/30 p-5 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_35px_rgba(69,10,245,0.45)] border border-white/15 group relative flex-shrink-0 overflow-hidden"
    >
      {/* Subtle background watermark */}
      <Heart className="w-28 h-28 text-white/10 fill-white/10 absolute -top-4 -right-4 rotate-12 pointer-events-none group-hover:scale-110 transition-transform duration-500" />

      <div className="relative z-10 w-11 h-11 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center shadow-inner border border-white/20">
        <Heart className="w-5 h-5 text-white fill-white" />
      </div>

      <div className="relative z-10">
        <h4 className="font-black text-white text-2xl tracking-tight leading-tight">
          Liked Songs
        </h4>
        <p className="text-xs sm:text-sm text-white/80 font-medium mt-1">
          {!email || !token
            ? "Sign in to view your favourites"
            : isLoading
            ? "Loading..."
            : `${likedCount} ${likedCount === 1 ? "liked song" : "liked songs"}`}
        </p>
      </div>

      <div className="absolute bottom-4 right-4 z-10 w-11 h-11 rounded-full bg-[#1db954] flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-xl">
        <Play className="w-5 h-5 text-black fill-black ml-0.5" />
      </div>
    </div>
  );
};

export default LikedSongsCard;
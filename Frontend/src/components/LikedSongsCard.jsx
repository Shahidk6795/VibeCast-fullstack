import React, { useState, useEffect } from 'react';
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { API_URL } from "../config.js";

const LikedSongsCard = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [likedCount, setLikedCount] = useState(0);

  const email = user?.primaryEmailAddress?.emailAddress;

  useEffect(() => {
    if (!email) return;

    const fetchLikes = async () => {
      try {
        const res = await fetch(`${API_URL}/api/likes/${email}`);
        if (res.ok) {
          const data = await res.json();
          setLikedCount(data.length);
        }
      } catch (e) {
        console.error("Failed to fetch likes", e);
      }
    };

    fetchLikes();
    window.addEventListener('vibecast_likes_updated', fetchLikes);
    return () => window.removeEventListener('vibecast_likes_updated', fetchLikes);
  }, [email]);

  if (!user || likedCount === 0) return null;

  return (
    <div 
      onClick={() => navigate('/liked-songs')}
      className="relative flex flex-col items-center justify-center p-4 bg-gradient-to-br from-indigo-700 to-purple-800 rounded-xl cursor-pointer group hover:shadow-2xl hover:scale-105 transition-all w-48 h-64 border border-white/10"
    >
      <div className="flex flex-col items-center justify-center flex-1 w-full text-center">
        <Heart className="w-16 h-16 text-white mb-4 drop-shadow-md" fill="white" />
        <h3 className="text-xl font-bold text-white mb-1">Liked Songs</h3>
        <p className="text-sm text-purple-200 font-medium">{likedCount} tracks</p>
      </div>
    </div>
  );
};

export default LikedSongsCard;
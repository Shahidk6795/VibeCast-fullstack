import React, { useState, useEffect } from 'react';
import { API_URL } from '../config.js';

const ServerWakeBanner = () => {
  const [waking, setWaking] = useState(false);

  useEffect(() => {
    let isDone = false;
    const timer = setTimeout(() => {
      if (!isDone) setWaking(true);
    }, 2500);

    fetch(`${API_URL}/api/health`)
      .catch(() => {})
      .finally(() => {
        isDone = true;
        clearTimeout(timer);
        setWaking(false);
      });

    return () => clearTimeout(timer);
  }, []);

  if (!waking) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 bg-zinc-900/95 border border-[#1db954]/40 text-white text-xs sm:text-sm px-4 py-2 rounded-full shadow-xl flex items-center gap-2 backdrop-blur-md">
      <span className="w-2 h-2 rounded-full bg-[#1db954] animate-ping" />
      <span>Waking up music server (takes ~30s on first visit)...</span>
    </div>
  );
};

export default ServerWakeBanner;
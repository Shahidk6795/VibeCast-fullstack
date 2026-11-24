import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Search } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 text-center">
      <p className="text-[#1db954] text-sm font-bold uppercase tracking-widest mb-2">404 Error</p>
      <h1 className="text-5xl md:text-7xl font-black mb-4">Page Not Found</h1>
      <p className="text-gray-400 mb-8 max-w-md">
        The track, album, or page you are looking for does not exist or may have moved.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 bg-[#1db954] hover:bg-[#1ed760] text-black font-bold px-6 py-3 rounded-full transition"
        >
          <Home className="w-4 h-4" /> Back to Home
        </button>
        <button
          onClick={() => navigate('/search')}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 rounded-full transition"
        >
          <Search className="w-4 h-4" /> Search Music
        </button>
      </div>
    </div>
  );
};

export default NotFound;
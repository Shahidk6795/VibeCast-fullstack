import React, { useState, useEffect, useContext } from "react";
import { TrendingUp, Play, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PlayerContext } from "../context/PlayerContext";

const Trending = () => {
  const navigate = useNavigate();
  const [trendingList, setTrendingList] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Bring in the play function from your context
  const { playPlaylist } = useContext(PlayerContext);

  // 1. Fetch real tracks from the database on load
  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/tracks');
        if (res.ok) {
          const data = await res.json();
          
          // Grab up to 10 random songs from your DB for the "Trending" view
          const shuffledDB = data.sort(() => 0.5 - Math.random()).slice(0, 10);
          
          const initializedTracks = shuffledDB.map(song => {
            // Realistic base plays: between 50,000 and 500,000
            const fakeBasePlays = Math.floor(Math.random() * 450000) + 50000;
            return {
              ...song,
              basePlays: fakeBasePlays,
              currentPlays: fakeBasePlays + Math.floor(Math.random() * 500)
            };
          });

          setTrendingList(initializedTracks);
        }
      } catch (err) {
        console.error("Failed to load trending tracks", err);
      }
    };
    fetchTracks();
  }, []);

  // 2. The live ticker animation
  useEffect(() => {
    const interval = setInterval(() => {
      setTrendingList(prevList => {
        if (prevList.length === 0) return prevList;
        return prevList.map(song => ({
          ...song,
          // Tick up by just 1 to 15 new plays every 2 seconds
          currentPlays: song.currentPlays + Math.floor(Math.random() * 15) + 1
        }));
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // 3. The 15s shuffle animation
  useEffect(() => {
    const reRankInterval = setInterval(() => {
      setIsUpdating(true);
      
      setTimeout(() => {
        setTrendingList(prevList => {
          if (prevList.length === 0) return prevList;
          return [...prevList].sort(() => 0.5 - Math.random());
        });
        setIsUpdating(false);
      }, 800);

    }, 15000);

    return () => clearInterval(reRankInterval);
  }, []);

  const formatPlays = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className="w-full min-h-screen text-white bg-black pb-24">
      
      <div className="relative w-full h-80 bg-gradient-to-b from-purple-900 to-black p-8 flex items-end pt-20 overflow-hidden">
         <div className={`absolute inset-0 bg-pink-600/20 mix-blend-overlay transition-opacity duration-1000 ${isUpdating ? 'opacity-100' : 'opacity-0'}`}></div>

         <div className="relative z-10 flex items-end gap-6">
            <div className="w-52 h-52 bg-gradient-to-br from-purple-500 to-pink-600 shadow-2xl shadow-pink-500/20 flex items-center justify-center rounded-lg rotate-3 hover:rotate-0 transition-transform duration-500">
               <Activity className="w-24 h-24 text-white animate-pulse" />
            </div>
            <div>
               <div className="flex items-center gap-2 mb-2">
                 <p className="text-sm font-bold uppercase tracking-widest text-pink-400">Live Global Charts</p>
                 {isUpdating && <span className="text-xs bg-red-600 px-2 py-0.5 rounded-full animate-pulse">UPDATING</span>}
               </div>
               
               <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter">Trending Now</h1>
               
               <p className="text-gray-300 flex items-center gap-2">
                 <TrendingUp className="w-4 h-4 text-green-400" />
                 Real-time updates every 15s
               </p>
            </div>
         </div>
      </div>

      <div className="px-6 py-8">
         <div className="grid grid-cols-[50px_4fr_3fr_1fr] text-gray-400 text-sm font-bold uppercase border-b border-white/10 pb-2 mb-4 px-4 sticky top-0 bg-black z-20">
            <span>#</span>
            <span>Title</span>
            <span className="hidden md:block">Live Plays</span>
            <span className="text-right">Time</span>
         </div>

         {trendingList.map((song, idx) => (
            <div 
               key={`${song.id || idx}-${song.title}`}
               onClick={() => playPlaylist(trendingList, idx)}
               className={`group grid grid-cols-[50px_4fr_3fr_1fr] items-center p-3 rounded-lg hover:bg-white/10 cursor-pointer transition-all duration-500 ${isUpdating ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}
            >
               <div className="text-gray-400 font-bold text-lg w-6 text-center">
                  <span className="group-hover:hidden text-pink-500">{idx + 1}</span>
                  <Play className="hidden group-hover:block w-4 h-4 text-white fill-white ml-1" />
               </div>

               <div className="flex items-center gap-4">
                  <img src={song.cover_url} alt={song.title} className="w-12 h-12 object-cover rounded shadow-md" />
                  <div>
                     <p className="font-bold text-white text-md group-hover:text-pink-400 transition-colors">{song.title}</p>
                     <p className="text-sm text-gray-400">{song.artist}</p>
                  </div>
               </div>

               <div className="hidden md:flex items-center gap-2 text-gray-400 text-sm font-mono tracking-wide">
                  {formatPlays(song.currentPlays)}
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
               </div>

               <div className="text-right text-sm text-gray-400">
                  {song.duration || '--:--'}
               </div>
            </div>
         ))}
      </div>
    </div>
  );
};

export default Trending;
import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { PlayerContext } from "../context/PlayerContext";
import "../index.css";
import Hyperspeed from "@/components/Hyperspeed";
import { Play, Dumbbell, Coffee, Heart, TrendingUp, Sparkles, Sun, CloudSun, Moon } from "lucide-react";
import LikedSongsCard from "@/components/LikedSongsCard";
import PlaylistManager from "@/components/PlaylistManager";
import { API_URL } from '../config.js';

const moods = [
  { id: "workout", title: "Iron Paradise", desc: "Pure Adrenaline.", icon: Dumbbell, color: "from-red-600 to-black", textColor: "text-red-500" },
  { id: "relax", title: "Zen Mode", desc: "Lo-Fi & Chill.", icon: Coffee, color: "from-emerald-600 to-black", textColor: "text-emerald-400" },
  { id: "romantic", title: "Late Night", desc: "Slow & Deep.", icon: Heart, color: "from-pink-600 to-black", textColor: "text-pink-500" }
];

// Updated to match our actual database genres!
const genres = ["All", "Hip-Hop", "Pop", "Soul", "R&B", "Latin", "Rock", "EDM", "Lo-Fi"];

const Home = () => {
  // Master lists (never change after initial load)
  const [allTracks, setAllTracks] = useState([]);
  const [allArtists, setAllArtists] = useState([]);
  
  // Display lists (these change when you click a genre)
  const [dbTracks, setDbTracks] = useState([]);
  const [homeArtists, setHomeArtists] = useState([]); 
  const [activeGenre, setActiveGenre] = useState("All");
  
  const { user } = useUser();
  const navigate = useNavigate();
  const { playPlaylist } = useContext(PlayerContext);

  const getGreetingData = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: "Good morning", icon: Sun, color: "text-yellow-400" };
    if (hour < 18) return { text: "Good afternoon", icon: CloudSun, color: "text-orange-400" };
    return { text: "Good evening", icon: Moon, color: "text-indigo-400" };
  };

  const greeting = getGreetingData();
  const GreetingIcon = greeting.icon;

  const fetchTracks = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/tracks`);
      if (response.ok) {
        const data = await response.json();
        const shuffled = data.sort(() => 0.5 - Math.random());
        setAllTracks(shuffled); // Save to Master List
        setDbTracks(shuffled);  // Show on screen
      }
    } catch (error) {
      console.error('Error fetching tracks:', error);
    }
  }, []);

  const fetchArtists = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/artists`);
      if (response.ok) {
        const data = await response.json();
        const formattedArtists = data.map(artist => ({
          name: artist.name,
          image: artist.image_url || "https://placehold.co/400x400/181818/ffffff?text=No+Image", 
          path: `/artist/${encodeURIComponent(artist.name)}`
        }));
        const shuffled = formattedArtists.sort(() => 0.5 - Math.random());
        setAllArtists(shuffled); // Save to Master List
        setHomeArtists(shuffled); // Show on screen
      }
    } catch (error) {
      console.error('Error fetching artists:', error);
    }
  }, []);

  useEffect(() => {
    fetchTracks();
    fetchArtists();
  }, [fetchTracks, fetchArtists]);

  const handleArtistClick = useCallback((artist) => {
    navigate(`/artist/${encodeURIComponent(artist.name)}`, { state: { image: artist.image } }); 
  }, [navigate]);

  // REAL FILTERING LOGIC
  const handleGenreClick = (genre) => {
    setActiveGenre(genre);

    if (genre === "All") {
      // Reset everything back to a shuffled master list
      setDbTracks([...allTracks].sort(() => 0.5 - Math.random()));
      setHomeArtists([...allArtists].sort(() => 0.5 - Math.random()));
    } else {
      // 1. Filter tracks by genre
      const filteredTracks = allTracks.filter(
        track => track.genre && track.genre.toLowerCase() === genre.toLowerCase()
      );

      // 2. Filter artists who sing those tracks!
      const validArtistNames = filteredTracks.map(t => t.artist.toLowerCase());
      const filteredArtists = allArtists.filter(artist => 
        validArtistNames.some(validName => validName.includes(artist.name.toLowerCase()))
      );

      // 3. Update the screen (with our safety net if a category is empty)
      if (filteredTracks.length > 0) {
        setDbTracks(filteredTracks);
        setHomeArtists(filteredArtists.length > 0 ? filteredArtists : [...allArtists].sort(() => 0.5 - Math.random()));
      } else {
        // Fallback: If empty, shuffle all
        setDbTracks([...allTracks].sort(() => 0.5 - Math.random()));
        setHomeArtists([...allArtists].sort(() => 0.5 - Math.random()));
      }
    }
  };

  const categories = useMemo(() => {
    return [
      { title: "Jump Back In", artists: homeArtists.slice(0, 6), type: "artist" },
      { title: "Trending Artists", artists: homeArtists.slice(6, 12), type: "artist" },
    ].filter(cat => cat.artists.length > 0);
  }, [homeArtists]);

  const featuredArtist = homeArtists.length > 0 ? homeArtists[0] : null;

  return (
    <div className="relative w-full min-h-screen text-white overflow-x-hidden bg-black">
      <div className="fixed inset-0 z-0 bg-black">
        <Hyperspeed intensity={0.5} colorShift={true} trailLength={60} speed={0.8} />
      </div>

      <div className="relative z-10 p-6 md:p-8 pt-4 min-h-screen pb-32 max-w-7xl mx-auto">
        
        {/* 1. REFINED GREETING & GENRE PILLS */}
        <header className="mb-10 pt-4">
          <div className="flex items-center gap-3 mb-6">
            <GreetingIcon className={`w-8 h-8 md:w-10 md:h-10 ${greeting.color} drop-shadow-md`} />
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white drop-shadow-md">
              {greeting.text}{user?.firstName ? `, ${user.firstName}` : ""}
            </h1>
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide snap-x">
            {genres.map(genre => (
              <button
                key={genre}
                onClick={() => handleGenreClick(genre)}
                className={`snap-start whitespace-nowrap px-6 py-2.5 rounded-full text-[13px] font-bold uppercase tracking-wider transition-all duration-300 ${
                  activeGenre === genre 
                  ? "bg-white text-black shadow-lg scale-105" 
                  : "bg-white/5 text-gray-300 hover:text-white hover:bg-white/15 border border-white/10"
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </header>

        {/* 2. HERO ARTIST SPOTLIGHT */}
        {featuredArtist && (
          <section className="mb-14 relative rounded-3xl overflow-hidden h-64 md:h-80 group cursor-pointer shadow-2xl border border-white/10" onClick={() => handleArtistClick(featuredArtist)}>
            <div className="absolute inset-0 bg-black">
              <img src={featuredArtist.image} alt={featuredArtist.name} className="w-full h-full object-cover opacity-60 group-hover:scale-105 group-hover:opacity-50 transition-all duration-700" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent"></div>
            
            <div className="absolute bottom-0 left-0 p-6 md:p-10 z-10 flex flex-col items-start w-full">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1db954]/20 border border-[#1db954]/50 text-[#1db954] text-xs font-bold uppercase tracking-widest mb-3 backdrop-blur-md">
                <Sparkles className="w-3 h-3" /> Artist of the Week
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-white mb-4 drop-shadow-lg">
                {featuredArtist.name}
              </h2>
              <button className="flex items-center gap-2 bg-[#1db954] hover:bg-[#1ed760] text-black px-6 py-3 rounded-full font-bold transition-transform hover:scale-105">
                <Play className="w-5 h-5 fill-black" /> Explore Music
              </button>
            </div>
          </section>
        )}

        {/* 3. GLOBAL TOP 5 */}
        {dbTracks.length > 0 && (
          <section className="mb-14">
            <h2 className="text-2xl font-bold mb-5 text-white flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-pink-500" />
              VibeCast Top 5
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
              {dbTracks.slice(0, 5).map((track, idx) => (
                <div
                  key={track.id || idx}
                  onClick={() => playPlaylist([{ name: track.title, artist: track.artist, path: track.audio_url, image: track.cover_url }], 0)}
                  className="snap-start relative group flex items-center gap-4 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all duration-300 cursor-pointer backdrop-blur-md shadow-lg flex-shrink-0 w-[260px] sm:w-[320px] hover:-translate-y-1"
                >
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 text-6xl font-black text-white/5 group-hover:text-[#1db954]/10 transition-colors pointer-events-none z-0">
                    {idx + 1}
                  </div>
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shadow-md bg-black z-10 flex-shrink-0">
                    <img src={track.cover_url} alt={track.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                      <Play className="w-6 h-6 text-white fill-white ml-1" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 z-10 py-1">
                    <p className="text-white font-bold text-sm sm:text-base truncate group-hover:text-[#1db954] transition-colors">{track.title}</p>
                    <p className="text-gray-400 text-xs sm:text-sm truncate mt-0.5">{track.artist}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4. MADE FOR YOU (DAILY MIXES) */}
        {dbTracks.length >= 4 && (
          <section className="mb-14">
            <h2 className="text-2xl font-bold mb-5 text-white hover:text-[#1db954] transition-colors duration-300">
              Made For You
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {['Daily Mix 1', 'Release Radar', 'Chill Vibes', 'Discover Weekly'].map((mixName, idx) => (
                <div 
                  key={mixName}
                  onClick={() => {
                    const mixTracks = dbTracks.slice(idx * 2, (idx * 2) + 5).map(t => ({
                      name: t.title, artist: t.artist, path: t.audio_url, image: t.cover_url
                    }));
                    if(mixTracks.length > 0) playPlaylist(mixTracks, 0);
                  }}
                  className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer shadow-lg border border-white/10"
                >
                  <img src={dbTracks[idx]?.cover_url} className="w-full h-full object-cover opacity-70 group-hover:scale-110 transition-transform duration-700" alt="Mix Cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10"></div>
                  
                  <div className="absolute bottom-0 left-0 p-4 sm:p-5 z-20 w-full">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-black text-white leading-tight drop-shadow-md">
                      {mixName}
                    </h3>
                  </div>

                  <div className="absolute bottom-4 right-4 w-10 h-10 sm:w-12 sm:h-12 bg-[#1db954] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-xl transition-all duration-300 translate-y-4 group-hover:translate-y-0 z-20">
                    <Play className="w-5 h-5 sm:w-6 sm:h-6 text-black fill-black ml-1" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 5. YOUR LIBRARY */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold mb-5 text-white hover:text-[#1db954] transition-colors duration-300">
            Your Library
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            <LikedSongsCard />
            <PlaylistManager />
          </div>
        </section>

        {/* 6. SELECT YOUR VIBE */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold mb-5 text-white hover:text-[#1db954] transition-colors duration-300">
            Select Your Vibe
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {moods.map((mood) => (
              <div key={mood.id} onClick={() => navigate(`/mood/${mood.id}`)} className="group relative h-32 sm:h-40 rounded-2xl overflow-hidden cursor-pointer border border-white/5 hover:border-white/20 transition-all hover:-translate-y-1">
                <div className={`absolute inset-0 bg-gradient-to-br ${mood.color} opacity-50 group-hover:opacity-80 transition-opacity duration-500`}></div>
                <div className="relative z-10 h-full flex flex-col justify-center items-center text-center p-4">
                  <mood.icon className={`w-8 h-8 sm:w-10 sm:h-10 ${mood.textColor} mb-3`} />
                  <h3 className="text-lg sm:text-xl font-black italic uppercase text-white">{mood.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 7. TICKER CATEGORIES */}
        {categories.map((category, index) => (
          <section key={index} className="mb-12 overflow-hidden relative">
            <h2 className="text-2xl font-bold mb-5 hover:underline text-[#1db954] transition-colors duration-300">
              {category.title}
            </h2>

            <div className="ticker-wrapper relative overflow-hidden group mask-gradient">
              <div className="ticker-content flex space-x-6 animate-ticker">
                {category.artists.concat(category.artists).map((artist, idx) => (
                  <div key={idx} onClick={() => handleArtistClick(artist)} className="group/card relative flex flex-col p-3 sm:p-4 w-32 sm:w-44 rounded-xl shadow-2xl border border-white/5 hover:border-[#1db954] bg-white/5 hover:bg-white/10 flex-shrink-0 cursor-pointer transition-all duration-300 hover:-translate-y-1 backdrop-blur-sm">
                    <div className="relative w-full aspect-square mb-3 shadow-lg rounded-full overflow-hidden">
                      <img src={artist.image} alt={artist.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#1db954] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform translate-y-2 group-hover/card:translate-y-0 duration-300">
                          <Play className="w-5 h-5 sm:w-6 sm:h-6 text-black fill-current ml-1" />
                        </div>
                      </div>
                    </div>
                    <div className="text-center z-10">
                      <p className="text-sm sm:text-base font-bold text-white truncate group-hover/card:text-[#1db954] transition-colors">{artist.name}</p>
                      <p className="text-xs sm:text-sm text-gray-400 truncate capitalize mt-1">{category.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}

        <div className="h-20"></div>
      </div>
    </div>
  );
};

export default Home;
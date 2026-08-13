import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { PlayerContext } from "../context/PlayerContext";
import "../index.css";
import Hyperspeed from "@/components/Hyperspeed";
import { Play, Dumbbell, Coffee, Heart, TrendingUp, Sparkles, Sun, CloudSun, Moon, Clock, Flame } from "lucide-react";
import LikedSongsCard from "@/components/LikedSongsCard";
import PlaylistManager from "@/components/PlaylistManager";
import { API_URL } from '../config.js';

const moods = [
  { id: "workout", title: "Iron Paradise", desc: "Pure Adrenaline.", icon: Dumbbell, color: "from-red-600 to-black", textColor: "text-red-500" },
  { id: "relax", title: "Zen Mode", desc: "Lo-Fi & Chill.", icon: Coffee, color: "from-emerald-600 to-black", textColor: "text-emerald-400" },
  { id: "romantic", title: "Late Night", desc: "Slow & Deep.", icon: Heart, color: "from-pink-600 to-black", textColor: "text-pink-500" }
];

const genres = ["All", "Hip-Hop", "Pop", "Soul", "R&B", "Latin", "Rock", "EDM", "Lo-Fi"];

const genreAmbience = {
  All: "from-[#1db954]/20 via-black to-black",
  "Hip-Hop": "from-purple-900/40 via-black to-black",
  "Pop": "from-pink-900/40 via-black to-black",
  "Soul": "from-blue-900/40 via-black to-black",
  "R&B": "from-amber-900/40 via-black to-black",
  "Latin": "from-yellow-900/40 via-black to-black",
  "Rock": "from-red-900/40 via-black to-black",
  "EDM": "from-emerald-900/40 via-black to-black",
  "Lo-Fi": "from-indigo-900/40 via-black to-black"
};

// 4. FEATURE: Helper to detect "NEW" releases (uploaded within last 30 days)
const isNewRelease = (dateString) => {
  if (!dateString) return false;
  const trackDate = new Date(dateString);
  if (isNaN(trackDate.getTime())) return false;
  const diffDays = Math.ceil(Math.abs(new Date() - trackDate) / (1000 * 60 * 60 * 24));
  return diffDays <= 30;
};

const Home = () => {
  const [allTracks, setAllTracks] = useState([]);
  const [allArtists, setAllArtists] = useState([]);
  
  const [dbTracks, setDbTracks] = useState([]);
  const [homeArtists, setHomeArtists] = useState([]); 
  const [activeGenre, setActiveGenre] = useState("All");
  
  // 3. FEATURE: Recently Played State
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);

  const { user } = useUser();
  const navigate = useNavigate();
  
  // Pull current track state from PlayerContext
  const { playPlaylist, currentTrack, isPlaying } = useContext(PlayerContext) || {};

  // Load Recently Played from localStorage on mount
  useEffect(() => {
    const savedRecents = localStorage.getItem('vibecast_recently_played');
    if (savedRecents) {
      try {
        setRecentlyPlayed(JSON.parse(savedRecents));
      } catch (e) {
        console.error("Failed to parse recently played songs:", e);
      }
    }
  }, []);

  // Record a track to Recently Played history
  const trackPlayed = useCallback((trackObj) => {
    setRecentlyPlayed((prev) => {
      const filtered = prev.filter((t) => t.name !== trackObj.name);
      const updated = [trackObj, ...filtered].slice(0, 8);
      localStorage.setItem('vibecast_recently_played', JSON.stringify(updated));
      return updated;
    });
  }, []);

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
        setAllTracks(shuffled);
        setDbTracks(shuffled);
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
        setAllArtists(shuffled);
        setHomeArtists(shuffled);
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

  const handleGenreClick = (genre) => {
    setActiveGenre(genre);

    if (genre === "All") {
      setDbTracks([...allTracks].sort(() => 0.5 - Math.random()));
      setHomeArtists([...allArtists].sort(() => 0.5 - Math.random()));
    } else {
      const filteredTracks = allTracks.filter(
        track => track.genre && track.genre.toLowerCase() === genre.toLowerCase()
      );

      const validArtistNames = filteredTracks.map(t => t.artist.toLowerCase());
      const filteredArtists = allArtists.filter(artist => 
        validArtistNames.some(validName => validName.includes(artist.name.toLowerCase()))
      );

      if (filteredTracks.length > 0) {
        setDbTracks(filteredTracks);
        setHomeArtists(filteredArtists.length > 0 ? filteredArtists : [...allArtists].sort(() => 0.5 - Math.random()));
      } else {
        setDbTracks([...allTracks].sort(() => 0.5 - Math.random()));
        setHomeArtists([...allArtists].sort(() => 0.5 - Math.random()));
      }
    }
  };

  // SPOTIFY-STYLE: 2-Hour Rotating Thematic Mixes
  const generatedMixes = useMemo(() => {
    if (allTracks.length === 0) return [];
    
    const currentWindow = Math.floor(Date.now() / (1000 * 60 * 60 * 2));
    
    const mixThemes = [
      { title: 'Hip-Hop Mix', genre: 'Hip-Hop', color: 'bg-purple-600' },
      { title: 'Soulful Vibes', genre: 'Soul', color: 'bg-blue-600' },
      { title: 'Pop Anthems', genre: 'Pop', color: 'bg-pink-600' },
      { title: 'Rock Classics', genre: 'Rock', color: 'bg-red-600' },
      { title: 'R&B Grooves', genre: 'R&B', color: 'bg-orange-600' },
      { title: 'Latin Heat', genre: 'Latin', color: 'bg-yellow-600' }
    ];

    const activeMixes = [];
    
    for (let i = 0; i < mixThemes.length; i++) {
      const theme = mixThemes[(currentWindow + i) % mixThemes.length];
      const relatedTracks = allTracks.filter(t => t.genre === theme.genre);
      
      if (relatedTracks.length >= 5) {
        const shuffled = [...relatedTracks].sort(() => 0.5 - Math.random());
        
        const playlistTracks = shuffled.slice(0, 15).map(t => ({
          name: t.title, artist: t.artist, path: t.audio_url, image: t.cover_url
        }));

        const uniqueArtists = [...new Set(playlistTracks.map(t => t.artist))];
        const subtitle = uniqueArtists.slice(0, 3).join(', ') + (uniqueArtists.length > 3 ? ' and more' : '');

        activeMixes.push({
          ...theme,
          tracks: playlistTracks,
          subtitle: subtitle,
          cover: playlistTracks[0].image
        });

        if (activeMixes.length === 4) break;
      }
    }

    return activeMixes;
  }, [allTracks]); 

  const categories = useMemo(() => {
    return [
      { title: "Jump Back In", artists: homeArtists.slice(0, 6), type: "artist" },
      { title: "Trending Artists", artists: homeArtists.slice(6, 12), type: "artist" },
    ].filter(cat => cat.artists.length > 0);
  }, [homeArtists]);

  const featuredArtist = homeArtists.length > 0 ? homeArtists[0] : null;

  return (
    <div className="relative w-full min-h-screen text-white overflow-x-hidden bg-black transition-colors duration-700">
      
      {/* 1. DYNAMIC VIBE-SHIFTING AMBIENT GLOW BACKGROUND */}
      <div className={`fixed inset-0 z-0 bg-gradient-to-b ${genreAmbience[activeGenre] || genreAmbience["All"]} transition-all duration-1000 ease-in-out`}>
        <Hyperspeed intensity={0.4} colorShift={true} trailLength={50} speed={0.7} />
      </div>

      <div className="relative z-10 p-6 md:p-8 pt-4 min-h-screen pb-32 max-w-7xl mx-auto">
        
        {/* REFINED GREETING & GENRE PILLS */}
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
                  ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.5)] scale-105" 
                  : "bg-white/5 text-gray-300 hover:text-white hover:bg-white/15 border border-white/10"
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </header>

        {/* 3. FEATURE: RECENTLY PLAYED ROW */}
        {recentlyPlayed.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#1db954]" />
              Recently Played
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide snap-x">
              {recentlyPlayed.map((track, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    playPlaylist?.([track], 0);
                    trackPlayed(track);
                  }}
                  className="snap-start group flex items-center gap-3 p-2 pr-4 rounded-xl bg-white/5 hover:bg-white/15 border border-white/5 cursor-pointer backdrop-blur-md transition-all duration-300 flex-shrink-0 w-[200px] sm:w-[240px]"
                >
                  <img src={track.image} alt={track.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white truncate group-hover:text-[#1db954] transition-colors">{track.name}</p>
                    <p className="text-xs text-gray-400 truncate">{track.artist}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* HERO ARTIST SPOTLIGHT */}
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

        {/* GLOBAL TOP 5 */}
        {dbTracks.length > 0 && (
          <section className="mb-14">
            <h2 className="text-2xl font-bold mb-5 text-white flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-pink-500" />
              VibeCast Top 5
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
              {dbTracks.slice(0, 5).map((track, idx) => {
                const isCurrentlyPlaying = currentTrack?.name === track.title && isPlaying;
                const formatted = { name: track.title, artist: track.artist, path: track.audio_url, image: track.cover_url };
                
                return (
                  <div
                    key={track.id || idx}
                    onClick={() => {
                      playPlaylist?.([formatted], 0);
                      trackPlayed(formatted);
                    }}
                    className="snap-start relative group flex items-center gap-4 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all duration-300 cursor-pointer backdrop-blur-md shadow-lg flex-shrink-0 w-[260px] sm:w-[320px] hover:-translate-y-1"
                  >
                    {/* 2. FEATURE: ANIMATED NOW-PLAYING EQUALIZER OR NUMBER */}
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 z-0 pointer-events-none">
                      {isCurrentlyPlaying ? (
                        <div className="flex items-end gap-1 h-8 pl-3 opacity-90">
                          <span className="w-1.5 bg-[#1db954] animate-bounce h-full rounded-full"></span>
                          <span className="w-1.5 bg-[#1db954] animate-bounce [animation-delay:0.2s] h-3/4 rounded-full"></span>
                          <span className="w-1.5 bg-[#1db954] animate-bounce [animation-delay:0.4s] h-1/2 rounded-full"></span>
                        </div>
                      ) : (
                        <span className="text-6xl font-black text-white/5 group-hover:text-[#1db954]/10 transition-colors">
                          {idx + 1}
                        </span>
                      )}
                    </div>

                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shadow-md bg-black z-10 flex-shrink-0">
                      <img src={track.cover_url} alt={track.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      
                      {/* 4. FEATURE: NEW RELEASE BADGE */}
                      {isNewRelease(track.created_at) && (
                        <span className="absolute top-1 left-1 bg-gradient-to-r from-red-600 to-pink-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-md uppercase tracking-wider z-20 flex items-center gap-0.5">
                          <Flame className="w-2.5 h-2.5 fill-white" /> NEW
                        </span>
                      )}

                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                        <Play className="w-6 h-6 text-white fill-white ml-1" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 z-10 py-1">
                      <p className={`font-bold text-sm sm:text-base truncate transition-colors ${isCurrentlyPlaying ? "text-[#1db954]" : "text-white group-hover:text-[#1db954]"}`}>
                        {track.title}
                      </p>
                      <p className="text-gray-400 text-xs sm:text-sm truncate mt-0.5">{track.artist}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* MADE FOR YOU (THEMATIC MIXES) */}
        {generatedMixes.length > 0 && (
          <section className="mb-14">
            <h2 className="text-2xl font-bold mb-5 text-white hover:text-[#1db954] transition-colors duration-300">
              Made For You
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {generatedMixes.map((mix) => (
                <div 
                  key={mix.title}
                  onClick={() => {
                    playPlaylist?.(mix.tracks, 0);
                    if (mix.tracks[0]) trackPlayed(mix.tracks[0]);
                  }}
                  className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer shadow-lg border border-white/10"
                >
                  <img src={mix.cover} className="w-full h-full object-cover opacity-70 group-hover:scale-110 transition-transform duration-700" alt={mix.title} />
                  <div className={`absolute inset-0 opacity-40 mix-blend-multiply ${mix.color}`}></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent z-10"></div>
                  
                  <div className="absolute bottom-0 left-0 p-4 sm:p-5 z-20 w-full">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-black text-white leading-tight drop-shadow-md mb-1">
                      {mix.title}
                    </h3>
                    <p className="text-xs text-gray-300 font-medium line-clamp-2">
                      {mix.subtitle}
                    </p>
                  </div>

                  <div className="absolute bottom-4 right-4 w-10 h-10 sm:w-12 sm:h-12 bg-[#1db954] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-xl transition-all duration-300 translate-y-4 group-hover:translate-y-0 z-20">
                    <Play className="w-5 h-5 sm:w-6 sm:h-6 text-black fill-black ml-1" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* YOUR LIBRARY */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold mb-5 text-white hover:text-[#1db954] transition-colors duration-300">
            Your Library
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            <LikedSongsCard />
            <PlaylistManager />
          </div>
        </section>

        {/* SELECT YOUR VIBE */}
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

        {/* TICKER CATEGORIES */}
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
import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { PlayerContext } from "../context/PlayerContext";
import "../index.css";
import Hyperspeed from "@/components/Hyperspeed";
import { Play, Dumbbell, Coffee, Heart, Sparkles, Sun, CloudSun, Moon, Clock, Flame, BarChart2, Radio, TrendingUp } from "lucide-react";
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

const vipArtistNames = [
  "Arijit Singh", "The Weeknd", "Taylor Swift", "Diljit Dosanjh", 
  "Drake", "Shreya Ghoshal", "Badshah", "Travis Scott", "Pritam", "Dua Lipa"
];

const getValidImage = (imageObj) => {
  if (!imageObj) return 'https://ik.imagekit.io/vibecast/images/default-artist.jpg';
  if (typeof imageObj === 'string') {
    if (imageObj === "[object Object]") return 'https://ik.imagekit.io/vibecast/images/default-artist.jpg';
    return imageObj;
  }
  if (Array.isArray(imageObj)) return imageObj[imageObj.length - 1]?.url || imageObj[imageObj.length - 1]?.link || imageObj[0]?.url;
  return imageObj.url || imageObj.link || 'https://ik.imagekit.io/vibecast/images/default-artist.jpg';
};

const getValidAudio = (audioObj) => {
  if (!audioObj) return '';
  if (typeof audioObj === 'string') return audioObj;
  if (Array.isArray(audioObj)) return audioObj[audioObj.length - 1]?.url || audioObj[audioObj.length - 1]?.link || audioObj[0]?.url;
  return audioObj.url || audioObj.link || '';
};

const isNewRelease = (dateString) => {
  if (!dateString) return false;
  const trackDate = new Date(dateString);
  if (isNaN(trackDate.getTime())) return false;
  const diffDays = Math.ceil(Math.abs(new Date() - trackDate) / (1000 * 60 * 60 * 24));
  return diffDays <= 30;
};

const Home = () => {
  const [allTracks, setAllTracks] = useState([]);
  const [dbTracks, setDbTracks] = useState([]);
  
  // RESTORED: allArtists backup so genre filtering works again!
  const [allArtists, setAllArtists] = useState([]);
  const [homeArtists, setHomeArtists] = useState([]); 
  
  const [activeGenre, setActiveGenre] = useState("All");
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  
  const [trendingSongs, setTrendingSongs] = useState([]);
  const [topCharts, setTopCharts] = useState([]);
  const [newReleases, setNewReleases] = useState([]);

  const { user } = useUser();
  const navigate = useNavigate();
  const { playPlaylist, currentTrack, isPlaying } = useContext(PlayerContext) || {};

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

  const fetchLiveVIPArtists = useCallback(async () => {
    try {
      const promises = vipArtistNames.map(name => 
        fetch(`${API_URL}/api/artists/search?query=${encodeURIComponent(name)}`).then(res => res.json())
      );
      const results = await Promise.all(promises);
      
      const liveArtists = results.map((res, idx) => {
        const artistObj = res.data?.results?.[0];
        return {
          name: artistObj?.title || artistObj?.name || vipArtistNames[idx],
          image: getValidImage(artistObj?.image)
        };
      });

      setAllArtists(liveArtists);
      setHomeArtists(liveArtists.sort(() => 0.5 - Math.random()));
    } catch (error) {
      console.error("Error fetching live VIP artists:", error);
    }
  }, []);

  const fetchHomeModules = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/artists/modules`);
      if (res.ok) {
        const data = await res.json();
        const payload = data.data || data; 
        
        // Deep parsing to ensure we catch the data no matter how the API formats it
        const trending = payload.trending?.songs || payload.trending?.albums || payload.trending || [];
        const charts = payload.charts || payload.top_charts || payload.playlists || [];
        const releases = payload.albums || payload.new_releases || payload.new_trending || [];
        
        setTrendingSongs(Array.isArray(trending) ? trending : []);
        setTopCharts(Array.isArray(charts) ? charts : []);
        setNewReleases(Array.isArray(releases) ? releases : []);
      } else {
        console.error("Backend /modules returned an error! Did you deploy the backend code to Render?");
      }
    } catch (error) {
      console.error('Error fetching home modules:', error);
    }
  }, []);

  useEffect(() => {
    fetchTracks();
    fetchLiveVIPArtists();
    fetchHomeModules();
  }, [fetchTracks, fetchLiveVIPArtists, fetchHomeModules]);

  const handleArtistClick = useCallback((artist) => {
    navigate(`/artist/${encodeURIComponent(artist.name)}`, { state: { image: artist.image } }); 
  }, [navigate]);

  // RESTORED: Genre clicking now properly filters BOTH the Top 5 tracks and the Artists!
  const handleGenreClick = (genre) => {
    setActiveGenre(genre);
    
    if (genre === "All") {
      setDbTracks([...allTracks].sort(() => 0.5 - Math.random()));
      setHomeArtists([...allArtists].sort(() => 0.5 - Math.random()));
    } else {
      // Filter Tracks
      const filteredTracks = allTracks.filter(
        track => track.genre && track.genre.toLowerCase() === genre.toLowerCase()
      );
      
      // Filter Artists based on the tracks in that genre
      const validArtistNames = filteredTracks.map(t => t.artist.toLowerCase());
      const filteredArtists = allArtists.filter(artist => 
        validArtistNames.some(validName => validName.includes(artist.name.toLowerCase()))
      );

      setDbTracks(filteredTracks.length > 0 ? filteredTracks : [...allTracks].sort(() => 0.5 - Math.random()));
      setHomeArtists(filteredArtists.length > 0 ? filteredArtists : [...allArtists].sort(() => 0.5 - Math.random()));
    }
  };

  const heroArtist = useMemo(() => {
    return [...homeArtists].sort(() => 0.5 - Math.random())[0];
  }, [homeArtists]);

  return (
    <div className="relative w-full min-h-screen text-white overflow-x-hidden bg-black transition-colors duration-700">
      
      <div className={`fixed inset-0 z-0 bg-gradient-to-b ${genreAmbience[activeGenre] || genreAmbience["All"]} transition-all duration-1000 ease-in-out`}>
        <Hyperspeed intensity={0.4} colorShift={true} trailLength={50} speed={0.7} />
      </div>

      <div className="relative z-10 p-6 md:p-8 pt-4 min-h-screen pb-32 max-w-7xl mx-auto">
        
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

        {/* LIVE VIP HERO ARTIST */}
        {heroArtist && (
          <section className="mb-14 relative rounded-3xl overflow-hidden h-64 md:h-80 group cursor-pointer shadow-2xl border border-white/10" onClick={() => handleArtistClick(heroArtist)}>
            <div className="absolute inset-0 bg-black">
              <img src={heroArtist.image} alt={heroArtist.name} className="w-full h-full object-cover opacity-60 group-hover:scale-105 group-hover:opacity-50 transition-all duration-700" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent"></div>
            
            <div className="absolute bottom-0 left-0 p-6 md:p-10 z-10 flex flex-col items-start w-full">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1db954]/20 border border-[#1db954]/50 text-[#1db954] text-xs font-bold uppercase tracking-widest mb-3 backdrop-blur-md">
                <Sparkles className="w-3 h-3" /> Artist of the Week
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-white mb-4 drop-shadow-lg">
                {heroArtist.name}
              </h2>
              <button className="flex items-center gap-2 bg-[#1db954] hover:bg-[#1ed760] text-black px-6 py-3 rounded-full font-bold transition-transform hover:scale-105">
                <Play className="w-5 h-5 fill-black" /> Explore Music
              </button>
            </div>
          </section>
        )}

        {/* TOP 5 TRACKS WITH GIF */}
        {dbTracks.length > 0 && (
          <section className="mb-14">
            <h2 className="text-2xl font-bold mb-5 text-white flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-pink-500" />
              VibeCast Top 5
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
              {dbTracks.slice(0, 5).map((track, idx) => {
                const isCurrentlyPlaying = currentTrack?.name === track.title && isPlaying;
                const formatted = { name: track.title, artist: track.artist, path: getValidAudio(track.audio_url), image: getValidImage(track.cover_url) };
                
                return (
                  <div
                    key={track.id || idx}
                    onClick={() => {
                      playPlaylist?.([formatted], 0);
                      trackPlayed(formatted);
                    }}
                    className="snap-start relative group flex items-center gap-4 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all duration-300 cursor-pointer backdrop-blur-md shadow-lg flex-shrink-0 w-[260px] sm:w-[320px] hover:-translate-y-1"
                  >
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 z-0 pointer-events-none">
                      {isCurrentlyPlaying ? (
                        <div className="flex items-center h-8 pl-3 opacity-90">
                          <img 
                            src="https://ik.imagekit.io/vibecast/images/equaliser-animated-green.f93a2ef4.gif" 
                            alt="Playing" 
                            className="w-5 h-5" 
                          />
                        </div>
                      ) : (
                        <span className="text-6xl font-black text-white/5 group-hover:text-[#1db954]/10 transition-colors">
                          {idx + 1}
                        </span>
                      )}
                    </div>

                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shadow-md bg-black z-10 flex-shrink-0 ml-4">
                      <img src={formatted.image} alt={track.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      
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

        {/* JIOSAAVN TRENDING SONGS */}
        {trendingSongs.length > 0 && (
          <section className="mb-14">
            <h2 className="text-2xl font-bold mb-5 text-white flex items-center gap-2">
              <Flame className="w-6 h-6 text-orange-500" />
              Trending Now
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
              {trendingSongs.map((song, idx) => {
                const formatted = { 
                  name: song.name?.replace(/&quot;/g, '"'), 
                  artist: song.primaryArtists || song.singers || "Unknown", 
                  path: getValidAudio(song.downloadUrl || song.url), 
                  image: getValidImage(song.image) 
                };
                return (
                  <div
                    key={song.id || idx}
                    onClick={() => {
                      playPlaylist?.([formatted], 0);
                      trackPlayed(formatted);
                    }}
                    className="snap-start relative group flex flex-col gap-3 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all duration-300 cursor-pointer backdrop-blur-md shadow-lg flex-shrink-0 w-[160px] sm:w-[180px] hover:-translate-y-1"
                  >
                    <div className="relative w-full aspect-square rounded-xl overflow-hidden shadow-md bg-black">
                      <img src={formatted.image} alt={formatted.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                        <div className="w-12 h-12 bg-[#1db954] rounded-full flex items-center justify-center shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                          <Play className="w-6 h-6 text-black fill-current ml-1" />
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 z-10">
                      <p className="font-bold text-sm sm:text-base text-white truncate group-hover:text-[#1db954] transition-colors">{formatted.name}</p>
                      <p className="text-gray-400 text-xs sm:text-sm truncate mt-0.5">{formatted.artist}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* JIOSAAVN NEW RELEASES */}
        {newReleases.length > 0 && (
          <section className="mb-14">
            <h2 className="text-2xl font-bold mb-5 text-white flex items-center gap-2">
              <Radio className="w-6 h-6 text-purple-500" />
              New Releases
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
              {newReleases.slice(0, 10).map((album) => (
                <div 
                  key={album.id}
                  onClick={() => navigate(`/album/${album.id}`, { state: { image: getValidImage(album.image), title: album.name || album.title, year: album.year } })}
                  className="group bg-[#181818] hover:bg-[#282828] p-4 rounded-xl transition duration-300 flex flex-col gap-3 cursor-pointer shadow-lg border border-transparent hover:border-white/10"
                >
                  <div className="relative aspect-square rounded-md overflow-hidden shadow-lg">
                    <img src={getValidImage(album.image)} alt={album.title || album.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500 pointer-events-none" />
                  </div>
                  <div className="flex flex-col">
                    <h4 className="font-bold text-white text-sm sm:text-base truncate group-hover:text-[#1db954]">{album.title || album.name}</h4>
                    <p className="text-xs text-gray-400 mt-0.5 capitalize truncate">{album.subtitle || album.role || "Album"}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* JIOSAAVN TOP CHARTS */}
        {topCharts.length > 0 && (
          <section className="mb-14">
            <h2 className="text-2xl font-bold mb-5 text-white flex items-center gap-2">
              <BarChart2 className="w-6 h-6 text-blue-500" />
              Top Charts
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
              {topCharts.map((chart) => (
                <div 
                  key={chart.id}
                  onClick={() => navigate(`/album/${chart.id}`, { state: { image: getValidImage(chart.image), title: chart.title || chart.name } })}
                  className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer shadow-lg border border-white/10"
                >
                  <img src={getValidImage(chart.image)} className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-700" alt={chart.title || chart.name} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10"></div>
                  
                  <div className="absolute bottom-0 left-0 p-4 sm:p-5 z-20 w-full">
                    <h3 className="text-base sm:text-lg font-black text-white leading-tight drop-shadow-md mb-1">
                      {chart.title || chart.name}
                    </h3>
                    <p className="text-xs text-gray-300 font-medium">Top Chart</p>
                  </div>

                  <div className="absolute top-4 right-4 w-10 h-10 bg-[#1db954] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-xl transition-all duration-300 z-20">
                    <Play className="w-5 h-5 text-black fill-black ml-1" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mb-14">
          <h2 className="text-2xl font-bold mb-5 text-white hover:text-[#1db954] transition-colors duration-300">
            Your Library
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            <LikedSongsCard />
            <PlaylistManager />
          </div>
        </section>

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

        {/* LIVE VIP ARTIST TICKER */}
        {homeArtists.length > 0 && (
          <section className="mb-12 overflow-hidden relative">
            <h2 className="text-2xl font-bold mb-5 hover:underline text-[#1db954] transition-colors duration-300">
              Trending Artists
            </h2>
            <div className="ticker-wrapper relative overflow-hidden group mask-gradient">
              <div className="ticker-content flex space-x-6 animate-ticker">
                {homeArtists.concat(homeArtists).map((artist, idx) => (
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
                      <p className="text-xs sm:text-sm text-gray-400 truncate mt-1">Artist</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <div className="h-20"></div>
      </div>
    </div>
  );
};

export default Home;
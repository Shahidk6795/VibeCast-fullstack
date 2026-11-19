import React, { useState, useEffect, useContext } from "react";
import { TrendingUp, Play, Activity } from "lucide-react";
import { PlayerContext } from "../context/PlayerContext";
import { API_URL } from "../config.js";

const getValidImage = (imageObj) => {
  if (!imageObj) return "https://ik.imagekit.io/vibecast/images/default-artist.jpg";
  if (typeof imageObj === "string") return imageObj;
  if (Array.isArray(imageObj)) {
    const highRes = imageObj.find((img) => img.quality === "500x500" || img.url?.includes("500x500"));
    return highRes?.url || highRes?.link || imageObj[imageObj.length - 1]?.url || "";
  }
  return imageObj.url || imageObj.link || "";
};

const getValidAudio = (audioObj) => {
  if (!audioObj) return "";
  if (typeof audioObj === "string") return audioObj;
  if (Array.isArray(audioObj)) {
    return audioObj[audioObj.length - 1]?.url || audioObj[0]?.url || "";
  }
  return audioObj.url || audioObj.link || "";
};

const formatDuration = (seconds) => {
  const secs = Number(seconds);
  if (!secs || Number.isNaN(secs)) return "--:--";
  const mins = Math.floor(secs / 60);
  const rem = Math.floor(secs % 60);
  return `${mins}:${rem < 10 ? "0" : ""}${rem}`;
};

const Trending = () => {
  const [trendingList, setTrendingList] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [loading, setLoading] = useState(true);

  const { playPlaylist } = useContext(PlayerContext) || {};

  // 1. Fetch live trending songs from the native backend API
  useEffect(() => {
    const fetchLiveTrending = async () => {
      try {
        let rawSongs = [];

        // Try pulling songs from the #1 live chart playlist
        const modRes = await fetch(`${API_URL}/api/artists/modules`);
        if (modRes.ok) {
          const modJson = await modRes.json();
          const charts = modJson?.data?.charts || [];
          const topChartId = charts[0]?.id;

          if (topChartId) {
            const plRes = await fetch(`${API_URL}/api/artists/playlists?id=${topChartId}`);
            if (plRes.ok) {
              const plJson = await plRes.json();
              rawSongs = plJson?.data?.songs || [];
            }
          }
        }

        // Fallback to native search if chart playlist returned empty
        if (rawSongs.length === 0) {
          const year = new Date().getFullYear();
          const searchRes = await fetch(
            `${API_URL}/api/search?query=${encodeURIComponent(`trending hindi ${year}`)}`
          );
          if (searchRes.ok) {
            const searchJson = await searchRes.json();
            rawSongs = searchJson?.data?.results || [];
          }
        }

        const initializedTracks = rawSongs.slice(0, 15).map((song) => {
          const fakeBasePlays = Math.floor(Math.random() * 450000) + 50000;
          const img = getValidImage(song.image);
          const audio = getValidAudio(song.downloadUrl || song.audio_url);
          const title = song.name || song.title || "Unknown Track";
          const artist = song.primaryArtists || song.artists?.primary?.map((a) => a.name).join(", ") || "Unknown Artist";

          return {
            id: song.id,
            title,
            name: title,
            artist,
            cover_url: img,
            image: img,
            path: audio,
            audio_url: audio,
            duration: formatDuration(song.duration),
            basePlays: fakeBasePlays,
            currentPlays: fakeBasePlays + Math.floor(Math.random() * 500)
          };
        }).filter((t) => t.path);

        setTrendingList(initializedTracks);
      } catch (err) {
        console.error("Failed to load live trending tracks:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveTrending();
  }, []);

  // 2. Live play-count ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setTrendingList((prevList) => {
        if (prevList.length === 0) return prevList;
        return prevList.map((song) => ({
          ...song,
          currentPlays: song.currentPlays + Math.floor(Math.random() * 15) + 1
        }));
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // 3. 15s re-ranking shuffle animation
  useEffect(() => {
    const reRankInterval = setInterval(() => {
      setIsUpdating(true);

      setTimeout(() => {
        setTrendingList((prevList) => {
          if (prevList.length === 0) return prevList;
          return [...prevList].sort(() => 0.5 - Math.random());
        });
        setIsUpdating(false);
      }, 800);
    }, 15000);

    return () => clearInterval(reRankInterval);
  }, []);

  const formatPlays = (num) => new Intl.NumberFormat("en-US").format(num);

  return (
    <div className="w-full min-h-screen text-white bg-black pb-24">
      <div className="relative w-full h-80 bg-gradient-to-b from-purple-900 to-black p-8 flex items-end pt-20 overflow-hidden">
        <div
          className={`absolute inset-0 bg-pink-600/20 mix-blend-overlay transition-opacity duration-1000 ${
            isUpdating ? "opacity-100" : "opacity-0"
          }`}
        ></div>

        <div className="relative z-10 flex items-end gap-6">
          <div className="w-52 h-52 bg-gradient-to-br from-purple-500 to-pink-600 shadow-2xl shadow-pink-500/20 flex items-center justify-center rounded-lg rotate-3 hover:rotate-0 transition-transform duration-500">
            <Activity className="w-24 h-24 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm font-bold uppercase tracking-widest text-pink-400">Live Global Charts</p>
              {isUpdating && (
                <span className="text-xs bg-red-600 px-2 py-0.5 rounded-full animate-pulse">UPDATING</span>
              )}
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

        {loading ? (
          <p className="text-gray-400 px-4 py-8">Loading live charts...</p>
        ) : (
          trendingList.map((song, idx) => (
            <div
              key={`${song.id || idx}-${song.title}`}
              onClick={() => playPlaylist?.(trendingList, idx)}
              className={`group grid grid-cols-[50px_4fr_3fr_1fr] items-center p-3 rounded-lg hover:bg-white/10 cursor-pointer transition-all duration-500 ${
                isUpdating ? "opacity-50 scale-95" : "opacity-100 scale-100"
              }`}
            >
              <div className="text-gray-400 font-bold text-lg w-6 text-center">
                <span className="group-hover:hidden text-pink-500">{idx + 1}</span>
                <Play className="hidden group-hover:block w-4 h-4 text-white fill-white ml-1" />
              </div>

              <div className="flex items-center gap-4 min-w-0">
                <img
                  src={song.cover_url}
                  alt={song.title}
                  className="w-12 h-12 object-cover rounded shadow-md flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-bold text-white text-md truncate group-hover:text-pink-400 transition-colors">
                    {song.title}
                  </p>
                  <p className="text-sm text-gray-400 truncate">{song.artist}</p>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-2 text-gray-400 text-sm font-mono tracking-wide">
                {formatPlays(song.currentPlays)}
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              </div>

              <div className="text-right text-sm text-gray-400">{song.duration}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Trending;
import React, { useContext, useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { PlayerContext } from "../context/PlayerContext";
import { MoreVertical, ArrowLeft, Clock } from "lucide-react";
import AddToPlaylistModal from "@/components/AddToPlaylistModal";
import { API_URL } from "../config.js";
import { FastAverageColor } from "fast-average-color";

const formatTime = (sec) => {
  if (!sec) return "0:00";
  const minutes = Math.floor(sec / 60);
  const seconds = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
};

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

const AlbumPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id, albumId } = useParams();
  const finalAlbumId = albumId || id;

  const [albumSongs, setAlbumSongs] = useState([]);
  const [albumInfo, setAlbumInfo] = useState({ 
    title: location.state?.title || "Loading...", 
    year: location.state?.year || "", 
    image: location.state?.image || "" 
  });
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
  const [themeColor, setThemeColor] = useState("#121212");

  const { 
    playPlaylist, playPause, isPlaying, currentSongIndex, 
    playlist, duration, setMiniPlayerVisible, isShuffle, toggleShuffle 
  } = useContext(PlayerContext);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    const fetchAlbumDetails = async () => {
      setIsLoading(true);
      try {
        // CORRECTED: Type-Aware API Routing (Playlist vs Album) using YOUR backend
        const isPlaylist = location.state?.type === 'playlist';
        let data = {};

        if (isPlaylist) {
          // It's a Top Chart / Playlist - fetch using your API_URL
          const res = await fetch(`${API_URL}/api/playlists?id=${finalAlbumId}`);
          const json = await res.json();
          data = json.data || {};
        } else {
          // It's a standard Album
          const res = await fetch(`${API_URL}/api/albums/${finalAlbumId}`);
          const json = await res.json();
          data = json.data || {};
        }
        
        setAlbumInfo({
          title: data.name || data.title || location.state?.title || "Playlist",
          year: data.year || data.releaseDate?.substring(0, 4) || location.state?.year || "",
          image: getValidImage(data.image) || location.state?.image
        });

        const songs = data.songs || data.list || [];
        const formattedSongs = songs.map(song => ({
          id: song.id,
          name: song.name?.replace(/&quot;/g, '"'),
          artist: song.artists?.primary?.map(a => a.name).join(', ') || song.primaryArtists || song.singers || "Unknown Artist",
          path: getValidAudio(song.downloadUrl || song.url),
          image: getValidImage(song.image),
          duration: formatTime(song.duration)
        }));

        setAlbumSongs(formattedSongs);
      } catch (err) {
        console.error("Failed to load album tracks:", err);
      } finally {
        setIsLoading(false);
      }
    };
    if (finalAlbumId) {
       fetchAlbumDetails();
    }
  }, [finalAlbumId, location.state]);

  useEffect(() => {
    if (!albumInfo.image) return;
    const fac = new FastAverageColor();
    fac.getColorAsync(albumInfo.image, { algorithm: 'dominant' })
      .then(color => setThemeColor(color.hex))
      .catch(e => console.error(e));
    return () => fac.destroy();
  }, [albumInfo.image]);

  const currentSong = playlist?.[currentSongIndex];
  const isCurrentAlbumPlaying = playlist && playlist.length > 0 && albumSongs.some(s => s.id === currentSong?.id);

  const handlePlayPause = useCallback(() => {
    if (!albumSongs.length) return;
    
    if (isCurrentAlbumPlaying) {
      if (playPause) playPause();
    } else {
      if (playPlaylist) playPlaylist(albumSongs, 0, true);
      if (setMiniPlayerVisible) setMiniPlayerVisible(true);
    }
  }, [albumSongs, isCurrentAlbumPlaying, playPlaylist, playPause, setMiniPlayerVisible]);

  const playPauseRef = useRef(handlePlayPause);
  
  useEffect(() => {
    playPauseRef.current = handlePlayPause;
  }, [handlePlayPause]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      
      if (e.code === "Space" || e.key === " ") {
        if (e.repeat) return;
        e.preventDefault(); 
        e.stopImmediatePropagation(); 
        if (playPauseRef.current) playPauseRef.current();
      }
    };
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, []);

  return (
    <div className="min-h-screen text-white flex flex-col items-center bg-black pb-24 select-none cursor-default">
      <style>{`
        .clear-bg-on-hover:hover { background-color: rgba(255, 255, 255, 0.1); }
        .clear-bg-active { background-color: rgba(255, 255, 255, 0.2); }
      `}</style>

      <div className="w-full h-80 pt-16 relative z-10 shadow-lg transition-all duration-700" style={{ backgroundImage: `linear-gradient(to bottom, ${themeColor}, #121212)` }}>
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 p-2 rounded-full bg-black/50 hover:bg-black/70 z-30 transition-transform hover:scale-110 cursor-pointer">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <div className="flex items-end max-w-5xl mx-auto h-full px-6 pb-8">
          <img src={albumInfo.image} alt={albumInfo.title} className="w-56 h-56 shadow-2xl object-cover rounded-md mr-6 border-4 border-white/10 pointer-events-none" />
          <div>
            <p className="text-sm font-bold uppercase text-white/80">{location.state?.type === 'playlist' ? 'Playlist' : 'Album'}</p>
            <h1 className="text-6xl font-black mb-2 drop-shadow-lg truncate max-w-2xl">{albumInfo.title}</h1>
            <p className="text-sm text-gray-300">
              {albumInfo.year ? `${albumInfo.year} • ` : ""}
              {albumSongs.length} {albumSongs.length === 1 ? 'song' : 'songs'}
            </p>
          </div>
        </div>
      </div>

      <div className="w-full min-h-screen pt-8 px-6 bg-gradient-to-b from-[#121212] via-black to-black">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center mb-6">
            <button onClick={handlePlayPause} className="w-16 h-16 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black flex items-center justify-center shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
              {isPlaying && isCurrentAlbumPlaying ? (
                <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
              ) : (
                <svg className="w-8 h-8 fill-current pl-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              )}
            </button>
            <button onClick={toggleShuffle} className={`ml-4 font-semibold hover:text-white transition cursor-pointer tracking-widest ${isShuffle ? "text-[#1db954]" : "text-gray-400"}`}>
              SHUFFLE
            </button>
          </div>

          <div className="grid grid-cols-[16px_48px_1fr_90px] gap-4 py-2 border-b border-gray-700/50 text-gray-400 text-xs uppercase font-semibold mb-2 pointer-events-none">
            <div>#</div><div></div><div>Title</div><div className="text-right"><Clock className="w-4 h-4 ml-auto" /></div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-[#1db954] border-t-transparent rounded-full animate-spin"></div></div>
          ) : (
            albumSongs.map((song, idx) => {
              const isCurrentSong = currentSong?.id === song.id || currentSong?.name === song.name;
              return (
                <div key={idx} onClick={() => { playPlaylist(albumSongs, idx, true); if (setMiniPlayerVisible) setMiniPlayerVisible(true); }} className={`group grid grid-cols-[16px_48px_1fr_90px] items-center gap-4 px-2 py-2 rounded-md cursor-pointer transition duration-200 clear-bg-on-hover ${isCurrentSong ? "clear-bg-active text-white" : "text-gray-400"}`}>
                  
                  <div className="font-medium text-sm text-center flex justify-center items-center">
                    {isCurrentSong && isPlaying ? (
                      <img 
                        src="https://ik.imagekit.io/vibecast/images/equaliser-animated-green.f93a2ef4.gif" 
                        alt="Playing" 
                        className="w-4 h-4" 
                      />
                    ) : (
                      <span className="group-hover:hidden">{idx + 1}</span>
                    )}
                    {!(isCurrentSong && isPlaying) && (
                      <svg className="w-4 h-4 hidden group-hover:block text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    )}
                  </div>
                  
                  <img src={song.image} alt={song.name} className="w-12 h-12 object-cover rounded shadow-md pointer-events-none" />
                  
                  <div className="flex flex-col truncate">
                    <span className={`text-base font-semibold truncate ${isCurrentSong ? 'text-[#1db954]' : 'text-white'}`}>{song.name}</span>
                    <span className="text-sm font-light text-gray-400">{song.artist}</span>
                  </div>
                  
                  <div className="flex justify-end items-center gap-3 text-sm text-gray-400">
                    <span>{isCurrentSong ? formatTime(duration) : song.duration}</span>
                    <button onClick={(e) => { e.stopPropagation(); setSelectedSong(song); setIsModalOpen(true); }} className="hidden group-hover:block cursor-pointer hover:text-white">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>

                </div>
              );
            })
          )}
        </div>
      </div>

      <AddToPlaylistModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} track={selectedSong} />
    </div>
  );
};

export default AlbumPage;
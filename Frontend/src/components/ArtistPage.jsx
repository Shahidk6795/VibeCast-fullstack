import React, { useContext, useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, useLocation, useSearchParams } from "react-router-dom";
import { PlayerContext } from "../context/PlayerContext";
import { MoreVertical, Disc } from "lucide-react";
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
  if (!imageObj) return 'https://ik.imagekit.io/VibeCast/images/default-artist.jpg';
  if (typeof imageObj === 'string') {
    if (imageObj === "[object Object]") return 'https://ik.imagekit.io/VibeCast/images/default-artist.jpg';
    return imageObj;
  }
  if (Array.isArray(imageObj)) return imageObj[imageObj.length - 1]?.url || imageObj[imageObj.length - 1]?.link || imageObj[0]?.url;
  return imageObj.url || imageObj.link || 'https://ik.imagekit.io/VibeCast/images/default-artist.jpg';
};

const getValidAudio = (audioObj) => {
  if (!audioObj) return '';
  if (typeof audioObj === 'string') return audioObj;
  if (Array.isArray(audioObj)) return audioObj[audioObj.length - 1]?.url || audioObj[audioObj.length - 1]?.link || audioObj[0]?.url;
  return audioObj.url || audioObj.link || '';
};

const ArtistPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { artistName } = useParams();
  const decodedArtistName = decodeURIComponent(artistName);

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "songs";

  const [dbArtistData, setDbArtistData] = useState(null);
  
  const [displaySongs, setDisplaySongs] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingSongs, setIsLoadingSongs] = useState(true);
  const [isLoadingMoreSongs, setIsLoadingMoreSongs] = useState(false);
  
  const [artistAlbums, setArtistAlbums] = useState([]);
  const [albumPage, setAlbumPage] = useState(1);
  const [hasMoreAlbums, setHasMoreAlbums] = useState(true);
  const [isLoadingAlbums, setIsLoadingAlbums] = useState(false);
  const [isLoadingMoreAlbums, setIsLoadingMoreAlbums] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
  
  const [themeDetails, setThemeDetails] = useState({ themeFrom: "#121212", themeAccent: "#1db954", genre: "Top Hits & Trending Melodies." });

  const { playPlaylist, playPause, isPlaying, currentSongIndex, playlist, duration, setMiniPlayerVisible, isShuffle, toggleShuffle } = useContext(PlayerContext);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    const fetchArtistDetails = async () => {
      try {
        const res = await fetch(`${API_URL}/api/artists/search?query=${encodeURIComponent(decodedArtistName)}`);
        if (res.ok) {
          const data = await res.json();
          const artistObj = data.data?.results?.[0];
          if (artistObj) {
            setDbArtistData({
              image_url: getValidImage(artistObj.image),
              quote: "Discover the top hits and latest drops. 🎵"
            });
            if (artistObj.role || artistObj.description) {
              setThemeDetails(prev => ({ ...prev, genre: artistObj.role || artistObj.description }));
            }
          }
        }
      } catch (error) { console.error("Failed to fetch live artist details:", error); }
    };
    fetchArtistDetails();
  }, [decodedArtistName]);

  let passedImage = location.state?.image;
  if (typeof passedImage === 'object') passedImage = getValidImage(passedImage);
  
  const finalImage = passedImage && passedImage !== "[object Object]" 
    ? passedImage 
    : (dbArtistData?.image_url || "https://ik.imagekit.io/VibeCast/images/default-artist.jpg");

  useEffect(() => {
    if (!finalImage || finalImage.includes('placehold') || finalImage.includes('default')) return;
    const fac = new FastAverageColor();
    fac.getColorAsync(finalImage, { algorithm: 'dominant' })
      .then(color => setThemeDetails(prev => ({ ...prev, themeFrom: color.hex, themeAccent: color.isLight ? '#121212' : color.hex })))
      .catch(e => console.error(e));
    return () => fac.destroy();
  }, [finalImage]);

  useEffect(() => {
    const fetchDynamicTracks = async () => {
      if (page === 1) setIsLoadingSongs(true);
      else setIsLoadingMoreSongs(true);
      try {
        const res = await fetch(`${API_URL}/api/artists/catalog?name=${encodeURIComponent(decodedArtistName)}&page=${page}`);
        if (res.ok) {
          const apiResponse = await res.json();
          const songs = apiResponse.data?.songs || apiResponse.data?.results || apiResponse.data || [];
          
          if (songs.length === 0) setHasMore(false); 
          
          const uniqueSongs = [];
          const seenNames = new Set();
          
          for (const song of songs) {
            const rawName = (song.name || "").replace(/&quot;/g, '"');
            const lowerName = rawName.toLowerCase();
            const baseName = lowerName.split(' (')[0].trim();
            
            const isSpecialVersion = lowerName.includes('remix') || lowerName.includes('reprise') || lowerName.includes('unplugged') || lowerName.includes('acoustic') || lowerName.includes('lofi') || lowerName.includes('mashup');
            const dedupeKey = isSpecialVersion ? lowerName : baseName;

            const singerStr = (song.artists?.primary?.map(a => a.name).join(', ') || song.primaryArtists || song.singers || "").toLowerCase();
            
            const isFake = lowerName.includes("karaoke") || lowerName.includes("tribute") || lowerName.includes("cover");
            const isAuthentic = singerStr === "" || singerStr.includes(decodedArtistName.toLowerCase());

            if (!seenNames.has(dedupeKey) && !isFake && isAuthentic) {
              seenNames.add(dedupeKey);
              uniqueSongs.push({
                id: song.id,
                name: rawName, 
                artist: song.artists?.primary?.map(a => a.name).join(', ') || decodedArtistName,
                path: getValidAudio(song.downloadUrl || song.url),
                image: getValidImage(song.image),
                duration: formatTime(song.duration)
              });
            }
          }

          setDisplaySongs(prev => {
            if (page === 1) return uniqueSongs;
            const existingNames = new Set(prev.map(s => s.name.toLowerCase()));
            const newSongs = uniqueSongs.filter(s => !existingNames.has(s.name.toLowerCase()));
            return [...prev, ...newSongs];
          });
        }
      } catch (error) { console.error("Failed to fetch JioSaavn tracks:", error); } 
      finally { setIsLoadingSongs(false); setIsLoadingMoreSongs(false); }
    };
    fetchDynamicTracks();
  }, [decodedArtistName, page]);

  // SMART ALBUM FETCHER
  useEffect(() => {
    if (activeTab === "albums") {
      const fetchAlbums = async () => {
        if (albumPage === 1 && artistAlbums.length === 0) setIsLoadingAlbums(true);
        else if (albumPage > 1) setIsLoadingMoreAlbums(true);
        else return;

        try {
          const res = await fetch(`${API_URL}/api/artists/albums?name=${encodeURIComponent(decodedArtistName)}&page=${albumPage}`);
          if (res.ok) {
            const data = await res.json();
            const rawAlbums = data.data?.albums || data.data?.results || data.data || [];
            
            if (rawAlbums.length === 0) setHasMoreAlbums(false);

            const uniqueAlbums = [];
            const seenAlbumNames = new Set();

            for (const album of rawAlbums) {
              const albumName = (album.name || album.title || "").trim();
              const cleanAlbumName = albumName.toLowerCase();
              
              // FIX: A much safer authenticity check. Some endpoints put artists in subtitle or description.
              const artistStr = (album.artists?.primary?.map(a => a.name).join(', ') || album.primaryArtists || album.subtitle || album.description || "").toLowerCase();
              
              // Only filter if we actually received a valid string, to prevent false positives blocking real albums
              const isAuthentic = artistStr === "" || artistStr.includes(decodedArtistName.toLowerCase()) || decodedArtistName.toLowerCase().includes(artistStr.split(',')[0]);

              if (!seenAlbumNames.has(cleanAlbumName) && isAuthentic) {
                seenAlbumNames.add(cleanAlbumName);
                uniqueAlbums.push({
                  id: album.id,
                  title: albumName,
                  year: album.year || album.releaseDate?.substring(0, 4) || "",
                  image: getValidImage(album.image)
                });
              }
            }

            setArtistAlbums(prev => {
              if (albumPage === 1) return uniqueAlbums;
              const existingIds = new Set(prev.map(a => a.id));
              const newAlbums = uniqueAlbums.filter(a => !existingIds.has(a.id));
              return [...prev, ...newAlbums];
            });
          }
        } catch (err) { console.error("Failed to load albums", err); } 
        finally { setIsLoadingAlbums(false); setIsLoadingMoreAlbums(false); }
      };
      fetchAlbums();
    }
  }, [activeTab, decodedArtistName, albumPage, artistAlbums.length]);

  const handlePlayPause = useCallback(() => {
    if (!displaySongs.length) return;
    const isCurrentArtistPlaying = playlist && playlist.length > 0 && playlist.some(song => song.artist === decodedArtistName);
    if (!isCurrentArtistPlaying) playPlaylist(displaySongs, 0);
    else playPause();
    if (setMiniPlayerVisible) setMiniPlayerVisible(true);
  }, [displaySongs, playlist, decodedArtistName, playPlaylist, playPause, setMiniPlayerVisible]);

  const selectSong = useCallback((index) => {
    playPlaylist(displaySongs, index, true);
    if (setMiniPlayerVisible) setMiniPlayerVisible(true);
  }, [displaySongs, playPlaylist, setMiniPlayerVisible]);

  return (
    <div className="min-h-screen text-white flex flex-col items-center overflow-hidden bg-black select-none cursor-default transition-colors duration-700 pb-24" style={{ "--theme-from": themeDetails.themeFrom, "--theme-accent": themeDetails.themeAccent }}>
      <style>{`
        .artist-header { background-image: linear-gradient(to bottom, var(--theme-from), #121212); }
        .clear-bg-on-hover:hover { background-color: rgba(255, 255, 255, 0.1); }
        .clear-bg-active { background-color: rgba(255, 255, 255, 0.2); }
        .clear-bg-strip { background-color: rgba(18, 18, 18, 0.1); }
      `}</style>

      <div className="w-full h-80 pt-16 relative artist-header z-10 shadow-lg transition-all duration-700">
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 p-2 rounded-full bg-black/50 hover:bg-black/70 z-30 transition-transform hover:scale-110 cursor-pointer">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        <div className="flex items-end max-w-5xl mx-auto h-full px-6 pb-8">
          <img src={finalImage} alt={decodedArtistName} crossOrigin="anonymous" className="w-56 h-56 shadow-[0_20px_50px_rgba(0,0,0,0.5)] object-cover rounded-full mr-6 border-4 border-white/10 pointer-events-none" />
          <div>
            <p className="text-sm font-bold uppercase text-white/80 flex items-center gap-1">
              <span className="bg-[#1db954] text-black px-2 py-0.5 rounded text-[10px] font-extrabold">VERIFIED</span> Artist
            </p>
            <h1 className="text-7xl font-black mb-1 drop-shadow-lg capitalize">{decodedArtistName}</h1>
            <p className="text-sm font-normal text-white/60 mt-1">{themeDetails.genre}</p>
          </div>
        </div>
      </div>

      <div className="w-full min-h-screen relative z-10 pt-8 px-6 pb-24 bg-gradient-to-b from-[#121212] via-black to-black">
        <div className="max-w-5xl mx-auto relative z-20">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-gray-800 pb-4">
            <div className="flex items-center">
              <button onClick={handlePlayPause} className="w-16 h-16 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black flex items-center justify-center shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
                {isPlaying && playlist.length > 0 && playlist.some(song => song.artist === decodedArtistName) ? (
                  <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                ) : (
                  <svg className="w-8 h-8 fill-current pl-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                )}
              </button>
              <button onClick={toggleShuffle} className={`ml-4 font-semibold hover:text-white transition cursor-pointer tracking-widest ${isShuffle ? "text-[#1db954]" : "text-gray-400"}`}>
                SHUFFLE
              </button>
            </div>
            <div className="flex gap-6">
              <button onClick={() => setSearchParams({ tab: "songs" }, { state: location.state, replace: true })} className={`font-bold text-base transition-colors pb-1 border-b-2 ${activeTab === "songs" ? "text-white border-[#1db954]" : "text-gray-400 border-transparent hover:text-white"}`}>
                Popular Songs
              </button>
              <button onClick={() => setSearchParams({ tab: "albums" }, { state: location.state, replace: true })} className={`font-bold text-base transition-colors pb-1 border-b-2 ${activeTab === "albums" ? "text-white border-[#1db954]" : "text-gray-400 border-transparent hover:text-white"}`}>
                Albums & EPs
              </button>
            </div>
          </div>

          {activeTab === "songs" && (
            <>
              <div className="grid grid-cols-[16px_48px_1fr_90px] gap-4 py-2 border-b border-gray-700/50 text-gray-400 text-xs uppercase font-semibold mb-2 clear-bg-strip pointer-events-none">
                <div>#</div><div></div><div>Title</div><div className="text-right">Time</div>
              </div>
              {isLoadingSongs ? (
                <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-[#1db954] border-t-transparent rounded-full animate-spin"></div></div>
              ) : (
                displaySongs.map((song, idx) => {
                  const isCurrentSong = playlist.length > 0 && playlist[currentSongIndex]?.name === song.name;
                  return (
                    <div key={idx} onClick={() => selectSong(idx)} className={`group grid grid-cols-[16px_48px_1fr_90px] items-center gap-4 px-2 py-2 rounded-md cursor-default transition duration-200 clear-bg-on-hover ${isCurrentSong ? "clear-bg-active text-white" : "text-gray-400"}`}>
                      <div className="font-medium text-sm text-center">
                        {isCurrentSong && isPlaying ? <span className="text-[#1db954] animate-pulse"><svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 24 24"><path d="M7 19v-14h3v14h-3zm8 0V5h3v14h-3z" /></svg></span> : <span className="group-hover:hidden">{idx + 1}</span>}
                        <svg className="w-4 h-4 hidden group-hover:block text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      </div>
                      <img src={song.image} alt={song.name} className="w-12 h-12 object-cover rounded shadow-md pointer-events-none" />
                      <div className="flex flex-col truncate">
                        <span className={`text-base font-semibold truncate ${isCurrentSong ? 'text-[#1db954]' : 'text-white'}`}>{song.name}</span>
                        <span className="text-sm font-light text-gray-400 group-hover:text-gray-300">{song.artist}</span>
                      </div>
                      <div className="flex justify-end items-center gap-3 text-sm text-gray-400">
                        <span>{isCurrentSong ? formatTime(duration) : song.duration}</span>
                        <button onClick={(e) => { e.stopPropagation(); setSelectedSong(song); setIsModalOpen(true); }} className="hidden group-hover:block cursor-pointer hover:text-white"><MoreVertical className="w-5 h-5" /></button>
                      </div>
                    </div>
                  );
                })
              )}
              {hasMore && displaySongs.length > 0 && (
                <div className="flex justify-center mt-8 mb-12">
                  <button onClick={() => setPage(p => p + 1)} disabled={isLoadingMoreSongs} className="px-8 py-3 rounded-full font-bold text-white border border-gray-500 hover:border-white flex items-center gap-2 transition-all">
                    {isLoadingMoreSongs ? "Loading..." : "Load More Songs"}
                  </button>
                </div>
              )}
            </>
          )}

          {activeTab === "albums" && (
            <>
              {isLoadingAlbums ? (
                <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-[#1db954] border-t-transparent rounded-full animate-spin"></div></div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                  {artistAlbums.map((album) => (
                    <div key={album.id} onClick={() => navigate(`/album/${album.id}`, { state: { image: album.image, title: album.title, year: album.year } })} className="group bg-[#181818] hover:bg-[#282828] p-4 rounded-xl transition duration-300 flex flex-col gap-3 cursor-pointer">
                      <div className="relative aspect-square rounded-md overflow-hidden shadow-lg">
                        <img src={album.image} alt={album.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500 pointer-events-none" />
                      </div>
                      <div className="flex flex-col">
                        <h4 className="font-bold text-white text-base truncate group-hover:text-[#1db954]">{album.title}</h4>
                        <p className="text-xs text-gray-400 mt-0.5">{album.year} • Album</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {hasMoreAlbums && artistAlbums.length > 0 && (
                <div className="flex justify-center mt-8 mb-12">
                  <button onClick={() => setAlbumPage(p => p + 1)} disabled={isLoadingMoreAlbums} className="px-8 py-3 rounded-full font-bold text-white border border-gray-500 hover:border-white flex items-center gap-2 transition-all">
                    {isLoadingMoreAlbums ? "Loading..." : "Load More Albums"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <AddToPlaylistModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} track={selectedSong} />
    </div>
  );
};

export default ArtistPage;
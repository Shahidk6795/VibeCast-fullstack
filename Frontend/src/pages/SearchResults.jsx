import React, { useState, useEffect, useContext, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PlayerContext } from "../context/PlayerContext";
import AddToPlaylistModal from "@/components/AddToPlaylistModal";
import { MoreVertical, Clock, Play } from "lucide-react";
import { API_URL } from "../config.js";

const formatTime = (sec) => {
  if (!sec) return "0:00";
  const minutes = Math.floor(sec / 60);
  const seconds = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const getAlbumImage = (img) => {
  if (!img) return "https://placehold.co/200x200/181818/ec4899?text=Album";
  if (typeof img === "string") return img;
  if (Array.isArray(img)) {
    const highRes = img.find((item) => item.quality === "500x500" || item.url?.includes("500x500"));
    return highRes?.url || highRes?.link || img[img.length - 1]?.url || img[img.length - 1]?.link || "";
  }
  return img.url || img.link || "";
};

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getQuery = useCallback(() => new URLSearchParams(location.search).get("query") || "", [location.search]);

  const [searchTerm, setSearchTerm] = useState(getQuery());
  const [filteredArtists, setFilteredArtists] = useState([]);
  const [filteredAlbums, setFilteredAlbums] = useState([]);
  const [filteredTracks, setFilteredTracks] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);

  const {
    playPlaylist,
    isPlaying,
    playlist,
    currentSongIndex,
    duration,
    setMiniPlayerVisible
  } = useContext(PlayerContext);

  useEffect(() => {
    setSearchTerm(getQuery());
  }, [location.search, getQuery]);

  useEffect(() => {
    const q = searchTerm.trim();

    if (q.length < 3) {
      setFilteredTracks([]);
      setFilteredAlbums([]);
      setFilteredArtists([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/api/search?query=${encodeURIComponent(q)}`);

        if (res.ok) {
          const apiResponse = await res.json();
          const songs = apiResponse.data?.results || [];
          const albums = apiResponse.data?.albums || [];

          const uniqueSongs = [];
          const seenNames = new Set();

          for (const song of songs) {
            const cleanName = song.name.split(" (")[0].trim().toLowerCase();

            if (!seenNames.has(cleanName)) {
              seenNames.add(cleanName);

              const coverUrl = song.image ? song.image[song.image.length - 1]?.url : "";

              uniqueSongs.push({
                id: song.id,
                title: song.name.replace(/&quot;/g, '"'),
                artist: song.artists?.primary?.map((a) => a.name).join(", ") || "Unknown Artist",
                album: song.album || null,
                audio_url: song.downloadUrl ? song.downloadUrl[song.downloadUrl.length - 1]?.url : "",
                cover_url: coverUrl,
                duration: formatTime(song.duration)
              });
            }
          }

          const uniqueAlbums = [];
          const seenAlbumIds = new Set();
          for (const alb of albums) {
            if (alb?.id && !seenAlbumIds.has(alb.id)) {
              seenAlbumIds.add(alb.id);
              uniqueAlbums.push({
                id: alb.id,
                name: (alb.name || alb.title || "Unknown Album").replace(/&quot;/g, '"'),
                year: alb.year || "",
                primaryArtists: alb.primaryArtists || "Various Artists",
                image: getAlbumImage(alb.image)
              });
            }
          }

          setFilteredTracks(uniqueSongs);
          setFilteredAlbums(uniqueAlbums);
          setFilteredArtists([]);
        }
      } catch (err) {
        console.error("Failed to fetch from VibeCast API:", err);
      } finally {
        setIsSearching(false);
      }
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const formattedSongs = useMemo(() => {
    return filteredTracks.map((track) => ({
      name: track.title,
      artist: track.artist,
      album: track.album,
      path: track.audio_url,
      image: track.cover_url,
      id: track.id,
      duration: track.duration || "--:--"
    }));
  }, [filteredTracks]);

  const selectSong = useCallback((index) => {
    playPlaylist(formattedSongs, index, true);
    if (setMiniPlayerVisible) setMiniPlayerVisible(true);
  }, [formattedSongs, playPlaylist, setMiniPlayerVisible]);

  return (
    <div className="min-h-screen relative overflow-x-hidden text-white flex flex-col items-center px-6 py-10 bg-gradient-to-br from-black via-[#120016] to-black animate-gradient-slow pb-32 cursor-default select-none">
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[#1a001f] via-[#2b004f] to-[#0a0a0a] opacity-70 blur-3xl animate-[gradientShift_15s_ease_infinite]" />

      <h1 className="text-3xl sm:text-4xl font-extrabold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-purple-400 to-violet-500 drop-shadow-lg">
        Explore VibeCast
      </h1>

      <div className="w-full max-w-md mb-10 relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search for songs or albums (min 3 letters)..."
          className="w-full px-5 py-3 rounded-full bg-black/50 border border-pink-500/20 text-white placeholder-gray-400 text-center shadow-inner focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
        />
        {isSearching && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {filteredArtists.length === 0 && filteredAlbums.length === 0 && filteredTracks.length === 0 && !isSearching ? (
        <p className="text-gray-400 text-lg mt-20 animate-pulse">
          {searchTerm.length >= 3 ? "No results found 😔" : "Type at least 3 letters to search 🎧"}
        </p>
      ) : (
        <div className="w-full max-w-5xl flex flex-col gap-12">

          {filteredArtists.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-6 text-white border-b border-pink-500/20 pb-2">Artists</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {filteredArtists.map((artist, idx) => (
                  <div
                    key={artist.id || idx}
                    onClick={() => navigate(`/artist/${encodeURIComponent(artist.name)}`, { state: { image: artist.image_url } })}
                    className="group relative bg-black/60 border border-pink-500/20 rounded-2xl p-5 flex flex-col items-center backdrop-blur-xl hover:border-pink-500/40 hover:shadow-[0_0_25px_rgba(236,72,153,0.6)] hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                  >
                    <img
                      src={artist.image_url}
                      alt={artist.name}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "https://placehold.co/150x150/181818/ec4899?text=Artist";
                      }}
                      className="w-28 h-28 object-cover rounded-full mb-3 shadow-[0_0_20px_rgba(236,72,153,0.3)] group-hover:shadow-[0_0_40px_rgba(236,72,153,0.6)] transition-all duration-500 pointer-events-none"
                    />
                    <p className="font-semibold text-center text-white mt-2 group-hover:text-pink-400 transition-colors truncate w-full">
                      {artist.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Artist</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {filteredAlbums.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-6 text-white border-b border-pink-500/20 pb-2">Albums</h2>
              <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide snap-x">
                {filteredAlbums.map((alb) => (
                  <div
                    key={alb.id}
                    onClick={() =>
                      navigate(`/album/${alb.id}`, {
                        state: { type: "album", image: alb.image, title: alb.name, year: alb.year }
                      })
                    }
                    className="snap-start flex-shrink-0 w-36 sm:w-44 group bg-black/60 border border-pink-500/20 rounded-2xl p-3 flex flex-col backdrop-blur-xl hover:border-pink-500/40 hover:shadow-[0_0_20px_rgba(236,72,153,0.4)] hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                  >
                    <img
                      src={alb.image}
                      alt={alb.name}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "https://placehold.co/200x200/181818/ec4899?text=Album";
                      }}
                      className="w-full aspect-square object-cover rounded-xl mb-3 shadow-md pointer-events-none"
                    />
                    <p className="font-semibold text-white text-sm truncate group-hover:text-pink-400 transition-colors">
                      {alb.name}
                    </p>
                    <p className="text-xs text-gray-400 truncate mt-1">{alb.primaryArtists}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {filteredTracks.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-6 text-white border-b border-pink-500/20 pb-2">Songs</h2>

              <div className="grid grid-cols-[16px_48px_1fr_60px_40px] gap-4 py-2 px-2 border-b border-pink-500/20 text-gray-400 text-xs uppercase font-semibold mb-2 pointer-events-none">
                <div className="text-center">#</div>
                <div></div>
                <div>Title</div>
                <div className="text-right"><Clock className="w-4 h-4 ml-auto" /></div>
                <div></div>
              </div>

              <div className="flex flex-col gap-1">
                {formattedSongs.map((song, index) => {
                  const isCurrentSong = playlist.length && playlist[currentSongIndex]?.name === song.name;

                  return (
                    <div
                      key={song.id || index}
                      onClick={() => selectSong(index)}
                      className={`group grid grid-cols-[16px_48px_1fr_60px_40px] items-center gap-4 px-2 py-2 rounded-md cursor-pointer transition duration-200 hover:bg-white/10 ${isCurrentSong ? "bg-pink-500/10 text-white" : "text-gray-400"}`}
                    >
                      <div className="text-center font-medium text-sm">
                        {isCurrentSong && isPlaying ? (
                          <span className="text-pink-500 animate-pulse">
                            <svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 24 24"><path d="M7 19v-14h3v14h-3zm8 0V5h3v14h-3z" /></svg>
                          </span>
                        ) : (
                          <>
                            <span className="group-hover:hidden">{index + 1}</span>
                            <Play className="w-4 h-4 hidden group-hover:block text-white mx-auto fill-current" />
                          </>
                        )}
                      </div>

                      <img
                        src={song.image}
                        alt={song.name}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "https://placehold.co/100x100/181818/ec4899?text=Song";
                        }}
                        className="w-12 h-12 object-cover rounded shadow-md pointer-events-none"
                      />

                      <div className="flex flex-col truncate">
                        <span className={`text-base font-semibold truncate ${isCurrentSong ? "text-pink-400" : "text-white group-hover:text-pink-200"}`}>
                          {song.name}
                        </span>
                        <div className="flex items-center gap-2 text-sm font-light text-gray-400 group-hover:text-gray-300 truncate">
                          <span className="truncate">{song.artist}</span>
                          {song.album?.id && song.album?.name && (
                            <>
                              <span className="text-gray-600">•</span>
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/album/${song.album.id}`, {
                                    state: {
                                      type: "album",
                                      image: song.image || "",
                                      title: song.album.name
                                    }
                                  });
                                }}
                                className="text-xs text-gray-400 hover:text-pink-400 hover:underline cursor-pointer truncate"
                              >
                                {song.album.name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="text-right text-sm text-gray-400 font-mono">
                        {isCurrentSong ? formatTime(duration) : song.duration}
                      </div>

                      <div className="text-center flex justify-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSong(song);
                            setIsModalOpen(true);
                          }}
                          className="hidden group-hover:block cursor-pointer text-gray-400 hover:text-white p-2 transition-all"
                          title="Add to Playlist"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

        </div>
      )}

      <AddToPlaylistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        track={selectedSong}
      />
    </div>
  );
};

export default SearchResults;
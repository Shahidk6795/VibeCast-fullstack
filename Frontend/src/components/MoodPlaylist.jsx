import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PlayerContext } from '../context/PlayerContext';
import AddToPlaylistModal from '@/components/AddToPlaylistModal';
import { useUser } from "@clerk/clerk-react";
import { Dumbbell, Coffee, Heart, Clock, Play, Pause, ArrowLeft, MoreVertical } from 'lucide-react';

const formatTime = (sec) => {
  if (!sec) return "0:00";
  const minutes = Math.floor(sec / 60);
  const seconds = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const MoodPlaylist = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  
  const { 
    playPlaylist, 
    isPlaying, 
    playPause, 
    playlist, 
    currentSongIndex, 
    duration, 
    isShuffle,    
    toggleShuffle  
  } = useContext(PlayerContext);

  const [moodTracks, setMoodTracks] = useState([]);
  const [likedSongs, setLikedSongs] = useState([]);
  const [totalPlaylistDuration, setTotalPlaylistDuration] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);

  const baseMoodConfig = {
    workout: {
      title: "Iron Paradise",
      desc: "Pure Adrenaline. Push your limits.",
      icon: Dumbbell,
      color: "from-red-900 to-black",
      textColor: "text-red-500",
      accent: "bg-red-600"
    },
    relax: {
      title: "Zen Mode",
      desc: "Lo-Fi & Chill. Clear your mind.",
      icon: Coffee,
      color: "from-slate-800 to-black",
      textColor: "text-emerald-400",
      accent: "bg-emerald-600"
    },
    romantic: {
      title: "Late Night",
      desc: "Slow & Deep. For the feels.",
      icon: Heart,
      color: "from-rose-900 to-black",
      textColor: "text-rose-500",
      accent: "bg-rose-600"
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchTracks = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/moods/${id}/tracks`);
        if (res.ok) {
          const data = await res.json();
          setMoodTracks(data);
        }
      } catch (err) {
        console.error("Failed to fetch mood tracks:", err);
      }
    };

    fetchTracks();
  }, [id]);

  useEffect(() => {
    if (!moodTracks || moodTracks.length === 0) {
      setTotalPlaylistDuration("");
      return;
    }

    let totalSecs = 0;
    
    moodTracks.forEach(track => {
      if (track.duration && track.duration !== "--:--") {
        const parts = track.duration.split(':');
        if (parts.length === 2) {
          totalSecs += parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
        } else if (parts.length === 3) {
          totalSecs += parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
        }
      }
    });

    if (totalSecs > 0) {
      const hours = Math.floor(totalSecs / 3600);
      const minutes = Math.floor((totalSecs % 3600) / 60);
      setTotalPlaylistDuration(hours > 0 ? `${hours} hr ${minutes} min` : `${minutes} min`);
    } else {
      setTotalPlaylistDuration("");
    }
  }, [moodTracks]);

  const fetchLikedSongs = async () => {
    if (!email) return;
    try {
      const res = await fetch(`http://localhost:5000/api/likes/${email}`);
      if (res.ok) {
        const data = await res.json();
        setLikedSongs(data);
      }
    } catch (e) {
      console.error("Failed to fetch liked songs", e);
    }
  };

  useEffect(() => {
    fetchLikedSongs();
    window.addEventListener('vibecast_likes_updated', fetchLikedSongs);
    return () => window.removeEventListener('vibecast_likes_updated', fetchLikedSongs);
  }, [email]);

  const toggleLike = async (e, song) => {
    e.stopPropagation();
    if (!email) return alert("Please log in to like songs");

    const isLiked = likedSongs.some(liked => liked.path === song.audio_url);
    const method = isLiked ? 'DELETE' : 'POST';

    try {
      const response = await fetch('http://localhost:5000/api/likes', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, audio_url: song.audio_url }),
      });

      if (response.ok) {
        fetchLikedSongs();
        window.dispatchEvent(new Event('vibecast_likes_updated'));
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const currentMood = baseMoodConfig[id] ? { ...baseMoodConfig[id], data: moodTracks } : null;
  
  const isThisPlaylistActive = playlist?.length > 0 && currentMood?.data?.length > 0 && playlist[0]?.path === currentMood.data[0]?.audio_url;
  const coverImage = currentMood?.data?.length > 0 ? currentMood.data[0].cover_url : null;

  const handlePlayPause = () => {
    if (!currentMood || currentMood.data.length === 0) return;

    const formattedTracks = currentMood.data.map(track => ({
        name: track.title,
        artist: track.artist,
        path: track.audio_url,
        image: track.cover_url,
        id: track.id
    }));

    if (isThisPlaylistActive) {
      playPause();
    } else {
      playPlaylist(formattedTracks, 0);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === "Space" && document.activeElement.tagName !== "INPUT") {
        event.preventDefault();
        event.stopImmediatePropagation();
        handlePlayPause();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isThisPlaylistActive, currentMood, playPlaylist, playPause]); 

  if (!currentMood) return <div className="text-white p-10 pt-24">Playlist not found</div>;

  return (
    <div className="min-h-screen bg-black text-white pb-32 font-sans select-none cursor-default">
        
        <div className={`relative h-96 flex flex-col justify-end p-8 bg-gradient-to-b ${currentMood.color}`}>
            <button 
                onClick={() => navigate(-1)}
                className="absolute top-6 left-6 p-3 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full transition-all duration-300 z-20 group"
            >
                <ArrowLeft className="w-6 h-6 text-white group-hover:-translate-x-1 transition-transform" />
            </button>

            <div className="flex flex-col md:flex-row items-end gap-8 z-10">
                <div className="w-48 h-48 shrink-0 bg-black/30 backdrop-blur-md rounded-lg flex items-center justify-center shadow-2xl border border-white/10 overflow-hidden">
                    {coverImage ? (
                        <img src={coverImage} alt={currentMood.title} className="w-full h-full object-cover" />
                    ) : (
                        <currentMood.icon className={`w-20 h-20 ${currentMood.textColor}`} />
                    )}
                </div>

                <div className="mb-2">
                    <p className="uppercase text-xs font-bold tracking-widest text-white/70 mb-2">Mood Playlist</p>
                    <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-4 drop-shadow-xl">{currentMood.title}</h1>
                    <p className="text-gray-300 text-lg font-medium flex items-center flex-wrap gap-2">
                        {currentMood.desc} 
                        <span className="hidden md:inline">•</span> 
                        <span className="font-bold text-white">{currentMood.data.length} Songs</span>
                        {totalPlaylistDuration && (
                            <span className="text-gray-400">, {totalPlaylistDuration}</span>
                        )}
                    </p>
                </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
        </div>

        <div className="px-8 py-6 bg-black flex items-center gap-6">
             <button 
                onClick={(e) => {
                    e.currentTarget.blur();
                    handlePlayPause();
                }}
                className={`w-14 h-14 ${currentMood.accent} rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-black/50 text-black`}
             >
                {isThisPlaylistActive && isPlaying ? (
                    <Pause className="w-7 h-7 fill-current" />
                ) : (
                    <Play className="w-7 h-7 fill-current ml-1" />
                )}
             </button>

             <button 
                onClick={toggleShuffle} 
                className={`ml-4 font-bold text-sm hover:text-white transition cursor-pointer tracking-[0.2em] ${isShuffle ? currentMood.textColor : "text-gray-400"}`}
            >
                SHUFFLE
            </button>
        </div>

        <div className="px-4 md:px-8">
            <div className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_1fr_auto] gap-4 px-4 py-2 text-gray-400 border-b border-white/10 text-sm uppercase font-bold sticky top-0 bg-black z-20">
                <span className="w-6 text-center">#</span>
                <span>Title</span>
                <span className="hidden md:block">Artist</span>
                <div className="flex justify-end"><Clock className="w-4 h-4" /></div>
            </div>

            <div className="flex flex-col mt-2">
            {currentMood.data.map((song, index) => {
                const isSongActive = isThisPlaylistActive && currentSongIndex === index;
                const isLiked = likedSongs.some(liked => liked.path === song.audio_url);

                return (
                    <div 
                        key={song.id || index}
                        onClick={() => {
                            const formattedTracks = currentMood.data.map(track => ({
                                name: track.title, artist: track.artist, path: track.audio_url, image: track.cover_url, id: track.id
                            }));
                            playPlaylist(formattedTracks, index);
                        }}
                        className={`group grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_1fr_auto] gap-4 px-4 py-3 items-center rounded-md cursor-pointer transition-colors 
                        ${isSongActive ? 'bg-white/10' : 'hover:bg-white/10'}`}
                    >
                        <span className={`w-6 flex justify-center items-center ${isSongActive ? currentMood.textColor : 'text-gray-400 group-hover:text-white'}`}>
                            {isSongActive && isPlaying ? (
                                <img src="https://ik.imagekit.io/vibecast/images/equaliser-animated-green.f93a2ef4.gif" className="h-4 w-4" alt="playing"/>
                            ) : (
                                <>
                                    <span className="group-hover:hidden">{index + 1}</span>
                                    <Play className="w-3 h-3 hidden group-hover:block fill-current text-white" />
                                </>
                            )}
                        </span>
                        
                        <div className="flex flex-col justify-center">
                            <span className={`font-medium text-base truncate ${isSongActive ? currentMood.textColor : 'text-white'}`}>
                                {song.title}
                            </span>
                            <span className="block md:hidden text-xs text-gray-500">{song.artist}</span>
                        </div>
                        
                        <div className={`hidden md:block text-sm ${isSongActive ? 'text-white' : 'text-gray-400'}`}>
                            {song.artist}
                        </div>
                        
                        <div className="flex justify-end items-center gap-4 text-sm text-gray-400 font-mono">
                           <button 
                             onClick={(e) => toggleLike(e, song)} 
                             className={`cursor-pointer transition-transform hover:scale-110 ${isLiked ? 'text-[#1db954]' : 'text-gray-400 hover:text-white group-hover:block hidden'}`}
                           >
                             <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                           </button>
                           
                           <span>
                             {isSongActive ? formatTime(duration) : song.duration || "--:--"}
                           </span>

                           <button 
                             onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSong(song);
                                setIsModalOpen(true);
                             }}
                             className="hidden group-hover:block cursor-pointer hover:text-white"
                           >
                             <MoreVertical className="w-5 h-5" />
                           </button>
                        </div>
                    </div>
                );
            })}
            
            {currentMood.data.length === 0 && (
                <div className="text-center py-12 text-gray-500 font-medium">
                    No tracks found for this mood yet.
                </div>
            )}
            </div>
        </div>

        <AddToPlaylistModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          track={selectedSong}
        />

    </div>
  );
};

export default MoodPlaylist;
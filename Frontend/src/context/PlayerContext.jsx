/* eslint-disable no-empty */
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useRef, useEffect, useCallback, useMemo } from "react";

export const PlayerContext = createContext();

const readStorageJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const readStorageNumber = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === "") return fallback;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const generateShuffleQueue = (length) => {
  const indices = Array.from({ length }, (_, i) => i);
  for (let i = length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
};

export const PlayerProvider = ({ children }) => {
  const [playlist, setPlaylist] = useState(() => {
    const saved = readStorageJSON("vibe_playlist", []);
    return Array.isArray(saved) ? saved : [];
  });

  const [currentSongIndex, setCurrentSongIndex] = useState(() => {
    const idx = Math.floor(readStorageNumber("vibe_index", 0));
    return idx >= 0 ? idx : 0;
  });

  const [volume, setVolume] = useState(() => {
    const vol = readStorageNumber("vibe_volume", 1);
    return vol >= 0 && vol <= 1 ? vol : 1;
  });

  const initialTimeRef = useRef(Math.max(0, readStorageNumber("vibe_time", 0)));

  const [isPlaying, setIsPlaying] = useState(false);
  const [miniPlayerVisible, setMiniPlayerVisible] = useState(false);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);

  const [isShuffle, setIsShuffle] = useState(false);
  const [shuffledQueue, setShuffledQueue] = useState([]);

  const audioRef = useRef(null);
  if (!audioRef.current) {
    audioRef.current = new Audio();
    audioRef.current.preload = "metadata";
    audioRef.current.volume = volume;
  }

  useEffect(() => {
    try {
      localStorage.setItem("vibe_playlist", JSON.stringify(playlist));
      localStorage.setItem("vibe_index", String(currentSongIndex));
      localStorage.setItem("vibe_volume", String(volume));
    } catch (err) {
      console.error("Failed to save player state:", err);
    }
  }, [playlist, currentSongIndex, volume]);

  useEffect(() => {
    if (playlist.length > 0 && playlist[currentSongIndex]) {
      const song = playlist[currentSongIndex];
      const audio = audioRef.current;

      const currentAudioUrl = song.audio_url || song.path;
      if (!currentAudioUrl) return;

      try {
        let history = readStorageJSON("vibecast_history", []);
        if (!Array.isArray(history)) history = [];
        const historyUrl = history[0]?.audio_url || history[0]?.path;

        if (history.length === 0 || historyUrl !== currentAudioUrl) {
          history.unshift(song);
          history = history.slice(0, 15);
          localStorage.setItem("vibecast_history", JSON.stringify(history));
        }
      } catch (err) {
        console.error("Could not save to history", err);
      }

      if (audio.src !== currentAudioUrl) {
        audio.src = currentAudioUrl;
        audio.load();

        if (initialTimeRef.current > 0) {
          audio.currentTime = initialTimeRef.current;
          initialTimeRef.current = 0;
        } else {
          audio.currentTime = 0;
        }

        if (isPlaying) {
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch((e) => {
              if (e.name !== "AbortError") {
                console.log("Playback interrupted:", e);
                setIsPlaying(false);
              }
            });
          }
        }
      }
    }
  }, [playlist, currentSongIndex, isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio.src) return;

    if (isPlaying) {
      if (audio.paused) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((e) => {
            if (e.name !== "AbortError") {
              console.error(e);
              setIsPlaying(false);
            }
          });
        }
      }
    } else {
      if (!audio.paused) audio.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const toggleShuffle = useCallback(() => {
    if (!isShuffle) {
      setShuffledQueue(generateShuffleQueue(playlist.length));
    } else {
      setShuffledQueue([]);
    }
    setIsShuffle((prev) => !prev);
  }, [isShuffle, playlist.length]);

  const nextSong = useCallback(() => {
    if (!playlist.length) return;

    let nextIndex;
    if (isShuffle && shuffledQueue.length > 0) {
      const currentQueueIndex = shuffledQueue.indexOf(currentSongIndex);
      const nextQueueIndex = (currentQueueIndex + 1) % shuffledQueue.length;
      nextIndex = shuffledQueue[nextQueueIndex];
    } else {
      nextIndex = (currentSongIndex + 1) % playlist.length;
    }

    setCurrentSongIndex(nextIndex);
    setIsPlaying(true);
  }, [playlist.length, isShuffle, shuffledQueue, currentSongIndex]);

  const prevSong = useCallback(() => {
    if (!playlist.length) return;

    let prevIndex;
    if (isShuffle && shuffledQueue.length > 0) {
      const currentQueueIndex = shuffledQueue.indexOf(currentSongIndex);
      const prevQueueIndex = (currentQueueIndex - 1 + shuffledQueue.length) % shuffledQueue.length;
      prevIndex = shuffledQueue[prevQueueIndex];
    } else {
      prevIndex = (currentSongIndex - 1 + playlist.length) % playlist.length;
    }

    setCurrentSongIndex(prevIndex);
    setIsPlaying(true);
  }, [playlist.length, isShuffle, shuffledQueue, currentSongIndex]);

  const nextSongRef = useRef(nextSong);
  useEffect(() => { nextSongRef.current = nextSong; }, [nextSong]);

  useEffect(() => {
    const audio = audioRef.current;
    let lastSaveTime = 0;

    const updateProgress = () => {
      setProgress(audio.currentTime);
      if (Math.abs(audio.currentTime - lastSaveTime) > 5) {
        try {
          localStorage.setItem("vibe_time", String(audio.currentTime));
        } catch {}
        lastSaveTime = audio.currentTime;
      }
    };

    const saveFinalProgress = () => {
      try {
        localStorage.setItem("vibe_time", String(audio.currentTime));
      } catch {}
    };

    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => nextSongRef.current();

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("pause", saveFinalProgress);
    window.addEventListener("beforeunload", saveFinalProgress);

    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("pause", saveFinalProgress);
      window.removeEventListener("beforeunload", saveFinalProgress);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA") return;

      const audio = audioRef.current;
      if (!audio) return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          if (audio.src) setIsPlaying((prev) => !prev);
          break;
        case "ArrowRight":
          audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 5);
          setProgress(audio.currentTime);
          break;
        case "ArrowLeft":
          audio.currentTime = Math.max(0, audio.currentTime - 5);
          setProgress(audio.currentTime);
          break;
        case "ArrowUp":
          e.preventDefault();
          setVolume((prev) => Math.min(1, prev + 0.1));
          break;
        case "ArrowDown":
          e.preventDefault();
          setVolume((prev) => Math.max(0, prev - 0.1));
          break;
        case "KeyM":
          setVolume((prev) => (prev > 0 ? 0 : 1));
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const playPlaylist = useCallback((songs, startIndex, autoPlay = true) => {
    setPlaylist(songs);
    setCurrentSongIndex(startIndex);
    setIsPlaying(autoPlay);
    setMiniPlayerVisible(true);
    initialTimeRef.current = 0;

    if (isShuffle) {
      setShuffledQueue(generateShuffleQueue(songs.length));
    }
  }, [isShuffle]);

  const playPause = useCallback(() => setIsPlaying((prev) => !prev), []);

  const seekSong = useCallback((time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  }, []);

  const contextValue = useMemo(() => ({
    playlist,
    currentSongIndex,
    isPlaying,
    miniPlayerVisible,
    duration,
    progress,
    playPlaylist,
    playPause,
    nextSong,
    prevSong,
    setMiniPlayerVisible,
    isShuffle,
    toggleShuffle,
    seekSong,
    volume,
    setVolume
  }), [
    playlist,
    currentSongIndex,
    isPlaying,
    miniPlayerVisible,
    duration,
    progress,
    isShuffle,
    volume,
    playPlaylist,
    playPause,
    nextSong,
    prevSong,
    toggleShuffle,
    seekSong
  ]);

  return (
    <PlayerContext.Provider value={contextValue}>
      {children}
    </PlayerContext.Provider>
  );
};
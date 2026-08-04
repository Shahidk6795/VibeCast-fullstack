import * as playlistService from '../services/playlistService.js';
import dotenv from 'dotenv';
dotenv.config();

export const fetchPlaylistDetails = async (req, res) => {
  try {
    const playlist = await playlistService.getPlaylistById(req.params.id);
    if (playlist) res.json(playlist);
    else res.status(404).json({ error: 'Playlist not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const addPlaylist = async (req, res) => {
  try {
    const id = await playlistService.createPlaylist(req.body.email, req.body.name);
    res.status(201).json({ id, name: req.body.name, user_email: req.body.email });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create playlist' });
  }
};

export const fetchUserPlaylists = async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);
    const playlists = await playlistService.getPlaylistsByUser(email);
    res.json(playlists);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch playlists' });
  }
};

export const editPlaylistName = async (req, res) => {
  try {
    await playlistService.updatePlaylistName(req.params.id, req.body.name);
    res.json({ success: true, name: req.body.name });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update playlist name' });
  }
};

export const removePlaylist = async (req, res) => {
  try {
    await playlistService.deletePlaylist(req.params.id);
    res.json({ message: 'Playlist deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete playlist' });
  }
};

export const uploadCover = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  
  const coverUrl = `http://localhost:${process.env.PORT || 5000}/uploads/${req.file.filename}`;
  try {
    await playlistService.updatePlaylistCover(req.params.id, coverUrl);
    res.json({ cover_url: coverUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// --- PLAYLIST TRACKS & SONGS CONTROLLERS ---

export const addTrack = async (req, res) => {
  const playlistId = req.params.id;
  const { title, artist, audio_url, cover_url } = req.body;
  
  try {
    const existing = await playlistService.checkTrackInPlaylist(playlistId, audio_url);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Track is already in this playlist' });
    }

    await playlistService.addTrackToPlaylist(playlistId, title, artist, audio_url, cover_url);
    res.status(201).json({ message: 'Track added to playlist!' });
  } catch (err) {
    console.error("Error adding track to playlist:", err);
    res.status(500).json({ error: 'Failed to add track' });
  }
};

export const fetchTracks = async (req, res) => {
  try {
    const tracks = await playlistService.getPlaylistTracks(req.params.id);
    res.json(tracks);
  } catch (err) {
    console.error("Error fetching playlist tracks:", err);
    res.status(500).json({ error: 'Failed to fetch tracks' });
  }
};

export const removeTrack = async (req, res) => {
  try {
    await playlistService.removeTrackFromPlaylist(req.params.playlistId, req.params.trackId);
    res.json({ message: 'Track removed from playlist' });
  } catch (err) {
    console.error("Error removing track:", err);
    res.status(500).json({ error: 'Failed to remove track' });
  }
};

// Alternate 'Songs' variations
export const addSong = async (req, res) => {
  const { playlist_id, title, artist, audio_url, cover_url } = req.body;
  try {
    await playlistService.addTrackToPlaylist(playlist_id, title, artist, audio_url, cover_url);
    res.json({ message: 'Song added successfully!' });
  } catch (err) {
    console.error("Error adding song:", err);
    res.status(500).json({ error: err.message });
  }
};

export const fetchSongs = async (req, res) => {
  try {
    const songs = await playlistService.getPlaylistSongs(req.params.id);
    res.json(songs);
  } catch (err) {
    console.error("Error fetching playlist songs:", err);
    res.status(500).json({ error: err.message });
  }
};

export const removeSong = async (req, res) => {
  try {
    await playlistService.removeSongFromPlaylist(req.params.id);
    res.json({ message: 'Song removed!' });
  } catch (err) {
    console.error("Error removing song:", err);
    res.status(500).json({ error: err.message });
  }
};
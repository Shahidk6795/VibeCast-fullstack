import * as playlistService from '../services/playlistService.js';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

export const fetchPlaylistDetails = async (req, res) => {
  try {
    const playlist = await playlistService.getPlaylistById(req.params.id);
    
    if (playlist) {
      if (playlist.cover_url && playlist.cover_url.includes('localhost')) {
        playlist.cover_url = "https://ik.imagekit.io/VibeCast/images/default-playlist.jpg";
      }
      res.json(playlist);
    } else {
      res.status(404).json({ error: 'Playlist not found' });
    }
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
    let playlists = await playlistService.getPlaylistsByUser(email);
    
    const defaultImage = "https://ik.imagekit.io/VibeCast/images/default-playlist.jpg";
    
    playlists = playlists.map(pl => {
      if (pl.cover_url && pl.cover_url.includes('localhost')) {
        pl.cover_url = defaultImage;
      }
      return pl;
    });

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
    const playlistId = req.params.id;
    const playlist = await playlistService.getPlaylistById(playlistId);

    if (playlist && playlist.cover_url && playlist.cover_url.includes('cloudinary.com')) {
      const urlParts = playlist.cover_url.split('/');
      const folderName = urlParts[urlParts.length - 2]; 
      const fileName = urlParts[urlParts.length - 1].split('.')[0]; 
      const publicId = `${folderName}/${fileName}`;

      try {
        await cloudinary.uploader.destroy(publicId);
        console.log(`Deleted cover from Cloudinary because playlist was deleted: ${publicId}`);
      } catch (deleteErr) {
        console.error("Failed to delete image during playlist removal:", deleteErr);
      }
    }

    await playlistService.deletePlaylist(playlistId);
    res.json({ message: 'Playlist deleted successfully' });

  } catch (err) {
    res.status(500).json({ error: 'Failed to delete playlist' });
  }
};

export const uploadCover = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  
  const newCoverUrl = req.file.path; 
  const playlistId = req.params.id;
  
  try {
    const playlist = await playlistService.getPlaylistById(playlistId);

    if (playlist && playlist.cover_url && playlist.cover_url.includes('cloudinary.com')) {
      const urlParts = playlist.cover_url.split('/');
      const folderName = urlParts[urlParts.length - 2]; 
      const fileName = urlParts[urlParts.length - 1].split('.')[0]; 
      const oldPublicId = `${folderName}/${fileName}`;

      try {
        await cloudinary.uploader.destroy(oldPublicId);
        console.log(`Deleted old cover: ${oldPublicId}`);
      } catch (deleteErr) {
        console.error("Failed to delete old image from Cloudinary:", deleteErr);
      }
    }

    await playlistService.updatePlaylistCover(playlistId, newCoverUrl);
    res.json({ cover_url: newCoverUrl });

  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  }
};

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
    let tracks = await playlistService.getPlaylistTracks(req.params.id);
    
    const defaultTrackImage = "https://ik.imagekit.io/VibeCast/images/default-track.jpg"; 
    
    tracks = tracks.map(track => {
      if (track.cover_url && track.cover_url.includes('localhost')) {
        track.cover_url = defaultTrackImage;
      }
      return track;
    });

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
    let songs = await playlistService.getPlaylistSongs(req.params.id);
    
    // Apply the same fix here if your frontend uses the /songs endpoint
    const defaultTrackImage = "https://ik.imagekit.io/VibeCast/images/default-track.jpg"; 
    
    songs = songs.map(song => {
      if (song.cover_url && song.cover_url.includes('localhost')) {
        song.cover_url = defaultTrackImage;
      }
      return song;
    });

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
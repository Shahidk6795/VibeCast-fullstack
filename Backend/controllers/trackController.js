import * as trackService from '../services/trackService.js';

// In-memory TTL cache (15 minutes)
let tracksCache = { data: null, expiresAt: 0 };
const CACHE_TTL = 15 * 60 * 1000;

// Helper to invalidate cache when a track is added/edited/deleted
const invalidateCache = () => {
  tracksCache = { data: null, expiresAt: 0 };
};

export const getTracks = async (req, res) => {
  try {
    // 1. Serve from cache if valid
    if (tracksCache.data && Date.now() < tracksCache.expiresAt) {
      return res.json(tracksCache.data);
    }
    
    // 2. Fetch fresh tracks
    const tracks = await trackService.fetchAllTracks();
    
    // 3. Update cache
    tracksCache = {
      data: tracks,
      expiresAt: Date.now() + CACHE_TTL
    };
    
    res.json(tracks);
  } catch (err) {
    console.error("Error fetching tracks:", err.message);
    
    // 4. Fallback: If API gives 429 but we have stale cache data, serve it anyway to prevent UI crash
    if (tracksCache.data) {
      console.log("Serving stale tracks from cache due to 429 API error.");
      return res.json(tracksCache.data);
    }
    
    res.status(500).json({ error: 'Database failed to fetch tracks' });
  }
};

export const addTrack = async (req, res) => {
  try {
    const result = await trackService.createTrack(req.body);
    if (result.error) {
      return res.status(400).json({ error: 'Duplicate: This song or audio link is already in the database!' });
    }
    invalidateCache(); // Bust cache so new song appears instantly
    res.json({ message: 'Track saved!' });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: 'Database failed' });
  }
};

export const getArtistTracks = async (req, res) => {
  try {
    const requestedName = decodeURIComponent(req.params.artistName);
    const tracks = await trackService.fetchTracksByArtist(requestedName);
    res.json(tracks);
  } catch (err) {
    console.error("Database error fetching artist tracks:", err);
    res.status(500).json([]); 
  }
};

export const editTrackArtist = async (req, res) => {
  try {
    await trackService.updateTrackArtist(req.params.id, req.body.artist);
    invalidateCache(); 
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update track' });
  }
};

export const fixTrackDuration = async (req, res) => {
  try {
    await trackService.updateTrackDuration(req.params.id, req.body.duration);
    invalidateCache();
    res.status(200).json({ message: "Duration updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update duration" });
  }
};

export const adminUpdateTrack = async (req, res) => {
  try {
    await trackService.updateTrackAdmin(req.params.id, req.body);
    invalidateCache();
    res.status(200).json({ message: "Track updated successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update track" });
  }
};

export const adminDeleteTrack = async (req, res) => {
  try {
    await trackService.deleteTrackAdmin(req.params.id);
    invalidateCache();
    res.status(200).json({ message: "Track deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete track" });
  }
};
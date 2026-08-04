import * as trackService from '../services/trackService.js';

export const getTracks = async (req, res) => {
  try {
    const tracks = await trackService.fetchAllTracks();
    res.json(tracks);
  } catch (err) {
    console.error("Error fetching tracks:", err.message);
    res.status(500).json({ error: 'Database failed to fetch tracks' });
  }
};

export const addTrack = async (req, res) => {
  try {
    const result = await trackService.createTrack(req.body);
    if (result.error) {
      return res.status(400).json({ error: 'Duplicate: This song or audio link is already in the database!' });
    }
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
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update track' });
  }
};

export const fixTrackDuration = async (req, res) => {
  try {
    await trackService.updateTrackDuration(req.params.id, req.body.duration);
    res.status(200).json({ message: "Duration updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update duration" });
  }
};

export const adminUpdateTrack = async (req, res) => {
  try {
    await trackService.updateTrackAdmin(req.params.id, req.body);
    res.status(200).json({ message: "Track updated successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update track" });
  }
};

export const adminDeleteTrack = async (req, res) => {
  try {
    await trackService.deleteTrackAdmin(req.params.id);
    res.status(200).json({ message: "Track deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete track" });
  }
};
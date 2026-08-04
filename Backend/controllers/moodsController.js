import * as moodsService from '../services/moodsService.js';

export const fetchMoodTracks = async (req, res) => {
  try { res.json(await moodsService.getTracksByMood(req.params.id)); } 
  catch (err) { res.status(500).json({ error: err.message }); }
};
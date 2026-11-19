import * as saavn from '../utils/saavnNative.js';

export const searchJioSaavn = async (req, res) => {
  try {
    const searchQuery = req.query.query;
    if (!searchQuery) {
      return res.json({ success: true, data: { results: [] } });
    }

    const results = await saavn.searchSongs(searchQuery, 20);
    res.json({ success: true, data: { results } });
  } catch (error) {
    console.error("Music Fetch Error:", error.message);
    res.status(500).json({ error: "Failed to fetch songs from the music API" });
  }
};
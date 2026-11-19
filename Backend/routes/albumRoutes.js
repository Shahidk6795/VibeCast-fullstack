import express from 'express';
import * as saavn from '../utils/saavnNative.js';

const router = express.Router();

// GET /api/albums/trending (returns only multi-song albums)
router.get('/trending', async (req, res) => {
  try {
    const queries = ['bollywood hits', 'latest hindi albums', 'top indian albums'];
    const query = queries[Math.floor(Math.random() * queries.length)];

    const albums = await saavn.searchAlbums(query, 30);
    const multiSongAlbums = albums.filter((album) => Number(album.songCount) > 1);

    res.json(multiSongAlbums.length > 0 ? multiSongAlbums : albums.slice(0, 12));
  } catch (error) {
    console.error('Trending Albums Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch trending albums' });
  }
});

// GET /api/albums/:id (fetches details and tracklist for a single album)
router.get('/:id', async (req, res) => {
  try {
    const data = await saavn.getAlbumDetails(req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Album Detail Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch album tracks' });
  }
});

export default router;
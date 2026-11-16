import express from 'express';
const router = express.Router();

// GET /api/albums/trending (returns only multi-song albums)
router.get('/trending', async (req, res) => {
  try {
    const SAAVN_API = process.env.SAAVN_API_URL;
    if (!SAAVN_API) {
      return res.status(500).json({ error: 'SAAVN_API_URL is missing' });
    }

    const queries = ['bollywood hits', 'latest hindi albums', 'top indian albums'];
    const query = queries[Math.floor(Math.random() * queries.length)];

    const response = await fetch(
      `${SAAVN_API}/search/albums?query=${encodeURIComponent(query)}&limit=30`
    );
    const data = await response.json();

    const multiSongAlbums = (data?.data?.results || []).filter(
      (album) => Number(album.songCount) > 1
    );

    res.json(multiSongAlbums);
  } catch (error) {
    console.error('Trending Albums Error:', error);
    res.status(500).json({ error: 'Failed to fetch trending albums' });
  }
});

// GET /api/albums/:id (fetches details and tracklist for a single album)
router.get('/:id', async (req, res) => {
  try {
    const SAAVN_API = process.env.SAAVN_API_URL;
    const response = await fetch(`${SAAVN_API}/albums?id=${req.params.id}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Album Detail Error:', error);
    res.status(500).json({ error: 'Failed to fetch album tracks' });
  }
});

export default router;
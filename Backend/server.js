import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pool from './db.js';
import * as saavn from './utils/saavnNative.js';

import createAuthRouter from './routes/auth.js';
import artistRoutes from './routes/artistRoutes.js';
import trackRoutes from './routes/trackRoutes.js';
import playlistRoutes from './routes/playlistRoutes.js';
import likesRoutes from './routes/likesRoutes.js';
import moodsRoutes from './routes/moodsRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import albumRoutes from './routes/albumRoutes.js';

const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Root endpoint for UptimeRobot
app.get('/', (_req, res) => res.status(200).send("VibeCast API is awake!"));

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok', db: 'Connected to MySQL!' });
  } catch (err) {
    res.status(500).json({ error: 'Database failed' });
  }
});

// Native Search API (Returns both songs and matching albums)
app.get('/api/search', async (req, res) => {
  try {
    const q = (req.query.query || '').trim();
    if (!q) {
      return res.json({ success: true, data: { results: [], albums: [] } });
    }

    const [songs, albums] = await Promise.all([
      saavn.searchSongs(q, 20).catch(() => []),
      saavn.searchAlbums(q, 12).catch(() => [])
    ]);

    res.json({
      success: true,
      data: { results: songs, albums }
    });
  } catch (error) {
    console.error("Search Error:", error.message);
    res.status(500).json({ error: "Search failed" });
  }
});

app.use('/api/auth', createAuthRouter(pool));
app.use('/api/artists', artistRoutes);
app.use('/api/tracks', trackRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/likes', likesRoutes);
app.use('/api/moods', moodsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/albums', albumRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on ${PORT}!`));
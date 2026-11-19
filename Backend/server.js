import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pool from './db.js';
import axios from 'axios';
import crypto from 'crypto';

import artistRoutes from './routes/artistRoutes.js';
import trackRoutes from './routes/trackRoutes.js';
import playlistRoutes from './routes/playlistRoutes.js';
import likesRoutes from './routes/likesRoutes.js';
import moodsRoutes from './routes/moodsRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import albumRoutes from './routes/albumRoutes.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Secret Key for Frontend Search Decryption
const SAAVN_KEY = Buffer.from('38346591', 'utf8');
const decryptAudioUrl = (encrypted) => {
  try {
    const decipher = crypto.createDecipheriv('des-ecb', SAAVN_KEY, null);
    let dec = decipher.update(encrypted, 'base64', 'utf8');
    dec += decipher.final('utf8');
    return dec.replace('_96.mp4', '_320.mp4');
  } catch (err) { return ''; }
};

// Root endpoint just for UptimeRobot (No extra pings needed!)
app.get('/', (_req, res) => res.status(200).send("VibeCast API is awake!"));
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok', db: 'Connected to MySQL!' });
  } catch (err) {
    res.status(500).json({ error: 'Database failed' });
  }
});

// Native Search API (Mocking the wrapper format so React doesn't break)
app.get('/api/search', async (req, res) => {
  try {
    const searchQuery = req.query.query; 
    if (!searchQuery) return res.json({ data: { results: [] } });

    const targetUrl = `https://www.jiosaavn.com/api.php?__call=search.getResults&q=${encodeURIComponent(searchQuery)}&n=20&p=1&_format=json&_marker=0&ctx=web6dot0`;
    const { data } = await axios.get(targetUrl, { timeout: 8000 });
    const results = data?.results || [];

    const formattedResults = results.map(song => ({
      id: song.id,
      name: song.title || song.song || 'Unknown',
      duration: parseInt(song.more_info?.duration || '0', 10),
      artists: { primary: [{ name: song.more_info?.primary_artists || song.more_info?.singers || 'Unknown' }] },
      image: [{ quality: "500x500", url: song.image?.replace('150x150', '500x500') || '' }],
      downloadUrl: [{ quality: "320kbps", url: decryptAudioUrl(song.more_info?.encrypted_media_url || '') }]
    }));

    res.json({ success: true, data: { results: formattedResults } });
  } catch (error) {
    console.error("Native Music Fetch Error:", error.message);
    res.status(500).json({ error: "Failed to fetch songs from the music API" });
  }
});

app.use('/api/artists', artistRoutes);
app.use('/api/tracks', trackRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/likes', likesRoutes);
app.use('/api/moods', moodsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/albums', albumRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on ${PORT}!`));
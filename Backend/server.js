import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pool from './db.js';
import axios from 'axios';

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

if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (_req, res) => {
  res.status(200).send("VibeCast API is awake and running!");
});

app.get('/api/search', async (req, res) => {
  try {
    const searchQuery = req.query.query; 
    const apiUrl = process.env.SAAVN_API_URL; 

    if (!apiUrl) {
        return res.status(500).json({ error: "SAAVN_API_URL is missing in environment variables" });
    }

    // 1. Construct the exact target URL
    const targetUrl = `${apiUrl}/search/songs?query=${searchQuery}`;
    
    // 2. Log it to the Render terminal so we can see what is broken
    console.log("DEBUG - Trying to fetch from:", targetUrl);

    // 3. Make the request
    const response = await axios.get(targetUrl);
    res.json(response.data);

  } catch (error) {
    console.error("Music Fetch Error:", error.message);
    res.status(500).json({ error: "Failed to fetch songs from the music API" });
  }
});

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ message: 'Connected to MySQL!' });
  } catch (err) {
    res.status(500).json({ error: 'Database failed' });
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
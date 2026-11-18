import axios from 'axios';
import pool from '../db.js';

// Helper to map JioSaavn song objects into VibeCast's exact track schema
const mapSaavnSong = (song) => {
  const audioObj = song.downloadUrl?.find((d) => d.quality === '320kbps')
    || song.downloadUrl?.[song.downloadUrl.length - 1];
  const imageObj = song.image?.find((img) => img.quality === '500x500')
    || song.image?.[song.image.length - 1];

  const mins = Math.floor((song.duration || 0) / 60);
  const secs = String((song.duration || 0) % 60).padStart(2, '0');

  return {
    id: song.id,
    title: song.name?.replace(/&quot;/g, '"').replace(/&#039;/g, "'") || 'Unknown Title',
    artist: song.artists?.primary?.map((a) => a.name).join(', ') || 'Unknown Artist',
    audio_url: audioObj?.url || '',
    cover_url: imageObj?.url || '',
    duration: `${mins}:${secs}`,
    mood: null
  };
};

// Powers "Made For You" / Home feed dynamically via JioSaavn
export const fetchAllTracks = async () => {
  try {
    const apiUrl = process.env.SAAVN_API_URL;
    if (!apiUrl) throw new Error("No SAAVN_API_URL configured.");

    const queries = ['trending hindi hits', 'arijit singh top songs', 'bollywood chill'];
    const randomQuery = queries[Math.floor(Math.random() * queries.length)];

    // If this hits 429, Axios throws an error which we now safely catch
    const { data } = await axios.get(
      `${apiUrl}/search/songs?query=${encodeURIComponent(randomQuery)}&limit=20`,
      { timeout: 8000 }
    );

    const results = data?.data?.results || [];
    const saavnTracks = results.map(mapSaavnSong).filter((t) => t.audio_url);
    
    if (saavnTracks.length > 0) return saavnTracks;
    throw new Error("JioSaavn returned empty tracks");

  } catch (error) {
    console.error("JioSaavn fetch failed (429/Timeout). Falling back to local DB...", error.message);
    
    try {
      // BULLETPROOF FALLBACK: Load from MySQL so the frontend never crashes!
      const [dbTracks] = await pool.query('SELECT * FROM tracks ORDER BY id DESC LIMIT 20');
      return dbTracks;
    } catch (dbErr) {
      console.error("Database fallback failed:", dbErr.message);
      return []; // Returns empty array instead of crashing with a 500 error
    }
  }
};

// Powers Artist Pages dynamically via JioSaavn
export const fetchTracksByArtist = async (artistName) => {
  try {
    const apiUrl = process.env.SAAVN_API_URL;
    if (!apiUrl) throw new Error("No SAAVN_API_URL configured.");

    const { data } = await axios.get(
      `${apiUrl}/search/songs?query=${encodeURIComponent(artistName)}&limit=20`,
      { timeout: 8000 }
    );

    const results = data?.data?.results || [];
    return results.map(mapSaavnSong).filter((t) => t.audio_url);

  } catch (error) {
    console.error(`JioSaavn failed for artist ${artistName}:`, error.message);
    
    try {
      // BULLETPROOF FALLBACK: Check local MySQL for this artist
      const [dbTracks] = await pool.query('SELECT * FROM tracks WHERE artist LIKE ? LIMIT 20', [`%${artistName}%`]);
      return dbTracks;
    } catch (dbErr) {
      return [];
    }
  }
};

export const createTrack = async (data) => {
  const { title, artist, audio_url, cover_url, mood, duration } = data;
  const [existing] = await pool.query(
    'SELECT id FROM tracks WHERE audio_url = ? OR (title = ? AND artist = ?)',
    [audio_url, title, artist]
  );
  if (existing.length > 0) return { error: 'Duplicate' };

  await pool.query(
    'INSERT INTO tracks (title, artist, audio_url, cover_url, mood, duration) VALUES (?, ?, ?, ?, ?, ?)',
    [title, artist, audio_url, cover_url, mood || null, duration || null]
  );
  return { success: true };
};

export const updateTrackArtist = async (id, artist) => {
  await pool.query('UPDATE tracks SET artist = ? WHERE id = ?', [artist, id]);
};

export const updateTrackDuration = async (id, duration) => {
  await pool.query('UPDATE tracks SET duration = ? WHERE id = ?', [duration, id]);
};

export const updateTrackAdmin = async (id, data) => {
  const { cover_url, audio_url, collaborator } = data;
  await pool.query(
    'UPDATE tracks SET cover_url = ?, audio_url = ?, artist = ? WHERE id = ?',
    [cover_url, audio_url, collaborator, id]
  );
};

export const deleteTrackAdmin = async (id) => {
  await pool.query('DELETE FROM tracks WHERE id = ?', [id]);
};
import axios from 'axios';
import pool from '../db.js';
import crypto from 'crypto'; 

// The Secret Key to decrypt JioSaavn's native audio URLs
const SAAVN_KEY = Buffer.from('38346591', 'utf8');

const decryptAudioUrl = (encryptedUrl) => {
  try {
    const decipher = crypto.createDecipheriv('des-ecb', SAAVN_KEY, null);
    let decrypted = decipher.update(encryptedUrl, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted.replace('_96.mp4', '_320.mp4'); // Force highest quality
  } catch (err) {
    return '';
  }
};

// Map Native JioSaavn data into VibeCast's Track Schema
const mapNativeSaavnSong = (song) => {
  const encryptedUrl = song.more_info?.encrypted_media_url;
  const audioUrl = encryptedUrl ? decryptAudioUrl(encryptedUrl) : '';
  const imageUrl = song.image?.replace('150x150', '500x500') || '';

  const totalSeconds = parseInt(song.more_info?.duration || '0', 10);
  const mins = Math.floor(totalSeconds / 60);
  const secs = String(totalSeconds % 60).padStart(2, '0');

  return {
    id: song.id,
    title: (song.title || song.song || 'Unknown').replace(/&quot;/g, '"').replace(/&#039;/g, "'"),
    artist: song.more_info?.primary_artists || song.more_info?.singers || 'Unknown Artist',
    audio_url: audioUrl,
    cover_url: imageUrl,
    duration: `${mins}:${secs}`,
    mood: null
  };
};

export const fetchAllTracks = async () => {
  try {
    const queries = ['trending hindi hits', 'arijit singh top songs', 'bollywood chill'];
    const randomQuery = queries[Math.floor(Math.random() * queries.length)];

    // Directly hit JioSaavn's internal hidden API
    const targetUrl = `https://www.jiosaavn.com/api.php?__call=search.getResults&q=${encodeURIComponent(randomQuery)}&n=20&p=1&_format=json&_marker=0&ctx=web6dot0`;
    
    const { data } = await axios.get(targetUrl, { timeout: 8000 });
    const results = data?.results || [];
    const saavnTracks = results.map(mapNativeSaavnSong).filter((t) => t.audio_url);
    
    if (saavnTracks.length > 0) return saavnTracks;
    throw new Error("Direct JioSaavn API returned empty tracks");

  } catch (error) {
    console.error("Native JioSaavn fetch failed. Falling back to DB...", error.message);
    try {
      const [dbTracks] = await pool.query('SELECT * FROM tracks ORDER BY id DESC LIMIT 20');
      return dbTracks;
    } catch (dbErr) {
      return []; 
    }
  }
};

export const fetchTracksByArtist = async (artistName) => {
  try {
    const targetUrl = `https://www.jiosaavn.com/api.php?__call=search.getResults&q=${encodeURIComponent(artistName)}&n=20&p=1&_format=json&_marker=0&ctx=web6dot0`;
    
    const { data } = await axios.get(targetUrl, { timeout: 8000 });
    const results = data?.results || [];
    return results.map(mapNativeSaavnSong).filter((t) => t.audio_url);
  } catch (error) {
    console.error(`Native JioSaavn failed for artist ${artistName}:`, error.message);
    try {
      const [dbTracks] = await pool.query('SELECT * FROM tracks WHERE artist LIKE ? LIMIT 20', [`%${artistName}%`]);
      return dbTracks;
    } catch (dbErr) {
      return [];
    }
  }
};

export const createTrack = async (data) => {
  const { title, artist, audio_url, cover_url, mood, duration } = data;
  const [existing] = await pool.query('SELECT id FROM tracks WHERE audio_url = ? OR (title = ? AND artist = ?)', [audio_url, title, artist]);
  if (existing.length > 0) return { error: 'Duplicate' };
  await pool.query('INSERT INTO tracks (title, artist, audio_url, cover_url, mood, duration) VALUES (?, ?, ?, ?, ?, ?)', [title, artist, audio_url, cover_url, mood || null, duration || null]);
  return { success: true };
};
export const updateTrackArtist = async (id, artist) => { await pool.query('UPDATE tracks SET artist = ? WHERE id = ?', [artist, id]); };
export const updateTrackDuration = async (id, duration) => { await pool.query('UPDATE tracks SET duration = ? WHERE id = ?', [duration, id]); };
export const updateTrackAdmin = async (id, data) => { await pool.query('UPDATE tracks SET cover_url = ?, audio_url = ?, artist = ? WHERE id = ?', [data.cover_url, data.audio_url, data.collaborator, id]); };
export const deleteTrackAdmin = async (id) => { await pool.query('DELETE FROM tracks WHERE id = ?', [id]); };
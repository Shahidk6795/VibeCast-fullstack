import pool from '../db.js';

export const fetchAllTracks = async () => {
  const [rows] = await pool.query('SELECT * FROM tracks ORDER BY created_at DESC, id DESC');
  return rows;
};

export const createTrack = async (data) => {
  const { title, artist, audio_url, cover_url, mood, duration } = data;
  
  // Check for duplicates first
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

export const fetchTracksByArtist = async (artistName) => {
  const [results] = await pool.query(
    "SELECT * FROM tracks WHERE artist LIKE ? ORDER BY id DESC", 
    [`%${artistName}%`]
  );
  return results;
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
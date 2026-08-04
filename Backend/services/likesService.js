import pool from '../db.js';

export const getLikesByUser = async (email) => {
  const [rows] = await pool.query(`
    SELECT tracks.title AS name, tracks.artist, tracks.audio_url AS path, tracks.cover_url AS image, tracks.duration
    FROM likes JOIN tracks ON likes.track_id = tracks.id 
    WHERE likes.user_email = ?
  `, [email]);
  return rows;
};

export const addLike = async (email, audio_url) => {
  await pool.query('INSERT INTO likes (user_email, track_id) VALUES (?, (SELECT id FROM tracks WHERE audio_url = ? LIMIT 1))', [email, audio_url]);
};

export const checkLike = async (email, audio_url) => {
  const [rows] = await pool.query('SELECT id FROM likes WHERE user_email = ? AND track_id = (SELECT id FROM tracks WHERE audio_url = ? LIMIT 1)', [email, audio_url]);
  return rows.length > 0;
};

export const removeLike = async (email, audio_url) => {
  await pool.query('DELETE FROM likes WHERE user_email = ? AND track_id = (SELECT id FROM tracks WHERE audio_url = ? LIMIT 1)', [email, audio_url]);
};
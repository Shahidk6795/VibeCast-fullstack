import pool from '../db.js';

export const getLikesByUser = async (email) => {
  const [rows] = await pool.query(`
    SELECT tracks.title AS name, tracks.artist, tracks.audio_url AS path, tracks.cover_url AS image, tracks.duration
    FROM likes JOIN tracks ON likes.track_id = tracks.id 
    WHERE likes.user_email = ?
  `, [email]);
  return rows;
};

export const addLike = async (trackData) => {
  const { email, audio_url, title, artist, cover_url, duration } = trackData;

  // 1. Check if the track already exists in your database
  let [tracks] = await pool.query('SELECT id FROM tracks WHERE audio_url = ? LIMIT 1', [audio_url]);
  let trackId;

  if (tracks.length > 0) {
    // Track exists, use its ID
    trackId = tracks[0].id;
  } else {
    // 2. Track is brand new from JioSaavn! Save it to the tracks table first.
    const [result] = await pool.query(
      'INSERT INTO tracks (title, artist, audio_url, cover_url, duration) VALUES (?, ?, ?, ?, ?)',
      [title || 'Unknown Title', artist || 'Unknown Artist', audio_url, cover_url || '', duration || '0:00']
    );
    trackId = result.insertId;
  }

  // 3. Now safely link it to the user (INSERT IGNORE prevents duplicate crash)
  await pool.query(
    'INSERT IGNORE INTO likes (user_email, track_id) VALUES (?, ?)', 
    [email, trackId]
  );
};

export const checkLike = async (email, audio_url) => {
  const [rows] = await pool.query(
    'SELECT id FROM likes WHERE user_email = ? AND track_id = (SELECT id FROM tracks WHERE audio_url = ? LIMIT 1)', 
    [email, audio_url]
  );
  return rows.length > 0;
};

export const removeLike = async (email, audio_url) => {
  await pool.query(
    'DELETE FROM likes WHERE user_email = ? AND track_id = (SELECT id FROM tracks WHERE audio_url = ? LIMIT 1)', 
    [email, audio_url]
  );
};
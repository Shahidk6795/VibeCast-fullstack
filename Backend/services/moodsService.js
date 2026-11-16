import pool from '../db.js';

export const getTracksByMood = async (moodId) => {
  const [rows] = await pool.query(
    `SELECT 
      id, 
      mood_id AS mood, 
      name AS title, 
      artist, 
      path AS audio_url, 
      image AS cover_url, 
      duration, 
      added_at AS created_at 
     FROM mood_tracks 
     WHERE mood_id = ? 
     ORDER BY id ASC`,
    [moodId]
  );
  return rows;
};
import pool from '../db.js';

export const getTracksByMood = async (moodId) => {
  const [rows] = await pool.query('SELECT * FROM tracks WHERE mood = ? ORDER BY id ASC', [moodId]);
  return rows;
};
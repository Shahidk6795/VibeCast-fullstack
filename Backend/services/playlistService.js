import pool from '../db.js';

export const getPlaylistById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM playlists WHERE id = ?', [id]);
  return rows[0];
};

export const createPlaylist = async (email, name) => {
  const [result] = await pool.query('INSERT INTO playlists (user_email, name) VALUES (?, ?)', [email, name]);
  return result.insertId;
};

export const getPlaylistsByUser = async (email) => {
  const [rows] = await pool.query('SELECT * FROM playlists WHERE user_email = ? ORDER BY created_at DESC', [email]);
  return rows;
};

export const updatePlaylistName = async (id, name) => {
  await pool.query('UPDATE playlists SET name = ? WHERE id = ?', [name, id]);
};

export const updatePlaylistCover = async (id, coverUrl) => {
  await pool.query('UPDATE playlists SET cover_url = ? WHERE id = ?', [coverUrl, id]);
};

export const deletePlaylist = async (id) => {
  await pool.query('DELETE FROM playlists WHERE id = ?', [id]);
};
// --- PLAYLIST TRACKS & SONGS LOGIC ---

export const checkTrackInPlaylist = async (playlistId, audioUrl) => {
  const [existing] = await pool.query(
    'SELECT id FROM playlist_tracks WHERE playlist_id = ? AND audio_url = ?', 
    [playlistId, audioUrl]
  );
  return existing;
};

export const addTrackToPlaylist = async (playlistId, title, artist, audio_url, cover_url) => {
  await pool.query(
    'INSERT INTO playlist_tracks (playlist_id, title, artist, audio_url, cover_url) VALUES (?, ?, ?, ?, ?)',
    [playlistId, title, artist, audio_url, cover_url]
  );
};

export const getPlaylistTracks = async (playlistId) => {
  const [rows] = await pool.query(
    'SELECT * FROM playlist_tracks WHERE playlist_id = ? ORDER BY added_at ASC', 
    [playlistId]
  );
  return rows;
};

export const removeTrackFromPlaylist = async (playlistId, trackId) => {
  await pool.query(
    'DELETE FROM playlist_tracks WHERE playlist_id = ? AND id = ?', 
    [playlistId, trackId]
  );
};

// Alternate 'Songs' variations you had in the original file
export const getPlaylistSongs = async (playlistId) => {
  const [rows] = await pool.query('SELECT * FROM playlist_tracks WHERE playlist_id = ? ORDER BY added_at DESC', [playlistId]);
  return rows;
};

export const removeSongFromPlaylist = async (trackId) => {
  await pool.query('DELETE FROM playlist_tracks WHERE id = ?', [trackId]);
};
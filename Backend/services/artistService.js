import pool from '../db.js';

export const createArtist = async (name, image_url, quote) => {
    const [result] = await pool.query(
        'INSERT INTO artists (name, image_url, quote) VALUES (?, ?, ?)', 
        [name, image_url, quote]
    );
    return result;
};

export const getArtistByName = async (name) => {
    const [rows] = await pool.query('SELECT name, image_url, quote FROM artists WHERE name = ?', [name]);
    return rows;
};

export const getAllArtists = async () => {
    const [rows] = await pool.query('SELECT * FROM artists ORDER BY name ASC');
    return rows;
};

export const removeArtist = async (id) => {
    await pool.query('DELETE FROM artists WHERE id = ?', [id]);
};
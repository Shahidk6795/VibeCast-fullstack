import * as artistService from '../services/artistService.js';

export const addArtist = async (req, res) => {
    const { name, image_url, quote } = req.body; 
    try {
        const result = await artistService.createArtist(name, image_url, quote); 
        
        res.status(201).json({ id: result.insertId, name, image_url, quote });
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).json({ error: 'Failed to add artist' });
    }
};

export const fetchArtistByName = async (req, res) => {
    try {
        const rows = await artistService.getArtistByName(req.params.artistName);
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({ error: 'Artist not found' });
        }
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).json({ error: 'Failed to fetch artist details' });
    }
};

export const fetchAllArtists = async (req, res) => {
    try {
        const rows = await artistService.getAllArtists();
        res.json(rows);
    } catch (err) {
        console.error("Database error fetching artists:", err);
        res.status(500).json({ error: 'Failed to fetch artists' });
    }
};

export const deleteArtist = async (req, res) => {
    try {
        await artistService.removeArtist(req.params.id);
        res.status(200).json({ message: 'Artist deleted successfully' });
    } catch (err) {
        console.error("Database error deleting artist:", err);
        res.status(500).json({ error: 'Failed to delete artist' });
    }
};
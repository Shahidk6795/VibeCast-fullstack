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
        if (rows.length > 0) res.json(rows[0]);
        else res.status(404).json({ error: 'Artist not found' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch artist details' });
    }
};

export const fetchAllArtists = async (req, res) => {
    try {
        const rows = await artistService.getAllArtists();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch artists' });
    }
};

export const deleteArtist = async (req, res) => {
    try {
        await artistService.removeArtist(req.params.id);
        res.status(200).json({ message: 'Artist deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete artist' });
    }
};

// HYBRID ROUTE: Top Hits on Page 1, Deep Catalog on Page 2+
export const fetchArtistCatalog = async (req, res) => {
    const { name, page = 1 } = req.query;
    const SAAVN_API = process.env.SAAVN_API_URL; 
    
    try {
        if (parseInt(page) === 1) {
            // PAGE 1: Use Search API to guarantee "All-Time Hits" & "Trending" are at the top
            const searchRes = await fetch(`${SAAVN_API}/search/songs?query=${encodeURIComponent(name)}&limit=40`);
            const searchJson = await searchRes.json();
            return res.json(searchJson);
        } else {
            // PAGE 2+: Use Artist Catalog API to fetch the rest of their discography one by one
            const artistRes = await fetch(`${SAAVN_API}/search/artists?query=${encodeURIComponent(name)}`);
            const artistJson = await artistRes.json();
            const artistId = artistJson.data?.results?.[0]?.id;

            if (!artistId) {
                return res.json({ data: { songs: [] } });
            }

            // We subtract 1 so the catalog starts from its true beginning
            const targetPage = parseInt(page) - 1;
            const songsRes = await fetch(`${SAAVN_API}/artists/${artistId}/songs?page=${targetPage}`);
            const songsJson = await songsRes.json();
            
            res.json(songsJson);
        }
    } catch (error) {
        console.error("Catalog Error:", error);
        res.status(500).json({ error: "Failed to fetch artist catalog" });
    }
};

// LIVE API ROUTE: Fetch Artist's Albums (Paginated)
export const fetchArtistAlbums = async (req, res) => {
    const { name, page = 1 } = req.query;
    const SAAVN_API = process.env.SAAVN_API_URL; 
    try {
        const artistRes = await fetch(`${SAAVN_API}/search/artists?query=${encodeURIComponent(name)}`);
        const artistJson = await artistRes.json();
        const artistId = artistJson.data?.results?.[0]?.id;

        if (!artistId) return res.json({ data: { albums: [] } });

        const albumsRes = await fetch(`${SAAVN_API}/artists/${artistId}/albums?page=${page}`);
        const albumsJson = await albumsRes.json();
        res.json(albumsJson);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch artist albums" });
    }
};
export const searchLiveArtists = async (req, res) => {
    const { query } = req.query;
    const SAAVN_API = process.env.SAAVN_API_URL; 
    
    try {
        if (!query) return res.json({ data: { results: [] } });
        
        const response = await fetch(`${SAAVN_API}/search/artists?query=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        res.json(data);
    } catch (error) {
        console.error("Live Artist Search Error:", error);
        res.status(500).json({ error: "Failed to search live artists" });
    }
};
// NEW: Fetch dynamic default artists for the Discover page
export const fetchDefaultArtists = async (req, res) => {
    const SAAVN_API = process.env.SAAVN_API_URL; 
    
    try {
        // Helper to safely fetch from JioSaavn
        const fetchSafe = async (url) => {
            try { 
                const response = await fetch(url); 
                return await response.json(); 
            } catch (e) { return { data: { results: [] } }; }
        };

        // Fetch top artists across 3 major streaming categories simultaneously
        const [hindiRes, englishRes, punjabiRes] = await Promise.all([
            fetchSafe(`${SAAVN_API}/search/artists?query=hindi&limit=15`),
            fetchSafe(`${SAAVN_API}/search/artists?query=english&limit=15`),
            fetchSafe(`${SAAVN_API}/search/artists?query=punjabi&limit=15`)
        ]);

        const rawArtists = [
            ...(hindiRes.data?.results || []),
            ...(englishRes.data?.results || []),
            ...(punjabiRes.data?.results || [])
        ];

        const uniqueArtists = [];
        const seen = new Set();

        for (const artist of rawArtists) {
            if (!seen.has(artist.id) && artist.image) {
                seen.add(artist.id);
                uniqueArtists.push({
                    id: artist.id,
                    name: artist.title || artist.name,
                    image: artist.image,
                    genre: artist.description || artist.role || "Trending Artist"
                });
            }
        }

        // Shuffle the array so the Discover page looks different every time!
        const shuffled = uniqueArtists.sort(() => 0.5 - Math.random()).slice(0, 18);
        
        res.json({ data: shuffled });
    } catch (error) {
        console.error("Default Artists Error:", error);
        res.status(500).json({ error: "Failed to fetch default artists" });
    }
};
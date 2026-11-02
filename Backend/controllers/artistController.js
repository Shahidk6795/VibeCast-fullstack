import * as artistService from '../services/artistService.js';

// --- DATABASE FUNCTIONS ---
export const addArtist = async (req, res) => {
    const { name, image_url, quote } = req.body; 
    try {
        const result = await artistService.createArtist(name, image_url, quote); 
        res.status(201).json({ id: result.insertId, name, image_url, quote });
    } catch (err) {
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

// --- HELPER: ADVANCED EXACT ARTIST ID MATCHER ---
const getExactArtistId = (results, queryName) => {
    if (!results || results.length === 0) return null;
    const target = queryName.toLowerCase().trim();

    // 1. Try absolute direct match first
    const exact = results.find(a => (a.title || a.name || "").toLowerCase().trim() === target);
    if (exact) return exact.id;

    // 2. Normalization Match (The KR$NA vs Krsna Solo Fix)
    // Converts "$" to "s", removes special characters, and trims spaces
    const normalize = (str) => str.toLowerCase().replace(/\$/g, 's').replace(/[^a-z0-9\s]/g, '').trim();
    const normTarget = normalize(queryName); // "kr$na" becomes "krsna"

    // Look for an exact normalized match ("krsna" matches "krsna", but NOT "krsnasolo")
    const exactNorm = results.find(a => normalize(a.title || a.name || "") === normTarget);
    if (exactNorm) return exactNorm.id;

    // 3. Final fallback: If it's a weird spelling, find the one that at least starts with the name
    const startsWith = results.find(a => normalize(a.title || a.name || "").startsWith(normTarget));
    if (startsWith) return startsWith.id;

    return results[0].id;
};


// --- LIVE API ROUTES ---

// HYBRID ROUTE: Top Hits on Page 1, Deep Catalog on Page 2+
export const fetchArtistCatalog = async (req, res) => {
    const { name, page = 1 } = req.query;
    const SAAVN_API = process.env.SAAVN_API_URL; 
    
    try {
        if (parseInt(page) === 1) {
            const searchRes = await fetch(`${SAAVN_API}/search/songs?query=${encodeURIComponent(name)}&limit=40`);
            const searchJson = await searchRes.json();
            return res.json(searchJson);
        } else {
            const artistRes = await fetch(`${SAAVN_API}/search/artists?query=${encodeURIComponent(name)}`);
            const artistJson = await artistRes.json();
            
            // FIX: Use strict exact matcher
            const artistId = getExactArtistId(artistJson.data?.results, name);

            if (!artistId) return res.json({ data: { songs: [] } });

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

export const fetchArtistAlbums = async (req, res) => {
    const { name, page = 1 } = req.query;
    const SAAVN_API = process.env.SAAVN_API_URL; 
    
    try {
        const artistRes = await fetch(`${SAAVN_API}/search/artists?query=${encodeURIComponent(name)}`);
        const artistJson = await artistRes.json();
        
        // FIX: Use strict exact matcher here too!
        const artistId = getExactArtistId(artistJson.data?.results, name);

        if (!artistId) return res.json({ data: { albums: [] } });

        const albumsRes = await fetch(`${SAAVN_API}/artists/${artistId}/albums?page=${page}`);
        const albumsJson = await albumsRes.json();
        res.json(albumsJson);
    } catch (error) {
        console.error("Albums Error:", error);
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

export const fetchDefaultArtists = async (req, res) => {
    const SAAVN_API = process.env.SAAVN_API_URL; 
    
    try {
        const fetchSafe = async (url) => {
            try { 
                const response = await fetch(url); 
                return await response.json(); 
            } catch (e) { return { data: { results: [] } }; }
        };

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

        const shuffled = uniqueArtists.sort(() => 0.5 - Math.random()).slice(0, 18);
        res.json({ data: shuffled });
    } catch (error) {
        console.error("Default Artists Error:", error);
        res.status(500).json({ error: "Failed to fetch default artists" });
    }
};
// NEW: Indestructible Home Modules Fetcher (With Fallback Generation)
export const fetchHomeModules = async (req, res) => {
    const SAAVN_API = process.env.SAAVN_API_URL; 
    try {
        // 1. Try the standard modules route first
        const response = await fetch(`${SAAVN_API}/modules?language=hindi,english`);
        const data = await response.json();
        
        // 2. If the API wrapper says "route not found" (like saavn.dev), we generate our own!
        if (data.success === false || data.message?.includes('not found')) {
            console.log("Modules route missing on this API wrapper. Generating fallback modules...");
            
// Fire 3 simultaneous searches to construct the homepage feeds
            const [trendingRes, releasesRes, chartsRes] = await Promise.all([
                // FIX: Search for 'albums' here instead of 'songs'!
                fetch(`${SAAVN_API}/search/albums?query=trending bollywood&limit=12`).then(r => r.json()),
                fetch(`${SAAVN_API}/search/albums?query=new release&limit=12`).then(r => r.json()),
                fetch(`${SAAVN_API}/search/playlists?query=top charts india&limit=12`).then(r => r.json())
            ]);

            return res.json({
                data: {
                    // FIX: Map it to 'albums' so the frontend reads it correctly
                    trending: { albums: trendingRes.data?.results || [] },
                    albums: releasesRes.data?.results || [],
                    charts: chartsRes.data?.results || []
                }
            });
        }

        // If the route DID exist, return it normally
        res.json(data);
    } catch (error) {
        console.error("Home Modules Error:", error);
        res.status(500).json({ error: "Failed to fetch home modules" });
    }
};
// NEW: Fetch Playlist / Top Chart Details
export const fetchPlaylistDetails = async (req, res) => {
    const { id } = req.query;
    const SAAVN_API = process.env.SAAVN_API_URL; 
    try {
        const response = await fetch(`${SAAVN_API}/playlists?id=${id}&limit=50`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Playlist Error:", error);
        res.status(500).json({ error: "Failed to fetch playlist details" });
    }
};
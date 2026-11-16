import * as artistService from '../services/artistService.js';

// In-memory TTL cache for homepage modules (15 minutes)
let modulesCache = { data: null, expiresAt: 0 };
const MODULES_CACHE_TTL = 15 * 60 * 1000;

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
    const normalize = (str) => str.toLowerCase().replace(/\$/g, 's').replace(/[^a-z0-9\s]/g, '').trim();
    const normTarget = normalize(queryName);

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

// UPGRADED: Live Dynamic Home Modules Fetcher with 15-Minute In-Memory Cache
export const fetchHomeModules = async (req, res) => {
    const SAAVN_API = process.env.SAAVN_API_URL; 
    try {
        // Return cached modules immediately if still fresh
        if (modulesCache.data && Date.now() < modulesCache.expiresAt) {
            return res.json(modulesCache.data);
        }

        const currentYear = new Date().getFullYear();

        // 1. Fetch live editorial playlists + fresh current-year album searches in parallel
        const [trendingPlaylistSearch, hindiYearRes, punjabiYearRes, englishYearRes, chartsRes] = await Promise.all([
            fetch(`${SAAVN_API}/search/playlists?query=${encodeURIComponent(`Trending Today ${currentYear}`)}&limit=3`).then(r => r.json()).catch(() => ({})),
            fetch(`${SAAVN_API}/search/albums?query=${encodeURIComponent(`hindi ${currentYear}`)}&limit=20`).then(r => r.json()).catch(() => ({})),
            fetch(`${SAAVN_API}/search/albums?query=${encodeURIComponent(`punjabi ${currentYear}`)}&limit=15`).then(r => r.json()).catch(() => ({})),
            fetch(`${SAAVN_API}/search/albums?query=${encodeURIComponent(`english ${currentYear}`)}&limit=15`).then(r => r.json()).catch(() => ({})),
            fetch(`${SAAVN_API}/search/playlists?query=top charts india&limit=12`).then(r => r.json()).catch(() => ({}))
        ]);

        // 2. Extract real live trending albums from JioSaavn's "Trending Today" editorial playlist
        let liveTrendingAlbums = [];
        const topTrendingPlaylistId = trendingPlaylistSearch?.data?.results?.[0]?.id;
        if (topTrendingPlaylistId) {
            try {
                const plRes = await fetch(`${SAAVN_API}/playlists?id=${topTrendingPlaylistId}&limit=30`).then(r => r.json());
                const plSongs = plRes?.data?.songs || [];
                const seenAlbumIds = new Set();

                for (const song of plSongs) {
                    const alb = song.album;
                    if (alb?.id && !seenAlbumIds.has(alb.id)) {
                        seenAlbumIds.add(alb.id);
                        liveTrendingAlbums.push({
                            id: alb.id,
                            name: alb.name || song.name,
                            title: alb.name || song.name,
                            image: song.image,
                            year: song.year || String(currentYear),
                            primaryArtists: song.artists?.primary?.map(a => a.name).join(', ') || "Various Artists",
                            type: 'album'
                        });
                    }
                }
            } catch (e) {
                console.error("Failed to extract albums from trending playlist:", e.message);
            }
        }

        // 3. Combine & deduplicate fresh current-year releases, prioritizing newest year first
        const rawReleases = [
            ...(hindiYearRes?.data?.results || []),
            ...(punjabiYearRes?.data?.results || []),
            ...(englishYearRes?.data?.results || [])
        ];

        const seenReleaseIds = new Set();
        const freshReleases = [];
        for (const alb of rawReleases) {
            if (alb?.id && !seenReleaseIds.has(alb.id)) {
                seenReleaseIds.add(alb.id);
                freshReleases.push(alb);
            }
        }

        freshReleases.sort((a, b) => {
            const yearDiff = Number(b.year || 0) - Number(a.year || 0);
            return yearDiff !== 0 ? yearDiff : 0.5 - Math.random();
        });

        // If Trending Today playlist yielded fewer than 12 albums, top up from fresh current-year albums
        const usedTrendingIds = new Set(liveTrendingAlbums.map(a => a.id));
        for (const alb of freshReleases) {
            if (liveTrendingAlbums.length >= 16) break;
            if (!usedTrendingIds.has(alb.id)) {
                usedTrendingIds.add(alb.id);
                liveTrendingAlbums.push(alb);
            }
        }

        const responsePayload = {
            data: {
                trending: { albums: liveTrendingAlbums.slice(0, 12) },
                albums: freshReleases.slice(0, 12),
                charts: chartsRes?.data?.results || []
            }
        };

        modulesCache = {
            data: responsePayload,
            expiresAt: Date.now() + MODULES_CACHE_TTL
        };

        return res.json(responsePayload);
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
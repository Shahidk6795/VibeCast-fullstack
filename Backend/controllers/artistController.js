import * as artistService from '../services/artistService.js';

// In-memory TTL caches (15 minutes)
let modulesCache = { data: null, expiresAt: 0 };
let defaultArtistsCache = { data: null, expiresAt: 0 };
const CACHE_TTL = 15 * 60 * 1000;

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

// RELIABLE HYBRID CATALOG: Tries Official Artist ID first, falls back to Multi-Query Search for Foreign Artists
export const fetchArtistCatalog = async (req, res) => {
    const { name, page = 1 } = req.query;
    const SAAVN_API = process.env.SAAVN_API_URL; 
    
    try {
        const pageNum = parseInt(page) || 1;
        const artistRes = await fetch(`${SAAVN_API}/search/artists?query=${encodeURIComponent(name)}&limit=10`);
        const artistJson = await artistRes.json();
        const artistId = getExactArtistId(artistJson.data?.results, name);

        if (artistId) {
            const targetPage = pageNum - 1;
            const songsRes = await fetch(`${SAAVN_API}/artists/${artistId}/songs?page=${targetPage}`);
            const songsJson = await songsRes.json();
            const artistSongs =
                songsJson?.data?.songs ||
                songsJson?.data?.topSongs ||
                songsJson?.data?.results ||
                [];

            if (artistSongs.length > 0) {
                return res.json({ data: { songs: artistSongs } });
            }
        }

        // Reliable Fallback for Foreign Artists (Drake, The Weeknd, Taylor Swift, etc.)
        const [directSearch, hitsSearch] = await Promise.all([
            fetch(`${SAAVN_API}/search/songs?query=${encodeURIComponent(name)}&page=${pageNum}&limit=30`)
                .then(r => r.json())
                .catch(() => ({})),
            pageNum === 1
                ? fetch(`${SAAVN_API}/search/songs?query=${encodeURIComponent(`${name} hits`)}&page=1&limit=20`)
                    .then(r => r.json())
                    .catch(() => ({}))
                : Promise.resolve({})
        ]);

        const combined = [
            ...(directSearch?.data?.results || []),
            ...(hitsSearch?.data?.results || [])
        ];

        const seenIds = new Set();
        const deduped = [];
        for (const s of combined) {
            if (s?.id && !seenIds.has(s.id)) {
                seenIds.add(s.id);
                deduped.push(s);
            }
        }

        return res.json({ data: { songs: deduped } });
    } catch (error) {
        console.error("Catalog Error:", error);
        res.status(500).json({ error: "Failed to fetch artist catalog" });
    }
};

// UPGRADED: Fetches Artist Albums with Automatic Search Fallback for Foreign Artists
export const fetchArtistAlbums = async (req, res) => {
    const { name, page = 1 } = req.query;
    const SAAVN_API = process.env.SAAVN_API_URL; 
    
    try {
        const pageNum = parseInt(page) || 1;
        const artistRes = await fetch(`${SAAVN_API}/search/artists?query=${encodeURIComponent(name)}&limit=10`);
        const artistJson = await artistRes.json();
        const artistId = getExactArtistId(artistJson.data?.results, name);

        if (artistId) {
            const albumsRes = await fetch(`${SAAVN_API}/artists/${artistId}/albums?page=${pageNum}`);
            const albumsJson = await albumsRes.json();
            const directAlbums =
                albumsJson?.data?.albums ||
                albumsJson?.data?.topAlbums ||
                albumsJson?.data?.results ||
                [];

            if (directAlbums.length > 0) {
                return res.json({ data: { albums: directAlbums } });
            }
        }

        // Fallback: Search albums directly by artist name & filter out tribute/karaoke clones
        const fallbackRes = await fetch(
            `${SAAVN_API}/search/albums?query=${encodeURIComponent(name)}&page=${pageNum}&limit=25`
        );
        const fallbackJson = await fallbackRes.json();
        const rawAlbums = fallbackJson?.data?.results || [];
        const coreTarget = name.toLowerCase().replace(/^the\s+/, '').trim();

        const genuineAlbums = rawAlbums.filter((alb) => {
            const titleLower = (alb.name || alb.title || "").toLowerCase();
            if (titleLower.includes("tribute") || titleLower.includes("karaoke") || titleLower.includes("cover")) {
                return false;
            }
            const artistsStr = (
                alb.primaryArtists ||
                alb.artists?.primary?.map((a) => a.name).join(", ") ||
                alb.subtitle ||
                ""
            ).toLowerCase();
            return !artistsStr || artistsStr.includes(coreTarget);
        });

        return res.json({
            data: {
                albums: genuineAlbums.length > 0 ? genuineAlbums : rawAlbums
            }
        });
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

// UPGRADED: Verified Default Artists Roster (Eliminates fake/fan profiles & empty avatars)
export const fetchDefaultArtists = async (req, res) => {
    const SAAVN_API = process.env.SAAVN_API_URL; 
    
    try {
        let verifiedPool = defaultArtistsCache.data;

        if (!verifiedPool || Date.now() >= defaultArtistsCache.expiresAt) {
            const verifiedArtistRoster = [
                "Arijit Singh", "Pritam", "Shreya Ghoshal", "A.R. Rahman",
                "Anirudh Ravichander", "Diljit Dosanjh", "Karan Aujla", "AP Dhillon",
                "Badshah", "Divine", "KR$NA", "Anuv Jain",
                "Jubin Nautiyal", "Atif Aslam", "Sonu Nigam", "Sunidhi Chauhan",
                "Vishal Mishra", "Sachin-Jigar", "Amit Trivedi", "Darshan Raval",
                "The Weeknd", "Taylor Swift", "Drake", "Dua Lipa"
            ];

            const fetchSafe = async (artistName) => {
                try { 
                    const response = await fetch(`${SAAVN_API}/search/artists?query=${encodeURIComponent(artistName)}&limit=5`); 
                    const json = await response.json();
                    const results = json.data?.results || [];
                    if (results.length === 0) return null;

                    const exactId = getExactArtistId(results, artistName);
                    const matched = results.find(a => a.id === exactId) || results[0];

                    const imgStr = Array.isArray(matched.image)
                        ? (matched.image[matched.image.length - 1]?.url || matched.image[matched.image.length - 1]?.link || "")
                        : (matched.image?.url || matched.image || "");

                    if (!imgStr || imgStr.includes("default") || imgStr.includes("placeholder")) {
                        return null;
                    }

                    return {
                        id: matched.id,
                        name: matched.title || matched.name || artistName,
                        image: matched.image,
                        genre: matched.description || matched.role || "Verified Artist"
                    };
                } catch {
                    return null;
                }
            };

            const resolved = await Promise.all(verifiedArtistRoster.map(fetchSafe));

            const uniqueArtists = [];
            const seen = new Set();

            for (const artist of resolved) {
                if (artist && !seen.has(artist.id)) {
                    seen.add(artist.id);
                    uniqueArtists.push(artist);
                }
            }

            verifiedPool = uniqueArtists;
            defaultArtistsCache = {
                data: verifiedPool,
                expiresAt: Date.now() + CACHE_TTL
            };
        }

        const shuffled = [...verifiedPool].sort(() => 0.5 - Math.random()).slice(0, 18);
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
        if (modulesCache.data && Date.now() < modulesCache.expiresAt) {
            return res.json(modulesCache.data);
        }

        const currentYear = new Date().getFullYear();

        const [trendingPlaylistSearch, hindiYearRes, punjabiYearRes, englishYearRes, chartsRes] = await Promise.all([
            fetch(`${SAAVN_API}/search/playlists?query=${encodeURIComponent(`Trending Today ${currentYear}`)}&limit=3`).then(r => r.json()).catch(() => ({})),
            fetch(`${SAAVN_API}/search/albums?query=${encodeURIComponent(`hindi ${currentYear}`)}&limit=20`).then(r => r.json()).catch(() => ({})),
            fetch(`${SAAVN_API}/search/albums?query=${encodeURIComponent(`punjabi ${currentYear}`)}&limit=15`).then(r => r.json()).catch(() => ({})),
            fetch(`${SAAVN_API}/search/albums?query=${encodeURIComponent(`english ${currentYear}`)}&limit=15`).then(r => r.json()).catch(() => ({})),
            fetch(`${SAAVN_API}/search/playlists?query=top charts india&limit=12`).then(r => r.json()).catch(() => ({}))
        ]);

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
            expiresAt: Date.now() + CACHE_TTL
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
import * as artistService from '../services/artistService.js';
import * as saavn from '../utils/saavnNative.js';

let modulesCache = { data: null, expiresAt: 0 };
let defaultArtistsCache = { data: null, expiresAt: 0 };
const CACHE_TTL = 15 * 60 * 1000;

// --- DATABASE FUNCTIONS ---
export const addArtist = async (req, res) => {
  const { name, image_url, quote } = req.body;
  try {
    const result = await artistService.createArtist(name, image_url, quote);
    res.status(201).json({ id: result.insertId, name, image_url, quote });
  } catch {
    res.status(500).json({ error: 'Failed to add artist' });
  }
};

export const fetchArtistByName = async (req, res) => {
  try {
    const rows = await artistService.getArtistByName(req.params.artistName);
    if (rows.length > 0) res.json(rows[0]);
    else res.status(404).json({ error: 'Artist not found' });
  } catch {
    res.status(500).json({ error: 'Failed to fetch artist details' });
  }
};

export const fetchAllArtists = async (req, res) => {
  try {
    const rows = await artistService.getAllArtists();
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch artists' });
  }
};

export const deleteArtist = async (req, res) => {
  try {
    await artistService.removeArtist(req.params.id);
    res.status(200).json({ message: 'Artist deleted successfully' });
  } catch {
    res.status(500).json({ error: 'Failed to delete artist' });
  }
};

// --- HELPER: EXACT ARTIST ID MATCHER ---
const getExactArtistId = (results, queryName) => {
  if (!results || results.length === 0) return null;
  const target = queryName.toLowerCase().trim();
  const exact = results.find((a) => (a.title || a.name || '').toLowerCase().trim() === target);
  if (exact) return exact.id;

  const normalize = (str) => str.toLowerCase().replace(/\$/g, 's').replace(/[^a-z0-9\s]/g, '').trim();
  const normTarget = normalize(queryName);
  const exactNorm = results.find((a) => normalize(a.title || a.name || '') === normTarget);
  if (exactNorm) return exactNorm.id;

  const startsWith = results.find((a) => normalize(a.title || a.name || '').startsWith(normTarget));
  return startsWith ? startsWith.id : results[0].id;
};

// --- LIVE NATIVE API ROUTES ---
export const fetchArtistCatalog = async (req, res) => {
  const { name, page = 1 } = req.query;
  try {
    const pageNum = parseInt(page) || 1;
    const artists = await saavn.searchArtists(name, 10);
    const artistId = getExactArtistId(artists, name);

    if (artistId) {
      const { songs } = await saavn.getArtistPage(artistId, pageNum - 1);
      if (songs.length > 0) return res.json({ data: { songs } });
    }

    const [directSearch, hitsSearch] = await Promise.all([
      saavn.searchSongs(name, 30, pageNum).catch(() => []),
      pageNum === 1 ? saavn.searchSongs(`${name} hits`, 20, 1).catch(() => []) : Promise.resolve([])
    ]);

    const seenIds = new Set();
    const deduped = [...directSearch, ...hitsSearch].filter((s) => {
      if (!s?.id || seenIds.has(s.id)) return false;
      seenIds.add(s.id);
      return true;
    });

    return res.json({ data: { songs: deduped } });
  } catch (error) {
    console.error('Catalog Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch artist catalog' });
  }
};

export const fetchArtistAlbums = async (req, res) => {
  const { name, page = 1 } = req.query;
  try {
    const pageNum = parseInt(page) || 1;
    const artists = await saavn.searchArtists(name, 10);
    const artistId = getExactArtistId(artists, name);

    if (artistId) {
      const { albums } = await saavn.getArtistPage(artistId, pageNum - 1);
      if (albums.length > 0) return res.json({ data: { albums } });
    }

    const rawAlbums = await saavn.searchAlbums(name, 25, pageNum);
    const coreTarget = name.toLowerCase().replace(/^the\s+/, '').trim();

    const genuineAlbums = rawAlbums.filter((alb) => {
      const titleLower = (alb.name || '').toLowerCase();
      if (titleLower.includes('tribute') || titleLower.includes('karaoke') || titleLower.includes('cover')) {
        return false;
      }
      const artistsStr = (alb.primaryArtists || '').toLowerCase();
      return !artistsStr || artistsStr.includes(coreTarget);
    });

    return res.json({ data: { albums: genuineAlbums.length > 0 ? genuineAlbums : rawAlbums } });
  } catch (error) {
    console.error('Albums Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch artist albums' });
  }
};

export const searchLiveArtists = async (req, res) => {
  const { query } = req.query;
  try {
    if (!query) return res.json({ data: { results: [] } });
    const results = await saavn.searchArtists(query, 15);
    res.json({ success: true, data: { results } });
  } catch (error) {
    console.error('Live Artist Search Error:', error.message);
    res.status(500).json({ error: 'Failed to search live artists' });
  }
};

export const fetchDefaultArtists = async (req, res) => {
  try {
    let verifiedPool = defaultArtistsCache.data;

    if (!verifiedPool || Date.now() >= defaultArtistsCache.expiresAt) {
      const verifiedArtistRoster = [
        'Arijit Singh', 'Pritam', 'Shreya Ghoshal', 'A.R. Rahman',
        'Anirudh Ravichander', 'Diljit Dosanjh', 'Karan Aujla', 'AP Dhillon',
        'Badshah', 'Divine', 'KR$NA', 'Anuv Jain',
        'Jubin Nautiyal', 'Atif Aslam', 'Sonu Nigam', 'Sunidhi Chauhan',
        'Vishal Mishra', 'Sachin-Jigar', 'Amit Trivedi', 'Darshan Raval',
        'The Weeknd', 'Taylor Swift', 'Drake', 'Dua Lipa'
      ];

      const fetchSafe = async (artistName) => {
        try {
          const results = await saavn.searchArtists(artistName, 5);
          if (results.length === 0) return null;
          const exactId = getExactArtistId(results, artistName);
          const matched = results.find((a) => a.id === exactId) || results[0];
          const imgStr = matched.image?.[matched.image.length - 1]?.url || '';
          if (!imgStr || imgStr.includes('default') || imgStr.includes('placeholder')) return null;

          return {
            id: matched.id,
            name: matched.name || artistName,
            image: matched.image,
            genre: matched.role || 'Verified Artist'
          };
        } catch {
          return null;
        }
      };

      const resolved = await Promise.all(verifiedArtistRoster.map(fetchSafe));
      const seen = new Set();
      verifiedPool = resolved.filter((a) => a && !seen.has(a.id) && seen.add(a.id));
      defaultArtistsCache = { data: verifiedPool, expiresAt: Date.now() + CACHE_TTL };
    }

    const shuffled = [...verifiedPool].sort(() => 0.5 - Math.random()).slice(0, 18);
    res.json({ data: shuffled });
  } catch (error) {
    console.error('Default Artists Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch default artists' });
  }
};

export const fetchHomeModules = async (req, res) => {
  try {
    if (modulesCache.data && Date.now() < modulesCache.expiresAt) {
      return res.json(modulesCache.data);
    }

    const currentYear = new Date().getFullYear();
    const [trendingPlaylists, hindiAlbums, punjabiAlbums, englishAlbums, charts] = await Promise.all([
      saavn.searchPlaylists(`Trending Today ${currentYear}`, 3).catch(() => []),
      saavn.searchAlbums(`hindi ${currentYear}`, 20).catch(() => []),
      saavn.searchAlbums(`punjabi ${currentYear}`, 15).catch(() => []),
      saavn.searchAlbums(`english ${currentYear}`, 15).catch(() => []),
      saavn.searchPlaylists('top charts india', 12).catch(() => [])
    ]);

    let liveTrendingAlbums = [];
    const topPlaylistId = trendingPlaylists?.[0]?.id;
    if (topPlaylistId) {
      try {
        const plData = await saavn.getPlaylistDetails(topPlaylistId);
        const seenAlbumIds = new Set();
        for (const song of plData.songs || []) {
          if (song.album?.id && !seenAlbumIds.has(song.album.id)) {
            seenAlbumIds.add(song.album.id);
            liveTrendingAlbums.push({
              id: song.album.id,
              name: song.album.name || song.name,
              title: song.album.name || song.name,
              image: song.image,
              year: song.year || String(currentYear),
              primaryArtists: song.primaryArtists || 'Various Artists',
              type: 'album'
            });
          }
        }
      } catch (e) {
        console.error('Trending playlist extraction failed:', e.message);
      }
    }

    const seenReleaseIds = new Set();
    const freshReleases = [...hindiAlbums, ...punjabiAlbums, ...englishAlbums].filter((alb) => {
      if (!alb?.id || seenReleaseIds.has(alb.id)) return false;
      seenReleaseIds.add(alb.id);
      return true;
    });

    freshReleases.sort((a, b) => {
      const yearDiff = Number(b.year || 0) - Number(a.year || 0);
      return yearDiff !== 0 ? yearDiff : 0.5 - Math.random();
    });

    const usedTrendingIds = new Set(liveTrendingAlbums.map((a) => a.id));
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
        charts
      }
    };

    modulesCache = { data: responsePayload, expiresAt: Date.now() + CACHE_TTL };
    return res.json(responsePayload);
  } catch (error) {
    console.error('Home Modules Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch home modules' });
  }
};

export const fetchPlaylistDetails = async (req, res) => {
  try {
    const data = await saavn.getPlaylistDetails(req.query.id);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Playlist Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch playlist details' });
  }
};
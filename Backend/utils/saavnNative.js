import axios from 'axios';
import crypto from 'crypto';

const SAAVN_BASE = 'https://www.jiosaavn.com/api.php';
const SAAVN_KEY = Buffer.from('38346591', 'utf8');

export const decryptAudioUrl = (encryptedUrl) => {
  if (!encryptedUrl) return '';
  try {
    const decipher = crypto.createDecipheriv('des-ecb', SAAVN_KEY, null);
    let decrypted = decipher.update(encryptedUrl, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted.replace('_96.mp4', '_320.mp4');
  } catch (err) {
    console.error('Decryption failed:', err.message);
    return '';
  }
};

const cleanText = (str = '') =>
  String(str)
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&');

const formatImage = (url = '') => {
  const highRes = url ? url.replace(/150x150|50x50/g, '500x500') : '';
  return [
    { quality: '150x150', url: url || '' },
    { quality: '500x500', url: highRes }
  ];
};

export const formatSong = (song) => {
  const encrypted = song.more_info?.encrypted_media_url || song.encrypted_media_url || '';
  const audioUrl = decryptAudioUrl(encrypted);
  const artistsStr =
    song.more_info?.primary_artists ||
    song.more_info?.singers ||
    song.primary_artists ||
    song.subtitle ||
    'Unknown Artist';

  return {
    id: song.id,
    name: cleanText(song.title || song.song || 'Unknown'),
    title: cleanText(song.title || song.song || 'Unknown'),
    year: song.year || '',
    duration: parseInt(song.more_info?.duration || song.duration || '0', 10),
    album: {
      id: song.more_info?.album_id || song.albumid || '',
      name: cleanText(song.more_info?.album || song.album || '')
    },
    artists: {
      primary: artistsStr.split(',').map((a) => ({ name: cleanText(a.trim()) }))
    },
    primaryArtists: cleanText(artistsStr),
    image: formatImage(song.image),
    downloadUrl: audioUrl ? [{ quality: '320kbps', url: audioUrl }] : []
  };
};

export const formatAlbum = (alb) => {
  const artistsStr =
    alb.more_info?.music ||
    alb.more_info?.artistMap?.primary_artists?.map((a) => a.name).join(', ') ||
    alb.subtitle ||
    'Various Artists';

  return {
    id: alb.id || alb.albumid,
    name: cleanText(alb.title || alb.name || 'Unknown Album'),
    title: cleanText(alb.title || alb.name || 'Unknown Album'),
    year: alb.year || '',
    songCount: Number(alb.more_info?.song_count || alb.song_count || alb.list_count || 0),
    primaryArtists: cleanText(artistsStr),
    image: formatImage(alb.image),
    type: 'album'
  };
};

export const formatArtist = (art) => ({
  id: art.id,
  name: cleanText(art.name || art.title || ''),
  title: cleanText(art.name || art.title || ''),
  role: art.role || art.description || 'Artist',
  image: formatImage(art.image)
});

export const formatPlaylist = (pl) => ({
  id: pl.id || pl.listid,
  name: cleanText(pl.title || pl.listname || 'Playlist'),
  title: cleanText(pl.title || pl.listname || 'Playlist'),
  image: formatImage(pl.image),
  songCount: Number(pl.more_info?.song_count || pl.list_count || 0),
  type: 'playlist'
});

const saavnGet = async (params) => {
  const { data } = await axios.get(SAAVN_BASE, {
    params: {
      _format: 'json',
      _marker: 0,
      api_version: 4,
      ctx: 'web6dot0',
      ...params
    },
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    },
    timeout: 8000
  });
  return data;
};

export const searchSongs = async (q, limit = 20, page = 1) => {
  const data = await saavnGet({ __call: 'search.getResults', q, n: limit, p: page });
  return (data?.results || []).map(formatSong).filter((s) => s.downloadUrl.length > 0);
};

export const searchAlbums = async (q, limit = 20, page = 1) => {
  const data = await saavnGet({ __call: 'search.getAlbumResults', q, n: limit, p: page });
  return (data?.results || []).map(formatAlbum);
};

export const searchArtists = async (q, limit = 10, page = 1) => {
  const data = await saavnGet({ __call: 'search.getArtistResults', q, n: limit, p: page });
  return (data?.results || []).map(formatArtist);
};

export const searchPlaylists = async (q, limit = 12, page = 1) => {
  const data = await saavnGet({ __call: 'search.getPlaylistResults', q, n: limit, p: page });
  return (data?.results || []).map(formatPlaylist);
};

export const getArtistPage = async (artistId, page = 0) => {
  const data = await saavnGet({
    __call: 'artist.getArtistPageDetails',
    artistId,
    n_song: 20,
    n_album: 20,
    page
  });
  return {
    songs: (data?.topSongs || []).map(formatSong).filter((s) => s.downloadUrl.length > 0),
    albums: (data?.topAlbums || []).map(formatAlbum)
  };
};

export const getAlbumDetails = async (albumid) => {
  const data = await saavnGet({ __call: 'content.getAlbumDetails', albumid });
  return {
    ...formatAlbum(data),
    songs: (data?.list || []).map(formatSong).filter((s) => s.downloadUrl.length > 0)
  };
};

export const getPlaylistDetails = async (listid) => {
  const data = await saavnGet({ __call: 'playlist.getDetails', listid });
  return {
    ...formatPlaylist(data),
    songs: (data?.list || []).map(formatSong).filter((s) => s.downloadUrl.length > 0)
  };
};
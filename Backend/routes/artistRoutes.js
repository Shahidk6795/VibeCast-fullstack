import express from 'express';
import * as artistController from '../controllers/artistController.js';

const router = express.Router();

router.get('/', artistController.fetchAllArtists);
router.get('/catalog', artistController.fetchArtistCatalog);
router.get('/albums', artistController.fetchArtistAlbums);
router.get('/search', artistController.searchLiveArtists);
router.get('/default', artistController.fetchDefaultArtists);
router.get('/modules', artistController.fetchHomeModules);
router.get('/playlists', artistController.fetchPlaylistDetails);
router.get('/name/:artistName', artistController.fetchArtistByName);

export default router;
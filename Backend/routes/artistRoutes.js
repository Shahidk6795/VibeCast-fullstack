import express from 'express';
import * as artistController from '../controllers/artistController.js';

const router = express.Router();

router.post('/', artistController.addArtist);
router.get('/', artistController.fetchAllArtists);
router.get('/catalog', artistController.fetchArtistCatalog); 
router.get('/albums', artistController.fetchArtistAlbums); 

router.get('/search', artistController.searchLiveArtists); 

router.get('/name/:artistName', artistController.fetchArtistByName);
router.delete('/:id', artistController.deleteArtist);

export default router;
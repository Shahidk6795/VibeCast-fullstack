import express from 'express';
import * as artistController from '../controllers/artistController.js';

const router = express.Router();

router.post('/', artistController.addArtist);
router.get('/', artistController.fetchAllArtists);

// NEW ROUTE: Placed here so it isn't mistaken for a dynamic ID
router.get('/catalog', artistController.fetchArtistCatalog); 

router.get('/name/:artistName', artistController.fetchArtistByName);
router.delete('/:id', artistController.deleteArtist);

export default router;
import express from 'express';
import * as trackController from '../controllers/trackController.js';

const router = express.Router();

router.get('/', trackController.getTracks);
router.get('/artist/:artistName', trackController.getArtistTracks);

export default router;
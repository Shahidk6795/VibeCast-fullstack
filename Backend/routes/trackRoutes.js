import express from 'express';
import * as trackController from '../controllers/trackController.js';

const router = express.Router();

router.get('/', trackController.getTracks);
router.post('/', trackController.addTrack);
router.get('/artist/:artistName', trackController.getArtistTracks);
router.put('/edit-artist/:id', trackController.editTrackArtist);
router.put('/fix-duration/:id', trackController.fixTrackDuration);
router.put('/admin/:id', trackController.adminUpdateTrack);
router.delete('/admin/:id', trackController.adminDeleteTrack);

export default router;
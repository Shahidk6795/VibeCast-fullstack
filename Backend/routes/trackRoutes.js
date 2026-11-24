import express from 'express';
import * as trackController from '../controllers/trackController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', trackController.getTracks);
router.post('/', trackController.addTrack);
router.get('/artist/:artistName', trackController.getArtistTracks);
router.put('/edit-artist/:id', requireAuth, requireAdmin, trackController.editTrackArtist);
router.put('/fix-duration/:id', requireAuth, requireAdmin, trackController.fixTrackDuration);
router.put('/admin/:id', requireAuth, requireAdmin, trackController.adminUpdateTrack);
router.delete('/admin/:id', requireAuth, requireAdmin, trackController.adminDeleteTrack);

export default router;
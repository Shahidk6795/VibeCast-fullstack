import express from 'express';
import * as moodsController from '../controllers/moodsController.js';
const router = express.Router();

router.get('/:id/tracks', moodsController.fetchMoodTracks);
export default router;
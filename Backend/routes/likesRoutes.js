import express from 'express';
import * as likesController from '../controllers/likesController.js';
const router = express.Router();

router.get('/:email', likesController.fetchLikes);
router.post('/', likesController.likeTrack);
router.post('/check', likesController.checkIsLiked);
router.delete('/', likesController.unlikeTrack);
export default router;
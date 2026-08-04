import express from 'express';
import * as playlistController from '../controllers/playlistController.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.get('/details/:id', playlistController.fetchPlaylistDetails);
router.post('/', playlistController.addPlaylist);
router.get('/user/:email', playlistController.fetchUserPlaylists);
router.get('/:email', playlistController.fetchUserPlaylists);
router.put('/:id/name', playlistController.editPlaylistName);
router.delete('/:id', playlistController.removePlaylist);
router.post('/:id/tracks', playlistController.addTrack);
router.get('/:id/tracks', playlistController.fetchTracks);
router.delete('/:playlistId/tracks/:trackId', playlistController.removeTrack);
router.post('/songs', playlistController.addSong);
router.get('/:id/songs', playlistController.fetchSongs);
router.delete('/songs/:id', playlistController.removeSong);

router.post('/:id/cover', upload.single('coverImage'), playlistController.uploadCover);

export default router;
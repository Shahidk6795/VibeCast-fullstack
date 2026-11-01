import * as likesService from '../services/likesService.js';

export const fetchLikes = async (req, res) => {
  try { 
    res.json(await likesService.getLikesByUser(req.params.email)); 
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
};

export const likeTrack = async (req, res) => {
  try { 
    // Pass the entire req.body so the service has title, artist, and cover art
    await likesService.addLike(req.body); 
    res.json({ message: 'Track Liked!' }); 
  } catch (err) { 
    console.error("Like Error:", err);
    res.status(500).json({ error: err.message }); 
  }
};

export const checkIsLiked = async (req, res) => {
  try { 
    res.json({ isLiked: await likesService.checkLike(req.body.email, req.body.audio_url) }); 
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
};

export const unlikeTrack = async (req, res) => {
  try { 
    await likesService.removeLike(req.body.email, req.body.audio_url); 
    res.json({ message: 'Track unliked!' }); 
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
};
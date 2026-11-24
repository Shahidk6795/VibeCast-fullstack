import * as likesService from '../services/likesService.js';

const resolveAuthorizedEmail = (req, requestedEmail) => {
  const tokenEmail = (req.user?.email || '').trim().toLowerCase();
  const normalizedRequested = requestedEmail
    ? decodeURIComponent(String(requestedEmail)).trim().toLowerCase()
    : tokenEmail;

  if (!tokenEmail || normalizedRequested !== tokenEmail) {
    return null;
  }
  return tokenEmail;
};

export const fetchLikes = async (req, res) => {
  const email = resolveAuthorizedEmail(req, req.params.email);
  if (!email) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    res.json(await likesService.getLikesByUser(email));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const likeTrack = async (req, res) => {
  const email = resolveAuthorizedEmail(req, req.body.email);
  if (!email) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    await likesService.addLike({ ...req.body, email });
    res.json({ message: 'Track Liked!' });
  } catch (err) {
    console.error("Like Error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const checkIsLiked = async (req, res) => {
  const email = resolveAuthorizedEmail(req, req.body.email);
  if (!email) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    res.json({ isLiked: await likesService.checkLike(email, req.body.audio_url) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const unlikeTrack = async (req, res) => {
  const email = resolveAuthorizedEmail(req, req.body.email);
  if (!email) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    await likesService.removeLike(email, req.body.audio_url);
    res.json({ message: 'Track unliked!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
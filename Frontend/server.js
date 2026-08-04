import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
const PORT = 4000;

app.use(cors());

const clientId = "7dbcd0878e6a443c88639fde9b2399f2";
const clientSecret = "c85542a438614b3a8c499c0d6ddb45d2";
const playlistId = "0cjltBetmIjATWCy91wmXq";

app.get("/pritam", async (req, res) => {
  try {
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    // 1️⃣ Get access token
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return res.status(500).json({ error: "Failed to get access token", details: tokenData });
    }

    const accessToken = tokenData.access_token;

    // 2️⃣ Get playlist tracks
    const playlistRes = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const playlistData = await playlistRes.json();

    if (!playlistData.items) {
      return res.status(500).json({ error: "Failed to fetch playlist", details: playlistData });
    }

    // 3️⃣ Format tracks
    const tracks = playlistData.items
      .map(item => item.track)
      .filter(Boolean)
      .map(track => ({
        name: track.name,
        artists: track.artists.map(a => a.name).join(", "),
        image: track.album.images[0]?.url,
        previewUrl: track.preview_url,
        durationMs: track.duration_ms,
      }));

    res.json({ tracks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch playlist", details: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

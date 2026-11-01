import axios from 'axios';

export const searchJioSaavn = async (req, res) => {
  try {
    const searchQuery = req.query.query;
    
    // Remove any accidental trailing slashes from your .env variable
    const baseUrl = (process.env.SAAVN_API_URL || '').replace(/\/$/, '');
    
    if (!baseUrl) {
        return res.status(500).json({ error: "SAAVN_API_URL is missing" });
    }

    // Construct the URL. (If your API fork doesn't use the '/api' prefix, you may need to adjust this)
    const targetUrl = `${baseUrl}/search/songs?query=${searchQuery}`;
    
    // This will print to your Render logs so you can see exactly why it 404s
    console.log("Attempting to fetch from:", targetUrl);

    const response = await axios.get(targetUrl);
    res.json(response.data);

  } catch (error) {
    console.error("Music Fetch Error:", error.message);
    res.status(500).json({ error: "Failed to fetch songs from the music API" });
  }
};
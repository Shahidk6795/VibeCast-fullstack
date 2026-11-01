import express from 'express';
const router = express.Router();

router.get('/:id', async (req, res) => {
    try {
        const SAAVN_API = process.env.SAAVN_API_URL;
        const response = await fetch(`${SAAVN_API}/albums?id=${req.params.id}`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Album Detail Error:", error);
        res.status(500).json({ error: "Failed to fetch album tracks" });
    }
});

export default router;
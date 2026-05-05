const express = require("express");
const axios = require("axios");
const router = express.Router();

const BASE = "https://api.rawg.io/api";
const KEY = process.env.RAWG_API_KEY;

// Rastgele oyun listesi — quiz için kullanılır
router.get("/random", async (req, res) => {
  try {
    const page = Math.floor(Math.random() * 20) + 1;
    const { data } = await axios.get(`${BASE}/games`, {
      params: {
        key: KEY,
        page,
        page_size: 20,
        min_rating: 3,
        ordering: "-rating",
      },
    });
    const games = data.results.filter((g) => g.background_image);
    res.json(games);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tek oyun detayı
router.get("/:id", async (req, res) => {
  try {
    const { data } = await axios.get(`${BASE}/games/${req.params.id}`, {
      params: { key: KEY },
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

const express = require("express");
const axios = require("axios");
const router = express.Router();

const BASE = "https://api.rawg.io/api";
const KEY = process.env.RAWG_API_KEY;

const cache = new Map();
function getCache(key) {
  const e = cache.get(key);
  if (!e || Date.now() - e.t > e.ttl) { cache.delete(key); return null; }
  return e.v;
}
function setCache(key, val, ttl) { cache.set(key, { v: val, t: Date.now(), ttl }); }

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

function firstSentence(text, maxLen = 220) {
  if (!text) return '';
  const match = text.trim().match(/^.+?[.!?](?=\s|$)/);
  const s = match ? match[0].trim() : text.slice(0, maxLen);
  return s.length > maxLen ? s.slice(0, maxLen - 1) + '…' : s;
}

// Oyun tarihi bilgisi — baloncuk easter egg için
router.get("/trivia", async (req, res) => {
  try {
    const page = Math.floor(Math.random() * 6) + 1;
    const cacheKey = `trivia_list_${page}`;
    let games = getCache(cacheKey);

    if (!games) {
      const { data } = await axios.get(`${BASE}/games`, {
        params: {
          key: KEY,
          page,
          page_size: 40,
          ordering: '-metacritic',
          metacritic: '85,100',
          dates: '1980-01-01,2015-12-31',
        },
      });
      games = data.results.filter(g => g.metacritic > 0 && g.released && g.background_image);
      setCache(cacheKey, games, 30 * 60 * 1000);
    }

    if (!games.length) return res.status(404).json({ error: 'No games found' });

    const game = games[Math.floor(Math.random() * games.length)];
    const year = game.released.slice(0, 4);

    const { data: detail } = await axios.get(`${BASE}/games/${game.id}`, { params: { key: KEY } });

    const rawText = detail.description_raw || stripHtml(detail.description || '');
    const sentence = firstSentence(rawText);
    const fact = sentence && sentence.length > 20
      ? sentence
      : `${game.name} oyunu ${year} yılında piyasaya çıktı ve Metacritic'te ${game.metacritic}/100 puan aldı.`;

    res.json({
      name: game.name,
      year,
      metacritic: game.metacritic,
      genre: game.genres?.[0]?.name || '',
      fact,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

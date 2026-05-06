const express = require('express');
const axios = require('axios');
const router = express.Router();

const BASE = 'https://api.rawg.io/api';
const KEY = process.env.RAWG_API_KEY;
const TTL = 30 * 60 * 1000;

const cache = new Map();
function getCache(key) {
  const e = cache.get(key);
  if (!e) return null;
  if (Date.now() - e.t > TTL) { cache.delete(key); return null; }
  return e.v;
}
function setCache(key, val) {
  cache.set(key, { v: val, t: Date.now() });
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const isEnglishTag = (name) => /^[\x00-\x7F\s\-'&.,!?()]+$/.test(name);

function toCard(g) {
  return {
    id: g.id,
    name: g.name,
    image: g.background_image,
    metacritic: g.metacritic || null,
    genres: (g.genres || []).map(x => x.name).slice(0, 3),
  };
}

router.get('/', async (req, res) => {
  const gameName = req.query.game?.trim();
  if (!gameName) return res.status(400).json({ error: 'Oyun adı gerekli' });

  const cacheKey = `rec_${gameName.toLowerCase()}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    // 1. Oyunu ara — en popüleri seç (metacritic öncelikli, sonra ratings_count)
    const pickMostPopular = (results) =>
      results.reduce((best, g) => {
        const score = (g) => (g.metacritic || 0) * 1000 + (g.ratings_count || 0);
        return score(g) > score(best) ? g : best;
      });

    let searchRes = await axios.get(`${BASE}/games`, {
      params: { key: KEY, search: gameName, page_size: 10, search_precise: true },
    });
    let results = searchRes.data.results;

    if (!results.length) {
      searchRes = await axios.get(`${BASE}/games`, {
        params: { key: KEY, search: gameName, page_size: 10 },
      });
      results = searchRes.data.results;
    }
    if (!results.length) return res.status(404).json({ error: 'Oyun bulunamadı' });

    const found = pickMostPopular(results);

    // 2. Detay çek
    const detailRes = await axios.get(`${BASE}/games/${found.id}`, { params: { key: KEY } });
    const detail = detailRes.data;

    const englishTags = (detail.tags || []).filter(t => isEnglishTag(t.name));
    const genres = detail.genres || [];

    // 3. İki farklı arama yap: biri genre+özgün tag, biri game-series — paralel
    const genreIds = genres.map(g => g.id).join(',');

    // Popüler olmayan tag'ler (index 3-12) daha özgün sonuç verir
    const nicheTagIds = shuffle(englishTags.slice(3, 12)).slice(0, 3).map(t => t.id).join(',');
    // Popüler tag'ler (index 0-3) genre ile birlikte temel benzerlik
    const broadTagIds = englishTags.slice(0, 3).map(t => t.id).join(',');

    const [nichRes, broadRes, seriesRes] = await Promise.allSettled([
      // Özgün tag'lerle arama — ratings'e göre, farklı sayfa
      axios.get(`${BASE}/games`, {
        params: {
          key: KEY,
          tags: nicheTagIds || undefined,
          genres: genreIds || undefined,
          ordering: '-rating',
          page_size: 20,
          page: Math.floor(Math.random() * 3) + 1,
        },
      }),
      // Genel tag+genre araması
      axios.get(`${BASE}/games`, {
        params: {
          key: KEY,
          tags: broadTagIds || undefined,
          genres: genreIds || undefined,
          ordering: '-added',
          page_size: 20,
          metacritic: '70,100',
        },
      }),
      // Aynı seriden oyunlar
      axios.get(`${BASE}/games/${found.id}/game-series`, {
        params: { key: KEY, page_size: 10 },
      }),
    ]);

    const excluded = new Set([found.id]);
    const pool = new Map(); // id → card (deduplicate)

    // Seri oyunlarını en üste koy
    if (seriesRes.status === 'fulfilled') {
      (seriesRes.value.data.results || [])
        .filter(g => g.background_image && g.name)
        .forEach(g => { pool.set(g.id, { ...toCard(g), isSeries: true }); excluded.add(g.id); });
    }

    // Niche tag sonuçlarını karıştırarak ekle
    if (nichRes.status === 'fulfilled') {
      shuffle(nichRes.value.data.results || [])
        .filter(g => !excluded.has(g.id) && g.background_image && g.name)
        .forEach(g => { if (!pool.has(g.id)) { pool.set(g.id, toCard(g)); excluded.add(g.id); } });
    }

    // Geniş arama sonuçlarını karıştırarak ekle
    if (broadRes.status === 'fulfilled') {
      shuffle(broadRes.value.data.results || [])
        .filter(g => !excluded.has(g.id) && g.background_image && g.name)
        .forEach(g => { if (!pool.has(g.id)) { pool.set(g.id, toCard(g)); excluded.add(g.id); } });
    }

    // Seri oyunları önce, geri kalanları karışık
    const seriesCards = [...pool.values()].filter(c => c.isSeries).map(c => { const { isSeries, ...rest } = c; return rest; });
    const otherCards = shuffle([...pool.values()].filter(c => !c.isSeries));
    const recommendations = [...seriesCards, ...otherCards].slice(0, 8);

    const result = {
      searched: {
        name: detail.name,
        image: detail.background_image,
        metacritic: detail.metacritic,
        genres: genres.map(g => g.name),
        tags: englishTags.slice(0, 8).map(t => t.name),
      },
      recommendations,
    };

    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

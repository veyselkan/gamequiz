const express = require('express');
const axios = require('axios');
const router = express.Router();

const BASE = 'https://api.rawg.io/api';
const KEY = process.env.RAWG_API_KEY;

// --- Basit in-memory cache ---
const cache = new Map();
const TTL_LIST   = 20 * 60 * 1000; // oyun listesi: 20 dk
const TTL_DETAIL = 60 * 60 * 1000; // oyun detayı: 60 dk

function getCache(key) {
  const e = cache.get(key);
  if (!e) return null;
  if (Date.now() - e.t > e.ttl) { cache.delete(key); return null; }
  return e.v;
}
function setCache(key, val, ttl) {
  cache.set(key, { v: val, t: Date.now(), ttl });
}

// --- Yardımcı fonksiyonlar ---
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickWrong(pool, correctVal, field, count = 3) {
  return shuffle(pool.filter(g => g[field] !== correctVal))
    .slice(0, count)
    .map(g => g[field]);
}

async function fetchGames() {
  const page = Math.floor(Math.random() * 8) + 1;
  const key = `list_p${page}`;
  const cached = getCache(key);
  if (cached) return shuffle([...cached]);

  const { data } = await axios.get(`${BASE}/games`, {
    params: { key: KEY, page, page_size: 40, ordering: '-rating', metacritic: '60,100' },
  });
  const games = data.results.filter(g => g.background_image && g.name);
  setCache(key, games, TTL_LIST);
  return shuffle([...games]);
}

async function fetchDetail(id) {
  const key = `detail_${id}`;
  const cached = getCache(key);
  if (cached) return cached;
  const { data } = await axios.get(`${BASE}/games/${id}`, { params: { key: KEY } });
  setCache(key, data, TTL_DETAIL);
  return data;
}

// Mode 1: Adını Bil
router.get('/1', async (req, res) => {
  try {
    const games = await fetchGames();
    const selected = games.slice(0, 10);
    const questions = selected.map(g => ({
      type: 'name',
      image: g.background_image,
      correct: g.name,
      options: shuffle([g.name, ...pickWrong(games, g.name, 'name')]),
    }));
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mode 2: Pixel Quiz
router.get('/2', async (req, res) => {
  try {
    const games = await fetchGames();
    const selected = games.slice(0, 10);
    const questions = selected.map(g => ({
      type: 'pixel',
      image: g.background_image,
      correct: g.name,
      options: shuffle([g.name, ...pickWrong(games, g.name, 'name')]),
    }));
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mode 3: Higher or Lower — metacritic puanı yüksek olanı seç
router.get('/3', async (req, res) => {
  try {
    const games = await fetchGames();
    const withScore = games.filter(g => g.metacritic > 0);
    const selected = shuffle(withScore).slice(0, 25).map(g => ({
      id: g.id,
      name: g.name,
      image: g.background_image,
      metacritic: g.metacritic,
    }));
    res.json(selected);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mode 4: Etiket Quiz — liste endpoint'inden tags gelir, ek çağrı yok
const isEnglishTag = (name) => /^[\x00-\x7F\s\-'&.,!?()]+$/.test(name);

router.get('/4', async (req, res) => {
  try {
    const games = await fetchGames();
    const withTags = games.filter(g => {
      const engTags = g.tags?.filter(t => isEnglishTag(t.name)) || [];
      return engTags.length >= 4;
    });
    const selected = withTags.slice(0, 10);

    const questions = selected.map(g => {
      const engTags = g.tags.filter(t => isEnglishTag(t.name));
      const tagList = shuffle(engTags).slice(0, 6).map(t => t.name).join(' • ');
      return {
        type: 'description',
        description: tagList,
        correct: g.name,
        options: shuffle([g.name, ...pickWrong(games, g.name, 'name')]),
      };
    });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mode 5: Geliştirici Kim? — detail cache ile tekrar hızlı
router.get('/5', async (req, res) => {
  try {
    const games = await fetchGames();
    const pool = games.slice(0, 12);

    const details = await Promise.all(
      pool.map(g =>
        fetchDetail(g.id)
          .then(d => ({ ...g, developer: d.developers?.[0]?.name || null }))
          .catch(() => null)
      )
    );

    const valid = details.filter(g => g && g.developer).slice(0, 10);
    const allDevs = [...new Set(valid.map(g => g.developer))];
    const fallbacks = ['Rockstar Games', 'EA Sports', 'Ubisoft', 'Bethesda Game Studios',
      'Valve', 'Capcom', 'Square Enix', 'Activision', 'Naughty Dog', 'FromSoftware'];

    const questions = valid.map(g => {
      let wrong = shuffle(allDevs.filter(d => d !== g.developer)).slice(0, 3);
      for (const f of shuffle(fallbacks)) {
        if (wrong.length >= 3) break;
        if (f !== g.developer && !wrong.includes(f)) wrong.push(f);
      }
      return {
        type: 'developer',
        image: g.background_image,
        name: g.name,
        correct: g.developer,
        options: shuffle([g.developer, ...wrong.slice(0, 3)]),
      };
    });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mode 6: Liste Doldur — türün en iyi 10 oyununu tahmin et
const GENRES = [
  { id: 4,  name: 'Action' },
  { id: 5,  name: 'RPG' },
  { id: 10, name: 'Strategy' },
  { id: 2,  name: 'Shooter' },
  { id: 3,  name: 'Adventure' },
  { id: 7,  name: 'Puzzle' },
  { id: 83, name: 'Platformer' },
  { id: 1,  name: 'Racing' },
];

router.get('/6', async (req, res) => {
  try {
    const genre = GENRES[Math.floor(Math.random() * GENRES.length)];
    const cacheKey = `list6_${genre.id}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    const { data } = await axios.get(`${BASE}/games`, {
      params: {
        key: KEY,
        page_size: 15,
        ordering: '-metacritic',
        genres: genre.id,
        metacritic: '75,100',
      },
    });

    const answers = data.results
      .filter(g => g.metacritic > 0 && g.name)
      .slice(0, 10)
      .map((g, i) => ({
        rank: i + 1,
        name: g.name,
        metacritic: g.metacritic,
        image: g.background_image,
      }));

    const result = {
      title: `En İyi 10 ${genre.name} Oyunu`,
      subtitle: 'Metacritic puanına göre sıralı',
      count: answers.length,
      answers,
    };

    setCache(cacheKey, result, TTL_LIST);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

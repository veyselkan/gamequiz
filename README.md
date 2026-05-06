# GameQuiz 🎮

Video oyunu bilgini test et! RAWG API tabanlı, çok modlu full-stack quiz uygulaması.

## 🌐 Canlı Demo

> **NOT:** Aşağıdaki URL'leri kendi deploy adreslerinizle değiştirin.

- **Frontend (Vercel):** `https://gamequiz-client.vercel.app`
- **Backend (Render):** `https://gamequiz-api.onrender.com`
- **API Health Check:** `https://gamequiz-api.onrender.com/api/health`

## 🧱 Mimari

```
[ React (Vercel) ]  ──HTTPS──▶  [ Express API (Render) ]  ──▶  [ MongoDB Atlas ]
                                          │
                                          └────▶  [ RAWG.io API (cache'li) ]
```

## 🔐 Authentication Gerekçesi

Auth sistemi **opsiyonel** olacak şekilde tasarlandı:
- Quiz oynamak için giriş **gerekmez** — herkes ücretsiz oynayabilir.
- **Skor kaydı, leaderboard'a girme ve kişisel skor geçmişi** için JWT tabanlı login/register zorunlu.
- Bu yaklaşım, "casual oyuncu" akışını kesintiye uğratmadan kalıcılık sağlamak içindir.

## ⚙️ Kurulum (Yerel Geliştirme)

### Gereksinimler
- Node.js 18+
- MongoDB Atlas hesabı (ücretsiz tier yeterli)
- RAWG.io API key (ücretsiz)

### 1. Repoyu klonla
```bash
git clone https://github.com/veyselkan/gamequiz.git
cd gamequiz
```

### 2. Server kurulumu
```bash
cd server
npm install
cp .env.example .env
# .env'yi aç ve değerleri doldur
node index.js
```

### 3. Client kurulumu (yeni terminal)
```bash
cd client
npm install
npm run dev
```

Uygulama `http://localhost:5173` adresinde açılır.

---

## 🎮 Quiz Modları

| # | Mod | Açıklama |
|---|-----|----------|
| 1 | Adını Bil | Oyun kapağından adını seç |
| 2 | Pixel Quiz | Piksel netleştikçe adını bul (3 hak) |
| 3 | Higher or Lower | Hangi oyunun Metacritic puanı daha yüksek? |
| 4 | Açıklama Quiz | Etiketlerden oyunu bul |
| 5 | Geliştirici Kim? | Oyunu yapan stüdyoyu seç |
| 6 | Liste Doldur | Türün en iyi 10 oyununu tahmin et |

Bonus: **Oyun Önerisi** — Sevdiğin bir oyun yaz, niche-tag + game-series benzerlik araması ile öneri al.

## 📡 API Endpoints

### Public
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/health` | Health check |
| GET | `/api/quiz/:mode` | Mod 1-6 için soru seti |
| GET | `/api/recommend?game=ad` | Benzer oyun önerisi |
| GET | `/api/scores/leaderboard?mode=` | Global leaderboard |
| POST | `/api/auth/register` | Kayıt (validated) |
| POST | `/api/auth/login` | Giriş (validated) |

### Korumalı (JWT zorunlu)
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/scores` | Skor kaydet |
| GET | `/api/scores/me` | Kendi skorlarım |
| PUT | `/api/scores/:id` | Skor güncelle (sahip-only) |
| DELETE | `/api/scores/:id` | Skor sil (sahip-only) |

## 🛠️ Teknolojiler

- **Frontend:** React 19, Vite, Tailwind CSS, React Router, framer-motion, canvas-confetti
- **Backend:** Node.js, Express 5, JWT, bcryptjs, express-validator
- **Veritabanı:** MongoDB Atlas (Mongoose)
- **Dış Servis:** RAWG.io (in-memory cache ile)

## 🚀 Deployment

### Frontend → Vercel
```bash
cd client
# Vercel'de proje import → Environment Variables:
# VITE_API_URL=https://your-backend.onrender.com/api
```

### Backend → Render
```bash
# Render'da Web Service oluştur, root: server/
# Build: npm install
# Start: node index.js
# Environment Variables: RAWG_API_KEY, MONGO_URI, JWT_SECRET, FRONTEND_URL, NODE_ENV=production
```

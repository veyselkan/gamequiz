# GameQuiz 🎮

Video oyunu bilgini test et! RAWG API tabanlı çok modlu quiz uygulaması.

## Kurulum (Yerel Geliştirme)

### Gereksinimler
- Node.js 18+
- `.env` dosyası (proje sahibinden al)

### 1. Repoyu klonla
```bash
git clone https://github.com/REPO_URL/gamequiz.git
cd gamequiz
```

### 2. Server kurulumu
```bash
cd server
npm install
```

`server/.env.example` dosyasını kopyala ve gerçek değerleri doldur:
```bash
cp .env.example .env
# .env dosyasını aç ve değerleri doldur
```

### 3. Client kurulumu
```bash
cd ../client
npm install
```

### 4. Çalıştır (iki ayrı terminal)

**Terminal 1 — Backend:**
```bash
cd server
node index.js
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
```

Uygulama `http://localhost:5173` adresinde açılır.

---

## Quiz Modları

| # | Mod | Açıklama |
|---|-----|----------|
| 1 | Adını Bil | Oyun kapağından adını seç |
| 2 | Pixel Quiz | Piksel netleştikçe adını bul (3 hak) |
| 3 | Higher or Lower | Hangi oyunun Metacritic puanı daha yüksek? |
| 4 | Açıklama Quiz | Etiketlerden oyunu bul |
| 5 | Geliştirici Kim? | Oyunu yapan stüdyoyu seç |
| 6 | Liste Doldur | Türün en iyi 10 oyununu tahmin et |

## Teknolojiler

- **Frontend:** React 19, Vite, Tailwind CSS, React Router
- **Backend:** Node.js, Express
- **Veritabanı:** MongoDB Atlas
- **API:** RAWG.io

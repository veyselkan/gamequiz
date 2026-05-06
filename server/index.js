require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const gamesRouter = require('./routes/games');
const authRouter = require('./routes/auth');
const scoresRouter = require('./routes/scores');
const quizRouter = require('./routes/quiz');
const recommendRouter = require('./routes/recommend');

connectDB();

const app = express();

const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // origin yoksa (curl, mobile) ya da listede yoksa tüm origin'lere açık değil
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return cb(null, true);
    }
    cb(new Error('CORS engellendi'));
  },
  credentials: true,
}));
app.use(express.json());

app.use('/api/games', gamesRouter);
app.use('/api/auth', authRouter);
app.use('/api/scores', scoresRouter);
app.use('/api/quiz', quizRouter);
app.use('/api/recommend', recommendRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use((req, res) => res.status(404).json({ error: 'Endpoint bulunamadı' }));

app.use((err, req, res, next) => {
  console.error(err);
  const isDev = process.env.NODE_ENV !== 'production';
  res.status(err.status || 500).json({
    error: isDev ? err.message : 'Sunucu hatası',
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

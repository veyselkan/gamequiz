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
app.use(cors());
app.use(express.json());

app.use('/api/games', gamesRouter);
app.use('/api/auth', authRouter);
app.use('/api/scores', scoresRouter);
app.use('/api/quiz', quizRouter);
app.use('/api/recommend', recommendRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const Score = require('../models/Score');

const MODE_NAMES = {
  1: 'Adını Bil',
  2: 'Pixel Quiz',
  3: 'Puan Tahmini',
  4: 'Açıklama Quiz',
  5: 'Geliştirici Kim?',
  6: 'Liste Doldur',
};

const saveScore = async (req, res) => {
  try {
    const { mode, score, correctAnswers, totalQuestions } = req.body;
    if (mode === undefined || score === undefined || correctAnswers === undefined || !totalQuestions)
      return res.status(400).json({ error: 'Eksik alanlar' });

    const saved = await Score.create({
      user: req.user._id,
      username: req.user.username,
      mode,
      modeName: MODE_NAMES[mode] || 'Bilinmiyor',
      score,
      correctAnswers,
      totalQuestions,
    });
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getLeaderboard = async (req, res) => {
  try {
    const { mode } = req.query;
    const matchStage = mode ? { mode: Number(mode) } : {};

    // Her kullanıcı her mod için bir kez görünür (en yüksek skoru)
    const groupKey = mode ? '$username' : { username: '$username', mode: '$mode' };
    const scores = await Score.aggregate([
      { $match: matchStage },
      { $sort: { score: -1 } },
      { $group: { _id: groupKey, doc: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$doc' } },
      { $sort: { score: -1 } },
      { $limit: 20 },
    ]);

    res.json(scores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getMyScores = async (req, res) => {
  try {
    const scores = await Score.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(scores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { saveScore, getLeaderboard, getMyScores };

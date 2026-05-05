const express = require('express');
const { saveScore, getLeaderboard, getMyScores } = require('../controllers/scoreController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/leaderboard', getLeaderboard);
router.post('/', protect, saveScore);
router.get('/me', protect, getMyScores);

module.exports = router;

const express = require('express');
const { saveScore, getLeaderboard, getMyScores, deleteScore, updateScore } = require('../controllers/scoreController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/leaderboard', getLeaderboard);
router.post('/', protect, saveScore);
router.get('/me', protect, getMyScores);
router.put('/:id', protect, updateScore);
router.delete('/:id', protect, deleteScore);

module.exports = router;

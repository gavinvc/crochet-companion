const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const {
  saveProgress,
  listProgress,
  getProgress,
  getProgressForPattern,
  updateProgress
} = require('../controllers/progress.controller');

const router = express.Router();

router.use(authMiddleware);

router.get('/', listProgress);
router.get('/by-pattern/:patternId', getProgressForPattern);
router.get('/:progressId', getProgress);
router.post('/', saveProgress);
router.patch('/:progressId', updateProgress);

module.exports = router;

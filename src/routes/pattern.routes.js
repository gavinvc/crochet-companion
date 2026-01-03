const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const { createPattern, listPatterns, getPattern, toggleFollow } = require('../controllers/pattern.controller');

const router = express.Router();

router.get('/', listPatterns);
router.get('/:patternId', getPattern);
router.post('/', authMiddleware, createPattern);
router.post('/:patternId/follow', authMiddleware, toggleFollow);

module.exports = router;

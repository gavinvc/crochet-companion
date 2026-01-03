const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const { createPattern, listPatterns, getPattern, toggleFollow, deletePattern } = require('../controllers/pattern.controller');

const router = express.Router();

router.get('/', listPatterns);
router.get('/:patternId', getPattern);
router.post('/', authMiddleware, createPattern);
router.post('/:patternId/follow', authMiddleware, toggleFollow);
router.delete('/:patternId', authMiddleware, deletePattern);

module.exports = router;

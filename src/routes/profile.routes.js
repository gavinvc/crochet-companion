const express = require('express');
const { getOwnProfile, updateProfile, getPublicProfile } = require('../controllers/profile.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/me', authMiddleware, getOwnProfile);
router.patch('/me', authMiddleware, updateProfile);
router.get('/:handle', getPublicProfile);

module.exports = router;

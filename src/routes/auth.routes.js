const express = require('express');
const { registerUser, loginUser, getSession } = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/session', authMiddleware, getSession);

module.exports = router;

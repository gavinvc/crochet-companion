const express = require('express');
const { parsePattern } = require('../controllers/parser.controller');

const router = express.Router();

router.post('/parse', parsePattern);

module.exports = router;

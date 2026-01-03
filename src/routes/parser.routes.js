const express = require('express');
const { parsePattern, parsePatternPdf } = require('../controllers/parser.controller');

const router = express.Router();

router.post('/parse', parsePattern);
router.post('/parse-pdf', parsePatternPdf);

module.exports = router;

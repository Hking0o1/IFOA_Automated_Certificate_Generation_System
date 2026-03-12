const express = require('express');
const { generateCertificate } = require('../controllers/certificateController');

const router = express.Router();
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.post('/:id', wrap(generateCertificate));

module.exports = router;

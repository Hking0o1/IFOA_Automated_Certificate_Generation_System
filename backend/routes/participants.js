const express = require('express');
const controller = require('../controllers/participantController');

const router = express.Router();
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get('/', wrap(controller.getParticipants));
router.get('/:id', wrap(controller.getParticipantById));
router.post('/', wrap(controller.createParticipant));

module.exports = router;

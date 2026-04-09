const express = require('express');
const router = express.Router();
const Session = require('../models/Session');
const auth = require('../middleware/auth');

function genCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// POST /api/session — Teacher creates a session
router.post('/', auth, async (req, res) => {
  try {
    const session = await Session.create({
      quiz: req.body.quizId,
      teacher: req.user.id,
      sessionCode: genCode()
    });
    res.json(session);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// GET /api/session/:code — Get session by code
router.get('/:code', async (req, res) => {
  try {
    const session = await Session.findOne({ sessionCode: req.params.code })
                                 .populate('quiz');
    if (!session) return res.status(404).json({ msg: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;

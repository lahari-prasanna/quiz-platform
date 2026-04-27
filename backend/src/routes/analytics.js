const express = require("express");
const router = express.Router();
const Session = require("../models/Session");
const auth = require("../middleware/auth");

router.get("/teacher", auth, async (req, res) => {
  try {
    const sessions = await Session.find({ teacher: req.user.id })
      .populate("quiz")
      .sort({ createdAt: -1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.get("/student", auth, async (req, res) => {
  try {
    const userId = req.user.id.toString();
    
    const sessions = await Session.find({ status: "ended" })
      .populate("quiz")
      .sort({ createdAt: -1 });

    const mySessions = sessions.filter(s =>
      s.finalScores.some(f => f.userId.toString() === userId)
    );

    const history = mySessions.map((s) => {
      const myScore = s.finalScores.find(f => f.userId.toString() === userId);
      const maxScore = (s.quiz?.questions?.length || 0) * 10;
      const sorted = [...s.finalScores].sort((a, b) => b.score - a.score);
      const rank = sorted.findIndex(f => f.userId.toString() === userId) + 1;

      return {
        sessionCode: s.sessionCode,
        quizTitle: s.quiz?.title || "Untitled",
        totalQuestions: s.quiz?.questions?.length || 0,
        myScore: myScore?.score || 0,
        maxScore,
        percentage: maxScore > 0 ? Math.round((myScore?.score / maxScore) * 100) : 0,
        rank,
        totalStudents: s.finalScores.length,
        date: s.createdAt,
      };
    });

    res.json(history);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const Session = require("../models/Session");
const auth = require("../middleware/auth");

// GET /api/analytics/teacher — all sessions for teacher
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

// GET /api/analytics/student — quiz history for logged-in student
router.get("/student", auth, async (req, res) => {
  try {
    const sessions = await Session.find({
      status: "ended",
      "finalScores.userId": req.user.id,
    })
      .populate("quiz")
      .sort({ createdAt: -1 });

    // Extract only this student's score from each session
    const history = sessions.map((s) => {
      const myScore = s.finalScores.find(
        (f) => f.userId === req.user.id,
      );
      const maxScore = (s.quiz?.questions?.length || 0) * 10;
      const rank =
        [...s.finalScores]
          .sort((a, b) => b.score - a.score)
          .findIndex((f) => f.userId === req.user.id) + 1;
      return {
        sessionCode: s.sessionCode,
        quizTitle: s.quiz?.title || "Untitled",
        totalQuestions: s.quiz?.questions?.length || 0,
        myScore: myScore?.score || 0,
        maxScore,
        percentage:
          maxScore > 0
            ? Math.round((myScore?.score / maxScore) * 100)
            : 0,
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

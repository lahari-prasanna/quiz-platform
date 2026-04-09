const Session = require('../models/Session');

module.exports = (io) => {
  const scores = {};
  const lastWarnTime = {}; // debounce per user

  io.on('connection', (socket) => {
    console.log('🔌 Connected:', socket.id);

    socket.on('join_session', ({ sessionCode, userId, name }) => {
      socket.join(sessionCode);
      if (!scores[sessionCode]) scores[sessionCode] = {};
      if (!lastWarnTime[sessionCode]) lastWarnTime[sessionCode] = {};

      if (userId !== 'teacher') {
        scores[sessionCode][userId] = { name, score: 0, warnings: 0, flagged: false };
        lastWarnTime[sessionCode][userId] = 0;
        console.log(`✅ ${name} joined [${sessionCode}]`);
      }
      io.to(sessionCode).emit('leaderboard_update', scores[sessionCode]);
    });

    socket.on('send_question', ({ sessionCode, question, index }) => {
      io.to(sessionCode).emit('receive_question', { question, index });
    });

    socket.on('submit_answer', ({ sessionCode, userId, answer, correctAnswer }) => {
      if (scores[sessionCode]?.[userId]) {
        // flagged student gets 0 for this answer
        if (!scores[sessionCode][userId].flagged && answer === correctAnswer) {
          scores[sessionCode][userId].score += 10;
        }
      }
      io.to(sessionCode).emit('leaderboard_update', scores[sessionCode]);
    });

    socket.on('tab_switch_warning', ({ sessionCode, userId }) => {
      if (!scores[sessionCode]?.[userId]) return;
      if (scores[sessionCode][userId].flagged) return; // already flagged, ignore

      // Server-side debounce — ignore if same user warned within 3 seconds
      const now = Date.now();
      if (now - (lastWarnTime[sessionCode]?.[userId] || 0) < 3000) {
        console.log(`⏭️ Duplicate warning ignored for ${scores[sessionCode][userId].name}`);
        return;
      }
      lastWarnTime[sessionCode][userId] = now;

      scores[sessionCode][userId].warnings += 1;
      const warningCount = scores[sessionCode][userId].warnings;
      const name = scores[sessionCode][userId].name;
      console.log(`⚠️ ${name} — warning ${warningCount}/3`);

      if (warningCount >= 3) {
        scores[sessionCode][userId].flagged = true;
        console.log(`🚩 ${name} flagged!`);
        socket.emit('flagged_cheating');
      }

      io.to(sessionCode).emit('cheat_warning', {
        userId, name, warningCount,
        flagged: scores[sessionCode][userId].flagged
      });

      io.to(sessionCode).emit('leaderboard_update', scores[sessionCode]);
    });

    socket.on('end_session', async ({ sessionCode }) => {
      const finalScores = scores[sessionCode] || {};
      io.to(sessionCode).emit('session_ended', finalScores);

      try {
        await Session.findOneAndUpdate(
          { sessionCode },
          {
            status: 'ended',
            finalScores: Object.entries(finalScores).map(([userId, data]) => ({
              userId, name: data.name, score: data.score,
              warnings: data.warnings || 0,
              flagged: data.flagged || false
            }))
          }
        );
        console.log('✅ Scores saved');
      } catch (err) {
        console.error('❌ Error:', err.message);
      }
      delete scores[sessionCode];
      delete lastWarnTime[sessionCode];
    });

    socket.on('disconnect', () => console.log('❌ Disconnected:', socket.id));
  });
};

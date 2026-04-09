const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  quiz:         { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
  teacher:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sessionCode:  { type: String, unique: true },
  status:       { type: String, enum: ['waiting','active','ended'], default: 'waiting' },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  currentQ:     { type: Number, default: 0 },
  finalScores:  [{
    userId:   String,
    name:     String,
    score:    Number,
    warnings: { type: Number, default: 0 },
    flagged:  { type: Boolean, default: false }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);

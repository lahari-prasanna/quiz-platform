const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  question: String,
  options: [String],
  answer: String,
  topic: String,
});

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    questions: [questionSchema],
    sourceFile: String,
  },
  { timestamps: true },
);

module.exports = mongoose.model("Quiz", quizSchema);

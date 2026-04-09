const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const axios = require('axios');
const auth = require('../middleware/auth');
const Quiz = require('../models/Quiz');

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'quiz-pdfs',
    allowed_formats: ['pdf'],
    resource_type: 'raw',
  },
});

const upload = multer({ storage });

// POST /api/quiz/generate — AI from PDF
router.post('/generate', auth, upload.single('pdf'), async (req, res) => {
  try {
    console.log('📄 File received:', req.file);
    console.log('📝 Body:', req.body);

    if (!req.file) {
      return res.status(400).json({ msg: 'No PDF file uploaded' });
    }

    // Cloudinary URL — AI service కి pass చేస్తాం
    const fileUrl = req.file.path;
    console.log('☁️ Cloudinary URL:', fileUrl);

    const aiRes = await axios.post(`${process.env.AI_SERVICE_URL}/generate`, {
      file_url: fileUrl,
      num_questions: parseInt(req.body.num_questions) || 5
    });

    const questions = aiRes.data.questions;
    const quiz = await Quiz.create({
      title: req.body.title || req.file.originalname,
      createdBy: req.user.id,
      questions,
      sourceFile: fileUrl,
    });

    res.json(quiz);
  } catch (err) {
    console.error('❌ Quiz generate error:', err.response?.data || err.message);
    res.status(500).json({ msg: err.response?.data?.error || err.message });
  }
});

// POST /api/quiz/manual
router.post('/manual', auth, async (req, res) => {
  try {
    const { title, questions } = req.body;
    if (!title || !questions || questions.length === 0) {
      return res.status(400).json({ msg: 'Title and questions are required' });
    }
    const quiz = await Quiz.create({
      title,
      createdBy: req.user.id,
      questions,
      sourceFile: 'manual',
    });
    res.json(quiz);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// GET /api/quiz
router.get('/', auth, async (req, res) => {
  try {
    const quizzes = await Quiz.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const axios = require("axios");
const auth = require("../middleware/auth");
const Quiz = require("../models/Quiz");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".txt",
];

const fileFilter = (req, file, cb) => {
  const ext = "." + file.originalname.split(".").pop().toLowerCase();
  if (file.mimetype.startsWith("image/"))
    return cb(new Error("IMAGE_NOT_ALLOWED"), false);
  if (!ALLOWED_EXTENSIONS.includes(ext))
    return cb(new Error("FILE_TYPE_NOT_SUPPORTED"), false);
  cb(null, true);
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.resolve(__dirname, "../../uploads");
    if (!fs.existsSync(uploadPath))
      fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) =>
    cb(
      null,
      Date.now() + "-" + file.originalname.replace(/\s+/g, "_"),
    ),
});

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Extract text using Python script
const extractText = (filePath) => {
  try {
    const scriptPath = path.resolve(
      __dirname,
      "../../extract_text.py",
    );
    const text = execSync(`python3 "${scriptPath}" "${filePath}"`, {
      timeout: 30000,
      maxBuffer: 10 * 1024 * 1024,
    }).toString();
    return text;
  } catch (err) {
    console.error("Python extract error:", err.message);
    return "";
  }
};

// Validate content
const validateContent = (text, ext) => {
  const trimmed = text.trim();

  if (!trimmed || trimmed.length < 50) {
    const messages = {
      pdf:
        trimmed.length === 0
          ? " This PDF appears to be empty. Please upload a PDF with actual text content."
          : "This PDF does not have enough readable text. Please upload a PDF with more content.",
      docx: " This Word document appears to be empty. Please upload a document with text content.",
      doc: " Old .doc format is not fully supported. Please save your file as .docx and try again.",
      pptx: "Could not read text from this presentation. Please make sure your slides contain text (not just images).",
      ppt: " Old .ppt format is not supported. Please save your presentation as .pptx and try again.",
      txt:
        trimmed.length === 0
          ? " This text file is empty. Please upload a file with actual content."
          : "This file does not have enough content. Please upload a document with more text.",
    };
    return {
      valid: false,
      msg:
        messages[ext] ||
        " Could not read content from this file. Please try a different file.",
    };
  }

  // Lorem ipsum check
  const loremPatterns = [
    "lorem ipsum",
    "dolor sit amet",
    "consectetur adipiscing",
  ];
  if (
    loremPatterns.filter((p) => trimmed.toLowerCase().includes(p))
      .length >= 2
  )
    return {
      valid: false,
      msg: " This file contains sample placeholder text (lorem ipsum). Please upload a document with real content.",
    };

  // Count real English words
  const realWords = trimmed.match(/\b[a-zA-Z]{3,}\b/g) || [];
  if (realWords.length < 30)
    return {
      valid: false,
      msg: ` This file does not have enough readable content (${realWords.length} words found). Please upload a document with at least 30 meaningful words.`,
    };

  return { valid: true, msg: "OK" };
};

// POST /api/quiz/generate
router.post(
  "/generate",
  auth,
  (req, res, next) => {
    upload.single("pdf")(req, res, (err) => {
      if (err) {
        if (err.message === "IMAGE_NOT_ALLOWED")
          return res.status(400).json({
            msg: "Images are not supported. Please upload PDF, Word, PowerPoint, or text files.",
          });
        if (err.message === "FILE_TYPE_NOT_SUPPORTED")
          return res.status(400).json({
            msg: "Unsupported file type. Allowed: PDF, DOCX, DOC, PPT, PPTX, TXT.",
          });
        if (err.code === "LIMIT_FILE_SIZE")
          return res.status(400).json({
            msg: "File too large. Maximum size is 10MB.",
          });
        return res.status(400).json({ msg: err.message });
      }
      next();
    });
  },
  async (req, res) => {
    const filePath = req.file?.path;
    const cleanup = () => {
      try {
        if (filePath && fs.existsSync(filePath))
          fs.unlinkSync(filePath);
      } catch (e) {}
    };

    try {
      if (!req.file)
        return res
          .status(400)
          .json({ msg: "Please select a file to upload." });

      const ext = req.file.originalname
        .split(".")
        .pop()
        .toLowerCase();
      console.log(
        ` File: ${req.file.originalname} | Ext: .${ext} | Size: ${req.file.size} bytes`,
      );

      // Step 1: Extract text using Python
      const text = extractText(filePath);
      console.log(` Extracted: ${text.length} chars`);
      console.log(`First 200 chars: ${text.slice(0, 200)}`);

      // Step 2: Validate
      const { valid, msg } = validateContent(text, ext);
      if (!valid) {
        console.log(` Validation failed: ${msg}`);
        cleanup();
        return res.status(400).json({ msg });
      }
      console.log(`Valid — ${text.trim().length} chars`);

      // Step 3: Upload to Cloudinary
      const cloudResult = await cloudinary.uploader.upload(filePath, {
        folder: "quiz-files",
        resource_type: "raw",
        public_id: `${Date.now()}-${req.file.originalname.replace(/\s+/g, "_")}`,
      });
      cleanup();
      console.log(" Uploaded to Cloudinary");

      // Step 4: Send text to AI — send more context for better questions
      const aiRes = await axios.post(
        `${process.env.AI_SERVICE_URL}/generate`,
        {
          text: text.slice(0, 5000),
          num_questions: parseInt(req.body.num_questions) || 5,
        },
        { timeout: 120000 },
      );

      const questions = aiRes.data.questions;
      if (!questions || questions.length === 0)
        return res.status(400).json({
          msg: "AI could not generate questions. Please try a different document.",
        });

      // Step 5: Save quiz
      const quiz = await Quiz.create({
        title: req.body.title || req.file.originalname,
        createdBy: req.user.id,
        questions,
        sourceFile: cloudResult.secure_url,
      });

      console.log(` Quiz created: ${quiz._id}`);
      res.json(quiz);
    } catch (err) {
      cleanup();
      console.error("Error:", err.response?.data || err.message);
      if (err.response?.status === 400)
        return res.status(400).json({
          msg: err.response.data.error || "Could not generate quiz.",
        });
      res
        .status(500)
        .json({ msg: "Failed to generate quiz. Please try again." });
    }
  },
);

// POST /api/quiz/manual
router.post("/manual", auth, async (req, res) => {
  try {
    const { title, questions } = req.body;
    if (!title || !questions || questions.length === 0)
      return res
        .status(400)
        .json({ msg: "Title and questions are required" });
    const quiz = await Quiz.create({
      title,
      createdBy: req.user.id,
      questions,
      sourceFile: "manual",
    });
    res.json(quiz);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// GET /api/quiz
router.get("/", auth, async (req, res) => {
  try {
    const quizzes = await Quiz.find({ createdBy: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// DELETE /api/quiz/:id
router.delete("/:id", auth, async (req, res) => {
  try {
    const quiz = await Quiz.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });
    if (!quiz) return res.status(404).json({ msg: "Quiz not found" });
    await Quiz.findByIdAndDelete(req.params.id);
    res.json({ msg: "Quiz deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;

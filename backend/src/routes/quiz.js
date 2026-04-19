const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const axios = require("axios");
const auth = require("../middleware/auth");
const Quiz = require("../models/Quiz");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const fs = require("fs");
const path = require("path");

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

const extractText = async (filePath, ext) => {
  try {
    if (ext === "pdf") {
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      return data.text || "";
    }
    if (ext === "docx") {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value || "";
    }
    if (ext === "txt") return fs.readFileSync(filePath, "utf8");
    const buffer = fs.readFileSync(filePath);
    return buffer
      .toString("utf8")
      .replace(/[^\x20-\x7E\n]/g, " ")
      .replace(/\s+/g, " ");
  } catch (err) {
    console.error("Extract error:", err.message);
    return "";
  }
};

const validateContent = (text, ext) => {
  const trimmed = text.trim();

  // Empty or no text extracted
  if (!trimmed || trimmed.length < 50) {
    if (ext === "pdf")
      return {
        valid: false,
        msg: "Could not extract text from this PDF. It may be scanned, image-based,No meaningful content, or empty. Please upload a text-based PDF.",
      };
    if (ext === "docx" || ext === "doc")
      return {
        valid: false,
        msg: "The Word document appears to be empty or has no readable text.",
      };
    if (ext === "txt")
      return {
        valid: false,
        msg: "The text file is empty. Please upload a file with actual content.",
      };
    return {
      valid: false,
      msg: " The file appears to be empty or has no readable content.",
    };
  }

  // Lorem ipsum
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
      msg: " The file contains lorem ipsum placeholder text. Please upload a document with real content.",
    };

  // Meaningful words
  const realWords = trimmed.match(/\b[a-zA-Z]{3,15}\b/g) || [];
  if (realWords.length < 50)
    return {
      valid: false,
      msg: ` Not enough readable content found (${realWords.length} words). Please upload a document with at least 50 meaningful words.`,
    };

  // Gibberish/random characters check
  const avgWordLen = realWords.join("").length / realWords.length;
  if (avgWordLen > 12)
    return {
      valid: false,
      msg: "The file contains random or unreadable characters. Please upload a proper document with real text.",
    };

  return { valid: true, msg: "OK" };
};

router.post(
  "/generate",
  auth,
  (req, res, next) => {
    upload.single("pdf")(req, res, (err) => {
      if (err) {
        if (err.message === "IMAGE_NOT_ALLOWED")
          return res.status(400).json({
            msg: " Images are not supported. Please upload PDF, Word, PowerPoint, or text files.",
          });
        if (err.message === "FILE_TYPE_NOT_SUPPORTED")
          return res.status(400).json({
            msg: "Unsupported file type. Allowed: PDF, DOCX, DOC, PPT, PPTX, TXT.",
          });
        if (err.code === "LIMIT_FILE_SIZE")
          return res.status(400).json({
            msg: " File too large. Maximum size is 10MB.",
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

      // Step 1: Extract text
      const text = await extractText(filePath, ext);
      console.log(` Extracted: ${text.length} chars`);

      // Step 2: Validate
      const { valid, msg } = validateContent(text, ext);
      if (!valid) {
        console.log(`${msg}`);
        cleanup();
        return res.status(400).json({ msg });
      }
      console.log(`Valid content — ${text.trim().length} chars`);

      // Step 3: Upload to Cloudinary
      const cloudResult = await cloudinary.uploader.upload(filePath, {
        folder: "quiz-files",
        resource_type: "raw",
        public_id: `${Date.now()}-${req.file.originalname.replace(/\s+/g, "_")}`,
      });
      cleanup();
      console.log(" Uploaded to Cloudinary");

      // Step 4: Send text to AI
      const aiRes = await axios.post(
        `${process.env.AI_SERVICE_URL}/generate`,
        {
          text: text.slice(0, 4000),
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

      console.log(`Quiz created: ${quiz._id}`);
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
router.delete('/:id', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!quiz) return res.status(404).json({ msg: 'Quiz not found' });
    await Quiz.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Quiz deleted successfully' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});


// DELETE /api/quiz/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!quiz) return res.status(404).json({ msg: 'Quiz not found' });
    await Quiz.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Quiz deleted successfully' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;

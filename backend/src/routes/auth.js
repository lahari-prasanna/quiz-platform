const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/User");

const createTransporter = () =>
  nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

// // POST /api/auth/register
// router.post("/register", async (req, res) => {
//   try {
//     const { name, email, password, role } = req.body;
//     // Email format validation
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email))
//       return res
//         .status(400)
//         .json({ msg: "Please enter a valid email address" });
//     const existing = await User.findOne({ email });
//     if (existing)
//       return res.status(400).json({ msg: "Email already exists" });
//     const hashed = await bcrypt.hash(password, 10);
//     const user = await User.create({
//       name,
//       email,
//       password: hashed,
//       role,
//     });
//     const token = jwt.sign(
//       { id: user._id, role: user.role },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" },
//     );
//     res.json({
//       token,
//       user: { id: user._id, name, role: user.role },
//     });
//   } catch (err) {
//     res.status(500).json({ msg: err.message });
//   }
// });

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return res
        .status(400)
        .json({ msg: "Please enter a valid email address" });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ msg: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);

    // Generate verification token (expires in 1 hour)
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const user = await User.create({
      name,
      email,
      password: hashed,
      role,
      isVerified: false,
      verificationToken: verificationToken,
      verificationExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });

    // Build verification link
    const frontendUrl =
      process.env.FRONTEND_URL || "http://localhost:3000";
    const verifyUrl = `${frontendUrl}/verify-email/${verificationToken}`;

    // Send email (do not await – send in background)
    const transporter = createTransporter();
    transporter
      .sendMail({
        from: `"QuizAI Platform" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "✅ Verify Your Email – QuizAI",
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1e3a8a, #1d4ed8); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0;">🎓 QuizAI Platform</h1>
          </div>
          <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px; border: 1px solid #eee;">
            <h2 style="color: #1e3a8a;">Welcome, ${name}!</h2>
            <p style="color: #555;">Please verify your email address to start using QuizAI.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verifyUrl}" style="background: linear-gradient(135deg, #2563eb, #059669); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px;">
                Verify Email
              </a>
            </div>
            <p style="color: #888; font-size: 13px;">This link expires in <strong>1 hour</strong>.<br/>If you didn't create an account, ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #aaa; font-size: 12px; text-align: center;">QuizAI Platform — RGUKT RK Valley · CSE Department</p>
          </div>
        </div>
      `,
      })
      .then(() =>
        console.log(`✅ Verification email sent to ${email}`),
      )
      .catch((err) =>
        console.error(`❌ Email failed: ${err.message}`),
      );

    // Respond to client – do NOT send token, do NOT log in
    res.status(201).json({
      msg: "Registration successful! Please check your email to verify your account.",
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// // POST /api/auth/login
// router.post("/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const user = await User.findOne({ email });
//     if (!user)
//       return res.status(400).json({ msg: "Invalid credentials" });
//     const match = await bcrypt.compare(password, user.password);
//     if (!match)
//       return res.status(400).json({ msg: "Invalid credentials" });
//     const token = jwt.sign(
//       { id: user._id, role: user.role },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" },
//     );
//     res.json({
//       token,
//       user: { id: user._id, name: user.name, role: user.role },
//     });
//   } catch (err) {
//     res.status(500).json({ msg: err.message });
//   }
// });

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ msg: "Invalid credentials" });

    // Check if user is verified
    if (!user.isVerified) {
      return res
        .status(403)
        .json({ msg: "Please verify your email before logging in." });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      token,
      user: { id: user._id, name: user.name, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// // POST /api/auth/resend-verification
// router.post("/resend-verification", async (req, res) => {
//   try {
//     const { email } = req.body;
//     const user = await User.findOne({ email });
//     if (!user) return res.status(404).json({ msg: "User not found" });
//     if (user.isVerified)
//       return res.status(400).json({ msg: "Email already verified" });

//     const verificationToken = crypto.randomBytes(32).toString("hex");
//     user.verificationToken = verificationToken;
//     user.verificationExpiry = new Date(Date.now() + 60 * 60 * 1000);
//     await user.save();

//     const frontendUrl =
//       process.env.FRONTEND_URL || "http://localhost:3000";
//     const verifyUrl = `${frontendUrl}/verify-email/${verificationToken}`;

//     const transporter = createTransporter();
//     await transporter.sendMail({
//       from: `"QuizAI Platform" <${process.env.EMAIL_USER}>`,
//       to: email,
//       subject: "✅ Resend: Verify Your Email – QuizAI",
//       html: `... (same as registration email) ...`,
//     });

//     res.json({ msg: "Verification email resent. Check your inbox." });
//   } catch (err) {
//     res.status(500).json({ msg: err.message });
//   }
// });

// POST /api/auth/resend-verification
router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });
    if (user.isVerified)
      return res.status(400).json({ msg: "Email already verified" });

    // Generate new token (old one becomes invalid)
    const newToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = newToken;
    user.verificationExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const frontendUrl =
      process.env.FRONTEND_URL || "http://localhost:3000";
    const verifyUrl = `${frontendUrl}/verify-email/${newToken}`;

    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"QuizAI Platform" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "✅ Resend: Verify Your Email – QuizAI",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1e3a8a, #1d4ed8); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0;">🎓 QuizAI Platform</h1>
          </div>
          <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px; border: 1px solid #eee;">
            <h2 style="color: #1e3a8a;">Verify your email address</h2>
            <p style="color: #555;">Hi ${user.name},</p>
            <p style="color: #555;">Click the button below to verify your account:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verifyUrl}" style="background: linear-gradient(135deg, #2563eb, #059669); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px;">
                Verify Email
              </a>
            </div>
            <p style="color: #888; font-size: 13px;">This link expires in <strong>1 hour</strong>.<br/>If you didn't request this, ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #aaa; font-size: 12px; text-align: center;">QuizAI Platform — RGUKT RK Valley · CSE Department</p>
          </div>
        </div>
      `,
    });

    res.json({
      msg: "New verification email sent. Check your inbox.",
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});
// // POST /api/auth/google
// router.post("/google", async (req, res) => {
//   try {
//     const { name, email, googleId, role } = req.body;
//     let user = await User.findOne({ email });

//     if (!user) {
//       if (!role) {
//         return res.json({ isNewUser: true });
//       }
//       user = await User.create({
//         name,
//         email,
//         password: googleId,
//         role,
//       });
//     }

//     const token = jwt.sign(
//       { id: user._id, role: user.role },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" },
//     );
//     res.json({
//       token,
//       user: { id: user._id, name: user.name, role: user.role },
//       isNewUser: false,
//     });
//   } catch (err) {
//     res.status(500).json({ msg: err.message });
//   }
// });

router.post("/google", async (req, res) => {
  try {
    const { name, email, googleId, role } = req.body;
    let user = await User.findOne({ email });

    if (!user) {
      if (!role) {
        return res.json({ isNewUser: true });
      }
      user = await User.create({
        name,
        email,
        password: googleId,
        role,
        isVerified: true, // Google users are auto-verified
      });
    }

    // If existing user but not verified, you may still allow? Or force verification?
    // For Google, you can also auto-verify them.
    if (user && !user.isVerified) {
      user.isVerified = true;
      user.verificationToken = undefined;
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );
    res.json({
      token,
      user: { id: user._id, name: user.name, role: user.role },
      isNewUser: false,
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.json({
        msg: "If this email exists, a reset link has been sent",
      });

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetToken = resetToken;
    user.resetExpiry = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    const frontendUrl =
      process.env.FRONTEND_URL || "http://localhost:3000";
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    // Response immediately — email background లో send చేయండి
    res.json({
      msg: "If this email exists, a reset link has been sent",
    });

    const transporter = createTransporter();
    transporter
      .sendMail({
        from: `"QuizAI Platform" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "🔑 Reset Your QuizAI Password",
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1e3a8a, #1d4ed8); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0;">🎓 QuizAI Platform</h1>
          </div>
          <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px; border: 1px solid #eee;">
            <h2 style="color: #1e3a8a;">Reset Your Password</h2>
            <p style="color: #555;">Hi ${user.name},</p>
            <p style="color: #555;">Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: linear-gradient(135deg, #2563eb, #059669); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px;">
                Reset Password
              </a>
            </div>
            <p style="color: #888; font-size: 13px;">This link expires in <strong>30 minutes</strong>.<br/>If you didn't request this, ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #aaa; font-size: 12px; text-align: center;">QuizAI Platform — RGUKT RK Valley · CSE Department</p>
          </div>
        </div>
      `,
      })
      .then(() => console.log(`✅ Reset email sent to ${email}`))
      .catch((err) =>
        console.error(`❌ Email failed: ${err.message}`),
      );
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// POST /api/auth/reset-password/:token
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    const user = await User.findOne({
      resetToken: token,
      resetExpiry: { $gt: new Date() },
    });
    if (!user)
      return res
        .status(400)
        .json({ msg: "Invalid or expired reset link" });
    user.password = await bcrypt.hash(password, 10);
    user.resetToken = undefined;
    user.resetExpiry = undefined;
    await user.save();
    res.json({
      msg: "Password reset successfully! You can now login.",
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// // GET /api/auth/verify-email/:token
// router.get("/verify-email/:token", async (req, res) => {
//   try {
//     const { token } = req.params;

//     const user = await User.findOne({
//       verificationToken: token,
//       verificationExpiry: { $gt: new Date() },
//     });

//     if (!user) {
//       return res
//         .status(400)
//         .json({ msg: "Invalid or expired verification link." });
//     }

//     // Mark user as verified
//     user.isVerified = true;
//     user.verificationToken = undefined;
//     user.verificationExpiry = undefined;
//     await user.save();

//     res.json({
//       msg: "Email verified successfully! You can now log in.",
//     });
//   } catch (err) {
//     res.status(500).json({ msg: err.message });
//   }
// });

router.get("/verify-email/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({
      verificationToken: token,
      verificationExpiry: { $gt: new Date() },
    });

    if (!user) {
      // Check if token exists but expired
      const expiredUser = await User.findOne({
        verificationToken: token,
      });
      if (expiredUser) {
        return res
          .status(400)
          .json({
            msg: "Verification link has expired. Please request a new one.",
          });
      }
      return res
        .status(400)
        .json({ msg: "Invalid verification link." });
    }

    if (user.isVerified) {
      return res
        .status(400)
        .json({ msg: "Email already verified. Please login." });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpiry = undefined;
    await user.save();

    res.json({
      msg: "Email verified successfully! You can now login.",
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});
module.exports = router;
// This is already handled — just need email format validation in register route

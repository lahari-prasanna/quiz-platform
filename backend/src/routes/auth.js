const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: 'Email already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, user: { id: user._id, name, role: user.role } });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ msg: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, user: { id: user._id, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// POST /api/auth/google
router.post('/google', async (req, res) => {
  try {
    const { name, email, googleId, role } = req.body;
    let user = await User.findOne({ email });
    const isNewUser = !user;

    if (!user) {
      // New user — role తో create చేయండి
      user = await User.create({
        name, email, password: googleId, role: role || 'student'
      });
    } else if (isNewUser === false && role && user.role !== role) {
      // Existing user కానీ role modal నుండి వస్తే update చేయండి
      user.role = role;
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      token,
      user: { id: user._id, name: user.name, role: user.role },
      isNewUser
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ msg: 'If this email exists, a reset link has been sent' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpiry = new Date(Date.now() + 30 * 60 * 1000);

    user.resetToken = resetToken;
    user.resetExpiry = resetExpiry;
    await user.save();

    // Production URL use చేయండి
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    await transporter.sendMail({
      from: `"QuizAI Platform" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔑 Reset Your QuizAI Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1e3a8a, #1d4ed8); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0;">🎓 QuizAI Platform</h1>
          </div>
          <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px; border: 1px solid #eee;">
            <h2 style="color: #1e3a8a;">Reset Your Password</h2>
            <p style="color: #555;">Hi ${user.name},</p>
            <p style="color: #555;">You requested to reset your password. Click the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}"
                style="background: linear-gradient(135deg, #2563eb, #059669); color: white; padding: 14px 32px;
                       text-decoration: none; border-radius: 8px; font-size: 16px;">
                Reset Password
              </a>
            </div>
            <p style="color: #888; font-size: 13px;">
              This link expires in <strong>30 minutes</strong>.<br/>
              If you didn't request this, ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #aaa; font-size: 12px; text-align: center;">
              QuizAI Platform — RGUKT RK Valley · CSE Department
            </p>
          </div>
        </div>
      `
    });

    res.json({ msg: 'If this email exists, a reset link has been sent' });
  } catch (err) {
    console.error('Email error:', err);
    res.status(500).json({ msg: 'Failed to send email: ' + err.message });
  }
});

// POST /api/auth/reset-password/:token
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetToken: token,
      resetExpiry: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid or expired reset link' });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetToken = undefined;
    user.resetExpiry = undefined;
    await user.save();

    res.json({ msg: 'Password reset successfully! You can now login.' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;

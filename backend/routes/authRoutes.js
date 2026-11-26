const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

function signUserToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register (Client account creation)
router.post('/register', async (req, res) => {
  try {
    const { firstName = '', lastName = '', email, password } = req.body;
    if (!email || !password || password.length < 6) {
      return res.status(400).json({ message: 'Provide a valid email and a password of at least 6 characters.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists. Please log in.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const fullName = `${firstName} ${lastName}`.trim() || normalizedEmail.split('@')[0];

    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      name: fullName,
      email: normalizedEmail,
      password: hashedPassword,
      authProvider: 'local',
      role: 'client'
    });

    const token = signUserToken(user);
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
});

// POST /api/auth/login (Unified login for clients & staff)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !user.password) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = signUserToken(user);
    res.status(200).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

// POST /api/auth/oauth (Google, Microsoft, or Apple sign-in)
router.post('/oauth', async (req, res) => {
  try {
    const { provider, email, name } = req.body;
    if (!email || !['google', 'microsoft', 'apple'].includes(provider)) {
      return res.status(400).json({ message: 'Invalid social sign-in payload.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    let user = await User.findOne({ email: normalizedEmail });

    // If user already exists (including pre-created staff accounts), preserve their role
    if (!user) {
      user = await User.create({
        name: (name || normalizedEmail.split('@')[0]).trim(),
        email: normalizedEmail,
        authProvider: provider,
        role: 'client'
      });
    }

    const token = signUserToken(user);
    res.status(200).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: 'Social authentication failed', error: err.message });
  }
});

module.exports = router;

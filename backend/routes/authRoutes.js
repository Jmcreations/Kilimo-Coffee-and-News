const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const jwksClient = require('jwks-rsa');
const User = require('../models/User');

const router = express.Router();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const appleJwks = jwksClient({ jwksUri: 'https://appleid.apple.com/auth/keys' });

function getAppleSigningKey(header, callback) {
  appleJwks.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key.getPublicKey());
  });
}

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

// POST /api/auth/login (Unified email/password login for clients & staff)
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

// POST /api/auth/oauth (Google, Microsoft, and Apple token verification)
router.post('/oauth', async (req, res) => {
  try {
    const { provider, idToken, accessToken, fallbackName } = req.body;
    let verifiedEmail = '';
    let verifiedName = fallbackName || '';

    if (provider === 'google') {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      const payload = ticket.getPayload();
      verifiedEmail = payload.email;
      verifiedName = payload.name || verifiedName;
    } else if (provider === 'microsoft') {
      const graphRes = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!graphRes.ok) {
        return res.status(401).json({ message: 'Invalid Microsoft token.' });
      }
      const profile = await graphRes.json();
      verifiedEmail = profile.mail || profile.userPrincipalName;
      verifiedName = profile.displayName || verifiedName;
    } else if (provider === 'apple') {
      const decoded = await new Promise((resolve, reject) => {
        jwt.verify(
          idToken,
          getAppleSigningKey,
          { audience: process.env.APPLE_CLIENT_ID, issuer: 'https://appleid.apple.com' },
          (err, payload) => (err ? reject(err) : resolve(payload))
        );
      });
      verifiedEmail = decoded.email;
    } else {
      return res.status(400).json({ message: 'Unsupported OAuth provider.' });
    }

    if (!verifiedEmail) {
      return res.status(400).json({ message: 'No verified email returned by provider.' });
    }

    const normalizedEmail = verifiedEmail.trim().toLowerCase();
    let user = await User.findOne({ email: normalizedEmail });

    // Preserve pre-registered staff roles ('admin' or 'journalist'); default new accounts to 'client'
    if (!user) {
      user = await User.create({
        name: (verifiedName || normalizedEmail.split('@')[0]).trim(),
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
    res.status(401).json({ message: 'Social authentication verification failed', error: err.message });
  }
});

module.exports = router;

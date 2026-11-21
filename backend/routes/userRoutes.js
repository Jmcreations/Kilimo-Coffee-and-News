const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

// Protect all /api/users routes for Admin only
router.use(verifyToken, authorizeRoles('admin'));

// GET /api/users - List all staff users
router.get('/', async (_req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load staff users.', error: err.message });
  }
});

// POST /api/users - Create a new Journalist, Delivery, or Admin user
router.post('/', async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ message: 'A user with this email already exists.' });
    }

    const newUser = new User({ name, email, password, role, phone });
    await newUser.save();

    res.status(201).json(newUser);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to create user.' });
  }
});

// PUT /api/users/:id - Edit user details, role, or password
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID.' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const { name, email, role, phone, password } = req.body;
    if (name) user.name = name.trim();
    if (email) user.email = email.toLowerCase().trim();
    if (role) user.role = role;
    if (phone !== undefined) user.phone = phone.trim();
    if (password && password.trim().length >= 6) {
      user.password = password.trim(); // Triggers pre('save') hash
    }

    await user.save();
    res.status(200).json(user);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to update user.' });
  }
});

// DELETE /api/users/:id - Delete a staff user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID.' });
    }

    if (req.user.id === id) {
      return res.status(400).json({ message: 'You cannot delete your own active admin account.' });
    }

    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({ message: 'User removed successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user.' });
  }
});

module.exports = router;

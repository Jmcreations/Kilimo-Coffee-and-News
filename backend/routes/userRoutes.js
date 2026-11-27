const express = require('express');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/roles');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

const BUILT_IN_ROLES = [
  { key: 'client', label: 'Client (Customer)', description: 'Standard coffee store customer', portalAccess: 'store', isBuiltIn: true },
  { key: 'journalist', label: 'Journalist', description: 'Publishes and manages coffee news articles', portalAccess: 'news', isBuiltIn: true },
  { key: 'delivery', label: 'Delivery Rider', description: 'Manages and delivers coffee orders', portalAccess: 'delivery', isBuiltIn: true },
  { key: 'admin', label: 'Admin', description: 'Manages operations, orders, news, and staff roles', portalAccess: 'admin', isBuiltIn: true }
];

// GET /api/users/roles - List assignable roles (hides 'admin' & 'super_admin' from regular admins)
router.get('/roles', verifyToken, authorizeRoles('admin', 'super_admin'), async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === 'super_admin';
    const customRoles = await Role.find().sort({ createdAt: 1 });

    const formattedCustom = customRoles.map((r) => ({
      _id: r._id,
      key: r.key,
      label: r.label,
      description: r.description,
      portalAccess: r.portalAccess,
      isBuiltIn: false
    }));

    const combined = [...BUILT_IN_ROLES, ...formattedCustom];

    // Regular admins only see staff/client roles; only super_admin can see or assign 'admin'
    const visibleRoles = isSuperAdmin
      ? combined
      : combined.filter((r) => r.key !== 'admin' && r.key !== 'super_admin');

    res.status(200).json(visibleRoles);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch roles.', error: err.message });
  }
});

// POST /api/users/roles - Define a new custom role (Super Admin only)
router.post('/roles', verifyToken, authorizeRoles('super_admin'), async (req, res) => {
  try {
    const { label, description = '', portalAccess = 'store' } = req.body;
    if (!label || !label.trim()) {
      return res.status(400).json({ message: 'Role name is required.' });
    }

    const key = label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    if (!key || ['super_admin', 'admin', 'client', 'journalist', 'delivery'].includes(key)) {
      return res.status(400).json({ message: 'That role key is reserved or invalid.' });
    }

    const exists = await Role.findOne({ key });
    if (exists) {
      return res.status(409).json({ message: 'A role with that name already exists.' });
    }

    const created = await Role.create({
      key,
      label: label.trim(),
      description: description.trim(),
      portalAccess,
      createdBy: req.user.id
    });

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create role.', error: err.message });
  }
});

// DELETE /api/users/roles/:id - Delete a custom role (Super Admin only)
router.delete('/roles/:id', verifyToken, authorizeRoles('super_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid role ID.' });
    }

    const roleDoc = await Role.findById(id);
    if (!roleDoc) {
      return res.status(404).json({ message: 'Role not found.' });
    }

    // Reassign any users holding the deleted custom role back to 'client'
    await User.updateMany({ role: roleDoc.key }, { $set: { role: 'client' } });
    await Role.findByIdAndDelete(id);

    res.status(200).json({ message: 'Custom role deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete role.', error: err.message });
  }
});

// GET /api/users - List users (Super Admin sees everyone; Admins never see super_admin accounts)
router.get('/', verifyToken, authorizeRoles('admin', 'super_admin'), async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === 'super_admin';
    const query = isSuperAdmin ? {} : { role: { $ne: 'super_admin' } };

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load users.', error: err.message });
  }
});

// POST /api/users - Create a staff or admin account directly
router.post('/', verifyToken, authorizeRoles('admin', 'super_admin'), async (req, res) => {
  try {
    const { name, email, phone = '', password, role = 'client' } = req.body;
    const isSuperAdmin = req.user.role === 'super_admin';
    const targetRole = (role || 'client').trim().toLowerCase();

    if (!name || !email || !password || password.length < 6) {
      return res.status(400).json({ message: 'Name, email, and a password of at least 6 characters are required.' });
    }

    if (targetRole === 'super_admin') {
      return res.status(403).json({ message: 'Super admin accounts cannot be created through this endpoint.' });
    }

    if (targetRole === 'admin' && !isSuperAdmin) {
      return res.status(403).json({ message: 'Only a super admin can create admin accounts.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: 'A user with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const created = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password: hashedPassword,
      authProvider: 'local',
      role: targetRole
    });

    const safeUser = created.toObject();
    delete safeUser.password;
    res.status(201).json(safeUser);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create user.', error: err.message });
  }
});

// PATCH /api/users/:id/role - Assign or update a user's role
router.patch('/:id/role', verifyToken, authorizeRoles('admin', 'super_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const nextRole = (req.body.role || '').trim().toLowerCase();
    const isSuperAdmin = req.user.role === 'super_admin';

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID.' });
    }

    if (!nextRole || nextRole === 'super_admin') {
      return res.status(403).json({ message: 'Invalid or restricted role assignment.' });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Hide super_admin existence from regular admins
    if (targetUser.role === 'super_admin' && !isSuperAdmin) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Prevent removing the last super_admin
    if (targetUser.role === 'super_admin' && nextRole !== 'super_admin') {
      const superAdminCount = await User.countDocuments({ role: 'super_admin' });
      if (superAdminCount <= 1) {
        return res.status(400).json({ message: 'Cannot demote the only super admin account.' });
      }
    }

    // Only super_admin can promote to 'admin' or modify an existing 'admin'
    if ((nextRole === 'admin' || targetUser.role === 'admin') && !isSuperAdmin) {
      return res.status(403).json({ message: 'Only a super admin can grant or modify admin privileges.' });
    }

    targetUser.role = nextRole;
    await targetUser.save();

    const safeUser = targetUser.toObject();
    delete safeUser.password;
    res.status(200).json(safeUser);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update user role.', error: err.message });
  }
});

// DELETE /api/users/:id - Delete a user account
router.delete('/:id', verifyToken, authorizeRoles('admin', 'super_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const isSuperAdmin = req.user.role === 'super_admin';

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID.' });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (targetUser.role === 'super_admin') {
      return res.status(isSuperAdmin ? 403 : 404).json({
        message: isSuperAdmin ? 'Super admin accounts cannot be deleted here.' : 'User not found.'
      });
    }

    if (targetUser.role === 'admin' && !isSuperAdmin) {
      return res.status(403).json({ message: 'Only a super admin can delete admin accounts.' });
    }

    await User.findByIdAndDelete(id);
    res.status(200).json({ message: 'User removed.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user.', error: err.message });
  }
});

module.exports = router;

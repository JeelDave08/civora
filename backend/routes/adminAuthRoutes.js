const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const ActivityLog = require('../models/ActivityLog');

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { loginId, password } = req.body;
    const email = loginId.toLowerCase().trim();

    // Validate email domain
    if (!email.endsWith('@admin.civora.com')) {
      return res.status(400).json({ message: 'Invalid admin email. Must use @admin.civora.com domain.' });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!admin.isActive) {
      return res.status(403).json({ message: 'Admin account has been deactivated. Contact super admin.' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Log the login activity
    await new ActivityLog({
      adminId: admin._id,
      action: 'LOGIN',
      details: `Admin ${admin.fullName} logged in`,
      ipAddress: req.ip
    }).save();

    const token = jwt.sign(
      { id: admin._id, role: 'admin', isAdmin: true },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: admin._id,
        email: admin.email,
        name: admin.fullName,
        role: 'admin',
        department: admin.department,
        permissions: admin.permissions,
        profileImage: admin.profileImage
      }
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin Register (protected — only existing admins can create new admins)
router.post('/register', async (req, res) => {
  try {
    // Check for admin token
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authorization required' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin' || !decoded.isAdmin) {
      return res.status(403).json({ message: 'Only admins can create admin accounts' });
    }

    const { fullName, email, password, department } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Validate email domain
    if (!normalizedEmail.endsWith('@admin.civora.com')) {
      return res.status(400).json({ message: 'Admin email must end with @admin.civora.com' });
    }

    // Check if admin already exists
    let existingAdmin = await Admin.findOne({ email: normalizedEmail });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdmin = new Admin({
      fullName,
      email: normalizedEmail,
      password: hashedPassword,
      department: department || 'General Administration'
    });

    await newAdmin.save();

    // Log the activity
    await new ActivityLog({
      adminId: decoded.id,
      action: 'CREATE_ADMIN',
      details: `Created new admin account: ${fullName} (${normalizedEmail})`,
      targetType: 'Admin',
      targetId: newAdmin._id,
      ipAddress: req.ip
    }).save();

    res.status(201).json({
      message: 'Admin account created successfully',
      admin: { id: newAdmin._id, email: newAdmin.email, name: newAdmin.fullName, department: newAdmin.department }
    });
  } catch (err) {
    console.error('Admin register error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

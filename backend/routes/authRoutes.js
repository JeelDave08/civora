const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, city, password } = req.body;
    
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      fullName,
      email,
      city,
      password: hashedPassword,
      role: 'citizen'
    });

    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ token, user: { id: user._id, email: user.email, name: user.fullName, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { loginId, password } = req.body;
    if (!loginId || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const cleanEmail = loginId.trim().toLowerCase();
    
    // Multi-collection lookup: User, Supervisor, FieldWorker
    const Supervisor = require('../models/Supervisor');
    const FieldWorker = require('../models/FieldWorker');

    let user = await User.findOne({ email: cleanEmail });
    if (!user) {
      user = await Supervisor.findOne({ email: cleanEmail });
    }
    if (!user) {
      user = await FieldWorker.findOne({ email: cleanEmail });
    }

    // Fallback: Check personalEmail if login by personal email was attempted
    if (!user) {
      user = await Supervisor.findOne({ personalEmail: cleanEmail });
    }
    if (!user) {
      user = await FieldWorker.findOne({ personalEmail: cleanEmail });
    }

    if (!user) {
      console.warn(`[LOGIN FAIL] No user found with email/personalEmail: ${cleanEmail}`);
      return res.status(400).json({ message: 'Invalid credentials: User account not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn(`[LOGIN FAIL] Password mismatch for email: ${cleanEmail}`);
      return res.status(400).json({ message: 'Invalid credentials: Password incorrect' });
    }

    const role = user.role || 'citizen';
    const token = jwt.sign({ id: user._id, role }, process.env.JWT_SECRET, { expiresIn: '24h' });

    // Log Activity
    try {
      const ActivityLog = require('../models/ActivityLog');
      await new ActivityLog({
        actorRole: role,
        actorName: user.fullName || user.email,
        action: 'USER_LOGIN',
        details: `${role === 'supervisor' ? 'Supervisor' : role === 'worker' ? 'Field Worker' : 'Citizen'} logged into system: ${user.fullName} (${user.email})`,
        targetType: role === 'supervisor' ? 'Supervisor' : role === 'worker' ? 'FieldWorker' : 'User',
        targetId: user._id,
        ipAddress: req.ip
      }).save();
    } catch (logErr) {
      console.warn('Login activity log skipped:', logErr.message);
    }

    console.log(`[LOGIN SUCCESS] User logged in: ${user.fullName} (${user.email}) Role: ${role}`);
    res.json({ token, user: { id: user._id, email: user.email, name: user.fullName, role } });
  } catch (err) {
    console.error('Login route error:', err);
    res.status(500).json({ message: 'Server error during login: ' + err.message });
  }
});

// Google Login/Register (Firebase token based)
router.post('/google', async (req, res) => {
  try {
    const { email, displayName, uid } = req.body; // In real-world, verify Firebase token
    
    let user = await User.findOne({ email });
    if (!user) {
      // Create user if not exists
      user = new User({
        fullName: displayName,
        email,
        googleId: uid,
        role: 'citizen'
      });
      await user.save();
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, user: { id: user._id, email: user.email, name: user.fullName, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

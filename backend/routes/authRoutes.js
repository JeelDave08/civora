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
    const { loginId, password } = req.body; // loginId can be email
    
    // For simplicity, checking email
    const user = await User.findOne({ email: loginId.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, user: { id: user._id, email: user.email, name: user.fullName, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
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

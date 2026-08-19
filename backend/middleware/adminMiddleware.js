const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Middleware to protect admin & supervisor routes
const adminProtect = async (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check that the token has admin, supervisor, or worker role
    if (!['admin', 'supervisor', 'worker'].includes(decoded.role)) {
      return res.status(403).json({ message: 'Access denied. Privileged access required.' });
    }

    if (decoded.role === 'admin') {
      const admin = await Admin.findById(decoded.id).select('-password');
      if (!admin) {
        return res.status(401).json({ message: 'Admin account not found' });
      }
      if (!admin.isActive) {
        return res.status(403).json({ message: 'Admin account has been deactivated' });
      }
      req.admin = admin;
    }

    req.user = decoded; // Keep compatibility for both roles
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = { adminProtect };

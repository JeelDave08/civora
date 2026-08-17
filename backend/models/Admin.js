const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: {
      validator: function (v) {
        return v.endsWith('@admin.civora.com');
      },
      message: 'Admin email must end with @admin.civora.com'
    }
  },
  password: { type: String, required: true },
  department: { type: String, default: 'General Administration' },
  permissions: {
    type: [String],
    default: ['all'],
    enum: ['all', 'manage_complaints', 'manage_citizens', 'manage_personnel', 'manage_departments', 'view_reports', 'manage_announcements']
  },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  profileImage: { type: String, default: '' },
  phone: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Admin', adminSchema);

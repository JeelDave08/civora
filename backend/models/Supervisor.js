const mongoose = require('mongoose');

const supervisorSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  personalEmail: { type: String, default: '' },
  password: { type: String, required: true },
  department: { type: String, default: 'General' },
  city: { type: String, default: '' },
  phone: { type: String, default: '' },
  profileImage: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  role: { type: String, default: 'supervisor' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Supervisor', supervisorSchema);

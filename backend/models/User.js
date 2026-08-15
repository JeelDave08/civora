const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  city: { type: String },
  password: { type: String }, // optional for Google Login
  role: { type: String, enum: ['citizen', 'admin', 'supervisor', 'worker'], default: 'citizen' },
  googleId: { type: String }, // For Firebase/Google Auth
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  profileImage: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);

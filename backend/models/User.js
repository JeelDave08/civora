const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  personalEmail: { type: String, default: '' },
  city: { type: String },
  password: { type: String }, // optional for Google Login
  role: { type: String, enum: ['citizen', 'admin', 'supervisor', 'worker'], default: 'citizen' },
  googleId: { type: String }, // For Firebase/Google Auth
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  profileImage: { type: String, default: '' },
  points: { type: Number, default: 450 },
  badges: { type: Array, default: ["First Report", "Community Helper"] },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);

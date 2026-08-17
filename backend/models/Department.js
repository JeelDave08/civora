const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  status: {
    type: String,
    enum: ['Active', 'Maintenance', 'Inactive'],
    default: 'Active'
  },
  description: { type: String, default: '' },
  icon: { type: String, default: 'Server' }, // Lucide icon name for frontend
  color: { type: String, default: 'text-emerald-500' }, // Tailwind color class
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Department', departmentSchema);

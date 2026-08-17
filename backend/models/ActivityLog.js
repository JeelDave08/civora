const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  action: { type: String, required: true }, // e.g., 'LOGIN', 'CREATE_PERSONNEL', 'UPDATE_COMPLAINT', etc.
  details: { type: String }, // Human-readable description
  targetType: { type: String }, // e.g., 'Complaint', 'User', 'Department'
  targetId: { type: mongoose.Schema.Types.ObjectId },
  ipAddress: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);

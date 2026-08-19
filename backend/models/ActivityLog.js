const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  actorRole: { type: String }, // 'admin' | 'supervisor' | 'worker'
  actorName: { type: String },
  action: { type: String, required: true }, // e.g., 'LOGIN', 'CREATE_PERSONNEL', 'TASK_PROGRESS', etc.
  details: { type: String }, // Human-readable description
  targetType: { type: String }, // e.g., 'Complaint', 'User', 'FieldWorker'
  targetId: { type: mongoose.Schema.Types.ObjectId },
  ipAddress: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipientRole: {
    type: String,
    enum: ['citizen', 'supervisor', 'admin', 'worker'],
    default: 'citizen'
  },
  type: {
    type: String,
    enum: ['VERIFICATION_REQUEST', 'COMMUNITY_REOPEN_ALERT', 'WORKER_RESOLVED', 'SUPERVISOR_APPROVED', 'GENERAL'],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  complaintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' },
  read: { type: Boolean, default: false },
  actionData: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

notificationSchema.index({ recipientId: 1, read: 1 });
notificationSchema.index({ complaintId: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

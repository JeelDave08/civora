const mongoose = require('mongoose');

const communityReopenEventSchema = new mongoose.Schema({
  complaintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true },
  reopenedAt: { type: Date, default: Date.now },
  stillExistsCount: { type: Number, required: true },
  thresholdApplied: { type: Number, required: true },
  status: {
    type: String,
    enum: ['TRIGGERED', 'REVIEWED_BY_SUPERVISOR', 'REWORK_ASSIGNED', 'RESOLVED_AGAIN'],
    default: 'TRIGGERED'
  },
  supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  supervisorNotes: { type: String, default: '' },
  actionTaken: { type: String, default: '' }
});

communityReopenEventSchema.index({ complaintId: 1 });
communityReopenEventSchema.index({ reopenedAt: -1 });

module.exports = mongoose.model('CommunityReopenEvent', communityReopenEventSchema);

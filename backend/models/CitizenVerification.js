const mongoose = require('mongoose');

const citizenVerificationSchema = new mongoose.Schema({
  complaintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true, unique: true },
  status: {
    type: String,
    enum: ['PENDING_SUPERVISOR', 'IN_VERIFICATION', 'VERIFIED_CLOSED', 'COMMUNITY_REOPENED'],
    default: 'PENDING_SUPERVISOR'
  },
  supervisorApprovedAt: { type: Date },
  supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  citizensNotifiedCount: { type: Number, default: 0 },
  yesCount: { type: Number, default: 0 },
  stillExistsCount: { type: Number, default: 0 },
  communityReopenedAt: { type: Date },
  reopenAlertSent: { type: Boolean, default: false },
  history: [
    {
      action: { type: String }, // e.g. 'WORKER_RESOLVED', 'SUPERVISOR_APPROVED', 'CITIZEN_VOTED', 'COMMUNITY_REOPENED'
      actorId: { type: mongoose.Schema.Types.ObjectId },
      actorRole: { type: String },
      actorName: { type: String },
      details: { type: String },
      vote: { type: String }, // 'YES_RESOLVED' | 'STILL_EXISTS'
      timestamp: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

citizenVerificationSchema.index({ complaintId: 1 });
citizenVerificationSchema.index({ status: 1 });

module.exports = mongoose.model('CitizenVerification', citizenVerificationSchema);

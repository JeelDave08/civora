const mongoose = require('mongoose');

const complaintSupporterSchema = new mongoose.Schema({
  complaintId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    required: true
  },
  citizenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  contributionType: {
    type: String,
    enum: ['JOINED_ISSUE', 'ADDED_EVIDENCE', 'CONFIRMED_ISSUE'],
    default: 'JOINED_ISSUE'
  },
  evidenceImages: [mongoose.Schema.Types.Mixed],
  comment: {
    type: String,
    default: ''
  },
  verificationVote: {
    type: String,
    enum: ['RESOLVED', 'STILL_EXISTS', null],
    default: null
  },
  verifiedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// Prevent same citizen from joining same complaint multiple times
complaintSupporterSchema.index({ complaintId: 1, citizenId: 1 }, { unique: true });
complaintSupporterSchema.index({ complaintId: 1 });
complaintSupporterSchema.index({ citizenId: 1 });

module.exports = mongoose.model('ComplaintSupporter', complaintSupporterSchema);

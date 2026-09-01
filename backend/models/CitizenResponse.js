const mongoose = require('mongoose');

const citizenResponseSchema = new mongoose.Schema({
  complaintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true },
  citizenId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  verificationId: { type: mongoose.Schema.Types.ObjectId, ref: 'CitizenVerification' },
  response: {
    type: String,
    enum: ['YES_RESOLVED', 'STILL_EXISTS'],
    required: true
  },
  createdAt: { type: Date, default: Date.now }
});

// Enforce single response per citizen per complaint
citizenResponseSchema.index({ complaintId: 1, citizenId: 1 }, { unique: true });

module.exports = mongoose.model('CitizenResponse', citizenResponseSchema);

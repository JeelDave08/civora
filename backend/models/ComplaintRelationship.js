const mongoose = require('mongoose');

const complaintRelationshipSchema = new mongoose.Schema({
  primaryComplaintId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    required: true
  },
  relatedComplaintId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    required: true
  },
  relationshipType: {
    type: String,
    enum: ['POTENTIAL_DUPLICATE', 'CONFIRMED_DUPLICATE', 'MERGED', 'RELATED'],
    required: true
  },
  similarityScore: {
    type: Number,
    min: 0,
    max: 100
  },
  distanceMeters: {
    type: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

complaintRelationshipSchema.index({ primaryComplaintId: 1, relatedComplaintId: 1 });
complaintRelationshipSchema.index({ primaryComplaintId: 1 });
complaintRelationshipSchema.index({ relatedComplaintId: 1 });

module.exports = mongoose.model('ComplaintRelationship', complaintRelationshipSchema);

const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String, required: true }, // e.g., 'Electricity', 'Roads', 'Water'
  status: { 
    type: String, 
    enum: ['New', 'Assigned', 'Working', 'Pending Citizen Verification', 'Community Reopened – Supervisor Review Required', 'Community Reopened', 'Resolved', 'Closed'], 
    default: 'New' 
  },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  progress: { type: Number, default: 0 },
  citizenId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  startDate: { type: Date },
  dueDate: { type: Date },
  remarks: { type: String },
  beforeImage: { type: String },
  afterImage: { type: String },
  location: {
    lat: { type: Number },
    lng: { type: Number },
    address: { type: String },
    geoPoint: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: undefined
      }
    }
  },
  imageUrl: { type: String },
  images: [mongoose.Schema.Types.Mixed], // Supports String URLs or { url, publicId, aiAnalysis: { detectedIssue, confidenceScore, suggestedCategory, suggestedPriority, status, analyzedAt, confirmedByCitizen, confirmedAt } }
  workStartedAt: { type: Date },
  workEndedAt: { type: Date },
  timeSpentSeconds: { type: Number, default: 0 },
  isTimerRunning: { type: Boolean, default: false },
  department: { type: String },
  suggestedSlaHours: { type: Number, default: null },
  slaDueAt: { type: Date, default: null },
  aiAnalysisStatus: {
    type: String,
    enum: ['NOT_ANALYZED', 'ANALYZING', 'COMPLETED', 'FAILED'],
    default: 'NOT_ANALYZED'
  },
  aiAnalysis: {
    category: { type: String, default: null },
    priority: { type: String, default: null },
    department: { type: String, default: null },
    issueSummary: { type: String, default: null },
    suggestedSlaHours: { type: Number, default: null },
    confidenceScore: { type: Number, min: 0, max: 1, default: null },
    imageAnalysis: { type: String, default: null },
    analyzedAt: { type: Date, default: null },
    confirmedByCitizen: { type: Boolean, default: false },
    confirmedAt: { type: Date, default: null }
  },
  aiProvider: { type: String, default: null },
  aiModel: { type: String, default: null },
  aiAnalysisVersion: { type: String, default: '1.0' },
  aiImageAnalysis: {
    detectedIssue: { type: String, default: null },
    confidenceScore: { type: Number, min: 0, max: 1, default: null },
    suggestedCategory: { type: String, default: null },
    suggestedPriority: { type: String, default: null },
    confirmedByCitizen: { type: Boolean, default: false },
    analyzedAt: { type: Date, default: null },
    confirmedAt: { type: Date, default: null }
  },
  communityIssue: {
    isPrimary: { type: Boolean, default: true },
    primaryComplaintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', default: null },
    supporterCount: { type: Number, default: 0 },
    duplicateCount: { type: Number, default: 0 },
    followersCount: { type: Number, default: 0 },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    verification: {
      resolvedCount: { type: Number, default: 0 },
      stillExistsCount: { type: Number, default: 0 },
      reopenSignaled: { type: Boolean, default: false }
    }
  },
  citizenVerification: {
    citizensNotified: { type: Number, default: 0 },
    yesCount: { type: Number, default: 0 },
    stillExistsCount: { type: Number, default: 0 },
    verificationStatus: {
      type: String,
      enum: ['NONE', 'PENDING_SUPERVISOR', 'IN_VERIFICATION', 'VERIFIED_CLOSED', 'COMMUNITY_REOPENED'],
      default: 'NONE'
    },
    communityReopened: { type: Boolean, default: false },
    approvedBySupervisorAt: { type: Date },
    reopenedAt: { type: Date }
  },
  createdAt: { type: Date, default: Date.now },
});

// Backward-compatible indexes for querying complaints efficiently
complaintSchema.index({ citizenId: 1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ department: 1 });
complaintSchema.index({ priority: 1 });
complaintSchema.index({ workerId: 1 });
complaintSchema.index({ createdAt: -1 });
complaintSchema.index({ 'location.geoPoint': '2dsphere' });
complaintSchema.index({ 'communityIssue.isPrimary': 1 });
complaintSchema.index({ 'communityIssue.primaryComplaintId': 1 });


// Pre-save hook to sync GeoJSON point coordinates from lat/lng
complaintSchema.pre('save', function () {
  if (this.location && typeof this.location.lat === 'number' && typeof this.location.lng === 'number') {
    this.location.geoPoint = {
      type: 'Point',
      coordinates: [this.location.lng, this.location.lat]
    };
  }
});


module.exports = mongoose.model('Complaint', complaintSchema);



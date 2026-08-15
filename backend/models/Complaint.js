const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String, required: true }, // e.g., 'Electricity', 'Roads', 'Water'
  status: { type: String, enum: ['New', 'Assigned', 'Working', 'Resolved', 'Closed'], default: 'New' },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  progress: { type: Number, default: 0 },
  citizenId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  location: {
    lat: { type: Number },
    lng: { type: Number },
    address: { type: String }
  },
  imageUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Complaint', complaintSchema);

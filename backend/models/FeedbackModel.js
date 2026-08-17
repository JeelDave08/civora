const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  citizenId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  subject: { type: String, required: true },
  comment: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  status: {
    type: String,
    enum: ['New', 'Reviewed', 'Resolved'],
    default: 'New'
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Feedback', feedbackSchema);

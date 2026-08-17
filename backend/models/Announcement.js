const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['Emergency Alert', 'Government News', 'Update', 'Maintenance'],
    default: 'Update'
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Announcement', announcementSchema);

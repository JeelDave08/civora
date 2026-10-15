const mongoose = require('mongoose');

const wardSchema = new mongoose.Schema({
  wardNumber: { 
    type: Number, 
    required: true 
  },
  wardName: { 
    type: String 
  },
  city: { 
    type: String, 
    default: 'Rajkot' 
  },
  boundary: {
    type: {
      type: String,
      enum: ['Polygon', 'MultiPolygon'],
      required: false
    },
    coordinates: {
      type: mongoose.Schema.Types.Mixed,
      required: false
    }
  },
  boundarySource: {
    type: String
  },
  isDemo: {
    type: Boolean,
    default: false
  },
  source: { 
    type: String,
    default: 'Rajkot Municipal Corporation'
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

// Unique index for wardNumber + city
wardSchema.index({ wardNumber: 1, city: 1 }, { unique: true });
// Geospatial index for boundaries
wardSchema.index({ boundary: '2dsphere' });

module.exports = mongoose.model('Ward', wardSchema);

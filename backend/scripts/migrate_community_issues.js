const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load backend environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const Complaint = require('../models/Complaint');
const ComplaintSupporter = require('../models/ComplaintSupporter');
const ComplaintRelationship = require('../models/ComplaintRelationship');

async function migrate() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('ERROR: MONGO_URI is not defined in environment variables.');
    process.exit(1);
  }

  console.log('Connecting to MongoDB database...');
  await mongoose.connect(mongoUri);
  console.log('MongoDB Connected Successfully.');

  try {
    const countBefore = await Complaint.countDocuments();
    console.log(`[VERIFICATION] Total complaints BEFORE migration: ${countBefore}`);

    const complaints = await Complaint.find();
    let updatedCount = 0;

    for (const doc of complaints) {
      let needsSave = false;

      // 1. Initialize location.geoPoint if missing and lat/lng are valid numbers
      if (!doc.location) doc.location = {};
      const lat = parseFloat(doc.location.lat);
      const lng = parseFloat(doc.location.lng);

      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        if (!doc.location.geoPoint || !doc.location.geoPoint.coordinates || doc.location.geoPoint.coordinates.length < 2) {
          doc.location.geoPoint = {
            type: 'Point',
            coordinates: [lng, lat] // GeoJSON format: [longitude, latitude]
          };
          doc.markModified('location');
          needsSave = true;
        }
      }

      // 2. Initialize communityIssue fields if missing
      if (!doc.communityIssue) {
        doc.communityIssue = {
          isPrimary: true,
          primaryComplaintId: null,
          supporterCount: 0,
          duplicateCount: 0,
          followersCount: 0,
          followers: [],
          verification: {
            resolvedCount: 0,
            stillExistsCount: 0,
            reopenSignaled: false
          }
        };
        needsSave = true;
      } else {
        if (doc.communityIssue.isPrimary === undefined) doc.communityIssue.isPrimary = true;
        if (doc.communityIssue.supporterCount === undefined) doc.communityIssue.supporterCount = 0;
        if (doc.communityIssue.duplicateCount === undefined) doc.communityIssue.duplicateCount = 0;
      }

      if (needsSave) {
        await doc.save();
        updatedCount++;
      }
    }

    console.log(`[MIGRATION] Updated ${updatedCount} existing complaint documents with additive community fields & GeoJSON points.`);

    // Ensure Mongoose creates indexes defined on schemas
    console.log('Ensuring MongoDB indexes for Complaint, ComplaintSupporter, and ComplaintRelationship...');
    await Complaint.createIndexes();
    await ComplaintSupporter.createIndexes();
    await ComplaintRelationship.createIndexes();
    console.log('MongoDB Indexes Created Successfully.');

    const countAfter = await Complaint.countDocuments();
    console.log(`[VERIFICATION] Total complaints AFTER migration: ${countAfter}`);

    if (countBefore === countAfter) {
      console.log('✅ SUCCESS: Migration completed with zero data loss!');
    } else {
      console.error(`⚠️ WARNING: Complaint count mismatch! Before: ${countBefore}, After: ${countAfter}`);
    }

  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
}

migrate();

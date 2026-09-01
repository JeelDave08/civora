const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Complaint = require('../models/Complaint');

async function migrateComplaints() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/civora';
    console.log('Connecting to MongoDB for migration...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    const complaints = await Complaint.find();
    console.log(`Found ${complaints.length} complaints to inspect and update.`);

    let updatedCount = 0;

    for (const c of complaints) {
      let modified = false;

      // 1. Fix location.geoPoint coordinates
      const lat = c.location?.lat !== undefined ? parseFloat(c.location.lat) : 23.0225;
      const lng = c.location?.lng !== undefined ? parseFloat(c.location.lng) : 72.5714;

      if (!c.location?.geoPoint?.coordinates || c.location.geoPoint.coordinates.length < 2) {
        c.location = c.location || {};
        c.location.lat = lat;
        c.location.lng = lng;
        c.location.geoPoint = {
          type: 'Point',
          coordinates: [lng, lat]
        };
        modified = true;
      }

      // 2. Fix communityIssue subdocument
      if (!c.communityIssue || c.communityIssue.isPrimary === undefined) {
        c.communityIssue = {
          isPrimary: true,
          primaryComplaintId: null,
          supporterCount: c.communityIssue?.supporterCount || 1,
          duplicateCount: c.communityIssue?.duplicateCount || 0,
          followersCount: c.communityIssue?.followersCount || 0,
          followers: c.communityIssue?.followers || [],
          verification: {
            resolvedCount: 0,
            stillExistsCount: 0,
            reopenSignaled: false
          }
        };
        modified = true;
      }

      if (modified) {
        await c.save();
        updatedCount++;
        console.log(`Updated complaint: ${c._id} | Title: "${c.title}"`);
      }
    }

    console.log(`\nMigration completed! Successfully updated ${updatedCount} complaint documents in MongoDB.`);

  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

migrateComplaints();

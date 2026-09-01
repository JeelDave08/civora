const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Complaint = require('../models/Complaint');
const ComplaintSupporter = require('../models/ComplaintSupporter');
const ComplaintRelationship = require('../models/ComplaintRelationship');
const { findDuplicates } = require('../services/duplicateDetectionService');

async function test() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/civora';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    // 1. Fetch all complaints
    const complaints = await Complaint.find().sort({ createdAt: -1 });
    console.log(`\n=== TOTAL COMPLAINTS IN DATABASE: ${complaints.length} ===`);
    complaints.forEach((c, idx) => {
      console.log(`[${idx + 1}] ID: ${c._id} | Title: "${c.title}" | Category: "${c.category}" | Status: ${c.status} | Supporters: ${c.communityIssue?.supporterCount || 1} | Location:`, c.location);
    });

    if (complaints.length === 0) {
      console.log('\nNo complaints found in DB. Creating a baseline primary complaint...');
      const primary = new Complaint({
        title: 'Road Pothole at Main Street',
        description: 'Large deep pothole on the main road causing traffic hazard.',
        category: 'Roads & Footpaths',
        priority: 'High',
        department: 'Roads & Transport',
        location: {
          address: 'Main Street, Rajkot',
          lat: 22.3039,
          lng: 70.8022,
          geoPoint: {
            type: 'Point',
            coordinates: [70.8022, 22.3039]
          }
        },
        status: 'New',
        communityIssue: {
          isPrimary: true,
          supporterCount: 1,
          duplicateCount: 0,
          verification: { resolvedCount: 0, stillExistsCount: 0, reopenSignaled: false }
        }
      });
      await primary.save();
      console.log(`Created baseline primary complaint: ${primary._id}`);
      complaints.push(primary);
    }

    // 2. Test findDuplicates for a new similar road complaint at location (22.3039, 70.8022)
    console.log('\n=== TESTING findDuplicates API FOR SIMILAR ROAD COMPLAINT ===');
    const testPayload = {
      title: 'Road Pothole Issue at Main Street',
      description: 'Severe pothole on the road near school',
      category: 'Roads & Footpaths',
      priority: 'High',
      department: 'Roads & Transport',
      lat: 22.3039,
      lng: 70.8022,
      location: {
        address: 'Main Street, Rajkot',
        lat: 22.3039,
        lng: 70.8022
      }
    };

    console.log('Test Payload:', testPayload);
    const duplicates = await findDuplicates(testPayload);
    console.log(`\nFound ${duplicates.length} duplicate candidates:`);
    console.log(JSON.stringify(duplicates, null, 2));

    if (duplicates.length > 0) {
      console.log('\n✅ DUPLICATE DETECTION SUCCESSFUL! Duplicate candidates returned.');
    } else {
      console.log('\n❌ NO DUPLICATES FOUND! Investigating why score failed threshold...');
    }

  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB.');
  }
}

test();

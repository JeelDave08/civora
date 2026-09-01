const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Complaint = require('../models/Complaint');
const { findDuplicates, calculateSimilarityScore, getHaversineDistanceMeters } = require('../services/duplicateDetectionService');

async function testScoring() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/civora');
    console.log('Connected to DB');

    const testPayload = {
      title: 'Road Issue at Rajkot Taluka, Rajkot, Gujarat, 360006, India',
      description: 'Pothole on the road',
      category: 'Road',
      priority: 'Medium',
      lat: 22.338968,
      lng: 70.758407,
      location: {
        address: 'Rajkot Taluka, Rajkot, Gujarat, 360006, India',
        lat: 22.338968,
        lng: 70.758407
      }
    };

    console.log('\n--- TESTING EXACT PAYLOAD OF USER COMPLAINT [1] ---');
    const duplicates = await findDuplicates(testPayload);
    console.log(`Candidates found: ${duplicates.length}`);
    console.log(JSON.stringify(duplicates, null, 2));

    // Inspect individual candidate scoring manually
    const allComplaints = await Complaint.find();
    console.log('\n--- DETAILED MANUAL SCORING FOR EACH COMPLAINT IN DB ---');
    for (const cand of allComplaints) {
      const candLat = cand.location?.lat || 23.0225;
      const candLng = cand.location?.lng || 72.5714;
      const dist = getHaversineDistanceMeters(testPayload.lat, testPayload.lng, candLat, candLng);
      const score = calculateSimilarityScore(testPayload, cand, dist, 3000);
      console.log(`ID: ${cand._id} | Title: "${cand.title}" | Category: "${cand.category}" | Dist: ${dist}m | Score: ${score}%`);
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

testScoring();

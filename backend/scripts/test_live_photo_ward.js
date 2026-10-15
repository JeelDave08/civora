/**
 * test_live_photo_ward.js
 * Tests STEP 4: Live Photo GPS → Ward Detection → Complaint save
 * 
 * Tests:
 *  A. Live Photo GPS inside Demo Ward 1  → wardNumber=1, DETECTED
 *  B. Live Photo GPS inside Demo Ward 10 → wardNumber=10, DETECTED
 *  C. GPS outside all demo wards         → complaint created, NOT_FOUND
 *  D. GPS unavailable (no lat/lng)       → complaint created, GPS_UNAVAILABLE
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Complaint = require('../models/Complaint');
const { getWardFromCoordinates } = require('../services/geoService');

const PASS = '✅ PASS';
const FAIL = '❌ FAIL';

// Simulate exactly what the backend route does for a Live Photo complaint
async function simulateLivePhotoComplaint({ lat, lng, hasGPS }) {
  let wardNumber = null;
  let wardDetectionMethod = null;
  let wardDetectionStatus = 'PENDING';
  let wardDetectedAt = null;

  // This is the exact logic from citizenRoutes.js POST /complaints (lines 561-581)
  const isLivePhoto = true;

  if (isLivePhoto) {
    if (hasGPS && lat && lng) {
      try {
        const wardInfo = await getWardFromCoordinates(lat, lng);
        wardNumber = wardInfo.wardNumber;
        wardDetectionMethod = wardInfo.detectionMethod;
        wardDetectionStatus = wardInfo.status;
        wardDetectedAt = new Date();
      } catch (geoErr) {
        wardDetectionStatus = 'GPS_UNAVAILABLE';
      }
    } else {
      wardDetectionStatus = 'GPS_UNAVAILABLE';
    }
  }

  // Save a test complaint (will be cleaned up)
  const complaint = new Complaint({
    title: `[TEST] Live Photo Ward Detection Test`,
    description: 'Automated test record – will be deleted',
    category: 'Roads',
    isLivePhoto: true,
    wardNumber,
    wardDetectionMethod,
    wardDetectionStatus,
    wardDetectedAt,
    location: {
      address: 'Test Location',
      lat: lat || 0,
      lng: lng || 0,
    },
    citizenId: new mongoose.Types.ObjectId(), // fake citizen for test
    status: 'New',
  });

  await complaint.save();

  // Re-fetch from DB to confirm persistence
  const saved = await Complaint.findById(complaint._id).lean();

  // Clean up
  await Complaint.deleteOne({ _id: complaint._id });

  return saved;
}

async function runTests() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/civora';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB\n');
  console.log('='.repeat(60));
  console.log('  CIVORA STEP 4 – Live Photo GPS → Ward Detection TEST');
  console.log('='.repeat(60));

  let passed = 0;
  let failed = 0;

  // ── TEST A: GPS inside Demo Ward 1 ───────────────────────────
  // Ward 1: lng [70.750–70.769], lat [22.331–22.350]  centroid: (22.341, 70.760)
  console.log('\nTEST A: Live Photo GPS inside Demo Ward 1');
  console.log('  lat=22.341, lng=70.760');
  try {
    const doc = await simulateLivePhotoComplaint({ lat: 22.341, lng: 70.760, hasGPS: true });
    console.log(`  wardNumber=${doc.wardNumber}, wardDetectionStatus=${doc.wardDetectionStatus}`);
    if (doc.wardNumber === 1 && doc.wardDetectionStatus === 'DETECTED') {
      console.log(`  ${PASS}`);
      passed++;
    } else {
      console.log(`  ${FAIL} Expected wardNumber=1, DETECTED`);
      failed++;
    }
  } catch (e) {
    console.log(`  ${FAIL} Error: ${e.message}`);
    failed++;
  }

  // ── TEST B: GPS inside Demo Ward 10 ──────────────────────────
  // Ward 10: row=1, col=3 → lng [70.810–70.829], lat [22.311–22.330]  centroid: (22.321, 70.820)
  console.log('\nTEST B: Live Photo GPS inside Demo Ward 10');
  console.log('  lat=22.321, lng=70.820');
  try {
    const doc = await simulateLivePhotoComplaint({ lat: 22.321, lng: 70.820, hasGPS: true });
    console.log(`  wardNumber=${doc.wardNumber}, wardDetectionStatus=${doc.wardDetectionStatus}`);
    if (doc.wardNumber === 10 && doc.wardDetectionStatus === 'DETECTED') {
      console.log(`  ${PASS}`);
      passed++;
    } else {
      console.log(`  ${FAIL} Expected wardNumber=10, DETECTED`);
      failed++;
    }
  } catch (e) {
    console.log(`  ${FAIL} Error: ${e.message}`);
    failed++;
  }

  // ── TEST C: GPS outside all demo wards ───────────────────────
  console.log('\nTEST C: GPS outside all demo ward polygons (Kolkata)');
  console.log('  lat=22.57, lng=88.36');
  try {
    const doc = await simulateLivePhotoComplaint({ lat: 22.57, lng: 88.36, hasGPS: true });
    console.log(`  wardNumber=${doc.wardNumber}, wardDetectionStatus=${doc.wardDetectionStatus}`);
    if (doc.wardNumber === null && doc.wardDetectionStatus === 'WARD_NOT_FOUND') {
      console.log(`  ${PASS} Complaint created, wardDetectionStatus=WARD_NOT_FOUND`);
      passed++;
    } else {
      console.log(`  ${FAIL} Expected wardNumber=null, WARD_NOT_FOUND`);
      failed++;
    }
  } catch (e) {
    console.log(`  ${FAIL} Error: ${e.message}`);
    failed++;
  }

  // ── TEST D: GPS unavailable ───────────────────────────────────
  console.log('\nTEST D: GPS unavailable (no lat/lng sent)');
  try {
    const doc = await simulateLivePhotoComplaint({ hasGPS: false });
    console.log(`  wardNumber=${doc.wardNumber}, wardDetectionStatus=${doc.wardDetectionStatus}`);
    if (doc.wardNumber === null && doc.wardDetectionStatus === 'GPS_UNAVAILABLE') {
      console.log(`  ${PASS} Complaint created, wardDetectionStatus=GPS_UNAVAILABLE`);
      passed++;
    } else {
      console.log(`  ${FAIL} Expected wardNumber=null, GPS_UNAVAILABLE`);
      failed++;
    }
  } catch (e) {
    console.log(`  ${FAIL} Error: ${e.message}`);
    failed++;
  }

  // ── SUMMARY ───────────────────────────────────────────────────
  console.log('\n' + '='.repeat(60));
  console.log(`  RESULTS: ${passed} passed, ${failed} failed out of 4 tests`);
  console.log('='.repeat(60));

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});

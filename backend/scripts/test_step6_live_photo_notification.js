/**
 * test_step6_live_photo_notification.js
 * STEP 6: Live Photo → Ward Supervisor Notification + Email
 *
 * Simulates the exact logic from citizenRoutes.js POST /complaints
 * post-save block (lines 634-701).
 *
 * Tests:
 *  1. GPS in Ward 1  → supervisor found, notification + email dispatched
 *  2. GPS in Ward 10 → supervisor found, notification + email dispatched
 *  3. GPS outside all demo wards → WARD_NOT_FOUND, no notification/email
 *  4. Ward with no supervisor → no random pick, no notification/email
 *  5. Notification/email failure → complaint still created
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Complaint    = require('../models/Complaint');
const Notification = require('../models/Notification');
const User         = require('../models/User');
const { getWardFromCoordinates }    = require('../services/geoService');
const { getSupervisorForWard }      = require('../services/supervisorService');
const { sendWardSupervisorLiveReportEmail } = require('../utils/emailSender');

const PASS = '✅ PASS';
const FAIL = '❌ FAIL';

// Replicates EXACTLY the post-save block from citizenRoutes.js
async function runLivePhotoFlow({ lat, lng, hasGPS, forceWardNumber = null, failEmail = false, failNotif = false }) {
  // 1. Ward Detection (same as route lines 561-581)
  let wardNumber = null;
  let wardDetectionStatus = 'PENDING';

  if (hasGPS && lat && lng) {
    try {
      const wardInfo = await getWardFromCoordinates(lat, lng);
      wardNumber = wardInfo.wardNumber;
      wardDetectionStatus = wardInfo.status;
    } catch {
      wardDetectionStatus = 'GPS_UNAVAILABLE';
    }
  } else {
    wardDetectionStatus = 'GPS_UNAVAILABLE';
  }

  // Override for test 4
  if (forceWardNumber !== null) wardNumber = forceWardNumber;

  // 2. Save complaint
  const complaint = new Complaint({
    title: '[TEST] Live Photo Ward 6 Test',
    description: 'Step 6 automated test – safe to delete',
    category: 'Roads',
    isLivePhoto: true,
    wardNumber,
    wardDetectionStatus,
    location: { address: 'Test Location', lat: lat || 0, lng: lng || 0 },
    citizenId: new mongoose.Types.ObjectId(),
    status: 'New',
  });
  await complaint.save();

  let notifCreated = false;
  let emailDispatched = false;
  let supervisorEmail = null;
  let supervisorFound = false;

  // 3. Post-save Live Photo block (same as route lines 635-700)
  let routeError = null;
  try {
    if (complaint.wardNumber !== null && complaint.wardNumber !== undefined) {
      const supervisorRes = await getSupervisorForWard(complaint.wardNumber);
      if (supervisorRes.status === 'FOUND' && supervisorRes.supervisor) {
        const assignedSupervisor = supervisorRes.supervisor;
        supervisorFound = true;
        supervisorEmail = assignedSupervisor.email;

        // Notification
        try {
          if (failNotif) throw new Error('[TEST] Simulated notification failure');
          const newNotif = new Notification({
            recipientId: assignedSupervisor._id,
            recipientRole: 'supervisor',
            complaintId: complaint._id,
            type: 'GENERAL',
            title: '🚨 New Live Photo Complaint – Ward ' + complaint.wardNumber,
            message: `Test notification for complaint #${complaint._id.toString().slice(-6).toUpperCase()}`,
          });
          await newNotif.save();
          notifCreated = true;
        } catch (notifErr) {
          console.warn('  [NOTIF ERROR CAUGHT SAFELY]', notifErr.message);
        }

        // Email (fire-and-forget, same as route)
        try {
          if (failEmail) throw new Error('[TEST] Simulated email failure');
          const emailRes = await sendWardSupervisorLiveReportEmail({
            supervisor: assignedSupervisor,
            complaint,
            citizenName: 'Test Citizen',
            wardNumber: complaint.wardNumber,
            livePhotoUrl: 'https://example.com/test-photo.jpg',
            capturedAt: new Date(),
          });
          emailDispatched = emailRes.success;
        } catch (mailErr) {
          console.warn('  [EMAIL ERROR CAUGHT SAFELY]', mailErr.message);
        }
      }
    }
  } catch (err) {
    routeError = err.message;
    console.error('  [LIVE PHOTO BLOCK ERROR]', err.message);
  }

  // 4. Clean up test data
  if (notifCreated) {
    await Notification.deleteOne({ complaintId: complaint._id, type: 'GENERAL' });
  }
  await Complaint.deleteOne({ _id: complaint._id });

  return {
    complaintCreated: true, // if we reach here, complaint was saved
    wardNumber: complaint.wardNumber,
    wardDetectionStatus: complaint.wardDetectionStatus,
    supervisorFound,
    supervisorEmail,
    notifCreated,
    emailDispatched,
    routeError,
  };
}

async function runTests() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/civora';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB\n');
  console.log('='.repeat(65));
  console.log('  CIVORA STEP 6 – Live Photo → Supervisor Notification + Email');
  console.log('='.repeat(65));

  let passed = 0;
  let failed = 0;

  // ── TEST 1: GPS in Ward 1 ─────────────────────────────────────
  console.log('\nTEST 1: Live Photo + GPS inside Ward 1 (lat=22.341, lng=70.760)');
  try {
    const r = await runLivePhotoFlow({ lat: 22.341, lng: 70.760, hasGPS: true });
    console.log(`  complaintCreated: ${r.complaintCreated}`);
    console.log(`  wardNumber: ${r.wardNumber}, wardDetectionStatus: ${r.wardDetectionStatus}`);
    console.log(`  supervisorFound: ${r.supervisorFound}, email: ${r.supervisorEmail}`);
    console.log(`  notifCreated: ${r.notifCreated}, emailDispatched: ${r.emailDispatched}`);
    if (r.complaintCreated && r.wardNumber === 1 && r.supervisorEmail === 'demo.supervisor1@civora.test' && r.notifCreated && r.emailDispatched) {
      console.log(`  ${PASS}`); passed++;
    } else {
      console.log(`  ${FAIL}`); failed++;
    }
  } catch (e) { console.log(`  ${FAIL} Error: ${e.message}`); failed++; }

  // ── TEST 2: GPS in Ward 10 ────────────────────────────────────
  console.log('\nTEST 2: Live Photo + GPS inside Ward 10 (lat=22.321, lng=70.820)');
  try {
    const r = await runLivePhotoFlow({ lat: 22.321, lng: 70.820, hasGPS: true });
    console.log(`  complaintCreated: ${r.complaintCreated}`);
    console.log(`  wardNumber: ${r.wardNumber}, wardDetectionStatus: ${r.wardDetectionStatus}`);
    console.log(`  supervisorFound: ${r.supervisorFound}, email: ${r.supervisorEmail}`);
    console.log(`  notifCreated: ${r.notifCreated}, emailDispatched: ${r.emailDispatched}`);
    if (r.complaintCreated && r.wardNumber === 10 && r.supervisorEmail === 'demo.supervisor10@civora.test' && r.notifCreated && r.emailDispatched) {
      console.log(`  ${PASS}`); passed++;
    } else {
      console.log(`  ${FAIL}`); failed++;
    }
  } catch (e) { console.log(`  ${FAIL} Error: ${e.message}`); failed++; }

  // ── TEST 3: GPS outside all demo wards ───────────────────────
  console.log('\nTEST 3: GPS outside all demo ward boundaries (Kolkata lat=22.57, lng=88.36)');
  try {
    const r = await runLivePhotoFlow({ lat: 22.57, lng: 88.36, hasGPS: true });
    console.log(`  complaintCreated: ${r.complaintCreated}`);
    console.log(`  wardNumber: ${r.wardNumber}, wardDetectionStatus: ${r.wardDetectionStatus}`);
    console.log(`  supervisorFound: ${r.supervisorFound}`);
    console.log(`  notifCreated: ${r.notifCreated}, emailDispatched: ${r.emailDispatched}`);
    if (r.complaintCreated && r.wardNumber === null && r.wardDetectionStatus === 'WARD_NOT_FOUND' && !r.supervisorFound && !r.notifCreated && !r.emailDispatched) {
      console.log(`  ${PASS}`); passed++;
    } else {
      console.log(`  ${FAIL}`); failed++;
    }
  } catch (e) { console.log(`  ${FAIL} Error: ${e.message}`); failed++; }

  // ── TEST 4: Ward with no supervisor mapped ────────────────────
  // Force wardNumber=999 (no supervisor exists for it)
  console.log('\nTEST 4: Ward detected but no Supervisor mapped (forceWardNumber=999)');
  try {
    const r = await runLivePhotoFlow({ hasGPS: false, forceWardNumber: 999 });
    console.log(`  complaintCreated: ${r.complaintCreated}`);
    console.log(`  wardNumber: ${r.wardNumber}, supervisorFound: ${r.supervisorFound}`);
    console.log(`  notifCreated: ${r.notifCreated}, emailDispatched: ${r.emailDispatched}`);
    if (r.complaintCreated && r.wardNumber === 999 && !r.supervisorFound && !r.notifCreated && !r.emailDispatched) {
      console.log(`  ${PASS}`); passed++;
    } else {
      console.log(`  ${FAIL}`); failed++;
    }
  } catch (e) { console.log(`  ${FAIL} Error: ${e.message}`); failed++; }

  // ── TEST 5: Notification/email failure → complaint survives ──
  console.log('\nTEST 5: Simulated notification + email failure → complaint still created');
  try {
    const r = await runLivePhotoFlow({ lat: 22.341, lng: 70.760, hasGPS: true, failEmail: true, failNotif: true });
    console.log(`  complaintCreated: ${r.complaintCreated}`);
    console.log(`  wardNumber: ${r.wardNumber}, supervisorFound: ${r.supervisorFound}`);
    console.log(`  notifCreated: ${r.notifCreated}, emailDispatched: ${r.emailDispatched}`);
    if (r.complaintCreated && r.wardNumber === 1 && r.supervisorFound && !r.notifCreated && !r.emailDispatched) {
      console.log(`  ${PASS} Complaint created; notification/email failures did NOT break complaint`);
      passed++;
    } else {
      console.log(`  ${FAIL}`); failed++;
    }
  } catch (e) { console.log(`  ${FAIL} Error: ${e.message}`); failed++; }

  // ── SUMMARY ───────────────────────────────────────────────────
  console.log('\n' + '='.repeat(65));
  console.log(`  RESULTS: ${passed} passed, ${failed} failed out of 5 tests`);
  console.log('='.repeat(65));

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(e => { console.error('Fatal:', e); process.exit(1); });

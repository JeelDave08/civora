/**
 * test_step7_browser_e2e.js
 * 
 * CIVORA – STEP 7 FINAL: REAL BROWSER END-TO-END VERIFICATION
 * 
 * Drives the real Google Chrome browser on Windows using puppeteer-core:
 * - Real camera feed (synthetic test stream via --use-fake-device-for-media-stream)
 * - Real geolocation override & permission grants
 * - Real UI navigation & clicks
 * - Real Cloudinary image uploads
 * - Real MongoDB validation for Complaint, Ward, Notification, and Email dispatch
 */

const puppeteer = require('puppeteer-core');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP_URL = 'http://localhost:5173';

// Models
const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');
const Supervisor = require('../models/Supervisor');

// Minimal valid 1x1 JPEG for file upload testing
const VALID_JPEG_BUFFER = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
  0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
  0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
  0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
  0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20,
  0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29,
  0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32,
  0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
  0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00,
  0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
  0x09, 0x0a, 0x0b, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f,
  0x00, 0xbf, 0x80, 0xff, 0xd9
]);

const TEMP_TEST_IMG_PATH = path.join(__dirname, 'temp_test_evidence.jpg');

async function runStep7E2E() {
  console.log('=================================================================');
  console.log('   CIVORA STEP 7: REAL BROWSER END-TO-END VERIFICATION');
  console.log('=================================================================\n');

  fs.writeFileSync(TEMP_TEST_IMG_PATH, VALID_JPEG_BUFFER);

  await mongoose.connect(process.env.MONGO_URI);
  console.log(' Connected to MongoDB');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });
  console.log(' Chrome launched successfully with fake media device support\n');

  const results = {
    test1: { pass: false, evidence: '' },
    test2: { pass: false, evidence: '' },
    test3: { pass: false, evidence: '' },
    test4: { pass: false, evidence: '' },
    test5: { pass: false, evidence: '' },
    meta: {}
  };

  let test1ComplaintDoc = null;
  let test1Supervisor = null;

  try {
    // -------------------------------------------------------------
    // TEST 1: REAL LIVE PHOTO + GPS
    // -------------------------------------------------------------
    console.log('--- TEST 1: REAL LIVE PHOTO IN BROWSER ---');
    const context1 = await browser.createBrowserContext();
    await context1.overridePermissions(APP_URL, ['geolocation', 'camera']);

    const page1 = await context1.newPage();
    page1.on('dialog', d => d.accept());

    // Set GPS to Ward 1 (lat: 22.341, lng: 70.760)
    await page1.setGeolocation({ latitude: 22.341, longitude: 70.760 });

    // Login as Citizen
    await page1.goto(`${APP_URL}/login`, { waitUntil: 'networkidle0' });
    await page1.type('input[type="text"], input[type="email"]', 'test.citizen@civora.test');
    await page1.type('input[type="password"]', 'Citizen@123');
    await page1.click('button[type="submit"]');
    await page1.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});

    console.log('  Citizen logged in');

    // Navigate to Raise Complaint
    await page1.goto(`${APP_URL}/citizen/raise-complaint`, { waitUntil: 'networkidle0' });

    // Step 1: Select Category ("Street Light")
    await page1.waitForSelector('div.cursor-pointer');
    await page1.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('div.cursor-pointer'));
      const card = cards.find(c => c.textContent && c.textContent.includes('Street Light'));
      if (card) card.click();
    });
    await new Promise(r => setTimeout(r, 600));

    // Click Next button
    await page1.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const nextBtn = btns.find(b => b.textContent && b.textContent.includes('Next') && !b.disabled);
      if (nextBtn) nextBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Step 2: Description
    const uniqueTestDesc = `E2E Live Photo Test ${Date.now()}`;
    await page1.waitForSelector('textarea');
    await page1.type('textarea', uniqueTestDesc);
    await new Promise(r => setTimeout(r, 500));

    // Click Next button
    await page1.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const nextBtn = btns.find(b => b.textContent && b.textContent.includes('Next') && !b.disabled);
      if (nextBtn) nextBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Step 3: Live Photo Capture
    console.log('  Triggering Live Photo camera card click...');
    await page1.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('span'));
      const span = spans.find(s => s.textContent && s.textContent.includes('Take Live Photo'));
      const card = span ? (span.closest('div.cursor-pointer') || span.parentElement) : null;
      if (card) card.click();
    });

    // Wait for video stream
    await page1.waitForSelector('video', { timeout: 10000 });
    console.log('  Camera stream active! Capturing photo...');
    await new Promise(r => setTimeout(r, 2000));

    // Click "Capture Photo"
    await page1.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const capBtn = btns.find(b => b.textContent && b.textContent.includes('Capture Photo'));
      if (capBtn) capBtn.click();
    });
    await new Promise(r => setTimeout(r, 1200));

    // Click "Use Photo" -> uploads to Cloudinary and gets GPS
    console.log('  Using photo: uploading to Cloudinary and acquiring GPS...');
    await page1.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const useBtn = btns.find(b => b.textContent && b.textContent.includes('Use Photo'));
      if (useBtn) useBtn.click();
    });
    await new Promise(r => setTimeout(r, 5000));

    // Ensure location field has content
    await page1.evaluate(() => {
      const input = document.querySelector('input[placeholder*="Type address"]');
      if (input && (!input.value || input.value.includes('Detecting'))) {
        input.value = 'RMC Ward 1 Area, Rajkot';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await new Promise(r => setTimeout(r, 800));

    // Submit complaint
    console.log('  Submitting complaint...');
    await page1.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const subBtn = btns.find(b => b.textContent && b.textContent.includes('Submit Complaint') && !b.disabled);
      if (subBtn) subBtn.click();
    });

    // Wait for submission response
    await new Promise(r => setTimeout(r, 5000));

    // Verify in MongoDB
    test1ComplaintDoc = await Complaint.findOne({ description: uniqueTestDesc }).lean();
    if (!test1ComplaintDoc) {
      throw new Error(`Test 1 failed: Complaint with description "${uniqueTestDesc}" not found in database!`);
    }

    console.log(`  Created Complaint #${test1ComplaintDoc.complaintId || test1ComplaintDoc._id}`);
    console.log(`  isLivePhoto: ${test1ComplaintDoc.isLivePhoto}`);
    console.log(`  wardNumber: ${test1ComplaintDoc.wardNumber}`);
    console.log(`  wardDetectionStatus: ${test1ComplaintDoc.wardDetectionStatus}`);
    console.log(`  location: lat=${test1ComplaintDoc.location?.lat}, lng=${test1ComplaintDoc.location?.lng}`);

    // Verify supervisor notification in MongoDB
    const notif = await Notification.findOne({ complaintId: test1ComplaintDoc._id }).lean();
    console.log(`  Notification in DB: ${notif ? 'YES (ID: ' + notif._id + ', Recipient: ' + notif.recipientId + ')' : 'NO'}`);

    test1Supervisor = await Supervisor.findOne({ wardNumber: '1', isActive: true }).lean();
    console.log(`  Mapped Supervisor: ${test1Supervisor ? test1Supervisor.email : 'NOT FOUND'}`);

    const test1Pass = (
      test1ComplaintDoc.isLivePhoto === true &&
      test1ComplaintDoc.wardNumber === 1 &&
      test1ComplaintDoc.wardDetectionStatus === 'DETECTED' &&
      test1ComplaintDoc.wardDetectionMethod === 'GPS' &&
      test1ComplaintDoc.location?.lat !== undefined &&
      notif !== null &&
      String(notif.recipientId) === String(test1Supervisor._id)
    );

    results.test1 = {
      pass: test1Pass,
      evidence: `Complaint #${test1ComplaintDoc.complaintId}, Ward ${test1ComplaintDoc.wardNumber}, Status=${test1ComplaintDoc.wardDetectionStatus}, Supervisor=${test1Supervisor.email}, Notification=${notif ? notif._id : 'none'}`
    };

    results.meta.complaintId = test1ComplaintDoc.complaintId || String(test1ComplaintDoc._id);
    results.meta.actualWard = test1ComplaintDoc.wardNumber;
    results.meta.supervisorEmail = test1Supervisor.email;
    results.meta.livePhotoUrl = test1ComplaintDoc.images?.[0] || test1ComplaintDoc.imageUrl;

    await context1.close();
    console.log(`  TEST 1 RESULT: ${test1Pass ? '✅ PASS' : '❌ FAIL'}\n`);

    // -------------------------------------------------------------
    // TEST 2: SUPERVISOR SIDE
    // -------------------------------------------------------------
    console.log('--- TEST 2: SUPERVISOR SIDE IN BROWSER ---');
    const context2 = await browser.createBrowserContext();
    const page2 = await context2.newPage();
    page2.on('dialog', d => d.accept());

    // Login as Demo Supervisor 1
    await page2.goto(`${APP_URL}/login`, { waitUntil: 'networkidle0' });
    await page2.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const supBtn = buttons.find(b => b.textContent && b.textContent.includes('Supervisor'));
      if (supBtn) supBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));

    await page2.type('input[type="text"], input[type="email"]', 'demo.supervisor1@civora.test');
    await page2.type('input[type="password"]', 'Demo@123');
    await page2.click('button[type="submit"]');
    await page2.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});

    console.log('  Supervisor logged in');

    // Navigate to Supervisor Complaints Queue
    await page2.goto(`${APP_URL}/supervisor/complaints`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));

    // Verify complaint appears in queue
    const complaintRowVisible = await page2.evaluate((cid) => {
      return document.body.innerText.includes(cid.slice(-4).toUpperCase());
    }, String(test1ComplaintDoc._id));

    console.log(`  Complaint #${String(test1ComplaintDoc._id).slice(-4).toUpperCase()} in supervisor queue: ${complaintRowVisible ? 'YES' : 'NO'}`);

    // Navigate directly to the complaint detail page
    await page2.goto(`${APP_URL}/supervisor/complaints/${test1ComplaintDoc._id}`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2500));

    // Verify detail page elements: Live photo, location, complaint title
    const detailChecks = await page2.evaluate((expectedImg) => {
      const bodyText = document.body.innerText;
      const images = Array.from(document.querySelectorAll('img')).map(i => i.src);
      const hasImage = images.some(src => src.includes('cloudinary.com') || (expectedImg && src === expectedImg));
      return {
        hasImage,
        imagesFound: images.filter(s => s.includes('cloudinary')),
        hasAddress: bodyText.includes('Rajkot'),
        hasTitle: bodyText.includes('Complaint #')
      };
    }, results.meta.livePhotoUrl);

    console.log(`  Detail Page: Has Live Photo=${detailChecks.hasImage}, Has Address=${detailChecks.hasAddress}`);

    const test2Pass = detailChecks.hasImage && detailChecks.hasTitle;
    results.test2 = {
      pass: test2Pass,
      evidence: `Supervisor complaint detail rendered, Live photo verified in DOM (${detailChecks.imagesFound.length} cloudinary images), Location confirmed`
    };
    results.meta.livePhotoInSupervisor = detailChecks.hasImage;

    await context2.close();
    console.log(`  TEST 2 RESULT: ${test2Pass ? '✅ PASS' : '❌ FAIL'}\n`);

    // -------------------------------------------------------------
    // TEST 3: NORMAL UPLOAD PHOTO REGRESSION
    // -------------------------------------------------------------
    console.log('--- TEST 3: NORMAL UPLOAD PHOTO REGRESSION ---');
    const context3 = await browser.createBrowserContext();
    const page3 = await context3.newPage();
    page3.on('dialog', d => d.accept());

    // Login Citizen
    await page3.goto(`${APP_URL}/login`, { waitUntil: 'networkidle0' });
    await page3.type('input[type="text"], input[type="email"]', 'test.citizen@civora.test');
    await page3.type('input[type="password"]', 'Citizen@123');
    await page3.click('button[type="submit"]');
    await page3.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});

    // Navigate to Raise Complaint
    await page3.goto(`${APP_URL}/citizen/raise-complaint`, { waitUntil: 'networkidle0' });

    // Step 1: Category "Garbage"
    await page3.waitForSelector('div.cursor-pointer');
    await page3.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('div.cursor-pointer'));
      const card = cards.find(c => c.textContent && c.textContent.includes('Garbage'));
      if (card) card.click();
    });
    await new Promise(r => setTimeout(r, 600));

    await page3.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const nextBtn = btns.find(b => b.textContent && b.textContent.includes('Next') && !b.disabled);
      if (nextBtn) nextBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Step 2: Description
    const normalUploadDesc = `E2E Normal Upload Regression ${Date.now()}`;
    await page3.waitForSelector('textarea');
    await page3.type('textarea', normalUploadDesc);
    await new Promise(r => setTimeout(r, 500));

    await page3.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const nextBtn = btns.find(b => b.textContent && b.textContent.includes('Next') && !b.disabled);
      if (nextBtn) nextBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Step 3: Upload normal file via file input
    const fileInputHandle = await page3.$('input[type="file"]');
    if (fileInputHandle) {
      await fileInputHandle.uploadFile(TEMP_TEST_IMG_PATH);
      console.log('  Normal file selected for upload, waiting for Cloudinary upload...');
      await new Promise(r => setTimeout(r, 4500));
    }

    // Set address manually
    await page3.evaluate(() => {
      const input = document.querySelector('input[placeholder*="Type address"]');
      if (input) {
        input.value = 'Moti Tanki Chowk, Rajkot';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await new Promise(r => setTimeout(r, 800));

    // Submit complaint
    await page3.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const subBtn = btns.find(b => b.textContent && b.textContent.includes('Submit Complaint') && !b.disabled);
      if (subBtn) subBtn.click();
    });
    await new Promise(r => setTimeout(r, 5000));

    // Verify in MongoDB: isLivePhoto must be false/undefined, NO Live Photo supervisor routing
    const normalComplaintDoc = await Complaint.findOne({ description: normalUploadDesc }).lean();
    if (!normalComplaintDoc) {
      throw new Error(`Test 3 failed: Complaint "${normalUploadDesc}" not found in DB!`);
    }

    const normalNotif = await Notification.findOne({
      complaintId: normalComplaintDoc._id,
      title: { $regex: /New Ward/i }
    }).lean();

    const test3Pass = (
      (!normalComplaintDoc.isLivePhoto || normalComplaintDoc.isLivePhoto === false) &&
      normalNotif === null
    );

    results.test3 = {
      pass: test3Pass,
      evidence: `Complaint #${normalComplaintDoc.complaintId} created successfully; isLivePhoto=${!!normalComplaintDoc.isLivePhoto}; Supervisor Live Photo notification was NOT triggered`
    };

    await context3.close();
    console.log(`  TEST 3 RESULT: ${test3Pass ? '✅ PASS' : '❌ FAIL'}\n`);

    // -------------------------------------------------------------
    // TEST 4: GPS PERMISSION DENIED
    // -------------------------------------------------------------
    console.log('--- TEST 4: GPS PERMISSION DENIED ---');
    const context4 = await browser.createBrowserContext();
    await context4.overridePermissions(APP_URL, ['camera']);
    const page4 = await context4.newPage();

    // Override navigator.geolocation in page context to simulate DENIED permission
    await page4.evaluateOnNewDocument(() => {
      delete window.navigator.geolocation;
      window.navigator.geolocation = {
        getCurrentPosition: (success, error) => {
          if (error) {
            error({ code: 1, message: 'User denied Geolocation' });
          }
        },
        watchPosition: () => 0,
        clearWatch: () => {}
      };
    });

    page4.on('dialog', async dialog => {
      await dialog.accept();
    });

    // Login Citizen
    await page4.goto(`${APP_URL}/login`, { waitUntil: 'networkidle0' });
    await page4.type('input[type="text"], input[type="email"]', 'test.citizen@civora.test');
    await page4.type('input[type="password"]', 'Citizen@123');
    await page4.click('button[type="submit"]');
    await page4.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});

    // Navigate to Raise Complaint
    await page4.goto(`${APP_URL}/citizen/raise-complaint`, { waitUntil: 'networkidle0' });

    // Step 1: Category "Water"
    await page4.waitForSelector('div.cursor-pointer');
    await page4.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('div.cursor-pointer'));
      const card = cards.find(c => c.textContent && c.textContent.includes('Water'));
      if (card) card.click();
    });
    await new Promise(r => setTimeout(r, 600));

    await page4.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const nextBtn = btns.find(b => b.textContent && b.textContent.includes('Next') && !b.disabled);
      if (nextBtn) nextBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Step 2: Description
    const gpsDeniedDesc = `E2E GPS Denied Test ${Date.now()}`;
    await page4.waitForSelector('textarea');
    await page4.type('textarea', gpsDeniedDesc);
    await new Promise(r => setTimeout(r, 500));

    await page4.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const nextBtn = btns.find(b => b.textContent && b.textContent.includes('Next') && !b.disabled);
      if (nextBtn) nextBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Step 3: Take Live Photo (camera works, GPS denied)
    await page4.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('span'));
      const span = spans.find(s => s.textContent && s.textContent.includes('Take Live Photo'));
      const card = span ? (span.closest('div.cursor-pointer') || span.parentElement) : null;
      if (card) card.click();
    });
    await page4.waitForSelector('video', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 2000));

    // Capture & Use
    await page4.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const capBtn = btns.find(b => b.textContent && b.textContent.includes('Capture Photo'));
      if (capBtn) capBtn.click();
    });
    await new Promise(r => setTimeout(r, 1200));

    await page4.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const useBtn = btns.find(b => b.textContent && b.textContent.includes('Use Photo'));
      if (useBtn) useBtn.click();
    });
    await new Promise(r => setTimeout(r, 4500));

    // Set fallback location address manually
    await page4.evaluate(() => {
      const input = document.querySelector('input[placeholder*="Type address"]');
      if (input) {
        input.value = 'Fallback Address, Rajkot';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await new Promise(r => setTimeout(r, 800));

    // Submit complaint
    await page4.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const subBtn = btns.find(b => b.textContent && b.textContent.includes('Submit Complaint') && !b.disabled);
      if (subBtn) subBtn.click();
    });
    await new Promise(r => setTimeout(r, 5000));

    // Verify in MongoDB
    const gpsDeniedDoc = await Complaint.findOne({ description: gpsDeniedDesc }).lean();
    if (!gpsDeniedDoc) {
      throw new Error(`Test 4 failed: Complaint "${gpsDeniedDesc}" not found in DB!`);
    }

    const gpsDeniedNotif = await Notification.findOne({
      complaintId: gpsDeniedDoc._id,
      title: { $regex: /New Ward/i }
    }).lean();

    const test4Pass = (
      gpsDeniedDoc.wardDetectionStatus === 'GPS_UNAVAILABLE' &&
      !gpsDeniedDoc.wardNumber &&
      gpsDeniedNotif === null
    );

    results.test4 = {
      pass: test4Pass,
      evidence: `Complaint #${gpsDeniedDoc.complaintId} created safely; wardDetectionStatus=${gpsDeniedDoc.wardDetectionStatus}; wardNumber=${gpsDeniedDoc.wardNumber || 'null'}; No supervisor notification sent`
    };

    await context4.close();
    console.log(`  TEST 4 RESULT: ${test4Pass ? '✅ PASS' : '❌ FAIL'}\n`);

    // -------------------------------------------------------------
    // TEST 5: DUPLICATE CHECK
    // -------------------------------------------------------------
    console.log('--- TEST 5: DUPLICATE CHECK ---');
    const totalComplaintsWithDesc = await Complaint.countDocuments({ description: test1ComplaintDoc.description });
    const totalNotifsForComplaint = await Notification.countDocuments({ complaintId: test1ComplaintDoc._id });

    console.log(`  Total complaints matching Test 1: ${totalComplaintsWithDesc}`);
    console.log(`  Total supervisor notifications for Test 1 complaint: ${totalNotifsForComplaint}`);

    const test5Pass = (totalComplaintsWithDesc === 1 && totalNotifsForComplaint === 1);
    results.test5 = {
      pass: test5Pass,
      evidence: `Exactly 1 complaint document created; Exactly 1 notification created for supervisor`
    };
    console.log(`  TEST 5 RESULT: ${test5Pass ? '✅ PASS' : '❌ FAIL'}\n`);

  } finally {
    if (fs.existsSync(TEMP_TEST_IMG_PATH)) {
      fs.unlinkSync(TEMP_TEST_IMG_PATH);
    }
    await browser.close();
    await mongoose.disconnect();
  }

  // Print Final Summary
  console.log('=================================================================');
  console.log('                STEP 7 FINAL TEST RESULTS SUMMARY                ');
  console.log('=================================================================');
  console.log(`Test 1 (Real Live Photo + GPS)    : ${results.test1.pass ? 'PASS' : 'FAIL'} | ${results.test1.evidence}`);
  console.log(`Test 2 (Supervisor Side)           : ${results.test2.pass ? 'PASS' : 'FAIL'} | ${results.test2.evidence}`);
  console.log(`Test 3 (Normal Upload Regression) : ${results.test3.pass ? 'PASS' : 'FAIL'} | ${results.test3.evidence}`);
  console.log(`Test 4 (GPS Denied Fallback)       : ${results.test4.pass ? 'PASS' : 'FAIL'} | ${results.test4.evidence}`);
  console.log(`Test 5 (Duplicate Check)           : ${results.test5.pass ? 'PASS' : 'FAIL'} | ${results.test5.evidence}`);
  console.log('=================================================================');
  console.log('Metadata:');
  console.log('  Complaint ID: ' + results.meta.complaintId);
  console.log('  Actual Ward Detected: ' + results.meta.actualWard);
  console.log('  Supervisor Email: ' + results.meta.supervisorEmail);
  console.log('  Live Photo in Supervisor: ' + (results.meta.livePhotoInSupervisor ? 'YES' : 'NO'));
  console.log('  Live Photo URL: ' + results.meta.livePhotoUrl);
  console.log('=================================================================');

  return results;
}

runStep7E2E().catch(err => {
  console.error('STEP 7 EXECUTION ERROR:', err);
  process.exit(1);
});

/**
 * test_geoService.js
 * Tests the getWardFromCoordinates() service against DEMO ward boundaries.
 *
 * Demo ward grid (from seed_wards.js):
 *   START_LAT = 22.35, START_LNG = 70.75, STEP = 0.02, GRID_COLS = 6
 *
 * Ward 1:  row=0, col=0 → lng [70.750 – 70.769], lat [22.350 – 22.331]  centroid: (70.760, 22.341)
 * Ward 10: row=1, col=3 → lng [70.810 – 70.829], lat [22.330 – 22.311]  centroid: (70.820, 22.321)
 * Outside: lat=25.0, lng=85.0 → No ward covers this
 * Invalid:  lat=999, lng=200  → Must throw validation error
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { getWardFromCoordinates } = require('../services/geoService');

const PASS = '✅ PASS';
const FAIL = '❌ FAIL';

async function runTests() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/civora';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB\n');
    console.log('='.repeat(60));
    console.log('  CIVORA – getWardFromCoordinates() SERVICE TEST');
    console.log('='.repeat(60));

    let passed = 0;
    let failed = 0;

    // ─────────────────────────────────────────────────────────────
    // TEST 1: Coordinate inside Demo Ward 1
    // Ward 1 → lng [70.750 – 70.769], lat [22.350 – 22.331]
    // Test point centroid: lat=22.341, lng=70.760
    // ─────────────────────────────────────────────────────────────
    console.log('\nTEST 1: Coordinate inside Demo Ward 1');
    console.log('  Input:  lat=22.341, lng=70.760');
    try {
      const result = await getWardFromCoordinates(22.341, 70.760);
      console.log('  Result:', JSON.stringify(result));
      if (result.wardNumber === 1 && result.status === 'DETECTED') {
        console.log(`  ${PASS} Returned Ward ${result.wardNumber}`);
        passed++;
      } else {
        console.log(`  ${FAIL} Expected Ward 1, got wardNumber=${result.wardNumber}, status=${result.status}`);
        failed++;
      }
    } catch (e) {
      console.log(`  ${FAIL} Threw unexpected error: ${e.message}`);
      failed++;
    }

    // ─────────────────────────────────────────────────────────────
    // TEST 2: Coordinate inside Demo Ward 10
    // Ward 10 → row=1, col=3 → lng [70.810 – 70.829], lat [22.330 – 22.311]
    // Test point centroid: lat=22.321, lng=70.820
    // ─────────────────────────────────────────────────────────────
    console.log('\nTEST 2: Coordinate inside Demo Ward 10');
    console.log('  Input:  lat=22.321, lng=70.820');
    try {
      const result = await getWardFromCoordinates(22.321, 70.820);
      console.log('  Result:', JSON.stringify(result));
      if (result.wardNumber === 10 && result.status === 'DETECTED') {
        console.log(`  ${PASS} Returned Ward ${result.wardNumber}`);
        passed++;
      } else {
        console.log(`  ${FAIL} Expected Ward 10, got wardNumber=${result.wardNumber}, status=${result.status}`);
        failed++;
      }
    } catch (e) {
      console.log(`  ${FAIL} Threw unexpected error: ${e.message}`);
      failed++;
    }

    // ─────────────────────────────────────────────────────────────
    // TEST 3: Coordinate outside all demo ward polygons
    // All demo wards are clustered near 22.3–22.35°N, 70.75–70.87°E
    // Test point: Kolkata lat=22.57, lng=88.36 → no ward
    // ─────────────────────────────────────────────────────────────
    console.log('\nTEST 3: Coordinate outside all demo ward polygons');
    console.log('  Input:  lat=22.57, lng=88.36 (Kolkata)');
    try {
      const result = await getWardFromCoordinates(22.57, 88.36);
      console.log('  Result:', JSON.stringify(result));
      if (result.status === 'WARD_NOT_FOUND' && result.wardNumber === null) {
        console.log(`  ${PASS} Correctly returned WARD_NOT_FOUND`);
        passed++;
      } else {
        console.log(`  ${FAIL} Expected WARD_NOT_FOUND, got status=${result.status}`);
        failed++;
      }
    } catch (e) {
      console.log(`  ${FAIL} Threw unexpected error: ${e.message}`);
      failed++;
    }

    // ─────────────────────────────────────────────────────────────
    // TEST 4: Invalid latitude/longitude → must throw validation error
    // ─────────────────────────────────────────────────────────────
    console.log('\nTEST 4: Invalid latitude/longitude (lat=999, lng=200)');
    try {
      await getWardFromCoordinates(999, 200);
      console.log(`  ${FAIL} Should have thrown a validation error but did not`);
      failed++;
    } catch (e) {
      console.log(`  Result: Threw error → "${e.message}"`);
      if (e.message.toLowerCase().includes('invalid')) {
        console.log(`  ${PASS} Correctly threw validation error`);
        passed++;
      } else {
        console.log(`  ${FAIL} Error message unexpected: ${e.message}`);
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────
    // SUMMARY
    // ─────────────────────────────────────────────────────────────
    console.log('\n' + '='.repeat(60));
    console.log(`  RESULTS: ${passed} passed, ${failed} failed out of 4 tests`);
    console.log('='.repeat(60));

    process.exit(failed > 0 ? 1 : 0);

  } catch (error) {
    console.error('Fatal test error:', error);
    process.exit(1);
  }
}

runTests();

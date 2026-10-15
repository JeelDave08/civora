/**
 * test_supervisorService.js
 * STEP 5: Ward → Supervisor Mapping Tests
 *
 * Tests use the REAL demo supervisors seeded in Step 2.
 * No dummy data created or deleted.
 *
 * Demo supervisor email pattern: demo.supervisorN@civora.test
 * Demo wardNumber stored as string e.g. "1", "10", "18"
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { getSupervisorForWard } = require('../services/supervisorService');

const PASS = '✅ PASS';
const FAIL = '❌ FAIL';

async function runTests() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/civora';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB\n');
  console.log('='.repeat(60));
  console.log('  CIVORA STEP 5 – Ward → Supervisor Mapping TEST');
  console.log('='.repeat(60));

  let passed = 0;
  let failed = 0;

  // ── TEST 1: Ward 1 → demo.supervisor1@civora.test ────────────
  console.log('\nTEST 1: wardNumber = 1');
  try {
    const result = await getSupervisorForWard(1);
    console.log(`  status: ${result.status}`);
    console.log(`  email:  ${result.supervisor?.email || 'null'}`);
    if (result.status === 'FOUND' && result.supervisor?.email === 'demo.supervisor1@civora.test') {
      console.log(`  ${PASS}`);
      passed++;
    } else {
      console.log(`  ${FAIL} Expected FOUND + demo.supervisor1@civora.test`);
      failed++;
    }
  } catch (e) {
    console.log(`  ${FAIL} Error: ${e.message}`);
    failed++;
  }

  // ── TEST 2: Ward 10 → demo.supervisor10@civora.test ──────────
  console.log('\nTEST 2: wardNumber = 10');
  try {
    const result = await getSupervisorForWard(10);
    console.log(`  status: ${result.status}`);
    console.log(`  email:  ${result.supervisor?.email || 'null'}`);
    if (result.status === 'FOUND' && result.supervisor?.email === 'demo.supervisor10@civora.test') {
      console.log(`  ${PASS}`);
      passed++;
    } else {
      console.log(`  ${FAIL} Expected FOUND + demo.supervisor10@civora.test`);
      failed++;
    }
  } catch (e) {
    console.log(`  ${FAIL} Error: ${e.message}`);
    failed++;
  }

  // ── TEST 3: Ward 18 → demo.supervisor18@civora.test ──────────
  console.log('\nTEST 3: wardNumber = 18');
  try {
    const result = await getSupervisorForWard(18);
    console.log(`  status: ${result.status}`);
    console.log(`  email:  ${result.supervisor?.email || 'null'}`);
    if (result.status === 'FOUND' && result.supervisor?.email === 'demo.supervisor18@civora.test') {
      console.log(`  ${PASS}`);
      passed++;
    } else {
      console.log(`  ${FAIL} Expected FOUND + demo.supervisor18@civora.test`);
      failed++;
    }
  } catch (e) {
    console.log(`  ${FAIL} Error: ${e.message}`);
    failed++;
  }

  // ── TEST 4: Ward 999 → NOT_FOUND ──────────────────────────────
  console.log('\nTEST 4: wardNumber = 999 (invalid / no supervisor)');
  try {
    const result = await getSupervisorForWard(999);
    console.log(`  status: ${result.status}`);
    if (result.status === 'NOT_FOUND' && result.supervisor === null) {
      console.log(`  ${PASS}`);
      passed++;
    } else {
      console.log(`  ${FAIL} Expected NOT_FOUND`);
      failed++;
    }
  } catch (e) {
    console.log(`  ${FAIL} Error: ${e.message}`);
    failed++;
  }

  // ── TEST 5: Confirm no random selection ───────────────────────
  // Run Ward 5 lookup 5 times — must always return exact same supervisor
  console.log('\nTEST 5: Confirm no random supervisor selection (Ward 5, 5 runs)');
  try {
    const results = [];
    for (let i = 0; i < 5; i++) {
      const r = await getSupervisorForWard(5);
      results.push(r.supervisor?.email || r.status);
    }
    const allSame = results.every(e => e === results[0]);
    console.log(`  All 5 results: ${[...new Set(results)].join(', ')}`);
    if (allSame && results[0] === 'demo.supervisor5@civora.test') {
      console.log(`  ${PASS} Deterministic – always demo.supervisor5@civora.test`);
      passed++;
    } else {
      console.log(`  ${FAIL} Not deterministic or wrong email`);
      failed++;
    }
  } catch (e) {
    console.log(`  ${FAIL} Error: ${e.message}`);
    failed++;
  }

  // ── SUMMARY ───────────────────────────────────────────────────
  console.log('\n' + '='.repeat(60));
  console.log(`  RESULTS: ${passed} passed, ${failed} failed out of 5 tests`);
  console.log('='.repeat(60));

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});

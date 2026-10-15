const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Ward = require('../models/Ward');
const User = require('../models/User');
const Supervisor = require('../models/Supervisor');
const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');
const { getWardFromCoordinates } = require('../services/geoService');
const { getSupervisorForWard } = require('../services/supervisorService');

async function testE2E() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/civora');
    console.log('Connected to MongoDB');

    console.log('--- Setting up Test Data ---');
    // 1. Setup Ward
    const testWard = new Ward({
      wardNumber: 999,
      wardName: 'Test Rajkot Ward',
      city: 'Rajkot',
      isActive: true,
      boundary: {
        type: 'Polygon',
        coordinates: [[[70.0, 22.0], [71.0, 22.0], [71.0, 23.0], [70.0, 23.0], [70.0, 22.0]]]
      }
    });
    await testWard.save();

    // 2. Setup Supervisor for Ward 999
    const testSupervisor = new Supervisor({
      fullName: 'E2E Test Sup',
      email: 'e2esup@civora.com',
      password: 'password',
      city: 'Rajkot',
      wardNumber: '999',
      isActive: true
    });
    await testSupervisor.save();

    console.log('--- Verifying Services ---');
    // GPS -> Ward
    const wardInfo = await getWardFromCoordinates(22.5, 70.5);
    if (wardInfo.wardNumber !== 999) throw new Error('GPS -> Ward mapping failed');
    
    // Ward -> Supervisor
    const supInfo = await getSupervisorForWard(wardInfo.wardNumber);
    if (supInfo.supervisor.email !== 'e2esup@civora.com') throw new Error('Ward -> Supervisor mapping failed');

    console.log('All E2E Service logics verified successfully.');

    // Cleanup
    await Ward.deleteOne({ _id: testWard._id });
    await Supervisor.deleteOne({ _id: testSupervisor._id });
    
    console.log('E2E Data cleaned up.');
    process.exit(0);
  } catch (err) {
    console.error('E2E Test failed:', err);
    process.exit(1);
  }
}

testE2E();

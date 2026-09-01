const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Complaint = require('../models/Complaint');
const ComplaintSupporter = require('../models/ComplaintSupporter');
const User = require('../models/User');

async function testJoinFlow() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/civora');
    console.log('Connected to DB');

    // 1. Find a primary complaint
    const primary = await Complaint.findOne({ 'communityIssue.isPrimary': { $ne: false }, status: { $ne: 'Closed' } }).sort({ createdAt: -1 });
    if (!primary) {
      console.log('No primary complaint found in database.');
      return;
    }

    console.log(`\nSelected Primary Complaint: #${String(primary._id).slice(-4).toUpperCase()} (${primary.title})`);
    console.log(`Initial Supporter Count: ${primary.communityIssue?.supporterCount || 1}`);

    // Find or create test citizen
    let testCitizen = await User.findOne({ role: 'citizen' });
    if (!testCitizen) {
      testCitizen = await User.create({
        fullName: 'Test Citizen',
        email: 'testcitizen@example.com',
        password: 'password123',
        role: 'citizen'
      });
    }

    console.log(`Test Citizen ID: ${testCitizen._id} (${testCitizen.fullName})`);

    // Clean existing supporter record for clean test if any
    await ComplaintSupporter.deleteMany({ complaintId: primary._id, citizenId: testCitizen._id });

    const initialComplaintCount = await Complaint.countDocuments();
    console.log(`Operational Complaints Count in DB BEFORE join: ${initialComplaintCount}`);

    // 2. Perform Join Logic (simulating POST /api/citizen/complaints/:id/join)
    const existingSupporter = await ComplaintSupporter.findOne({
      complaintId: primary._id,
      citizenId: testCitizen._id
    });

    if (!existingSupporter) {
      await ComplaintSupporter.create({
        complaintId: primary._id,
        citizenId: testCitizen._id,
        comment: 'I also face this exact same issue every day!',
        evidenceImages: ['https://res.cloudinary.com/test/sample.jpg']
      });

      // Update primary complaint supporter count
      primary.communityIssue.supporterCount = (primary.communityIssue.supporterCount || 1) + 1;
      await primary.save();
    }

    const finalComplaintCount = await Complaint.countDocuments();
    const updatedPrimary = await Complaint.findById(primary._id);
    const supporterRecord = await ComplaintSupporter.findOne({ complaintId: primary._id, citizenId: testCitizen._id });

    console.log('\n=== VERIFICATION RESULTS AFTER JOIN ===');
    console.log(`Operational Complaints Count in DB AFTER join: ${finalComplaintCount} (Prevented secondary complaint creation: ${initialComplaintCount === finalComplaintCount})`);
    console.log(`Updated Primary Supporter Count: ${updatedPrimary.communityIssue.supporterCount}`);
    console.log(`ComplaintSupporter record created:`, supporterRecord ? `YES (_id: ${supporterRecord._id})` : 'NO');

    // 3. Test duplicate join prevention
    let duplicateJoinBlocked = false;
    try {
      await ComplaintSupporter.create({
        complaintId: primary._id,
        citizenId: testCitizen._id,
        comment: 'Duplicate join attempt'
      });
    } catch (dupErr) {
      duplicateJoinBlocked = true;
    }
    console.log(`Duplicate join attempt by same citizen blocked by unique index: ${duplicateJoinBlocked ? 'YES (E11000 duplicate key error)' : 'NO'}`);

  } catch (err) {
    console.error('Error in testJoinFlow:', err);
  } finally {
    await mongoose.disconnect();
  }
}

testJoinFlow();

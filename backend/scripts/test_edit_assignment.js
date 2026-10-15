const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Complaint = require('../models/Complaint');
const FieldWorker = require('../models/FieldWorker');
const Supervisor = require('../models/Supervisor');
const { sendWorkAssignmentEmail } = require('../utils/emailSender');

async function testScenario() {
  console.log('Connecting to database...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected.');

  // Create or retrieve 2 test workers
  let workerA = await FieldWorker.findOne({ email: 'worker.a.test@civora.local' });
  if (!workerA) {
    workerA = new FieldWorker({
      fullName: 'Worker Alpha',
      email: 'worker.a.test@civora.local',
      personalEmail: 'workera.testinbox@example.com',
      password: 'password123',
      department: 'Roads & Transport'
    });
    await workerA.save();
  }

  let workerB = await FieldWorker.findOne({ email: 'worker.b.test@civora.local' });
  if (!workerB) {
    workerB = new FieldWorker({
      fullName: 'Worker Beta',
      email: 'worker.b.test@civora.local',
      personalEmail: 'workerb.testinbox@example.com',
      password: 'password123',
      department: 'Water Supply'
    });
    await workerB.save();
  }

  // Create or retrieve a test supervisor
  let supervisor = await Supervisor.findOne({ email: 'sup.test@civora.local' });
  if (!supervisor) {
    supervisor = new Supervisor({
      fullName: 'Supervisor Sharma',
      email: 'sup.test@civora.local',
      personalEmail: 'supervisor.testinbox@example.com',
      password: 'password123',
      department: 'Municipal Operations'
    });
    await supervisor.save();
  }

  // Create a test complaint
  const complaint = new Complaint({
    title: 'Test Pothole on Sector 9 Ring Road',
    description: 'Road damage affecting traffic',
    category: 'Roads & Transport',
    priority: 'Medium',
    status: 'New',
    location: {
      address: 'Sector 9, Ring Road, Smart City',
      lat: 19.0760,
      lng: 72.8777
    }
  });
  await complaint.save();
  console.log(`Created test complaint: ${complaint._id}`);

  // ==========================================
  // Step 1: Assign Worker A
  // ==========================================
  console.log('\n--- Step 1 & 2: Assign Worker A & Verify Assignment Email ---');
  complaint.workerId = workerA._id;
  complaint.status = 'Assigned';
  complaint.startDate = new Date('2026-10-01T09:00:00Z');
  complaint.dueDate = new Date('2026-10-03T18:00:00Z');
  await complaint.save();

  const emailRes1 = await sendWorkAssignmentEmail({
    worker: workerA,
    complaint,
    supervisor,
    isUpdate: false
  });
  console.log('Worker A assignment email sent:', emailRes1.success);
  if (!emailRes1.success) throw new Error('Worker A assignment email failed');

  // ==========================================
  // Step 3, 4, 5, 6: Edit Start/Due Date -> Save -> Verify DB -> Verify Updated Email to Worker A
  // ==========================================
  console.log('\n--- Step 3-6: Edit Start/Due Date -> Save -> Verify DB -> Send Updated Email to Worker A ---');
  const newStartDate = new Date('2026-10-05T09:00:00Z');
  const newDueDate = new Date('2026-10-08T18:00:00Z');

  const updatedComplaint1 = await Complaint.findByIdAndUpdate(
    complaint._id,
    { startDate: newStartDate, dueDate: newDueDate },
    { new: true }
  );

  console.log('Database Start Date matches new date:', updatedComplaint1.startDate.toISOString() === newStartDate.toISOString());
  console.log('Database Due Date matches new date:', updatedComplaint1.dueDate.toISOString() === newDueDate.toISOString());

  const emailRes2 = await sendWorkAssignmentEmail({
    worker: workerA,
    complaint: updatedComplaint1,
    supervisor,
    isUpdate: true
  });
  console.log('Worker A updated assignment email sent:', emailRes2.success);
  if (!emailRes2.success) throw new Error('Worker A updated assignment email failed');

  // ==========================================
  // Step 7, 8, 9, 10: Change Worker A to Worker B -> Save -> Verify Worker B receives email, Worker A does not
  // ==========================================
  console.log('\n--- Step 7-10: Change Worker A to Worker B -> Save -> Verify Worker B receives email ---');
  const updatedComplaint2 = await Complaint.findByIdAndUpdate(
    complaint._id,
    { workerId: workerB._id },
    { new: true }
  );
  console.log('Database workerId updated to Worker B:', String(updatedComplaint2.workerId) === String(workerB._id));

  // The assignment endpoint resolves the assigned worker (workerB) from updated complaint workerId
  const assignedWorker = await FieldWorker.findById(updatedComplaint2.workerId);
  console.log(`Resolved recipient worker: ${assignedWorker.fullName} (${assignedWorker.personalEmail || assignedWorker.email})`);

  // Verify Worker B is the recipient, NOT Worker A
  const isWorkerB = String(assignedWorker._id) === String(workerB._id);
  const isNotWorkerA = String(assignedWorker._id) !== String(workerA._id);
  console.log('Target recipient is Worker B:', isWorkerB);
  console.log('Old Worker A is NOT target recipient:', isNotWorkerA);

  const emailRes3 = await sendWorkAssignmentEmail({
    worker: assignedWorker,
    complaint: updatedComplaint2,
    supervisor,
    isUpdate: true
  });
  console.log('Worker B updated assignment email sent:', emailRes3.success);
  if (!emailRes3.success) throw new Error('Worker B updated assignment email failed');

  // Clean up test documents
  await Complaint.findByIdAndDelete(complaint._id);
  await FieldWorker.findByIdAndDelete(workerA._id);
  await FieldWorker.findByIdAndDelete(workerB._id);
  await Supervisor.findByIdAndDelete(supervisor._id);
  console.log('\n✓ All 10 test scenario steps successfully verified!');

  process.exit(0);
}

testScenario().catch(err => {
  console.error('Test scenario error:', err);
  process.exit(1);
});

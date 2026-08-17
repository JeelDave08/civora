const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { adminProtect } = require('../middleware/adminMiddleware');

// Models
const Admin = require('../models/Admin');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const Announcement = require('../models/Announcement');
const ActivityLog = require('../models/ActivityLog');
const Feedback = require('../models/FeedbackModel');
const Department = require('../models/Department');

// ==========================================
// DASHBOARD
// ==========================================

// GET /api/admin/dashboard — Dashboard stats + recent data
router.get('/dashboard', adminProtect, async (req, res) => {
  try {
    // Complaint stats
    const allComplaints = await Complaint.find().sort({ createdAt: -1 });
    const totalComplaints = allComplaints.length;
    const pendingCount = allComplaints.filter(c => c.status === 'New').length;
    const inProgressCount = allComplaints.filter(c => ['Assigned', 'Working'].includes(c.status)).length;
    const resolvedToday = allComplaints.filter(c => {
      if (c.status !== 'Resolved' && c.status !== 'Closed') return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return c.createdAt >= today;
    }).length;
    const resolvedTotal = allComplaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;

    // User stats
    const totalCitizens = await User.countDocuments({ role: 'citizen' });
    const totalSupervisors = await User.countDocuments({ role: 'supervisor' });
    const totalWorkers = await User.countDocuments({ role: 'worker' });

    // Unassigned complaints (for the tickets panel)
    const unassignedComplaints = await Complaint.find({ status: 'New' })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('citizenId', 'fullName');

    // Recent announcements
    const announcements = await Announcement.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5);

    const stats = [
      { title: 'Pending Complaints', value: String(pendingCount), icon: 'Clock', color: 'text-amber-500', bg: 'bg-amber-50' },
      { title: 'Resolved Today', value: String(resolvedToday), icon: 'CheckCircle', color: 'text-[#4CC9B0]', bg: 'bg-[#4CC9B0]/10' },
      { title: 'Active Supervisors', value: String(totalSupervisors), icon: 'UserCheck', color: 'text-[#7DB9D7]', bg: 'bg-[#7DB9D7]/10' },
      { title: 'Field Workers', value: String(totalWorkers), icon: 'Users', color: 'text-purple-500', bg: 'bg-purple-50' },
    ];

    res.json({
      stats,
      unassignedComplaints: unassignedComplaints.map(c => ({
        id: `#CMP-${String(c._id).slice(-3).toUpperCase()}`,
        _id: c._id,
        title: c.title,
        department: c.category,
        priority: c.priority,
        citizen: c.citizenId?.fullName || 'Unknown',
        createdAt: c.createdAt
      })),
      announcements: announcements.map(a => ({
        id: a._id,
        type: a.type,
        title: a.title,
        message: a.message,
        time: getTimeAgo(a.createdAt),
        icon: a.type === 'Emergency Alert' ? 'ShieldAlert' : 'Award',
        color: a.type === 'Emergency Alert' ? 'text-rose-500' : 'text-[#3E766D]'
      })),
      overview: {
        totalComplaints,
        totalCitizens,
        totalSupervisors,
        totalWorkers,
        resolvedTotal,
        resolutionRate: totalComplaints > 0 ? Math.round((resolvedTotal / totalComplaints) * 100) : 0
      }
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ message: 'Server error fetching dashboard data' });
  }
});

// ==========================================
// COMPLAINTS MANAGEMENT
// ==========================================

// GET /api/admin/complaints — All complaints with filters
router.get('/complaints', adminProtect, async (req, res) => {
  try {
    const { status, category, priority, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const complaints = await Complaint.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('citizenId', 'fullName email')
      .populate('workerId', 'fullName email');

    const total = await Complaint.countDocuments(filter);

    res.json({
      complaints,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Fetch complaints error:', err);
    res.status(500).json({ message: 'Server error fetching complaints' });
  }
});

// PUT /api/admin/complaints/:id/assign — Assign complaint to worker
router.put('/complaints/:id/assign', adminProtect, async (req, res) => {
  try {
    const { workerId } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { workerId, status: 'Assigned' },
      { new: true }
    );
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    // Log activity
    await new ActivityLog({
      adminId: req.admin._id,
      action: 'ASSIGN_COMPLAINT',
      details: `Assigned complaint "${complaint.title}" to worker`,
      targetType: 'Complaint',
      targetId: complaint._id,
      ipAddress: req.ip
    }).save();

    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: 'Server error assigning complaint' });
  }
});

// PUT /api/admin/complaints/:id/status — Update complaint status
router.put('/complaints/:id/status', adminProtect, async (req, res) => {
  try {
    const { status } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    await new ActivityLog({
      adminId: req.admin._id,
      action: 'UPDATE_COMPLAINT_STATUS',
      details: `Updated complaint "${complaint.title}" status to ${status}`,
      targetType: 'Complaint',
      targetId: complaint._id,
      ipAddress: req.ip
    }).save();

    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: 'Server error updating complaint status' });
  }
});

// ==========================================
// CITIZENS MANAGEMENT
// ==========================================

// GET /api/admin/citizens — All citizens with stats
router.get('/citizens', adminProtect, async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const filter = { role: 'citizen' };
    
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const citizens = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    // Stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);

    const totalCitizens = await User.countDocuments({ role: 'citizen' });
    const newRegistrations = await User.countDocuments({ role: 'citizen', createdAt: { $gte: thisWeek } });

    // Count citizens who have at least one complaint as "active"
    const activeUserIds = await Complaint.distinct('citizenId');
    const activeCitizens = activeUserIds.length;

    res.json({
      citizens,
      stats: {
        total: totalCitizens,
        newRegistrations,
        active: activeCitizens,
        suspended: 0 // Placeholder — can be extended with a suspended field
      },
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Fetch citizens error:', err);
    res.status(500).json({ message: 'Server error fetching citizens' });
  }
});

// ==========================================
// PERSONNEL MANAGEMENT
// ==========================================

// GET /api/admin/personnel — All supervisors & workers
router.get('/personnel', adminProtect, async (req, res) => {
  try {
    const personnel = await User.find({ role: { $in: ['supervisor', 'worker'] } })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(personnel);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching personnel' });
  }
});

// GET /api/admin/personnel-monitoring — Monitoring data for Supervisors & Field Workers
router.get('/personnel-monitoring', adminProtect, async (req, res) => {
  try {
    const { role, search } = req.query;
    const filter = { role: { $in: ['supervisor', 'worker'] } };
    if (role && ['supervisor', 'worker'].includes(role)) {
      filter.role = role;
    }
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ];
    }

    const personnel = await User.find(filter).select('-password').sort({ createdAt: -1 });

    const enriched = await Promise.all(personnel.map(async (p) => {
      let activeTasks = 0;
      let resolvedTasks = 0;

      if (p.role === 'worker') {
        activeTasks = await Complaint.countDocuments({ workerId: p._id, status: { $in: ['Assigned', 'Working'] } });
        resolvedTasks = await Complaint.countDocuments({ workerId: p._id, status: { $in: ['Resolved', 'Closed'] } });
      } else if (p.role === 'supervisor') {
        const deptFilter = p.city ? { category: p.city } : {};
        activeTasks = await Complaint.countDocuments({ ...deptFilter, status: { $in: ['New', 'Assigned', 'Working'] } });
        resolvedTasks = await Complaint.countDocuments({ ...deptFilter, status: { $in: ['Resolved', 'Closed'] } });
      }

      return {
        _id: p._id,
        fullName: p.fullName,
        email: p.email,
        phone: p.phone || 'N/A',
        role: p.role,
        department: p.city || 'General',
        profileImage: p.profileImage,
        activeTasks,
        resolvedTasks,
        joinedAt: p.createdAt
      };
    }));

    const totalSupervisors = enriched.filter(p => p.role === 'supervisor').length;
    const totalWorkers = enriched.filter(p => p.role === 'worker').length;
    const totalActiveTasks = enriched.reduce((acc, p) => acc + p.activeTasks, 0);
    const totalResolvedTasks = enriched.reduce((acc, p) => acc + p.resolvedTasks, 0);

    res.json({
      personnel: enriched,
      stats: {
        totalSupervisors,
        totalWorkers,
        totalActiveTasks,
        totalResolvedTasks
      }
    });
  } catch (err) {
    console.error('Personnel monitoring error:', err);
    res.status(500).json({ message: 'Server error fetching personnel monitoring data' });
  }
});

// POST /api/admin/personnel — Create supervisor or worker account
router.post('/personnel', adminProtect, async (req, res) => {
  try {
    const { fullName, email, password, role, department } = req.body;

    if (!['supervisor', 'worker'].includes(role)) {
      return res.status(400).json({ message: 'Role must be supervisor or worker' });
    }

    // Check if user already exists
    let existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      city: department || ''
    });

    await newUser.save();

    // Log activity
    await new ActivityLog({
      adminId: req.admin._id,
      action: 'CREATE_PERSONNEL',
      details: `Created ${role} account: ${fullName} (${email})`,
      targetType: 'User',
      targetId: newUser._id,
      ipAddress: req.ip
    }).save();

    res.status(201).json({
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully`,
      user: { id: newUser._id, email: newUser.email, name: newUser.fullName, role: newUser.role }
    });
  } catch (err) {
    console.error('Create personnel error:', err);
    res.status(500).json({ message: 'Server error creating personnel' });
  }
});

// ==========================================
// DEPARTMENTS
// ==========================================

// GET /api/admin/departments — All departments
router.get('/departments', adminProtect, async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });

    // Enrich with personnel counts
    const enriched = await Promise.all(departments.map(async (dept) => {
      const supervisorCount = await User.countDocuments({ role: 'supervisor', city: dept.name });
      const workerCount = await User.countDocuments({ role: 'worker', city: dept.name });
      return {
        ...dept.toObject(),
        supervisorCount,
        workerCount
      };
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching departments' });
  }
});

// PUT /api/admin/departments/:id — Update department status
router.put('/departments/:id', adminProtect, async (req, res) => {
  try {
    const { status, description } = req.body;
    const update = {};
    if (status) update.status = status;
    if (description !== undefined) update.description = description;

    const dept = await Department.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!dept) return res.status(404).json({ message: 'Department not found' });

    await new ActivityLog({
      adminId: req.admin._id,
      action: 'UPDATE_DEPARTMENT',
      details: `Updated department "${dept.name}" — status: ${dept.status}`,
      targetType: 'Department',
      targetId: dept._id,
      ipAddress: req.ip
    }).save();

    res.json(dept);
  } catch (err) {
    res.status(500).json({ message: 'Server error updating department' });
  }
});

// ==========================================
// ANNOUNCEMENTS
// ==========================================

// GET /api/admin/announcements
router.get('/announcements', adminProtect, async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'fullName');
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching announcements' });
  }
});

// POST /api/admin/announcements
router.post('/announcements', adminProtect, async (req, res) => {
  try {
    const { title, message, type } = req.body;

    const announcement = new Announcement({
      title,
      message,
      type: type || 'Update',
      createdBy: req.admin._id
    });

    await announcement.save();

    await new ActivityLog({
      adminId: req.admin._id,
      action: 'CREATE_ANNOUNCEMENT',
      details: `Created announcement: "${title}"`,
      targetType: 'Announcement',
      targetId: announcement._id,
      ipAddress: req.ip
    }).save();

    res.status(201).json(announcement);
  } catch (err) {
    res.status(500).json({ message: 'Server error creating announcement' });
  }
});

// ==========================================
// ACTIVITY LOG (MONITORING)
// ==========================================

// GET /api/admin/activity-log
router.get('/activity-log', adminProtect, async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const logs = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('adminId', 'fullName email');

    const total = await ActivityLog.countDocuments();

    res.json({
      logs,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching activity log' });
  }
});

// ==========================================
// FEEDBACKS
// ==========================================

// GET /api/admin/feedbacks — All citizen feedbacks
router.get('/feedbacks', adminProtect, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const feedbacks = await Feedback.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('citizenId', 'fullName email profileImage');

    const total = await Feedback.countDocuments(filter);

    // Average rating
    const allFeedbacks = await Feedback.find();
    const avgRating = allFeedbacks.length > 0
      ? (allFeedbacks.reduce((sum, f) => sum + f.rating, 0) / allFeedbacks.length).toFixed(1)
      : 0;

    res.json({
      feedbacks,
      stats: {
        total,
        avgRating: parseFloat(avgRating),
        newCount: await Feedback.countDocuments({ status: 'New' }),
        reviewedCount: await Feedback.countDocuments({ status: 'Reviewed' }),
        resolvedCount: await Feedback.countDocuments({ status: 'Resolved' })
      },
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching feedbacks' });
  }
});

// PUT /api/admin/feedbacks/:id/status — Update feedback status
router.put('/feedbacks/:id/status', adminProtect, async (req, res) => {
  try {
    const { status } = req.body;
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ message: 'Server error updating feedback' });
  }
});

// ==========================================
// ADMIN PROFILE
// ==========================================

// GET /api/admin/profile
router.get('/profile', adminProtect, async (req, res) => {
  try {
    res.json(req.admin);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching profile' });
  }
});

// PUT /api/admin/profile
router.put('/profile', adminProtect, async (req, res) => {
  try {
    const { fullName, phone, profileImage, department } = req.body;
    const update = {};
    if (fullName) update.fullName = fullName;
    if (phone !== undefined) update.phone = phone;
    if (profileImage !== undefined) update.profileImage = profileImage;
    if (department) update.department = department;

    const admin = await Admin.findByIdAndUpdate(req.admin._id, update, { new: true }).select('-password');
    res.json(admin);
  } catch (err) {
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function getTimeAgo(date) {
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

module.exports = router;

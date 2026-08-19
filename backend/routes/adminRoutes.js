const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
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
    const days = parseInt(req.query.days) || 7;
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    // Complaint stats (Filtered by selected days for unassigned & complaints in date range)
    const complaintsInRange = await Complaint.find({ createdAt: { $gte: dateThreshold } }).sort({ createdAt: -1 });
    const allComplaints = await Complaint.find().sort({ createdAt: -1 });
    
    const totalComplaints = allComplaints.length;
    const pendingCount = complaintsInRange.filter(c => c.status === 'New').length;
    const inProgressCount = complaintsInRange.filter(c => ['Assigned', 'Working'].includes(c.status)).length;
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

    // Unassigned complaints in selected time frame (for the tickets panel)
    const unassignedComplaints = await Complaint.find({ 
      status: 'New',
      createdAt: { $gte: dateThreshold }
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('citizenId', 'fullName');

    // Recent announcements
    const announcements = await Announcement.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5);

    const stats = [
      { title: `Pending Complaints (${days}D)`, value: String(pendingCount), icon: 'Clock', color: 'text-amber-500', bg: 'bg-amber-50' },
      { title: 'Resolved Today', value: String(resolvedToday), icon: 'CheckCircle', color: 'text-[#4CC9B0]', bg: 'bg-[#4CC9B0]/10' },
      { title: 'Active Supervisors', value: String(totalSupervisors), icon: 'UserCheck', color: 'text-[#7DB9D7]', bg: 'bg-[#7DB9D7]/10' },
      { title: 'Field Workers', value: String(totalWorkers), icon: 'Users', color: 'text-purple-500', bg: 'bg-purple-50' },
    ];

    res.json({
      days,
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
    const { status, category, priority, search, days, page = 1, limit = 20 } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (days) {
      const numDays = parseInt(days);
      if (!isNaN(numDays)) {
        const dateThreshold = new Date();
        dateThreshold.setDate(dateThreshold.getDate() - numDays);
        filter.createdAt = { $gte: dateThreshold };
      }
    }
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
    const { workerId, startDate, dueDate } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { workerId, status: 'Assigned', startDate, dueDate },
      { new: true }
    );
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    // Log activity safely for Admin or Supervisor
    try {
      await new ActivityLog({
        adminId: req.admin ? req.admin._id : undefined,
        actorRole: req.user ? req.user.role : 'admin',
        actorName: req.admin ? req.admin.fullName : 'Supervisor',
        action: 'ASSIGN_COMPLAINT',
        details: `Assigned complaint "${complaint.title}" to field worker`,
        targetType: 'Complaint',
        targetId: complaint._id,
        ipAddress: req.ip
      }).save();
    } catch (logErr) {
      console.warn('ActivityLog skipped for assignment:', logErr.message);
    }

    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: 'Server error assigning complaint: ' + err.message });
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

    try {
      await new ActivityLog({
        adminId: req.admin ? req.admin._id : undefined,
        actorRole: req.user ? req.user.role : 'admin',
        actorName: req.admin ? req.admin.fullName : (req.user ? req.user.role : 'User'),
        action: 'UPDATE_COMPLAINT_STATUS',
        details: `Updated complaint "${complaint.title}" status to ${status}`,
        targetType: 'Complaint',
        targetId: complaint._id,
        ipAddress: req.ip
      }).save();
    } catch (logErr) {
      console.warn('ActivityLog skipped:', logErr.message);
    }

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
    const filter = { $or: [{ role: 'citizen' }, { role: { $exists: false } }, { role: '' }, { role: null }] };
    
    if (search) {
      filter.$and = [
        {
          $or: [
            { fullName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { city: { $regex: search, $options: 'i' } }
          ]
        }
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

// POST /api/admin/citizens — Create citizen account
router.post('/citizens', adminProtect, async (req, res) => {
  try {
    const { fullName, email, password, phone, city, address } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Full name, email, and password are required' });
    }

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
      phone: phone || '',
      city: city || '',
      address: address || '',
      role: 'citizen'
    });

    await newUser.save();

    await new ActivityLog({
      adminId: req.admin ? req.admin._id : undefined,
      action: 'CREATE_CITIZEN',
      details: `Created citizen account: ${fullName} (${email})`,
      targetType: 'User',
      targetId: newUser._id,
      ipAddress: req.ip
    }).save();

    res.status(201).json({
      message: 'Citizen account created successfully',
      user: { id: newUser._id, email: newUser.email, name: newUser.fullName, role: newUser.role }
    });
  } catch (err) {
    console.error('Create citizen error:', err);
    res.status(500).json({ message: 'Server error creating citizen' });
  }
});

// PUT /api/admin/citizens/:id/password — Update password for citizen
router.put('/citizens/:id/password', adminProtect, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 4) {
      return res.status(400).json({ message: 'Password must be at least 4 characters' });
    }

    const { id } = req.params;
    let user = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      user = await User.findById(id);
    }
    if (!user) {
      user = await User.findOne({ _id: id });
    }

    if (!user) {
      return res.status(404).json({ message: 'User account not found' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    try {
      await new ActivityLog({
        adminId: req.admin ? req.admin._id : undefined,
        action: 'UPDATE_CITIZEN_PASSWORD',
        details: `Changed password for citizen: ${user.fullName} (${user.email})`,
        targetType: 'User',
        targetId: user._id,
        ipAddress: req.ip
      }).save();
    } catch (logErr) {
      console.warn('ActivityLog error ignored:', logErr.message);
    }

    res.json({ message: `Password updated successfully for ${user.fullName}` });
  } catch (err) {
    console.error('Change citizen password error:', err);
    res.status(500).json({ message: 'Server error updating citizen password: ' + err.message });
  }
});

// DELETE /api/admin/citizens/:id — Delete citizen account
router.delete('/citizens/:id', adminProtect, async (req, res) => {
  try {
    const { id } = req.params;
    let user = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      user = await User.findById(id);
    }

    if (!user) {
      return res.status(404).json({ message: 'User account not found' });
    }

    await User.findByIdAndDelete(user._id);

    try {
      await new ActivityLog({
        adminId: req.admin ? req.admin._id : undefined,
        action: 'DELETE_CITIZEN',
        details: `Deleted citizen account: ${user.fullName} (${user.email})`,
        targetType: 'User',
        targetId: user._id,
        ipAddress: req.ip
      }).save();
    } catch (logErr) {
      console.warn('ActivityLog error ignored:', logErr.message);
    }

    res.json({ message: 'Citizen account deleted successfully' });
  } catch (err) {
    console.error('Delete citizen error:', err);
    res.status(500).json({ message: 'Server error deleting citizen account: ' + err.message });
  }
});

// ==========================================
// PERSONNEL MANAGEMENT
// ==========================================

const Supervisor = require('../models/Supervisor');
const FieldWorker = require('../models/FieldWorker');

// GET /api/admin/personnel — All supervisors & workers
router.get('/personnel', adminProtect, async (req, res) => {
  try {
    const supervisors = await Supervisor.find().select('-password').lean();
    const workers = await FieldWorker.find().select('-password').lean();
    const legacyPersonnel = await User.find({ role: { $in: ['supervisor', 'worker'] } }).select('-password').lean();

    const allPersonnel = [
      ...supervisors.map(s => ({ ...s, role: 'supervisor' })),
      ...workers.map(w => ({ ...w, role: 'worker' })),
      ...legacyPersonnel
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json(allPersonnel);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching personnel: ' + err.message });
  }
});

// GET /api/admin/personnel-monitoring — Monitoring data for Supervisors & Field Workers
router.get('/personnel-monitoring', adminProtect, async (req, res) => {
  try {
    const { role, search } = req.query;

    let supervisors = await Supervisor.find().select('-password').lean();
    let workers = await FieldWorker.find().select('-password').lean();
    let legacy = await User.find({ role: { $in: ['supervisor', 'worker'] } }).select('-password').lean();

    let combined = [
      ...supervisors.map(s => ({ ...s, role: 'supervisor' })),
      ...workers.map(w => ({ ...w, role: 'worker' })),
      ...legacy
    ];

    if (role && ['supervisor', 'worker'].includes(role)) {
      combined = combined.filter(p => p.role === role);
    }

    if (search) {
      const q = search.toLowerCase();
      combined = combined.filter(p => 
        (p.fullName && p.fullName.toLowerCase().includes(q)) ||
        (p.email && p.email.toLowerCase().includes(q)) ||
        (p.city && p.city.toLowerCase().includes(q)) ||
        (p.department && p.department.toLowerCase().includes(q))
      );
    }

    const enriched = await Promise.all(combined.map(async (p) => {
      let activeTasks = 0;
      let resolvedTasks = 0;

      if (p.role === 'worker') {
        activeTasks = await Complaint.countDocuments({ workerId: p._id, status: { $in: ['Assigned', 'Working'] } });
        resolvedTasks = await Complaint.countDocuments({ workerId: p._id, status: { $in: ['Resolved', 'Closed'] } });
      } else if (p.role === 'supervisor') {
        const deptFilter = p.city || p.department ? { category: p.city || p.department } : {};
        activeTasks = await Complaint.countDocuments({ ...deptFilter, status: { $in: ['New', 'Assigned', 'Working'] } });
        resolvedTasks = await Complaint.countDocuments({ ...deptFilter, status: { $in: ['Resolved', 'Closed'] } });
      }

      return {
        _id: p._id,
        fullName: p.fullName,
        email: p.email,
        personalEmail: p.personalEmail || '',
        phone: p.phone || 'N/A',
        role: p.role,
        department: p.department || p.city || 'General',
        profileImage: p.profileImage || '',
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
    res.status(500).json({ message: 'Server error fetching personnel monitoring data: ' + err.message });
  }
});

// POST /api/admin/personnel — Create supervisor or worker account
router.post('/personnel', adminProtect, async (req, res) => {
  try {
    const { fullName, email, personalEmail, password, role, department } = req.body;
    const cleanEmail = email.toLowerCase();

    if (!['supervisor', 'worker'].includes(role)) {
      return res.status(400).json({ message: 'Role must be supervisor or worker' });
    }

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Full name, login email, and password are required' });
    }

    // Check existing across all collections
    const existingInUser = await User.findOne({ email: cleanEmail });
    const existingInSup = await Supervisor.findOne({ email: cleanEmail });
    const existingInWorker = await FieldWorker.findOne({ email: cleanEmail });

    if (existingInUser || existingInSup || existingInWorker) {
      return res.status(400).json({ message: 'Account with this login email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let newUser;
    if (role === 'supervisor') {
      newUser = new Supervisor({
        fullName,
        email: cleanEmail,
        personalEmail: personalEmail ? personalEmail.toLowerCase() : '',
        password: hashedPassword,
        department: department || 'General',
        city: department || ''
      });
    } else {
      newUser = new FieldWorker({
        fullName,
        email: cleanEmail,
        personalEmail: personalEmail ? personalEmail.toLowerCase() : '',
        password: hashedPassword,
        department: department || 'General',
        city: department || ''
      });
    }

    await newUser.save();

    // Send credentials email to personalEmail (or email if personalEmail not specified)
    const targetEmail = (personalEmail && personalEmail.trim()) ? personalEmail.trim() : email.trim();
    const { sendWelcomeCredentialsEmail } = require('../utils/emailSender');
    
    let emailSent = false;
    try {
      emailSent = await sendWelcomeCredentialsEmail({
        toEmail: targetEmail,
        name: fullName,
        loginEmail: email,
        password: password,
        role: role,
        department: department
      });
      console.log(`[POST /personnel] Credentials email dispatch result to ${targetEmail}: ${emailSent}`);
    } catch (mailErr) {
      console.error('[POST /personnel] Email dispatch error:', mailErr);
    }

    // Log activity safely for Admin or Supervisor
    try {
      await new ActivityLog({
        adminId: req.admin ? req.admin._id : undefined,
        actorRole: req.user ? req.user.role : 'admin',
        actorName: req.admin ? req.admin.fullName : 'Supervisor',
        action: 'CREATE_PERSONNEL',
        details: `Created ${role} account (${role === 'supervisor' ? 'Supervisors' : 'Field Workers'}): ${fullName} (Login: ${email})`,
        targetType: role === 'supervisor' ? 'Supervisor' : 'FieldWorker',
        targetId: newUser._id,
        ipAddress: req.ip
      }).save();
    } catch (logErr) {
      console.warn('Activity log write skipped:', logErr.message);
    }

    res.status(201).json({
      message: `${role.toUpperCase()} account created successfully in dedicated ${role === 'supervisor' ? 'supervisors' : 'fieldworkers'} collection. Credentials email sent to ${targetEmail}!`,
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        personalEmail: newUser.personalEmail,
        role: newUser.role,
        department: newUser.department
      }
    });
  } catch (err) {
    console.error('Create personnel error:', err);
    res.status(500).json({ message: 'Server error creating personnel account: ' + err.message });
  }
});

// PUT /api/admin/personnel/:id/password — Change password for supervisor or worker
router.put('/personnel/:id/password', adminProtect, async (req, res) => {
  try {
    const { password } = req.body;
    const { id } = req.params;

    if (!password || password.length < 4) {
      return res.status(400).json({ message: 'Password must be at least 4 characters' });
    }

    let account = await Supervisor.findById(id) || await FieldWorker.findById(id) || await User.findById(id);
    if (!account) {
      return res.status(404).json({ message: 'Personnel account not found' });
    }

    const salt = await bcrypt.genSalt(10);
    account.password = await bcrypt.hash(password, salt);
    await account.save();

    res.json({ message: `Password updated successfully for ${account.fullName}` });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ message: 'Server error updating password: ' + err.message });
  }
});

// DELETE /api/admin/personnel/:id — Delete supervisor or worker account
router.delete('/personnel/:id', adminProtect, async (req, res) => {
  try {
    const { id } = req.params;
    let deleted = await Supervisor.findByIdAndDelete(id) || await FieldWorker.findByIdAndDelete(id) || await User.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Personnel account not found' });
    }

    res.json({ message: `Personnel account deleted successfully` });
  } catch (err) {
    console.error('Delete personnel error:', err);
    res.status(500).json({ message: 'Server error deleting user account: ' + err.message });
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

// POST /api/admin/departments — Create a new department/service
router.post('/departments', adminProtect, async (req, res) => {
  try {
    const { name, description, icon, color, status } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Service name is required' });
    }

    const existing = await Department.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ message: 'A service with this name already exists' });
    }

    const newDept = new Department({
      name: name.trim(),
      description: description || '',
      icon: icon || 'Server',
      color: color || 'text-emerald-500',
      status: status || 'Active'
    });

    await newDept.save();

    await new ActivityLog({
      adminId: req.admin ? req.admin._id : undefined,
      action: 'CREATE_DEPARTMENT',
      details: `Created new service department "${newDept.name}"`,
      targetType: 'Department',
      targetId: newDept._id,
      ipAddress: req.ip
    }).save();

    res.status(201).json(newDept);
  } catch (err) {
    console.error('Create department error:', err);
    res.status(500).json({ message: 'Server error creating service' });
  }
});

// DELETE /api/admin/departments/:id — Delete department/service
router.delete('/departments/:id', adminProtect, async (req, res) => {
  try {
    const dept = await Department.findByIdAndDelete(req.params.id);
    if (!dept) return res.status(404).json({ message: 'Service department not found' });

    await new ActivityLog({
      adminId: req.admin ? req.admin._id : undefined,
      action: 'DELETE_DEPARTMENT',
      details: `Deleted service department "${dept.name}"`,
      targetType: 'Department',
      targetId: dept._id,
      ipAddress: req.ip
    }).save();

    res.json({ message: `Service "${dept.name}" deleted successfully` });
  } catch (err) {
    console.error('Delete department error:', err);
    res.status(500).json({ message: 'Server error deleting service' });
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
      adminId: req.admin ? req.admin._id : undefined,
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
      createdBy: req.admin ? req.admin._id : (req.user ? req.user.id : undefined)
    });

    await announcement.save();

    await new ActivityLog({
      adminId: req.admin ? req.admin._id : undefined,
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
// ACTIVITY LOGS / NOTIFICATIONS TELEMETRY
// ==========================================

// GET /api/admin/activity-logs — Live notifications & activity logs feed
router.get('/activity-logs', adminProtect, async (req, res) => {
  try {
    const { role } = req.query; // 'all' or 'supervisor' or 'worker'
    const limit = parseInt(req.query.limit) || 30;

    let filter = {};
    if (role === 'supervisor') {
      filter = { actorRole: { $in: ['supervisor', 'worker'] } };
    }

    const logs = await ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const formattedLogs = logs.map(log => ({
      id: log._id,
      action: log.action,
      title: log.action.replace(/_/g, ' '),
      details: log.details || 'System activity recorded',
      message: log.details || 'System activity recorded',
      actorRole: log.actorRole || 'admin',
      actorName: log.actorName || 'System Admin',
      targetType: log.targetType,
      targetId: log.targetId,
      time: getTimeAgo(log.createdAt),
      createdAt: log.createdAt
    }));

    res.json({ logs: formattedLogs });
  } catch (err) {
    console.error('Activity logs fetch error:', err);
    res.status(500).json({ message: 'Server error fetching activity telemetry: ' + err.message });
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

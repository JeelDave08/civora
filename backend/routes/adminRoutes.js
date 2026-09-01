const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { adminProtect } = require('../middleware/adminMiddleware');

// Models
const Admin = require('../models/Admin');
const User = require('../models/User');
const Supervisor = require('../models/Supervisor');
const FieldWorker = require('../models/FieldWorker');
const Complaint = require('../models/Complaint');
const Announcement = require('../models/Announcement');
const ActivityLog = require('../models/ActivityLog');
const Feedback = require('../models/FeedbackModel');
const Department = require('../models/Department');
const CitizenVerification = require('../models/CitizenVerification');
const CitizenResponse = require('../models/CitizenResponse');
const Notification = require('../models/Notification');
const CommunityReopenEvent = require('../models/CommunityReopenEvent');
const SystemSetting = require('../models/SystemSetting');

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
    const rawComplaints = await Complaint.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('citizenId', 'fullName email')
      .lean();

    const complaints = await Promise.all(rawComplaints.map(async (c) => {
      if (c.workerId) {
        let worker = await User.findById(c.workerId).select('_id fullName email department city role').lean();
        if (!worker) {
          worker = await FieldWorker.findById(c.workerId).select('_id fullName email department city role').lean();
        }
        return { ...c, workerId: worker || c.workerId };
      }
      return c;
    }));

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

// PUT /api/admin/complaints/:id/status — Update complaint status & progress details & timer tracking
router.put('/complaints/:id/status', adminProtect, async (req, res) => {
  try {
    let { status, remarks, beforeImage, afterImage, isTimerRunning, timeSpentSeconds, actionType } = req.body;
    const updateData = {};

    // Requirement #1: Worker marks complaint as "Issue Resolved" -> status changes to "Pending Citizen Verification"
    if (status === 'Resolved') {
      status = 'Pending Citizen Verification';
    }

    if (status) updateData.status = status;
    if (remarks !== undefined) updateData.remarks = remarks;
    if (beforeImage !== undefined) updateData.beforeImage = beforeImage;
    if (afterImage !== undefined) updateData.afterImage = afterImage;
    if (typeof isTimerRunning === 'boolean') updateData.isTimerRunning = isTimerRunning;
    if (typeof timeSpentSeconds === 'number') updateData.timeSpentSeconds = timeSpentSeconds;

    if (actionType === 'START_WORK') {
      updateData.workStartedAt = new Date();
      updateData.isTimerRunning = true;
      updateData.status = 'Working';
    } else if (actionType === 'STOP_WORK') {
      updateData.workEndedAt = new Date();
      updateData.isTimerRunning = false;
    }

    if (status === 'Pending Citizen Verification') {
      updateData['citizenVerification.verificationStatus'] = 'PENDING_SUPERVISOR';
    }

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    // Initialize or update CitizenVerification session if status is Pending Citizen Verification
    if (status === 'Pending Citizen Verification') {
      let cv = await CitizenVerification.findOne({ complaintId: complaint._id });
      if (!cv) {
        cv = new CitizenVerification({
          complaintId: complaint._id,
          status: 'PENDING_SUPERVISOR',
          history: [{
            action: 'WORKER_RESOLVED',
            actorRole: 'worker',
            actorName: req.user ? req.user.fullName : 'Field Agent',
            details: remarks || 'Worker marked issue as resolved. Awaiting supervisor approval.',
            timestamp: new Date()
          }]
        });
      } else {
        cv.status = 'PENDING_SUPERVISOR';
        cv.history.push({
          action: 'WORKER_RESOLVED',
          actorRole: 'worker',
          actorName: req.user ? req.user.fullName : 'Field Agent',
          details: remarks || 'Worker updated resolution evidence.',
          timestamp: new Date()
        });
      }
      await cv.save();
    }

    try {
      await new ActivityLog({
        adminId: req.admin ? req.admin._id : undefined,
        actorRole: req.user ? req.user.role : 'admin',
        actorName: req.admin ? req.admin.fullName : (req.user ? req.user.fullName : 'User'),
        action: 'UPDATE_COMPLAINT_STATUS',
        details: `Updated complaint "${complaint.title}" status to ${status || complaint.status}`,
        targetType: 'Complaint',
        targetId: complaint._id,
        ipAddress: req.ip
      }).save();
    } catch (logErr) {
      console.warn('ActivityLog skipped:', logErr.message);
    }

    res.json(complaint);
  } catch (err) {
    console.error('Error updating status:', err);
    res.status(500).json({ message: 'Server error updating complaint status' });
  }
});

// POST /api/admin/complaints/:id/approve-resolution — Supervisor approves worker resolution & triggers nearby citizen verification
router.post('/complaints/:id/approve-resolution', adminProtect, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    complaint.status = 'Pending Citizen Verification';
    if (!complaint.citizenVerification) complaint.citizenVerification = {};
    complaint.citizenVerification.verificationStatus = 'IN_VERIFICATION';
    complaint.citizenVerification.approvedBySupervisorAt = new Date();

    // Fetch configurable verification radius from SystemSetting (default 5km)
    let radiusSetting = await SystemSetting.findOne({ key: 'verification_radius_km' });
    const radiusKm = radiusSetting ? parseFloat(radiusSetting.value) : 5;

    // Find citizens near complaint location
    const compLat = complaint.location?.lat || 23.0225;
    const compLng = complaint.location?.lng || 72.5714;

    const allCitizens = await User.find({ role: 'citizen' }).select('_id fullName email');
    
    // Filter citizens by radius if distance function applies, fallback to active citizens
    const notifiedCitizenIds = [];
    const notificationDocs = [];

    allCitizens.forEach(citizen => {
      notifiedCitizenIds.push(citizen._id);
      notificationDocs.push({
        recipientId: citizen._id,
        recipientRole: 'citizen',
        type: 'VERIFICATION_REQUEST',
        title: 'Was this issue actually resolved?',
        message: `Field team reported resolution for Garbage/Dumping complaint #${String(complaint._id).slice(-4).toUpperCase()} ('${complaint.title}'). Please verify if the issue is fixed.`,
        complaintId: complaint._id,
        actionData: {
          options: ['YES_RESOLVED', 'STILL_EXISTS']
        }
      });
    });

    if (notificationDocs.length > 0) {
      await Notification.insertMany(notificationDocs);
    }

    complaint.citizenVerification.citizensNotified = notificationDocs.length;
    await complaint.save();

    // Update CitizenVerification session
    let cv = await CitizenVerification.findOne({ complaintId: complaint._id });
    if (!cv) {
      cv = new CitizenVerification({
        complaintId: complaint._id,
        status: 'IN_VERIFICATION',
        supervisorApprovedAt: new Date(),
        supervisorId: req.user ? req.user._id : (req.admin ? req.admin._id : undefined),
        citizensNotifiedCount: notificationDocs.length,
        history: []
      });
    } else {
      cv.status = 'IN_VERIFICATION';
      cv.supervisorApprovedAt = new Date();
      cv.supervisorId = req.user ? req.user._id : (req.admin ? req.admin._id : undefined);
      cv.citizensNotifiedCount = notificationDocs.length;
    }

    cv.history.push({
      action: 'SUPERVISOR_APPROVED',
      actorId: req.user ? req.user._id : (req.admin ? req.admin._id : undefined),
      actorRole: req.user ? req.user.role : 'supervisor',
      actorName: req.user ? req.user.fullName : 'Supervisor',
      details: `Supervisor approved worker resolution and dispatched verification requests to ${notificationDocs.length} nearby citizens.`,
      timestamp: new Date()
    });

    await cv.save();

    try {
      await new ActivityLog({
        adminId: req.admin ? req.admin._id : undefined,
        actorRole: req.user ? req.user.role : 'supervisor',
        actorName: req.user ? req.user.fullName : 'Supervisor',
        action: 'SUPERVISOR_APPROVE_RESOLUTION',
        details: `Approved resolution for complaint #${String(complaint._id).slice(-4).toUpperCase()} and triggered citizen verification (${notificationDocs.length} notified)`,
        targetType: 'Complaint',
        targetId: complaint._id,
        ipAddress: req.ip
      }).save();
    } catch (logErr) {
      console.warn('ActivityLog skipped:', logErr.message);
    }

    res.json({
      success: true,
      message: `Supervisor approved resolution. Verification request sent to ${notificationDocs.length} citizens.`,
      complaint,
      verification: cv
    });
  } catch (err) {
    console.error('Approve resolution error:', err);
    res.status(500).json({ message: 'Server error approving resolution: ' + err.message });
  }
});

// GET /api/admin/verification/dashboard — Supervisor Citizen Verification section statistics & list
router.get('/verification/dashboard', adminProtect, async (req, res) => {
  try {
    const allVerifications = await CitizenVerification.find()
      .populate('complaintId')
      .sort({ updatedAt: -1 });

    const complaintsAwaitingVerification = await Complaint.find({
      status: { $in: ['Pending Citizen Verification', 'Community Reopened – Supervisor Review Required', 'Community Reopened'] }
    }).populate('workerId', 'fullName email department').populate('citizenId', 'fullName');

    let totalAwaiting = 0;
    let totalYes = 0;
    let totalStillExists = 0;
    let totalReopened = 0;
    let totalNotified = 0;
    let totalResponded = 0;

    const historyList = await Promise.all(allVerifications.map(async (cv) => {
      const comp = cv.complaintId || await Complaint.findById(cv.complaintId);
      const yes = cv.yesCount || comp?.citizenVerification?.yesCount || 0;
      const no = cv.stillExistsCount || comp?.citizenVerification?.stillExistsCount || 0;
      const notified = cv.citizensNotifiedCount || comp?.citizenVerification?.citizensNotified || 0;

      if (cv.status === 'IN_VERIFICATION' || cv.status === 'PENDING_SUPERVISOR') totalAwaiting++;
      if (cv.status === 'COMMUNITY_REOPENED' || comp?.status?.includes('Community Reopened')) totalReopened++;
      totalYes += yes;
      totalStillExists += no;
      totalNotified += notified;
      totalResponded += (yes + no);

      return {
        id: cv._id,
        complaintId: comp?._id,
        complaintCode: comp ? `#CMP-${String(comp._id).slice(-4).toUpperCase()}` : '#CMP-UNKNOWN',
        title: comp?.title || 'Civic Issue',
        category: comp?.category || 'General',
        status: comp?.status || cv.status,
        verificationStatus: cv.status,
        notifiedCount: notified,
        yesCount: yes,
        stillExistsCount: no,
        responseRate: notified > 0 ? Math.round(((yes + no) / notified) * 100) : 0,
        createdAt: cv.createdAt,
        updatedAt: cv.updatedAt,
        history: cv.history || []
      };
    }));

    const responsePercentage = totalNotified > 0 ? Math.round((totalResponded / totalNotified) * 100) : 0;

    res.json({
      metrics: {
        totalAwaitingVerification: totalAwaiting,
        yesResolvedCount: totalYes,
        stillExistsCount: totalStillExists,
        communityReopenedCount: totalReopened,
        citizenResponsePercentage: responsePercentage,
        totalNotified: totalNotified,
        totalResponded: totalResponded
      },
      verificationHistory: historyList,
      pendingComplaints: complaintsAwaitingVerification
    });
  } catch (err) {
    console.error('Error fetching verification dashboard data:', err);
    res.status(500).json({ message: 'Server error fetching verification telemetry: ' + err.message });
  }
});

// POST /api/admin/complaints/:id/reopen-review — Supervisor takes action on Community Reopened complaint
router.post('/complaints/:id/reopen-review', adminProtect, async (req, res) => {
  try {
    const { action, supervisorNotes, workerId } = req.body; // action: 'REWORK' | 'CLOSE'
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    if (action === 'REWORK') {
      complaint.status = 'Assigned';
      if (workerId) complaint.workerId = workerId;
      complaint.progress = 0;
      if (complaint.citizenVerification) {
        complaint.citizenVerification.verificationStatus = 'PENDING_SUPERVISOR';
        complaint.citizenVerification.communityReopened = false;
      }

      await CommunityReopenEvent.findOneAndUpdate(
        { complaintId: complaint._id },
        {
          status: 'REWORK_ASSIGNED',
          supervisorId: req.user ? req.user._id : (req.admin ? req.admin._id : undefined),
          supervisorNotes: supervisorNotes || 'Assigned rework to field agent based on community feedback.',
          actionTaken: 'Assigned Rework'
        },
        { sort: { reopenedAt: -1 } }
      );
    } else if (action === 'CLOSE') {
      complaint.status = 'Closed';
      if (complaint.citizenVerification) {
        complaint.citizenVerification.verificationStatus = 'VERIFIED_CLOSED';
      }

      await CitizenVerification.findOneAndUpdate(
        { complaintId: complaint._id },
        { status: 'VERIFIED_CLOSED' }
      );
    }

    await complaint.save();

    res.json({
      success: true,
      message: `Supervisor action '${action}' completed for complaint #${String(complaint._id).slice(-4).toUpperCase()}`,
      complaint
    });
  } catch (err) {
    console.error('Error handling reopen review:', err);
    res.status(500).json({ message: 'Server error handling reopen review: ' + err.message });
  }
});

// GET /api/admin/settings/citizen-verification — Fetch dynamic threshold & radius config
router.get('/settings/citizen-verification', adminProtect, async (req, res) => {
  try {
    const thresholdDoc = await SystemSetting.findOne({ key: 'community_reopen_threshold' });
    const radiusDoc = await SystemSetting.findOne({ key: 'verification_radius_km' });

    res.json({
      communityReopenThreshold: thresholdDoc ? parseInt(thresholdDoc.value) : 2,
      verificationRadiusKm: radiusDoc ? parseFloat(radiusDoc.value) : 5
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching verification settings' });
  }
});

// PUT /api/admin/settings/citizen-verification — Update dynamic threshold & radius config
router.put('/settings/citizen-verification', adminProtect, async (req, res) => {
  try {
    const { communityReopenThreshold, verificationRadiusKm } = req.body;

    if (communityReopenThreshold !== undefined) {
      await SystemSetting.findOneAndUpdate(
        { key: 'community_reopen_threshold' },
        {
          key: 'community_reopen_threshold',
          value: parseInt(communityReopenThreshold),
          description: 'Number of Still Exists citizen votes required to trigger Community Reopen Alert',
          updatedBy: req.user ? req.user._id : (req.admin ? req.admin._id : undefined),
          updatedAt: new Date()
        },
        { upsert: true, new: true }
      );
    }

    if (verificationRadiusKm !== undefined) {
      await SystemSetting.findOneAndUpdate(
        { key: 'verification_radius_km' },
        {
          key: 'verification_radius_km',
          value: parseFloat(verificationRadiusKm),
          description: 'Radius in km for identifying nearby citizens for verification alerts',
          updatedBy: req.user ? req.user._id : (req.admin ? req.admin._id : undefined),
          updatedAt: new Date()
        },
        { upsert: true, new: true }
      );
    }

    res.json({
      success: true,
      message: 'Citizen Verification settings updated successfully!',
      communityReopenThreshold: parseInt(communityReopenThreshold || 2),
      verificationRadiusKm: parseFloat(verificationRadiusKm || 5)
    });
  } catch (err) {
    console.error('Error saving verification settings:', err);
    res.status(500).json({ message: 'Server error updating verification settings: ' + err.message });
  }
});


// ==========================================
// CIVIC INTELLIGENCE PLATFORM & HEATMAP API
// ==========================================

// GET /api/admin/civic-intelligence/map — Civic Problem Heatmap & City Intelligence Data
router.get('/civic-intelligence/map', adminProtect, async (req, res) => {
  try {
    const {
      category,
      status,
      priority,
      ward,
      department,
      timeframe,
      days,
      communityOnly,
      aiStatus,
      slaStatus
    } = req.query;

    const filter = {};

    // Category Filter
    if (category && category !== 'All') {
      filter.category = category;
    }

    // Status Filter
    if (status && status !== 'All') {
      if (status === 'Active') {
        filter.status = { $in: ['New', 'Assigned', 'Working', 'Pending Citizen Verification', 'Community Reopened'] };
      } else {
        filter.status = status;
      }
    }

    // Priority Filter
    if (priority && priority !== 'All') {
      filter.priority = priority;
    }

    // Department Filter
    if (department && department !== 'All') {
      filter.department = department;
    }

    // Timeframe / Days Filter
    const daysNum = parseInt(days || timeframe);
    if (!isNaN(daysNum) && daysNum > 0) {
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - daysNum);
      filter.createdAt = { $gte: dateThreshold };
    }

    // Community Issues Only Filter
    if (communityOnly === 'true' || communityOnly === true) {
      filter.$or = [
        { 'communityIssue.isPrimary': true },
        { 'communityIssue.supporterCount': { $gt: 1 } },
        { 'communityIssue.duplicateCount': { $gt: 0 } }
      ];
    }

    // AI Classification Status Filter
    if (aiStatus && aiStatus !== 'All') {
      if (aiStatus === 'AI Verified') {
        filter.aiAnalysisStatus = 'COMPLETED';
      } else if (aiStatus === 'AI Pending Review') {
        filter.aiAnalysisStatus = 'ANALYZING';
      } else if (aiStatus === 'AI Overridden') {
        filter['aiAnalysis.confirmedByCitizen'] = false;
      }
    }

    // SLA Status Filter
    const now = new Date();
    if (slaStatus && slaStatus !== 'All') {
      if (slaStatus === 'Overdue' || slaStatus === 'Breached') {
        filter.slaDueAt = { $lt: now };
        filter.status = { $nin: ['Resolved', 'Closed'] };
      } else if (slaStatus === 'Due Soon') {
        const soon = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        filter.slaDueAt = { $gte: now, $lte: soon };
        filter.status = { $nin: ['Resolved', 'Closed'] };
      } else if (slaStatus === 'On Track') {
        filter.slaDueAt = { $gt: now };
      }
    }

    // Ward Filter (Check in address, title, or ward field)
    if (ward && ward !== 'All') {
      const wardRegex = new RegExp(ward, 'i');
      filter.$or = [
        { 'location.address': wardRegex },
        { description: wardRegex },
        { title: wardRegex }
      ];
    }

    // Fetch raw complaint documents matching criteria
    const rawComplaints = await Complaint.find(filter)
      .sort({ createdAt: -1 })
      .populate('citizenId', 'fullName email phone')
      .lean();

    // Populate worker & supervisor details cleanly
    const complaints = await Promise.all(rawComplaints.map(async (c) => {
      let worker = null;
      if (c.workerId) {
        worker = await User.findById(c.workerId).select('_id fullName email department city role').lean();
        if (!worker) {
          worker = await FieldWorker.findById(c.workerId).select('_id fullName email department city role').lean();
        }
      }
      return {
        ...c,
        workerId: worker || c.workerId
      };
    }));

    // City-wide overview statistics
    const totalIssues = complaints.length;
    const activeIssues = complaints.filter(c => ['New', 'Assigned', 'Working', 'Pending Citizen Verification', 'Community Reopened'].includes(c.status)).length;
    const resolvedIssues = complaints.filter(c => ['Resolved', 'Closed'].includes(c.status)).length;
    const communityIssues = complaints.filter(c => (c.communityIssue?.supporterCount || 0) > 1 || c.communityIssue?.isPrimary === true).length;
    const slaBreachedIssues = complaints.filter(c => c.slaDueAt && new Date(c.slaDueAt) < now && !['Resolved', 'Closed'].includes(c.status)).length;

    // Category distribution counts
    const categoryCounts = {
      Road: 0,
      Garbage: 0,
      'Street Light': 0,
      Water: 0,
      Drainage: 0,
      Parks: 0,
      Building: 0,
      Other: 0
    };

    complaints.forEach(c => {
      const cat = c.category || 'Other';
      if (categoryCounts[cat] !== undefined) {
        categoryCounts[cat]++;
      } else {
        const catLower = cat.toLowerCase();
        if (catLower.includes('road') || catLower.includes('pothole')) categoryCounts.Road++;
        else if (catLower.includes('garbage') || catLower.includes('waste')) categoryCounts.Garbage++;
        else if (catLower.includes('light')) categoryCounts['Street Light']++;
        else if (catLower.includes('water')) categoryCounts.Water++;
        else if (catLower.includes('drain')) categoryCounts.Drainage++;
        else if (catLower.includes('park')) categoryCounts.Parks++;
        else if (catLower.includes('build')) categoryCounts.Building++;
        else categoryCounts.Other++;
      }
    });

    // Hotspot aggregation by Ward / Locality
    const wardMap = new Map();
    complaints.forEach(c => {
      let wardName = 'City Central';
      const addr = c.location?.address || '';
      const wardMatch = addr.match(/Ward\s*\d+/i) || c.title?.match(/Ward\s*\d+/i);
      if (wardMatch) {
        wardName = wardMatch[0].toUpperCase();
      } else if (addr) {
        const parts = addr.split(',').map(s => s.trim()).filter(Boolean);
        if (parts.length > 0) wardName = parts[0];
      }

      if (!wardMap.has(wardName)) {
        wardMap.set(wardName, {
          ward: wardName,
          count: 0,
          activeCount: 0,
          resolvedCount: 0,
          communityCount: 0,
          lat: c.location?.lat || 22.3039,
          lng: c.location?.lng || 70.8022
        });
      }

      const item = wardMap.get(wardName);
      item.count++;
      if (['New', 'Assigned', 'Working', 'Pending Citizen Verification', 'Community Reopened'].includes(c.status)) {
        item.activeCount++;
      } else {
        item.resolvedCount++;
      }
      if ((c.communityIssue?.supporterCount || 0) > 1 || c.communityIssue?.isPrimary === true) {
        item.communityCount++;
      }
    });

    const hotspots = Array.from(wardMap.values()).sort((a, b) => b.count - a.count).slice(0, 10);

    res.json({
      success: true,
      summary: {
        totalIssues,
        activeIssues,
        resolvedIssues,
        communityIssues,
        slaBreachedIssues,
        categoryCounts
      },
      hotspots,
      complaints
    });
  } catch (err) {
    console.error('Error fetching civic intelligence map data:', err);
    res.status(500).json({ message: 'Server error fetching civic intelligence data: ' + err.message });
  }
});

// ==========================================
// ADMIN COMMUNITY ISSUES & DUPLICATE MANAGEMENT
// ==========================================

const ComplaintRelationship = require('../models/ComplaintRelationship');
const ComplaintSupporter = require('../models/ComplaintSupporter');

// GET /api/admin/complaints/community-issues — Fetch primary community issues and metrics
router.get('/complaints/community-issues', adminProtect, async (req, res) => {
  try {
    const primaryIssues = await Complaint.find({ 'communityIssue.isPrimary': { $ne: false } })
      .sort({ 'communityIssue.supporterCount': -1, createdAt: -1 })
      .populate('citizenId', 'fullName email')
      .populate('workerId', 'fullName email');

    const totalCommunityIssues = primaryIssues.length;
    const totalSupportersCount = primaryIssues.reduce((acc, c) => acc + (c.communityIssue?.supporterCount || 1), 0);
    const totalDuplicatesConsolidated = await ComplaintRelationship.countDocuments({ relationshipType: { $in: ['CONFIRMED_DUPLICATE', 'MERGED'] } });

    const relationships = await ComplaintRelationship.find()
      .populate('primaryComplaintId', 'title category status')
      .populate('relatedComplaintId', 'title category status')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      primaryIssues,
      relationships,
      metrics: {
        totalCommunityIssues,
        totalSupportersCount,
        totalDuplicatesConsolidated,
        citizenParticipationRate: totalCommunityIssues > 0 ? Math.round((totalSupportersCount / totalCommunityIssues) * 10) / 10 : 1.0
      }
    });
  } catch (err) {
    console.error('Error fetching admin community issues:', err);
    res.status(500).json({ message: 'Server error fetching community issues: ' + err.message });
  }
});

// POST /api/admin/complaints/merge — Admin manual merge of secondary complaint into primary complaint
router.post('/complaints/merge', adminProtect, async (req, res) => {
  try {
    const { primaryComplaintId, secondaryComplaintId, reason } = req.body;

    if (!primaryComplaintId || !secondaryComplaintId) {
      return res.status(400).json({ message: 'Primary complaint ID and secondary complaint ID are required' });
    }

    if (primaryComplaintId.toString() === secondaryComplaintId.toString()) {
      return res.status(400).json({ message: 'Cannot merge a complaint with itself' });
    }

    const primary = await Complaint.findById(primaryComplaintId);
    const secondary = await Complaint.findById(secondaryComplaintId);

    if (!primary || !secondary) {
      return res.status(404).json({ message: 'Primary or secondary complaint not found' });
    }

    // Preserve secondary complaint history, mark as non-primary linked to primary
    if (!secondary.communityIssue) secondary.communityIssue = {};
    secondary.communityIssue.isPrimary = false;
    secondary.communityIssue.primaryComplaintId = primary._id;
    secondary.status = 'Closed'; // Consolidated into primary issue
    await secondary.save();

    // Increment duplicate count and supporter count on primary
    if (!primary.communityIssue) primary.communityIssue = { isPrimary: true, supporterCount: 1, duplicateCount: 0 };
    primary.communityIssue.duplicateCount = (primary.communityIssue.duplicateCount || 0) + 1;
    primary.communityIssue.supporterCount = (primary.communityIssue.supporterCount || 0) + (secondary.communityIssue?.supporterCount || 1);

    // Merge secondary images into primary complaint images list safely
    if (secondary.images && secondary.images.length > 0) {
      primary.images = [...(primary.images || []), ...secondary.images].slice(0, 15);
    }

    await primary.save();

    // Record relationship
    const relationship = new ComplaintRelationship({
      primaryComplaintId: primary._id,
      relatedComplaintId: secondary._id,
      relationshipType: 'MERGED',
      similarityScore: 100,
      createdBy: req.admin ? req.admin._id : undefined
    });
    await relationship.save();

    // Log Activity with audit action COMPLAINT_MERGED (requirement #30)
    try {
      await new ActivityLog({
        adminId: req.admin ? req.admin._id : undefined,
        actorRole: req.user ? req.user.role : 'admin',
        actorName: req.admin ? req.admin.fullName : 'Admin',
        action: 'COMPLAINT_MERGED',
        details: `Merged secondary complaint #${String(secondary._id).slice(-4).toUpperCase()} into primary complaint #${String(primary._id).slice(-4).toUpperCase()} (${reason || 'Manual Admin Consolidation'})`,
        targetType: 'Complaint',
        targetId: primary._id,
        ipAddress: req.ip
      }).save();
    } catch (logErr) {
      console.warn('ActivityLog skipped for merge:', logErr.message);
    }

    res.json({
      success: true,
      message: `Successfully merged complaint #${String(secondary._id).slice(-4).toUpperCase()} into #${String(primary._id).slice(-4).toUpperCase()}`,
      primary,
      secondary
    });
  } catch (err) {
    console.error('Error merging complaints:', err);
    res.status(500).json({ message: 'Server error merging complaints: ' + err.message });
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

      let totalTimeSpentSeconds = 0;
      let currentlyWorking = false;

      if (p.role === 'worker') {
        activeTasks = await Complaint.countDocuments({ workerId: p._id, status: { $in: ['Assigned', 'Working'] } });
        resolvedTasks = await Complaint.countDocuments({ workerId: p._id, status: { $in: ['Resolved', 'Closed'] } });
        const comps = await Complaint.find({ workerId: p._id }).select('timeSpentSeconds isTimerRunning');
        totalTimeSpentSeconds = comps.reduce((acc, c) => acc + (c.timeSpentSeconds || 0), 0);
        currentlyWorking = comps.some(c => c.isTimerRunning);
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
        totalTimeSpentSeconds,
        currentlyWorking,
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

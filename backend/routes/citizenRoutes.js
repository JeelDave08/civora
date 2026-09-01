const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const CitizenVerification = require('../models/CitizenVerification');
const CitizenResponse = require('../models/CitizenResponse');
const Notification = require('../models/Notification');
const CommunityReopenEvent = require('../models/CommunityReopenEvent');
const SystemSetting = require('../models/SystemSetting');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Middleware to protect routes (optional for basic setup, but good practice)
const protect = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user || decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Get Dashboard Data (Extended with My Civic Impact stats - rewards free)
router.get('/dashboard', protect, async (req, res) => {
  try {
    const allComplaints = await Complaint.find({ citizenId: req.user.id }).sort({ createdAt: -1 });
    const recentComplaints = allComplaints.slice(0, 5);

    const submittedCount = allComplaints.length;
    const inProgressCount = allComplaints.filter(c => ['Assigned', 'Working'].includes(c.status)).length;
    const resolvedCount = allComplaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
    const pendingCount = allComplaints.filter(c => c.status === 'New').length;

    const statsData = [
      { id: 1, title: "Submitted", count: submittedCount, icon: "FileText", color: "text-blue-600", bg: "bg-blue-50" },
      { id: 2, title: "In Progress", count: inProgressCount, icon: "Activity", color: "text-amber-600", bg: "bg-amber-50" },
      { id: 3, title: "Resolved", count: resolvedCount, icon: "CheckCircle", color: "text-emerald-600", bg: "bg-emerald-50" },
      { id: 4, title: "Pending", count: pendingCount, icon: "Clock", color: "text-rose-600", bg: "bg-rose-50" }
    ];

    // Compute Civic Impact stats for authenticated citizen
    const ComplaintSupporter = require('../models/ComplaintSupporter');
    const citizenSupporterRecords = await ComplaintSupporter.find({ citizenId: req.user.id });

    // Issues Reported
    const issuesReported = submittedCount;
    // Issues Resolved
    const issuesResolved = resolvedCount;

    // Community Issues Verified (Unique resolution verifications)
    const verifiedSupporterRecords = citizenSupporterRecords.filter(s => s.verificationVote === 'RESOLVED' || s.verificationVote === 'STILL_EXISTS');
    const communityIssuesVerified = verifiedSupporterRecords.length;

    // Community Contributions (Total supporter actions by citizen)
    const communityContributions = citizenSupporterRecords.length;

    // Calculate Civic Impact Score (0-100%)
    // Formula:
    // Issues Reported: 35% (Target 10 complaints = 35 pts)
    // Issues Resolved Ratio: 35% (Resolved / Reported * 35 pts, default 0 if reported = 0)
    // Community Issues Verified: 20% (Target 5 verifications = 20 pts)
    // Community Contributions: 10% (Target 5 contributions = 10 pts)
    const reportedScore = Math.min(35, (issuesReported / 10) * 35);
    const resolvedRatioScore = issuesReported > 0 ? (issuesResolved / issuesReported) * 35 : 0;
    const verifiedScore = Math.min(20, (communityIssuesVerified / 5) * 20);
    const contribScore = Math.min(10, (communityContributions / 5) * 10);
    const civicImpactScore = Math.round(reportedScore + resolvedRatioScore + verifiedScore + contribScore);

    // Dynamic Civic Status logic based on score
    let civicStatus = "🌱 Getting Started";
    if (civicImpactScore >= 80) {
      civicStatus = "🏆 High Civic Impact";
    } else if (civicImpactScore >= 60) {
      civicStatus = "🌟 Active Civic Contributor";
    } else if (civicImpactScore >= 40) {
      civicStatus = "🏙️ Active Citizen";
    } else if (civicImpactScore >= 20) {
      civicStatus = "🌿 Civic Participant";
    }

    // Dynamic personalized message based on activity
    let impactMessage = "🌱 Start your civic journey by reporting a genuine issue in your area.";
    if (issuesReported === 0) {
      impactMessage = "Your civic impact starts with your first genuine report.";
    } else if (civicImpactScore >= 80) {
      impactMessage = "🌟 Your civic participation is making a strong impact on city operations.";
    } else if (communityIssuesVerified > 0) {
      impactMessage = "🤝 Your community verification is helping keep civic information accurate.";
    } else if (issuesResolved > 0) {
      impactMessage = "🏙️ Your reported issues are making a visible difference in your neighborhood.";
    } else {
      impactMessage = "👏 Your reports are helping CIVORA identify real civic issues.";
    }

    const impact = {
      issuesReported,
      issuesResolved,
      communityIssuesVerified,
      communityContributions,
      civicImpactScore,
      civicStatus,
      message: impactMessage
    };

    const announcements = [
      { id: 1, type: "Emergency Alert", title: "Heavy Rain Warning", time: "2 hours ago", icon: "ShieldAlert", color: "text-rose-500" },
      { id: 2, type: "Government News", title: "New Recycling Program", time: "1 day ago", icon: "Award", color: "text-[#3E766D]" }
    ];

    res.json({
      stats: statsData,
      recentComplaints,
      announcements,
      impact
    });
  } catch (err) {
    console.error("Error fetching dashboard data:", err);
    res.status(500).json({ message: 'Server error' });
  }
});
// Get All Complaints
router.get('/complaints', protect, async (req, res) => {
  try {
    const allComplaints = await Complaint.find({ citizenId: req.user.id })
      .populate('workerId', 'fullName email phone department')
      .sort({ createdAt: -1 });
    res.json(allComplaints);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching complaints' });
  }
});

// Get Single Complaint
router.get('/complaints/:id', protect, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    
    // Check if citizen owns this complaint
    if (complaint.citizenId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this complaint' });
    }
    
    res.json(complaint);
  } catch (err) {
    console.error('Error fetching complaint details:', err);
    res.status(500).json({ message: 'Server error fetching complaint details' });
  }
});

// Delete Complaint
router.delete('/complaints/:id', protect, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    
    // Check if citizen owns this complaint
    if (complaint.citizenId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this complaint' });
    }

    await Complaint.findByIdAndDelete(req.params.id);
    res.json({ message: 'Complaint deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error deleting complaint' });
  }
});

// Reverse Geocode Proxy using LocationIQ (keeps API key secure on backend)
router.get('/reverse-geocode', protect, async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ success: false, message: 'Valid latitude and longitude are required' });
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[GPS] latitude: ${latitude}, longitude: ${longitude}`);
    }

    const apiKey = process.env.LOCATIONIQ_API_KEY || "pk.0c9741909440306217e5f3b924862636";
    const apiUrl = `https://us1.locationiq.com/v1/reverse?key=${apiKey}&lat=${latitude}&lon=${longitude}&format=json`;

    const response = await fetch(apiUrl);
    const status = response.status;

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[LOCATIONIQ REVERSE] HTTP Status: ${status}`);
    }

    if (response.ok) {
      const data = await response.json();
      const addr = data.address || {};

      // Robust Indian & General location formatter hierarchy
      let formattedAddress = "";
      const road = addr.road || addr.street || addr.pedestrian || addr.footway || "";
      const neighbourhood = addr.neighbourhood || addr.suburb || addr.residential || addr.locality || addr.district || "";
      const city = addr.city || addr.town || addr.village || addr.municipality || addr.state_district || addr.county || "";
      const state = addr.state || "";

      if (road && neighbourhood && city) {
        formattedAddress = `${road}, ${neighbourhood}, ${city}`;
      } else if (road && city) {
        formattedAddress = `${road}, ${city}`;
      } else if (neighbourhood && city) {
        formattedAddress = `${neighbourhood}, ${city}`;
      } else if (city && state) {
        formattedAddress = `${city}, ${state}`;
      } else if (data.display_name) {
        formattedAddress = data.display_name;
      } else {
        formattedAddress = "Location detected";
      }

      return res.json({
        success: true,
        address: formattedAddress,
        displayName: data.display_name || formattedAddress,
        rawAddress: addr,
        lat: latitude,
        lng: longitude
      });
    }

    // Secondary fallback to Nominatim if LocationIQ rate-limits or returns non-200
    const nomRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
      headers: { 'User-Agent': 'CivoraApp/1.0' }
    });

    if (nomRes.ok) {
      const nomData = await nomRes.json();
      if (nomData.display_name) {
        return res.json({
          success: true,
          address: nomData.display_name,
          displayName: nomData.display_name,
          lat: latitude,
          lng: longitude
        });
      }
    }

    return res.json({
      success: true,
      address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      displayName: `GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      lat: latitude,
      lng: longitude
    });

  } catch (err) {
    console.error('Reverse geocoding error:', err);
    res.status(500).json({
      success: false,
      message: 'Unable to identify the address. Your GPS coordinates are still available.',
      lat: req.query.lat,
      lng: req.query.lng
    });
  }
});

const { analyzeImage } = require('../services/aiImageAnalysisService');

// Analyze Photo Evidence using AI Vision API
router.post('/complaints/analyze-image', async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'Image URL is required for AI analysis' });
    }

    const analysis = await analyzeImage(imageUrl);

    res.json({
      success: true,
      analysis: {
        detectedIssue: analysis.detectedIssue,
        confidenceScore: analysis.confidenceScore,
        suggestedCategory: analysis.suggestedCategory,
        suggestedPriority: analysis.suggestedPriority,
        suggestedDepartment: analysis.suggestedDepartment,
        analyzedAt: analysis.analyzedAt
      }
    });
  } catch (err) {
    console.error('Error analyzing image with AI:', err);
    res.status(500).json({
      success: false,
      message: 'AI analysis is temporarily unavailable. You can continue manually.',
      error: err.message
    });
  }
});

// Create Complaint (Supports optional AI fields & citizen confirmation)
router.post('/complaints', protect, async (req, res) => {
  try {
    let { 
      title, 
      description, 
      category, 
      priority, 
      department,
      location, 
      lat, 
      lng, 
      imageUrl, 
      images,
      aiAnalysis,
      aiAnalysisStatus,
      suggestedSlaHours,
      slaDueAt,
      aiProvider,
      aiModel,
      aiAnalysisVersion,
      aiImageAnalysis
    } = req.body;
    
    // Ensure images array is initialized
    const imageList = Array.isArray(images) && images.length > 0 ? images : (imageUrl ? [imageUrl] : []);
    const primaryImage = imageList[0] || '';

    // Auto-geocode address if lat/lng are missing
    if ((!lat || !lng) && location) {
      try {
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`, {
          headers: { 'User-Agent': 'CivoraApp/1.0' }
        });
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData && geoData.length > 0) {
            lat = parseFloat(geoData[0].lat);
            lng = parseFloat(geoData[0].lon);
          }
        }
      } catch (geoErr) {
        console.error('Auto-geocoding fallback error:', geoErr);
      }
    }

    // Calculate SLA due date if suggested SLA hours provided but slaDueAt not passed
    let finalSlaDueAt = slaDueAt ? new Date(slaDueAt) : null;
    if (!finalSlaDueAt && (suggestedSlaHours || (aiAnalysis && aiAnalysis.suggestedSlaHours))) {
      const hours = suggestedSlaHours || aiAnalysis.suggestedSlaHours;
      finalSlaDueAt = new Date(Date.now() + hours * 60 * 60 * 1000);
    }

    const finalLat = lat ? parseFloat(lat) : 23.0225;
    const finalLng = lng ? parseFloat(lng) : 72.5714;

    const newComplaint = new Complaint({
      title,
      description,
      category,
      priority,
      department: department || (aiAnalysis ? aiAnalysis.department : null),
      location: { 
        address: location,
        lat: finalLat,
        lng: finalLng,
        geoPoint: {
          type: 'Point',
          coordinates: [finalLng, finalLat]
        }
      },
      imageUrl: primaryImage,
      images: imageList,
      citizenId: req.user.id,
      status: 'New',
      suggestedSlaHours: suggestedSlaHours || (aiAnalysis ? aiAnalysis.suggestedSlaHours : null),
      slaDueAt: finalSlaDueAt,
      aiAnalysisStatus: aiAnalysisStatus || (aiAnalysis ? 'COMPLETED' : 'NOT_ANALYZED'),
      aiAnalysis: aiAnalysis || undefined,
      aiProvider: aiProvider || null,
      aiModel: aiModel || null,
      aiAnalysisVersion: aiAnalysisVersion || '1.0',
      aiImageAnalysis: aiImageAnalysis || undefined,
      communityIssue: {
        isPrimary: true,
        primaryComplaintId: null,
        supporterCount: 1,
        duplicateCount: 0,
        followersCount: 0,
        followers: [req.user.id],
        verification: {
          resolvedCount: 0,
          stillExistsCount: 0,
          reopenSignaled: false
        }
      }
    });

    await newComplaint.save();

    // Register creator as first supporter
    try {
      const ComplaintSupporter = require('../models/ComplaintSupporter');
      await new ComplaintSupporter({
        complaintId: newComplaint._id,
        citizenId: req.user.id,
        contributionType: 'JOINED_ISSUE',
        evidenceImages: imageList
      }).save();
    } catch (supporterErr) {
      console.warn('Initial supporter creation warning:', supporterErr.message);
    }

    res.status(201).json(newComplaint);
  } catch (err) {
    console.error('Error creating complaint:', err);
    res.status(500).json({ message: 'Server error while creating complaint' });
  }
});


// Citizen confirms or overrides AI Analysis suggestions
router.put('/complaints/:id/confirm-ai', protect, async (req, res) => {
  try {
    const { category, priority, department, suggestedSlaHours } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    if (complaint.citizenId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to confirm this complaint' });
    }

    // Update final confirmed complaint fields
    if (category) complaint.category = category;
    if (priority) complaint.priority = priority;
    if (department) complaint.department = department;

    const slaHours = suggestedSlaHours || (complaint.aiAnalysis ? complaint.aiAnalysis.suggestedSlaHours : complaint.suggestedSlaHours);
    if (slaHours) {
      complaint.suggestedSlaHours = slaHours;
      complaint.slaDueAt = new Date(Date.now() + slaHours * 60 * 60 * 1000);
    }

    if (complaint.aiAnalysis) {
      complaint.aiAnalysis.confirmedByCitizen = true;
      complaint.aiAnalysis.confirmedAt = new Date();
    } else {
      complaint.aiAnalysis = {
        category: complaint.category,
        priority: complaint.priority,
        department: complaint.department,
        suggestedSlaHours: slaHours || null,
        confirmedByCitizen: true,
        confirmedAt: new Date()
      };
    }

    await complaint.save();
    res.json(complaint);
  } catch (err) {
    console.error('Error confirming AI complaint:', err);
    res.status(500).json({ message: 'Server error confirming complaint AI data' });
  }
});

// Get User Profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = require('../models/User');
    const userProfile = await user.findById(req.user.id).select('-password');
    res.json(userProfile);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching profile' });
  }
});

// Update User Profile
router.put('/profile', protect, async (req, res) => {
  try {
    const user = require('../models/User');
    const { fullName, phone, address, profileImage } = req.body;
    
    const updatedUser = await user.findByIdAndUpdate(
      req.user.id,
      { $set: { fullName, phone, address, profileImage } },
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

// Get Nearby Complaints (all complaints with location data)
router.get('/nearby-complaints', protect, async (req, res) => {
  try {
    const complaints = await Complaint.find({
      'location.lat': { $exists: true, $ne: null },
      'location.lng': { $exists: true, $ne: null }
    }).populate('citizenId', 'fullName').sort({ createdAt: -1 }).limit(100);
    res.json(complaints);
  } catch (err) {
    console.error('Error fetching nearby complaints:', err);
    res.status(500).json({ message: 'Server error fetching nearby complaints' });
  }
});

// Submit Feedback
router.post('/feedback', protect, async (req, res) => {
  try {
    const Feedback = require('../models/FeedbackModel');
    const { subject, comment, rating } = req.body;

    if (!subject || !comment || !rating) {
      return res.status(400).json({ message: 'Subject, comment, and rating are required' });
    }

    const feedback = new Feedback({
      citizenId: req.user.id,
      subject,
      comment,
      rating: Math.min(5, Math.max(1, parseInt(rating))),
      status: 'New'
    });

    await feedback.save();
    res.status(201).json(feedback);
  } catch (err) {
    console.error('Error submitting feedback:', err);
    res.status(500).json({ message: 'Server error submitting feedback' });
  }
});

// ==========================================
// REWARDS SYSTEM
// ==========================================

// GET /api/citizen/rewards — Catalog & User balance
router.get('/rewards', protect, async (req, res) => {
  try {
    const { Reward, ClaimedReward } = require('../models/Reward');
    const User = require('../models/User');

    // Seed default rewards if empty
    let rewards = await Reward.find({ isActive: true });
    if (rewards.length === 0) {
      await Reward.insertMany([
        { title: "Free Parking Pass", description: "1-day free parking in municipal spots", pointsCost: 200, category: "Parking", icon: "🅿️", promoPrefix: "PARK" },
        { title: "Public Transit Pass", description: "Unlimited metro/bus pass for 1 day", pointsCost: 300, category: "Transit", icon: "🚌", promoPrefix: "BUS" },
        { title: "City Event Ticket", description: "Pass to local civic art & music festival", pointsCost: 500, category: "Events", icon: "🎫", promoPrefix: "EVENT" },
        { title: "Property Tax Voucher", description: "₹500 rebate voucher on property tax", pointsCost: 1000, category: "Tax", icon: "📄", promoPrefix: "TAX" }
      ]);
      rewards = await Reward.find({ isActive: true });
    }

    const user = await User.findById(req.user.id).select('points badges');
    const userPoints = user?.points ?? 450;
    const userBadges = user?.badges || ["First Report", "Community Helper"];

    res.json({
      rewards,
      points: userPoints,
      badges: userBadges
    });
  } catch (err) {
    console.error('Error fetching rewards:', err);
    res.status(500).json({ message: 'Server error fetching rewards' });
  }
});

// POST /api/citizen/rewards/claim — Claim a reward with points
router.post('/rewards/claim', protect, async (req, res) => {
  try {
    const { rewardId } = req.body;
    const { Reward, ClaimedReward } = require('../models/Reward');
    const User = require('../models/User');

    const reward = await Reward.findById(rewardId);
    if (!reward) return res.status(404).json({ message: 'Reward not found' });
    if (reward.stock <= 0) return res.status(400).json({ message: 'Reward out of stock' });

    const user = await User.findById(req.user.id);
    const currentPoints = user.points ?? 450;

    if (currentPoints < reward.pointsCost) {
      return res.status(400).json({ message: `Insufficient points. You need ${reward.pointsCost} pts.` });
    }

    // Deduct points
    user.points = currentPoints - reward.pointsCost;
    await user.save();

    // Deduct stock
    reward.stock -= 1;
    await reward.save();

    // Generate unique coupon code (e.g. CIV-PARK-8912)
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const couponCode = `CIV-${reward.promoPrefix}-${randomCode}`;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days validity

    const claim = new ClaimedReward({
      citizenId: user._id,
      rewardId: reward._id,
      rewardTitle: reward.title,
      couponCode,
      pointsSpent: reward.pointsCost,
      expiresAt
    });

    await claim.save();

    res.status(201).json({
      message: 'Reward claimed successfully!',
      couponCode,
      remainingPoints: user.points,
      claim
    });
  } catch (err) {
    console.error('Error claiming reward:', err);
    res.status(500).json({ message: 'Server error claiming reward' });
  }
});

// ==========================================
// DUPLICATE COMPLAINT DETECTION & COMMUNITY ISSUES
// ==========================================

const { findDuplicates } = require('../services/duplicateDetectionService');
const ComplaintSupporter = require('../models/ComplaintSupporter');
const ComplaintRelationship = require('../models/ComplaintRelationship');

// POST /api/complaints/check-duplicates (and /api/citizen/complaints/check-duplicates)
router.post('/complaints/check-duplicates', async (req, res) => {
  try {
    const { category, department, priority, description, title, location, lat, lng, imageUrl, images } = req.body;

    const duplicates = await findDuplicates({
      category,
      department,
      priority,
      description,
      title,
      location,
      lat,
      lng,
      imageUrl,
      images
    });

    res.json({
      success: true,
      duplicates
    });
  } catch (err) {


    console.error('Error checking duplicate complaints:', err);
    // Non-blocking fallback requirement #44
    res.json({
      success: true,
      duplicates: [],
      message: 'Unable to check for similar issues right now. You can continue submitting your complaint.',
      error: err.message
    });
  }
});

// POST /api/complaints/:complaintId/join — Citizen joins existing community issue
router.post('/complaints/:complaintId/join', protect, async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { comment, evidenceImages } = req.body;
    const citizenId = req.user.id;

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    // Check if already joined
    const existingSupporter = await ComplaintSupporter.findOne({ complaintId: complaint._id, citizenId });
    if (existingSupporter) {
      return res.status(400).json({ message: 'You have already joined this community issue.' });
    }

    // Create supporter record
    const supporter = new ComplaintSupporter({
      complaintId: complaint._id,
      citizenId,
      contributionType: (evidenceImages && evidenceImages.length > 0) ? 'ADDED_EVIDENCE' : 'JOINED_ISSUE',
      evidenceImages: evidenceImages || [],
      comment: comment || ''
    });

    await supporter.save();

    // Increment supporter count on primary complaint
    if (!complaint.communityIssue) {
      complaint.communityIssue = { isPrimary: true, supporterCount: 1, duplicateCount: 0, followersCount: 0 };
    }
    complaint.communityIssue.supporterCount = (complaint.communityIssue.supporterCount || 0) + 1;

    // Add extra evidence images to complaint gallery
    if (evidenceImages && evidenceImages.length > 0) {
      const existingImages = complaint.images || [];
      const newImages = [...existingImages, ...evidenceImages].slice(0, 10);
      complaint.images = newImages;
    }

    await complaint.save();

    res.status(201).json({
      success: true,
      message: 'You joined this community issue successfully!',
      complaintId: complaint._id,
      supporterCount: complaint.communityIssue.supporterCount
    });
  } catch (err) {
    console.error('Error joining complaint:', err);
    res.status(500).json({ message: 'Server error while joining community issue: ' + err.message });
  }
});

// POST /api/complaints/:complaintId/community-evidence — Add additional evidence photos
router.post('/complaints/:complaintId/community-evidence', protect, async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { images, comment } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ message: 'At least one photo is required' });
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    let supporter = await ComplaintSupporter.findOne({ complaintId: complaint._id, citizenId: req.user.id });
    if (!supporter) {
      // Auto-join if adding evidence for the first time
      supporter = new ComplaintSupporter({
        complaintId: complaint._id,
        citizenId: req.user.id,
        contributionType: 'ADDED_EVIDENCE',
        evidenceImages: images,
        comment: comment || ''
      });
      complaint.communityIssue.supporterCount = (complaint.communityIssue.supporterCount || 0) + 1;
    } else {
      supporter.evidenceImages = [...(supporter.evidenceImages || []), ...images];
      if (comment) supporter.comment = comment;
      supporter.contributionType = 'ADDED_EVIDENCE';
    }

    await supporter.save();

    // Add to complaint's master images list
    complaint.images = [...(complaint.images || []), ...images].slice(0, 15);
    await complaint.save();

    res.json({
      success: true,
      message: 'Community evidence added successfully!',
      images: supporter.evidenceImages
    });
  } catch (err) {
    console.error('Error adding community evidence:', err);
    res.status(500).json({ message: 'Server error adding community evidence' });
  }
});

// POST /api/complaints/:complaintId/follow — Follow issue for updates
router.post('/complaints/:complaintId/follow', protect, async (req, res) => {
  try {
    const { complaintId } = req.params;
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    if (!complaint.communityIssue) {
      complaint.communityIssue = { isPrimary: true, supporterCount: 1, followersCount: 0, followers: [] };
    }

    const followers = complaint.communityIssue.followers || [];
    if (!followers.some(id => id.toString() === req.user.id)) {
      followers.push(req.user.id);
      complaint.communityIssue.followers = followers;
      complaint.communityIssue.followersCount = followers.length;
      await complaint.save();
    }

    res.json({ success: true, message: 'You are now following this issue for updates', followersCount: complaint.communityIssue.followersCount });
  } catch (err) {
    res.status(500).json({ message: 'Server error following issue' });
  }
});

// DELETE /api/complaints/:complaintId/follow — Unfollow issue
router.delete('/complaints/:complaintId/follow', protect, async (req, res) => {
  try {
    const { complaintId } = req.params;
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    if (complaint.communityIssue && complaint.communityIssue.followers) {
      complaint.communityIssue.followers = complaint.communityIssue.followers.filter(id => id.toString() !== req.user.id);
      complaint.communityIssue.followersCount = complaint.communityIssue.followers.length;
      await complaint.save();
    }

    res.json({ success: true, message: 'Unfollowed issue', followersCount: complaint.communityIssue?.followersCount || 0 });
  } catch (err) {
    res.status(500).json({ message: 'Server error unfollowing issue' });
  }
});

// GET /api/complaints/:complaintId/community — Fetch community details & evidence
router.get('/complaints/:complaintId/community', protect, async (req, res) => {
  try {
    const { complaintId } = req.params;
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    const supporters = await ComplaintSupporter.find({ complaintId: complaint._id })
      .select('contributionType evidenceImages comment verificationVote joinedAt createdAt')
      .sort({ createdAt: -1 });

    const currentSupporter = supporters.find(s => s.citizenId && s.citizenId.toString() === req.user.id);
    const isFollowing = complaint.communityIssue?.followers?.some(id => id.toString() === req.user.id) || false;

    // Collect privacy-preserving community evidence photos
    const communityEvidence = [];
    supporters.forEach(s => {
      if (s.evidenceImages && s.evidenceImages.length > 0) {
        s.evidenceImages.forEach(img => {
          const url = typeof img === 'string' ? img : (img.url || '');
          if (url) {
            communityEvidence.push({
              url,
              addedAt: s.createdAt,
              contributionType: s.contributionType
            });
          }
        });
      }
    });

    res.json({
      supporterCount: complaint.communityIssue?.supporterCount || supporters.length || 1,
      duplicateCount: complaint.communityIssue?.duplicateCount || 0,
      followersCount: complaint.communityIssue?.followersCount || 0,
      isFollowing,
      hasJoined: !!currentSupporter,
      communityEvidence,
      verification: complaint.communityIssue?.verification || { resolvedCount: 0, stillExistsCount: 0, reopenSignaled: false },
      userVerificationVote: currentSupporter?.verificationVote || null
    });
  } catch (err) {
    console.error('Error fetching community details:', err);
    res.status(500).json({ message: 'Server error fetching community details' });
  }
});

// POST /api/complaints/:complaintId/verify — Citizen resolution verification
router.post('/complaints/:complaintId/verify', protect, async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { vote } = req.body; // 'RESOLVED' or 'STILL_EXISTS'

    if (!['RESOLVED', 'STILL_EXISTS'].includes(vote)) {
      return res.status(400).json({ message: 'Invalid verification vote. Must be RESOLVED or STILL_EXISTS.' });
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    let supporter = await ComplaintSupporter.findOne({ complaintId: complaint._id, citizenId: req.user.id });
    if (!supporter) {
      supporter = new ComplaintSupporter({
        complaintId: complaint._id,
        citizenId: req.user.id,
        contributionType: 'CONFIRMED_ISSUE'
      });
      complaint.communityIssue.supporterCount = (complaint.communityIssue.supporterCount || 0) + 1;
    }

    supporter.verificationVote = vote;
    supporter.verifiedAt = new Date();
    await supporter.save();

    // Recalculate verification statistics across all supporters
    const allSupporters = await ComplaintSupporter.find({ complaintId: complaint._id });
    const resolvedCount = allSupporters.filter(s => s.verificationVote === 'RESOLVED').length;
    const stillExistsCount = allSupporters.filter(s => s.verificationVote === 'STILL_EXISTS').length;

    const totalSupporters = Math.max(1, complaint.communityIssue?.supporterCount || allSupporters.length || 1);
    const stillExistsRatio = stillExistsCount / totalSupporters;
    const reopenSignaled = stillExistsRatio >= 0.3; // 30% threshold requirement #35

    if (!complaint.communityIssue) complaint.communityIssue = {};
    complaint.communityIssue.verification = {
      resolvedCount,
      stillExistsCount,
      reopenSignaled
    };

    await complaint.save();

    res.json({
      success: true,
      message: 'Verification recorded. Thank you for helping keep Civora accurate!',
      verification: complaint.communityIssue.verification
    });
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ message: 'Server error recording resolution verification' });
  }
});

// ==========================================
// CITIZEN VERIFICATION & COMMUNITY ACCOUNTABILITY
// ==========================================

// GET /api/citizen/verification/pending — Get complaints awaiting verification for nearby citizens
router.get('/verification/pending', protect, async (req, res) => {
  try {
    const pendingComplaints = await Complaint.find({
      status: 'Pending Citizen Verification',
      'citizenVerification.verificationStatus': 'IN_VERIFICATION'
    }).sort({ updatedAt: -1 });

    const userResponses = await CitizenResponse.find({ citizenId: req.user.id });
    const respondedComplaintIds = new Set(userResponses.map(r => r.complaintId.toString()));

    const result = pendingComplaints.map(comp => ({
      _id: comp._id,
      code: `#CMP-${String(comp._id).slice(-4).toUpperCase()}`,
      title: comp.title,
      category: comp.category,
      description: comp.description,
      location: comp.location,
      beforeImage: comp.beforeImage,
      afterImage: comp.afterImage,
      createdAt: comp.createdAt,
      hasResponded: respondedComplaintIds.has(comp._id.toString()),
      userVote: userResponses.find(r => r.complaintId.toString() === comp._id.toString())?.response || null
    }));

    res.json(result);
  } catch (err) {
    console.error('Error fetching pending verifications:', err);
    res.status(500).json({ message: 'Server error fetching pending verifications' });
  }
});

// POST /api/citizen/verification/:complaintId/respond — Citizen submits verification response (Yes, Resolved | Still Exists)
router.post('/verification/:complaintId/respond', protect, async (req, res) => {
  try {
    const { response } = req.body; // 'YES_RESOLVED' | 'STILL_EXISTS'
    const { complaintId } = req.params;

    if (!['YES_RESOLVED', 'STILL_EXISTS'].includes(response)) {
      return res.status(400).json({ message: 'Invalid response value. Must be YES_RESOLVED or STILL_EXISTS.' });
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    // Check if citizen has already responded (enforce single vote per citizen)
    const existingResponse = await CitizenResponse.findOne({
      complaintId: complaint._id,
      citizenId: req.user.id
    });

    if (existingResponse) {
      return res.status(400).json({
        message: 'You have already submitted a verification response for this complaint.',
        alreadyVoted: true,
        userVote: existingResponse.response
      });
    }

    // Save citizen response
    let cv = await CitizenVerification.findOne({ complaintId: complaint._id });
    if (!cv) {
      cv = new CitizenVerification({
        complaintId: complaint._id,
        status: 'IN_VERIFICATION'
      });
    }

    const citizenResponse = new CitizenResponse({
      complaintId: complaint._id,
      citizenId: req.user.id,
      verificationId: cv._id,
      response
    });
    await citizenResponse.save();

    // Update counts
    if (response === 'YES_RESOLVED') {
      cv.yesCount = (cv.yesCount || 0) + 1;
    } else {
      cv.stillExistsCount = (cv.stillExistsCount || 0) + 1;
    }

    // Record anonymized event history
    cv.history.push({
      action: 'CITIZEN_VOTED',
      actorId: req.user.id,
      actorRole: 'citizen',
      actorName: 'Verified Citizen', // PII protected
      vote: response,
      details: `Citizen submitted response: ${response === 'YES_RESOLVED' ? 'Yes, Resolved' : 'Still Exists'}`,
      timestamp: new Date()
    });

    // Update Complaint embedded fields
    if (!complaint.citizenVerification) complaint.citizenVerification = {};
    complaint.citizenVerification.yesCount = cv.yesCount;
    complaint.citizenVerification.stillExistsCount = cv.stillExistsCount;

    // Check Community Reopen Threshold
    let thresholdSetting = await SystemSetting.findOne({ key: 'community_reopen_threshold' });
    const reopenThreshold = thresholdSetting ? parseInt(thresholdSetting.value) : 2;

    let reopenTriggered = false;

    if (cv.stillExistsCount >= reopenThreshold && complaint.status !== 'Community Reopened – Supervisor Review Required') {
      reopenTriggered = true;
      cv.status = 'COMMUNITY_REOPENED';
      cv.communityReopenedAt = new Date();

      complaint.status = 'Community Reopened – Supervisor Review Required';
      complaint.citizenVerification.verificationStatus = 'COMMUNITY_REOPENED';
      complaint.citizenVerification.communityReopened = true;
      complaint.citizenVerification.reopenedAt = new Date();

      // Log Community Reopen Audit Event
      await new CommunityReopenEvent({
        complaintId: complaint._id,
        reopenedAt: new Date(),
        stillExistsCount: cv.stillExistsCount,
        thresholdApplied: reopenThreshold,
        status: 'TRIGGERED'
      }).save();

      // Dispatch Notifications to Supervisors and Admins
      const supervisors = await User.find({ role: 'supervisor' });
      const notificationDocs = supervisors.map(sup => ({
        recipientId: sup._id,
        recipientRole: 'supervisor',
        type: 'COMMUNITY_REOPEN_ALERT',
        title: '⚠️ Community Reopen Alert',
        message: `Complaint #${String(complaint._id).slice(-4).toUpperCase()} ('${complaint.title}') has been reopened due to community feedback (${cv.stillExistsCount} citizens reported 'Still Exists'). Supervisor review required.`,
        complaintId: complaint._id
      }));

      if (notificationDocs.length > 0) {
        await Notification.insertMany(notificationDocs);
      }

      cv.history.push({
        action: 'COMMUNITY_REOPENED',
        actorRole: 'system',
        details: `⚠️ Community Reopen Alert triggered automatically: ${cv.stillExistsCount} citizens reported 'Still Exists' (Threshold: ${reopenThreshold}).`,
        timestamp: new Date()
      });
    }

    await cv.save();
    await complaint.save();

    res.json({
      success: true,
      message: response === 'YES_RESOLVED' 
        ? 'Thank you! Your verification confirming resolution has been recorded.' 
        : 'Thank you for your feedback. The issue has been flagged for supervisor review.',
      vote: response,
      reopenTriggered,
      verificationStats: {
        citizensNotified: cv.citizensNotifiedCount || complaint.citizenVerification?.citizensNotified || 0,
        yesCount: cv.yesCount,
        stillExistsCount: cv.stillExistsCount,
        status: complaint.status
      }
    });
  } catch (err) {
    console.error('Error recording citizen verification response:', err);
    res.status(500).json({ message: 'Server error recording verification response: ' + err.message });
  }
});

// GET /api/citizen/verification/:complaintId — Get verification status & anonymized history for a complaint
router.get('/verification/:complaintId', protect, async (req, res) => {
  try {
    const { complaintId } = req.params;
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    const cv = await CitizenVerification.findOne({ complaintId });
    const userVoteDoc = await CitizenResponse.findOne({ complaintId, citizenId: req.user.id });

    res.json({
      complaintId,
      status: complaint.status,
      verificationStatus: cv?.status || complaint.citizenVerification?.verificationStatus || 'NONE',
      citizensNotified: cv?.citizensNotifiedCount || complaint.citizenVerification?.citizensNotified || 0,
      yesCount: cv?.yesCount || complaint.citizenVerification?.yesCount || 0,
      stillExistsCount: cv?.stillExistsCount || complaint.citizenVerification?.stillExistsCount || 0,
      hasVoted: !!userVoteDoc,
      userVote: userVoteDoc?.response || null,
      history: (cv?.history || []).map(item => ({
        action: item.action,
        actorRole: item.actorRole,
        details: item.details,
        vote: item.vote,
        timestamp: item.timestamp
      }))
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching verification details' });
  }
});

// GET /api/citizen/notifications — Persistent in-app notifications feed
router.get('/notifications', protect, async (req, res) => {
  try {
    const dbNotifications = await Notification.find({ recipientId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate('complaintId', 'title category status location');

    res.json(dbNotifications);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching notifications' });
  }
});

// PUT /api/citizen/notifications/:id/read — Mark notification read
router.put('/notifications/:id/read', protect, async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user.id },
      { read: true },
      { new: true }
    );
    res.json({ success: true, notification: notif });
  } catch (err) {
    res.status(500).json({ message: 'Server error updating notification' });
  }
});

module.exports = router;




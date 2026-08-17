const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
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

// Get Dashboard Data
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

    const announcements = [
      { id: 1, type: "Emergency Alert", title: "Heavy Rain Warning", time: "2 hours ago", icon: "ShieldAlert", color: "text-rose-500" },
      { id: 2, type: "Government News", title: "New Recycling Program", time: "1 day ago", icon: "Award", color: "text-[#3E766D]" }
    ];

    res.json({
      stats: statsData,
      recentComplaints,
      announcements
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
// Get All Complaints
router.get('/complaints', protect, async (req, res) => {
  try {
    const allComplaints = await Complaint.find({ citizenId: req.user.id }).sort({ createdAt: -1 });
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
// Create Complaint
router.post('/complaints', protect, async (req, res) => {
  try {
    let { title, description, category, priority, location, lat, lng, imageUrl } = req.body;
    
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

    const newComplaint = new Complaint({
      title,
      description,
      category,
      priority,
      location: { 
        address: location,
        lat: lat ? parseFloat(lat) : 23.0225,
        lng: lng ? parseFloat(lng) : 72.5714
      },
      imageUrl,
      citizenId: req.user.id,
      status: 'New'
    });

    await newComplaint.save();
    res.status(201).json(newComplaint);
  } catch (err) {
    console.error('Error creating complaint:', err);
    res.status(500).json({ message: 'Server error while creating complaint' });
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

// GET /api/citizen/rewards/my-claims — Fetch user's claimed vouchers
router.get('/rewards/my-claims', protect, async (req, res) => {
  try {
    const { ClaimedReward } = require('../models/Reward');
    const claims = await ClaimedReward.find({ citizenId: req.user.id }).sort({ createdAt: -1 });
    res.json(claims);
  } catch (err) {
    console.error('Error fetching claimed rewards:', err);
    res.status(500).json({ message: 'Server error fetching claimed rewards' });
  }
});

module.exports = router;



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
    const { title, description, category, priority, location, lat, lng, imageUrl } = req.body;
    
    const newComplaint = new Complaint({
      title,
      description,
      category,
      priority,
      location: { 
        address: location,
        lat: lat || null,
        lng: lng || null
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

module.exports = router;

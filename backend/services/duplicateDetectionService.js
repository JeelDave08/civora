const Complaint = require('../models/Complaint');

/**
 * Haversine formula to calculate exact distance in meters between two lat/lng points.
 */
function getHaversineDistanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Calculate Jaccard similarity token overlap for descriptions/text (0 to 1).
 */
function calculateTextSimilarity(text1 = '', text2 = '') {
  if (!text1 || !text2) return 0;
  const tokenize = (str) => new Set(str.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2));
  const set1 = tokenize(text1);
  const set2 = tokenize(text2);

  if (set1.size === 0 || set2.size === 0) return 0;

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

/**
 * Normalize category string into standard canonical key for matching.
 */
function normalizeCategory(cat = '') {
  const c = cat.toLowerCase().trim();
  if (c.includes('road') || c.includes('pothole') || c.includes('footpath') || c.includes('street')) return 'road';
  if (c.includes('garbage') || c.includes('waste') || c.includes('trash') || c.includes('clean')) return 'garbage';
  if (c.includes('electric') || c.includes('light') || c.includes('power')) return 'electricity';
  if (c.includes('water') || c.includes('drain') || c.includes('sewage') || c.includes('pipe')) return 'water';
  if (c.includes('park') || c.includes('tree') || c.includes('garden')) return 'parks';
  return c;
}

/**
 * Calculate multivariable similarity score (0 - 100%).
 * Weighting:
 * - Exact Image Match: 100% (Instant duplicate signal)
 * - Distance: 35%
 * - Address / Location Match: 25%
 * - Category Match: 25%
 * - Description & Title: 10%
 * - AI / Priority Signal: 5%
 */
function calculateSimilarityScore(newIssue, candidate, distanceMeters, radiusMeters) {
  // 0. Check Exact Image Match (highest confidence)
  const newImg = newIssue.imageUrl || (newIssue.images && newIssue.images[0]) || '';
  const candImg = candidate.imageUrl || (candidate.images && candidate.images[0]) || '';
  
  if (newImg && candImg) {
    const extractUrl = (img) => typeof img === 'string' ? img : (img?.url || '');
    const url1 = extractUrl(newImg);
    const url2 = extractUrl(candImg);
    if (url1 && url2 && url1 === url2) {
      console.log(`[DUPLICATE MATCH] Exact image match detected! Score: 100%`);
      return 100;
    }
  }

  let score = 0;

  // 1. Distance Score (35 points max)
  const normalizedDistance = Math.max(0, 1 - (distanceMeters / radiusMeters));
  const distanceScore = normalizedDistance * 35;
  score += distanceScore;

  // 2. Category Match with Synonym Normalization (25 points max)
  const cat1 = normalizeCategory(newIssue.category);
  const cat2 = normalizeCategory(candidate.category);
  if (cat1 && cat2 && (cat1 === cat2 || cat1.includes(cat2) || cat2.includes(cat1))) {
    score += 25;
  } else if (cat1 && cat2) {
    score += 10; // Partial match
  }

  // 3. Address & Location Similarity (25 points max)
  const addr1 = typeof newIssue.location === 'string' ? newIssue.location : (newIssue.location?.address || newIssue.title || '');
  const addr2 = candidate.location?.address || candidate.title || '';
  const addrSim = calculateTextSimilarity(addr1, addr2);
  if (addrSim > 0.4 || (addr1 && addr2 && addr1.toLowerCase() === addr2.toLowerCase())) {
    score += 25;
  } else {
    score += Math.round(addrSim * 20);
  }

  // 4. Description & Title Similarity (10 points max)
  const text1 = `${newIssue.title || ''} ${newIssue.description || ''}`;
  const text2 = `${candidate.title || ''} ${candidate.description || ''}`;
  const textSim = calculateTextSimilarity(text1, text2);
  score += Math.round(textSim * 10);

  // 5. Priority / AI Signal (5 points max)
  if (newIssue.priority && candidate.priority && newIssue.priority === candidate.priority) {
    score += 5;
  }

  return Math.round(Math.min(100, Math.max(0, score)));
}

/**
 * Perform Duplicate Search using MongoDB 2dsphere / distance + multivariable scoring.
 */
async function findDuplicates({ category, department, priority, description, title, location, lat: reqLat, lng: reqLng, imageUrl, images }) {
  const radiusMeters = parseInt(process.env.DUPLICATE_COMPLAINT_RADIUS_METERS) || 3000; // 3 km default search radius

  let lat = reqLat !== undefined ? parseFloat(reqLat) : (location?.lat !== undefined ? parseFloat(location.lat) : (location?.latitude !== undefined ? parseFloat(location.latitude) : null));
  let lng = reqLng !== undefined ? parseFloat(reqLng) : (location?.lng !== undefined ? parseFloat(location.lng) : (location?.longitude !== undefined ? parseFloat(location.longitude) : null));

  // Fallback to default city center if missing
  if (lat === null || isNaN(lat)) lat = 23.0225;
  if (lng === null || isNaN(lng)) lng = 72.5714;

  const candidateMap = new Map();

  // 1. Try $nearSphere query first
  try {
    const geoCandidates = await Complaint.find({
      status: { $ne: 'Closed' },
      'location.geoPoint': {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: radiusMeters
        }
      }
    }).limit(30);

    for (const c of geoCandidates) {
      candidateMap.set(String(c._id), c);
    }
  } catch (geoErr) {
    console.warn('Geospatial $nearSphere query notice:', geoErr.message);
  }

  // 2. Query all active non-closed complaints in database to ensure 100% coverage
  try {
    const activeCandidates = await Complaint.find({ status: { $ne: 'Closed' } }).sort({ createdAt: -1 }).limit(50);
    for (const c of activeCandidates) {
      candidateMap.set(String(c._id), c);
    }
  } catch (err) {
    console.warn('Active complaints search fallback error:', err.message);
  }

  const candidates = Array.from(candidateMap.values());
  const results = [];

  for (const candidate of candidates) {
    // Extract candidate coordinates
    let candLat = candidate.location?.lat;
    let candLng = candidate.location?.lng;

    if (candLat === undefined || candLat === null || isNaN(candLat)) {
      if (candidate.location?.geoPoint?.coordinates && candidate.location.geoPoint.coordinates.length >= 2) {
        candLng = candidate.location.geoPoint.coordinates[0];
        candLat = candidate.location.geoPoint.coordinates[1];
      } else {
        candLat = 23.0225;
        candLng = 72.5714;
      }
    }

    const distanceMeters = getHaversineDistanceMeters(lat, lng, candLat, candLng);

    const similarityScore = calculateSimilarityScore(
      { category, department, priority, description, title, location, imageUrl, images },
      candidate,
      distanceMeters,
      radiusMeters
    );

    console.log(`[DUPLICATE SCORE] Complaint: #CMP-${String(candidate._id).slice(-4).toUpperCase()} | Distance: ${distanceMeters}m | Category Match: ${category === candidate.category} | Final Score: ${similarityScore}%`);

    // Show warning if similarity score >= 30% or distance <= 1000m or same category
    if (similarityScore >= 30) {
      results.push({
        complaintId: `#CMP-${String(candidate._id).slice(-4).toUpperCase()}`,
        rawId: candidate._id,
        title: candidate.title || `${candidate.category} Issue`,
        category: candidate.category,
        department: candidate.department || candidate.category,
        distanceMeters,
        supporterCount: candidate.communityIssue?.supporterCount || 1,
        status: candidate.status,
        priority: candidate.priority,
        similarityScore,
        imageUrl: candidate.imageUrl || (candidate.images && candidate.images[0]) || '',
        locationAddress: candidate.location?.address || 'Nearby Location',
        createdAt: candidate.createdAt
      });
    }
  }

  // Sort by highest similarity score first, then smallest distance
  results.sort((a, b) => b.similarityScore - a.similarityScore || a.distanceMeters - b.distanceMeters);

  return results.slice(0, 3);
}



module.exports = {
  findDuplicates,
  calculateSimilarityScore,
  getHaversineDistanceMeters
};

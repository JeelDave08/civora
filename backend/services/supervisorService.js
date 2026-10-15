const Supervisor = require('../models/Supervisor');

/**
 * Retrieves the exact matching Supervisor for a specific Rajkot Ward.
 *
 * @param {number|string} wardNumber - The ward number to look up.
 * @returns {Promise<Object>} Status and the matched supervisor.
 */
async function getSupervisorForWard(wardNumber) {
  if (wardNumber === undefined || wardNumber === null || wardNumber === '') {
    return { status: 'INVALID_WARD', supervisor: null };
  }

  try {
    // 1. Find all active supervisors in Rajkot
    const activeSupervisors = await Supervisor.find({ isActive: true, city: 'Rajkot' });
    
    // 2. Clean the input wardNumber
    const targetWard = String(wardNumber).trim().toLowerCase();

    // 3. Exact matching logic: handles string CSV (e.g. "7,8") and exact string matching
    const matchingSupervisors = activeSupervisors.filter(sup => {
      if (!sup.wardNumber) return false;
      const supWards = String(sup.wardNumber)
        .toLowerCase()
        .split(',')
        .map(w => w.trim().replace(/[^a-z0-9]/g, ''));
        
      const cleanTarget = targetWard.replace(/[^a-z0-9]/g, '');
      return supWards.includes(cleanTarget);
    });

    // 4. Return results
    if (matchingSupervisors.length === 0) {
      return { status: 'NOT_FOUND', supervisor: null };
    }

    if (matchingSupervisors.length > 1) {
      return { status: 'MULTIPLE_SUPERVISORS', supervisor: null };
    }

    return { status: 'FOUND', supervisor: matchingSupervisors[0] };
  } catch (error) {
    console.error('Error fetching supervisor for ward:', error.message);
    throw error;
  }
}

module.exports = {
  getSupervisorForWard
};

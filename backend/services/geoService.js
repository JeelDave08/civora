const Ward = require('../models/Ward');

/**
 * Retrieves the Rajkot Ward Number for a given coordinate.
 *
 * @param {number} latitude - Latitude coordinate (-90 to 90)
 * @param {number} longitude - Longitude coordinate (-180 to 180)
 * @returns {Promise<Object>} Ward information or NOT_FOUND status
 */
async function getWardFromCoordinates(latitude, longitude) {
  try {
    // 1. Validate latitude and longitude
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      throw new Error('Invalid latitude: must be between -90 and 90');
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      throw new Error('Invalid longitude: must be between -180 and 180');
    }

    // 2. Query the database using $geoIntersects
    const matchingWard = await Ward.findOne({
      isActive: true,
      boundary: {
        $geoIntersects: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat] // IMPORTANT: GeoJSON is [longitude, latitude]
          }
        }
      }
    });

    // 3. Handle result
    if (matchingWard) {
      return {
        wardNumber: matchingWard.wardNumber,
        wardName: matchingWard.wardName,
        city: matchingWard.city || 'Rajkot',
        detectionMethod: 'GPS',
        status: 'DETECTED'
      };
    } else {
      return {
        wardNumber: null,
        wardName: null,
        city: 'Rajkot',
        detectionMethod: 'GPS',
        status: 'WARD_NOT_FOUND'
      };
    }
  } catch (error) {
    console.error('Error in getWardFromCoordinates:', error.message);
    throw error;
  }
}

module.exports = {
  getWardFromCoordinates
};

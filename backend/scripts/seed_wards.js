const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
const Ward = require('../models/Ward');
const Supervisor = require('../models/Supervisor');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const GRID_COLS = 6;
const START_LAT = 22.35;
const START_LNG = 70.75;
const STEP = 0.02; 

async function seedDemoData() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/civora';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    let wardCount = 0;
    let supervisorCount = 0;

    const defaultPassword = await bcrypt.hash('Demo@123', 10);

    for (let i = 1; i <= 18; i++) {
      const wardNumber = i;
      const wardName = `Ward ${i}`;

      const row = Math.floor((i - 1) / GRID_COLS);
      const col = (i - 1) % GRID_COLS;

      const minLng = START_LNG + (col * STEP);
      const maxLng = minLng + (STEP * 0.95); 
      const minLat = START_LAT - (row * STEP);
      const maxLat = minLat - (STEP * 0.95); 

      const polygonCoords = [[
        [minLng, minLat],
        [maxLng, minLat],
        [maxLng, maxLat],
        [minLng, maxLat],
        [minLng, minLat]
      ]];

      const updateData = {
        wardName: wardName,
        city: 'Rajkot',
        boundary: {
          type: 'Polygon',
          coordinates: polygonCoords
        },
        boundarySource: 'DEMO_TEST_ONLY',
        source: 'Rajkot Municipal Corporation',
        isActive: true,
        isDemo: true
      };

      await Ward.updateOne(
        { wardNumber: wardNumber, city: 'Rajkot' },
        { $set: updateData },
        { upsert: true }
      );
      wardCount++;

      const supervisorEmail = `demo.supervisor${i}@civora.test`;
      const supervisorUpdateData = {
        fullName: `Demo Supervisor ${i}`,
        password: defaultPassword,
        department: 'General',
        city: 'Rajkot',
        wardNumber: wardNumber.toString(),
        isActive: true,
        isDemo: true,
        role: 'supervisor'
      };

      await Supervisor.updateOne(
        { email: supervisorEmail },
        { $set: supervisorUpdateData },
        { upsert: true }
      );
      supervisorCount++;
    }

    console.log(`Successfully processed/upserted ${wardCount} demo wards.`);
    console.log(`Successfully processed/upserted ${supervisorCount} demo supervisors.`);
    
    const countW = await Ward.countDocuments({ isDemo: true });
    console.log(`Total demo wards in DB: ${countW}`);

    const countS = await Supervisor.countDocuments({ isDemo: true });
    console.log(`Total demo supervisors in DB: ${countS}`);

    // Ensure 2dsphere index is created
    await Ward.syncIndexes();

    process.exit(0);

  } catch (error) {
    console.error('Error during demo seed:', error);
    process.exit(1);
  }
}

seedDemoData();

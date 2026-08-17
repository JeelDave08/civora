const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const Admin = require('./models/Admin');
const Department = require('./models/Department');

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for seeding...');

    // ============ Seed Default Admin ============
    const adminEmail = 'admin@admin.civora.com';
    const existingAdmin = await Admin.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('✓ Default admin already exists:', adminEmail);
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Admin@123', salt);

      const admin = new Admin({
        fullName: 'Civora Admin',
        email: adminEmail,
        password: hashedPassword,
        department: 'General Administration',
        permissions: ['all'],
        isActive: true
      });

      await admin.save();
      console.log('✓ Default admin created:');
      console.log('  Email:    admin@admin.civora.com');
      console.log('  Password: Admin@123');
      console.log('  ⚠ Change this password after first login!');
    }

    // ============ Seed Default Departments ============
    const defaultDepartments = [
      { name: 'Roads & Transport', status: 'Active', description: 'Road maintenance, traffic signals, and public transport', icon: 'Car', color: 'text-blue-500' },
      { name: 'Water Supply', status: 'Active', description: 'Water distribution, pipelines, and water treatment', icon: 'Droplets', color: 'text-cyan-500' },
      { name: 'Electricity', status: 'Active', description: 'Power grid, street lighting, and electrical infrastructure', icon: 'Zap', color: 'text-amber-500' },
      { name: 'Waste Management', status: 'Active', description: 'Garbage collection, recycling, and waste disposal', icon: 'Trash2', color: 'text-emerald-500' },
      { name: 'Public Safety', status: 'Active', description: 'Emergency services, surveillance, and safety infrastructure', icon: 'ShieldCheck', color: 'text-purple-500' },
      { name: 'Parks & Recreation', status: 'Active', description: 'Public parks, gardens, and recreational facilities', icon: 'Trees', color: 'text-green-500' },
    ];

    for (const dept of defaultDepartments) {
      const exists = await Department.findOne({ name: dept.name });
      if (!exists) {
        await new Department(dept).save();
        console.log(`✓ Department created: ${dept.name}`);
      } else {
        console.log(`✓ Department already exists: ${dept.name}`);
      }
    }

    console.log('\n✅ Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seedAdmin();

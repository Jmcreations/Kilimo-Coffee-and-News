const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const email = (process.env.ADMIN_EMAIL || 'admin@kilimocoffee.co.ke').toLowerCase();
    const password = process.env.ADMIN_PASSWORD || 'KilimoAdmin@2026';

    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`Admin user already exists: ${email}`);
      process.exit(0);
    }

    await User.create({
      name: 'Kilimo Super Admin',
      email,
      password,
      role: 'admin',
      phone: '+254700000000'
    });

    console.log(`Created initial Admin account -> Email: ${email} | Password: ${password}`);
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed admin:', err);
    process.exit(1);
  }
}

seedAdmin();

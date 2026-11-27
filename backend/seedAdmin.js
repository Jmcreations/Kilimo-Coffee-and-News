const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function bootstrapSuperAdmin() {
  const email = (process.env.SUPER_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD || '';
  const name = (process.env.SUPER_ADMIN_NAME || 'Justin').trim();

  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is missing in environment variables.');
    process.exit(1);
  }

  if (!email || !password || password.length < 8) {
    console.error(
      'Set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD (at least 8 characters) in your .env or Northflank environment before running this script.'
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    const hashedPassword = await bcrypt.hash(password, 10);

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      existingUser.name = name;
      existingUser.password = hashedPassword;
      existingUser.role = 'super_admin';
      await existingUser.save();
      console.log(`Updated existing account (${email}) to super_admin.`);
    } else {
      await User.create({
        name,
        email,
        password: hashedPassword,
        authProvider: 'local',
        role: 'super_admin'
      });
      console.log(`Created super_admin account for ${email}.`);
    }
  } catch (err) {
    console.error('Failed to bootstrap super_admin:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

bootstrapSuperAdmin();

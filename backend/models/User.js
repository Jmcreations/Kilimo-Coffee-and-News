const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, trim: true, default: '' },
    lastName: { type: String, trim: true, default: '' },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, default: '' },
    password: { type: String, default: '' },
    authProvider: {
      type: String,
      enum: ['local', 'google', 'microsoft', 'apple'],
      default: 'local'
    },
    role: {
      type: String,
      trim: true,
      default: 'client'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);

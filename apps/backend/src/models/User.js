const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pinCode: { type: String, required: true },
  phone: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
}, { _id: true });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
    default: null,
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    required: true,
    default: 'local',
  },
  providerId: {
    type: String,
    default: null,
  },
  avatarUrl: {
    type: String,
    default: null,
  },
  addresses: [addressSchema],
}, {
  timestamps: true,
});

module.exports = mongoose.model('User', userSchema);

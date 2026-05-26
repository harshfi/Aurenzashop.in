const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    minlength: 3,
    maxlength: 32,
  },
  type: {
    type: String,
    enum: ['percent', 'flat'],
    required: true,
  },
  value: {
    type: Number,
    required: true,
    min: 0,
  },
  minOrderAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  maxDiscountAmount: {
    type: Number,
    default: null,
    min: 0,
  },
  startsAt: {
    type: Date,
    default: null,
  },
  endsAt: {
    type: Date,
    default: null,
  },
  usageLimit: {
    type: Number,
    default: null,
    min: 1,
  },
  usagePerUser: {
    type: Number,
    default: null,
    min: 1,
  },
  usedCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  applicableCategories: [{
    type: String,
    trim: true,
  }],
  applicableBrands: [{
    type: String,
    trim: true,
  }],
  description: {
    type: String,
    default: '',
    trim: true,
  },
}, {
  timestamps: true,
});

couponSchema.index({ isActive: 1, startsAt: 1, endsAt: 1 });

module.exports = mongoose.model('Coupon', couponSchema);

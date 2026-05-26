const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
  description: { type: String, default: '', trim: true },
  bannerImage: { type: String, default: '', trim: true },
  tags: [{ type: String, trim: true }],
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 },
}, { timestamps: true });

collectionSchema.index({ isActive: 1, isFeatured: 1, displayOrder: 1 });

module.exports = mongoose.model('Collection', collectionSchema);

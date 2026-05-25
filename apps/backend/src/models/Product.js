const mongoose = require('mongoose');
const { CATEGORY_LIST } = require('@aurenza/shared');

const variantSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    trim: true,
  },
  sizeOrDimension: {
    type: String,
    required: [true, 'Size or dimension is required'],
    trim: true,
  },
  color: {
    type: String,
    trim: true,
    default: null,
  },
  additionalPrice: {
    type: Number,
    default: 0,
    min: 0,
  },
  stockCount: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
}, { _id: true });

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    trim: true,
    default: '',
  },
  date: {
    type: Date,
    default: Date.now,
  },
}, { _id: true });

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Product title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
  },
  basePrice: {
    type: Number,
    required: [true, 'Base price is required'],
    min: [0, 'Price cannot be negative'],
  },
  category: {
    type: String,
    enum: {
      values: CATEGORY_LIST,
      message: '{VALUE} is not a valid category',
    },
    required: [true, 'Category is required'],
  },
  images: [{
    type: String, // Cloudinary URLs
  }],
  variants: [variantSchema],
  ratings: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0, min: 0 },
  },
  reviews: [reviewSchema],
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Text index for search
productSchema.index({ title: 'text', description: 'text' });
// Category index for filtering
productSchema.index({ category: 1 });
// Composite index for listing queries
productSchema.index({ isActive: 1, createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);

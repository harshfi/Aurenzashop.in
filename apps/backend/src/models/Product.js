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
  reorderThreshold: {
    type: Number,
    min: 0,
    default: 5,
  },
  stockStatus: {
    type: String,
    enum: ['in-stock', 'low-stock', 'out-of-stock'],
    default: 'in-stock',
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
  slug: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    sparse: true,
  },
  shortDescription: {
    type: String,
    trim: true,
    default: '',
    maxlength: 220,
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
  },
  brand: {
    type: String,
    required: [true, 'Brand is required'],
    trim: true,
    default: 'Aurenza',
    enum: ['Aurenza'],
  },
  basePrice: {
    type: Number,
    required: [true, 'Base price is required'],
    min: [0, 'Price cannot be negative'],
  },
  compareAtPrice: {
    type: Number,
    min: [0, 'Compare-at price cannot be negative'],
    default: null,
  },
  discountPercentage: {
    type: Number,
    min: 0,
    max: 99,
    default: 0,
  },
  category: {
    type: String,
    enum: {
      values: CATEGORY_LIST,
      message: '{VALUE} is not a valid category',
    },
    required: [true, 'Category is required'],
  },
  subcategory: {
    type: String,
    trim: true,
    default: '',
  },
  collection: {
    type: String,
    trim: true,
    default: '',
  },
  material: {
    type: String,
    trim: true,
    default: '',
  },
  season: {
    type: String,
    trim: true,
    default: '',
  },
  gender: {
    type: String,
    enum: ['men', 'women', 'unisex', 'kids'],
    default: 'unisex',
  },
  tags: [{
    type: String,
    trim: true,
  }],
  images: [{
    type: String,
  }],
  imageFolder: {
    type: String,
    default: '',
    trim: true,
  },
  mainImage: {
    type: String,
    default: '',
    trim: true,
  },
  hoverImage: {
    type: String,
    default: '',
    trim: true,
  },
  galleryImages: [{
    type: String,
  }],
  variants: [variantSchema],
  totalStock: {
    type: Number,
    min: 0,
    default: 0,
  },
  inventoryStatus: {
    type: String,
    enum: ['in-stock', 'low-stock', 'out-of-stock'],
    default: 'in-stock',
  },
  reorderThreshold: {
    type: Number,
    min: 0,
    default: 10,
  },
  sku: {
    type: String,
    trim: true,
    default: '',
    index: true,
  },
  taxIncluded: {
    type: Boolean,
    default: true,
  },
  attributes: {
    fabric: { type: String, default: '', trim: true },
    fit: { type: String, default: '', trim: true },
    workType: { type: String, default: '', trim: true },
    embroideryDetails: { type: String, default: '', trim: true },
    occasion: { type: String, default: '', trim: true },
    sleeveType: { type: String, default: '', trim: true },
    neckline: { type: String, default: '', trim: true },
    washCare: { type: String, default: '', trim: true },
    countryOfOrigin: { type: String, default: 'India', trim: true },
  },
  seo: {
    metaTitle: { type: String, default: '', trim: true },
    metaDescription: { type: String, default: '', trim: true },
    keywords: [{ type: String, trim: true }],
  },
  ratings: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0, min: 0 },
  },
  reviews: [reviewSchema],
  featured: {
    type: Boolean,
    default: false,
  },
  trending: {
    type: Boolean,
    default: false,
  },
  bestseller: {
    type: Boolean,
    default: false,
  },
  newArrival: {
    type: Boolean,
    default: false,
  },
  festiveSpecial: {
    type: Boolean,
    default: false,
  },
  editorPick: {
    type: Boolean,
    default: false,
  },
  productStatus: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'active',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
  suppressReservedKeysWarning: true,
});

const slugify = (value = '') => String(value)
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 120);

productSchema.pre('validate', function setSlugAndAvailability(next) {
  if (!this.slug && this.title) {
    this.slug = slugify(this.title);
  }

  this.brand = 'Aurenza';
  this.sku = this.sku || this.variants?.[0]?.sku || '';
  this.mainImage = this.mainImage || this.images?.[0] || '';
  this.galleryImages = (this.galleryImages && this.galleryImages.length ? this.galleryImages : this.images || []).slice(0, 8);
  this.hoverImage = this.hoverImage || this.galleryImages?.[1] || this.mainImage || '';

  const totalStock = (this.variants || []).reduce((sum, variant) => sum + Number(variant.stockCount || 0), 0);
  this.totalStock = totalStock;

  const lowStockThreshold = Number(this.reorderThreshold || 10);
  if (totalStock <= 0) this.inventoryStatus = 'out-of-stock';
  else if (totalStock <= lowStockThreshold) this.inventoryStatus = 'low-stock';
  else this.inventoryStatus = 'in-stock';

  (this.variants || []).forEach((variant) => {
    const threshold = Number(variant.reorderThreshold ?? 5);
    if (variant.stockCount <= 0) variant.stockStatus = 'out-of-stock';
    else if (variant.stockCount <= threshold) variant.stockStatus = 'low-stock';
    else variant.stockStatus = 'in-stock';
  });

  if (this.compareAtPrice && this.compareAtPrice > this.basePrice) {
    this.discountPercentage = Math.round(((this.compareAtPrice - this.basePrice) / this.compareAtPrice) * 100);
  } else {
    this.discountPercentage = 0;
  }
  this.isActive = this.productStatus === 'active';

  if (!this.seo?.metaTitle) {
    this.seo = this.seo || {};
    this.seo.metaTitle = `${this.title} | Aurenza`;
  }
  if (!this.seo?.metaDescription) {
    this.seo = this.seo || {};
    this.seo.metaDescription = this.shortDescription || this.description?.slice(0, 150) || '';
  }
  next();
});

productSchema.index({ title: 'text', description: 'text', brand: 'text', tags: 'text' });
productSchema.index({ category: 1, subcategory: 1, collection: 1 });
productSchema.index({ featured: 1, createdAt: -1 });
productSchema.index({ bestseller: 1, newArrival: 1, createdAt: -1 });
productSchema.index({ productStatus: 1, createdAt: -1 });
productSchema.index({ isActive: 1, category: 1, createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);

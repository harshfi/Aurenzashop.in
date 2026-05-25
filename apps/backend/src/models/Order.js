const mongoose = require('mongoose');
const {
  ORDER_STATUS_LIST,
  PAYMENT_STATUS_LIST,
  PAYMENT_METHOD_LIST,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
} = require('@aurenza/shared');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  variantSku: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  priceAtPurchase: {
    type: Number,
    required: true,
    min: 0,
  },
  // Snapshot fields for historical accuracy
  productTitle: { type: String },
  productImage: { type: String },
  variantLabel: { type: String },
}, { _id: false });

const shippingAddressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pinCode: { type: String, required: true },
  phone: { type: String, required: true },
}, { _id: false });

const trackingEntrySchema = new mongoose.Schema({
  status: { type: String, required: true },
  location: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: {
    type: [orderItemSchema],
    required: true,
    validate: {
      validator: (v) => v.length > 0,
      message: 'Order must have at least one item',
    },
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  paymentMethod: {
    type: String,
    enum: PAYMENT_METHOD_LIST,
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: PAYMENT_STATUS_LIST,
    default: PAYMENT_STATUSES.PENDING,
  },
  orderStatus: {
    type: String,
    enum: ORDER_STATUS_LIST,
    default: ORDER_STATUSES.PLACED,
  },
  shippingAddress: {
    type: shippingAddressSchema,
    required: true,
  },
  razorpayOrderId: {
    type: String,
    default: null,
  },
  razorpayPaymentId: {
    type: String,
    default: null,
  },
  delhiveryAWB: {
    type: String,
    default: null,
  },
  trackingHistory: [trackingEntrySchema],
}, {
  timestamps: true,
});

// Indexes for common queries
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ razorpayOrderId: 1 });
orderSchema.index({ delhiveryAWB: 1 });

module.exports = mongoose.model('Order', orderSchema);

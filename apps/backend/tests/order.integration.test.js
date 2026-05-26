const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongo;
let app;
let Admin;
let Product;
let Coupon;
let Order;
let adminAgent;
let product;
let constrainedProduct;

const buildShippingAddress = () => ({
  street: '221B Baker Street',
  city: 'Mumbai',
  state: 'Maharashtra',
  pinCode: '400001',
  phone: '9876543210',
});

const buildCustomer = () => ({
  name: 'Test Buyer',
  email: `buyer-${Date.now()}@example.com`,
  phone: '9876543210',
});

test.before(async () => {
  mongo = await MongoMemoryServer.create();

  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = mongo.getUri();
  process.env.ADMIN_JWT_SECRET = 'test-admin-jwt-secret';
  process.env.AUTH_SECRET = 'test-auth-secret';
  process.env.NEXTAUTH_SECRET = 'test-nextauth-secret';
  process.env.COUPON_RULES = '';

  app = require('../src/index');
  Admin = require('../src/models/Admin');
  Product = require('../src/models/Product');
  Coupon = require('../src/models/Coupon');
  Order = require('../src/models/Order');

  await mongoose.connection.asPromise();

  await Admin.create({
    name: 'Test Admin',
    email: 'admin@test.com',
    password: 'Secure@123',
  });

  product = await Product.create({
    title: 'Integration Test Shirt',
    description: 'Premium shirt for integration tests.',
    brand: 'Aurenza',
    basePrice: 2000,
    compareAtPrice: 2500,
    category: 'ethnic-wear',
    images: ['https://example.com/shirt.jpg'],
    variants: [
      {
        sku: 'TEST-SHIRT-M-BLK',
        sizeOrDimension: 'M',
        color: 'Black',
        additionalPrice: 0,
        stockCount: 10,
      },
    ],
    ratings: { average: 4.5, count: 10 },
  });

  constrainedProduct = await Product.create({
    title: 'Limited Stock Sneaker',
    description: 'Single stock sneaker for race test.',
    brand: 'Aurenza',
    basePrice: 5000,
    category: 'gowns',
    images: ['https://example.com/shoe.jpg'],
    variants: [
      {
        sku: 'RACE-SHOE-42-WHT',
        sizeOrDimension: '42',
        color: 'White',
        additionalPrice: 0,
        stockCount: 1,
      },
    ],
    ratings: { average: 4.7, count: 5 },
  });

  adminAgent = request.agent(app);
  const loginRes = await adminAgent.post('/api/auth/admin/login').send({
    email: 'admin@test.com',
    password: 'Secure@123',
  });

  assert.equal(loginRes.status, 200);
});

test.after(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

test('admin can create coupon and customer can validate + apply it to order', async () => {
  const createCouponRes = await adminAgent.post('/api/coupons/admin').send({
    code: 'WELCOME20',
    type: 'percent',
    value: 20,
    minOrderAmount: 1000,
    usageLimit: 100,
    usagePerUser: 2,
    isActive: true,
    applicableCategories: ['ethnic-wear'],
    applicableBrands: ['Aurenza'],
    description: 'Introductory 20% off',
  });

  assert.equal(createCouponRes.status, 201);

  const validateRes = await request(app).post('/api/orders/coupon/validate').send({
    couponCode: 'WELCOME20',
    subTotalAmount: 2000,
    items: [{ category: 'ethnic-wear', brand: 'Aurenza' }],
  });

  assert.equal(validateRes.status, 200);
  assert.equal(validateRes.body.discountAmount, 400);

  const payload = {
    items: [{ productId: product._id.toString(), variantSku: 'TEST-SHIRT-M-BLK', quantity: 1 }],
    paymentMethod: 'cod',
    customer: buildCustomer(),
    shippingAddress: buildShippingAddress(),
    couponCode: 'WELCOME20',
  };

  const idempotencyKey = 'idem-test-order-1';

  const firstOrderRes = await request(app)
    .post('/api/orders')
    .set('x-idempotency-key', idempotencyKey)
    .send(payload);

  assert.equal(firstOrderRes.status, 201);
  assert.equal(firstOrderRes.body.order.subTotalAmount, 2000);
  assert.equal(firstOrderRes.body.order.discountAmount, 400);
  assert.equal(firstOrderRes.body.order.totalAmount, 1600);
  assert.equal(firstOrderRes.body.order.couponCode, 'WELCOME20');

  const secondOrderRes = await request(app)
    .post('/api/orders')
    .set('x-idempotency-key', idempotencyKey)
    .send(payload);

  assert.equal(secondOrderRes.status, 200);
  assert.equal(secondOrderRes.body.reused, true);
  assert.equal(secondOrderRes.body.order._id, firstOrderRes.body.order._id);

  const refreshedProduct = await Product.findById(product._id).lean();
  assert.equal(refreshedProduct.variants[0].stockCount, 9);

  const coupon = await Coupon.findOne({ code: 'WELCOME20' }).lean();
  assert.equal(coupon.usedCount, 1);
});

test('cancel transitions are strict and restore inventory', async () => {
  const order = await Order.findOne({ couponCode: 'WELCOME20' });
  assert.ok(order);

  const cancelRes = await adminAgent
    .put(`/api/orders/admin/${order._id}/status`)
    .send({ status: 'cancelled', reason: 'Customer requested cancellation', location: 'Admin Desk' });

  assert.equal(cancelRes.status, 200);
  assert.equal(cancelRes.body.order.orderStatus, 'cancelled');

  const stockAfterCancel = await Product.findById(product._id).lean();
  assert.equal(stockAfterCancel.variants[0].stockCount, 10);

  const invalidTransitionRes = await adminAgent
    .put(`/api/orders/admin/${order._id}/status`)
    .send({ status: 'shipped', reason: 'Should fail' });

  assert.equal(invalidTransitionRes.status, 400);
});

test('refund endpoint marks paid order refunded and writes audit events', async () => {
  const paidOrder = await Order.create({
    user: new mongoose.Types.ObjectId(),
    items: [{
      product: product._id,
      variantSku: 'TEST-SHIRT-M-BLK',
      quantity: 1,
      priceAtPurchase: 2000,
      productTitle: 'Integration Test Shirt',
      productImage: 'https://example.com/shirt.jpg',
      variantLabel: 'M / Black',
    }],
    subTotalAmount: 2000,
    discountAmount: 0,
    totalAmount: 2000,
    paymentMethod: 'cod',
    paymentStatus: 'paid',
    orderStatus: 'processing',
    shippingAddress: buildShippingAddress(),
    trackingHistory: [{ status: 'Order Placed', location: 'Online', timestamp: new Date() }],
  });

  const refundRes = await adminAgent
    .put(`/api/orders/admin/${paidOrder._id}/refund`)
    .send({ amount: 2000, reason: 'Quality issue' });

  assert.equal(refundRes.status, 200);
  assert.equal(refundRes.body.order.refundStatus, 'refunded');
  assert.equal(refundRes.body.order.paymentStatus, 'refunded');

  const updatedOrder = await Order.findById(paidOrder._id).lean();
  const refundEvent = updatedOrder.lifecycleEvents.find((event) => event.action === 'ORDER_REFUNDED');
  assert.ok(refundEvent);
});

test('race condition protection: stock does not go below zero', async () => {
  const payloadA = {
    items: [{ productId: constrainedProduct._id.toString(), variantSku: 'RACE-SHOE-42-WHT', quantity: 1 }],
    paymentMethod: 'cod',
    customer: { ...buildCustomer(), email: 'racer-a@example.com' },
    shippingAddress: buildShippingAddress(),
  };

  const payloadB = {
    items: [{ productId: constrainedProduct._id.toString(), variantSku: 'RACE-SHOE-42-WHT', quantity: 1 }],
    paymentMethod: 'cod',
    customer: { ...buildCustomer(), email: 'racer-b@example.com' },
    shippingAddress: buildShippingAddress(),
  };

  const [resA, resB] = await Promise.all([
    request(app).post('/api/orders').set('x-idempotency-key', 'race-a').send(payloadA),
    request(app).post('/api/orders').set('x-idempotency-key', 'race-b').send(payloadB),
  ]);

  const statuses = [resA.status, resB.status].sort();
  assert.deepEqual(statuses, [201, 400]);

  const constrained = await Product.findById(constrainedProduct._id).lean();
  assert.ok(constrained.variants[0].stockCount >= 0);
  assert.equal(constrained.variants[0].stockCount, 0);
});

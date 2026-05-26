const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const adminAuth = require('../middlewares/adminAuth');
const buyerAuth = require('../middlewares/buyerAuth');

// Buyer routes
router.post('/', orderController.createOrder);
router.post('/verify-payment', orderController.verifyPayment);
router.post('/coupon/validate', orderController.validateCoupon);
router.get('/my-orders', buyerAuth, orderController.getMyOrders);
router.get('/detail/:id', buyerAuth, orderController.getOrder);
router.get('/internal/by-email', orderController.getOrdersByEmailInternal);

// Admin routes
router.get('/admin/all', adminAuth, orderController.getAllOrders);
router.get('/admin/stats', adminAuth, orderController.getDashboardStats);
router.put('/admin/:id/pack', adminAuth, orderController.packOrder);
router.put('/admin/:id/status', adminAuth, orderController.updateOrderStatus);
router.put('/admin/:id/refund', adminAuth, orderController.refundOrder);

// Webhooks (no auth — verified by signature)
router.post('/webhooks/razorpay', orderController.razorpayWebhook);
router.post('/webhooks/delhivery', orderController.delhiveryWebhook);

module.exports = router;

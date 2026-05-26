const express = require('express');
const router = express.Router();
const adminAuth = require('../middlewares/adminAuth');
const customerController = require('../controllers/customerController');

router.get('/admin/all', adminAuth, customerController.listCustomers);
router.get('/admin/analytics', adminAuth, customerController.getCustomerAnalytics);
router.get('/admin/:id', adminAuth, customerController.getCustomerProfile);

module.exports = router;

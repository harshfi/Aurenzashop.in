const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const adminAuth = require('../middlewares/adminAuth');
const buyerAuth = require('../middlewares/buyerAuth');

// Admin auth routes
router.post('/admin/login', authController.adminLogin);
router.post('/admin/logout', authController.adminLogout);
router.get('/admin/me', adminAuth, authController.getAdminProfile);

// Buyer auth routes
router.post('/buyer/register', authController.registerBuyer);
router.post('/buyer/login', authController.loginBuyer);
router.get('/buyer/me', buyerAuth, authController.getBuyerProfile);
router.put('/buyer/profile', buyerAuth, authController.updateBuyerProfile);

module.exports = router;

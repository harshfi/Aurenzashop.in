const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const adminAuth = require('../middlewares/adminAuth');
const buyerAuth = require('../middlewares/buyerAuth');
const { authLimiter } = require('../middlewares/rateLimit');

// Admin auth routes
router.post('/admin/login', authLimiter, authController.adminLogin);
router.post('/admin/logout', authController.adminLogout);
router.get('/admin/me', adminAuth, authController.getAdminProfile);

// Buyer auth routes
router.get('/buyer/google', buyerAuth, authController.verifyBuyerGoogleSession);
router.get('/buyer/me', buyerAuth, authController.getBuyerProfile);
router.put('/buyer/profile', buyerAuth, authController.updateBuyerProfile);
router.get('/internal/buyer', authController.getBuyerProfileByEmailInternal);
router.put('/internal/buyer', authController.updateBuyerProfileByEmailInternal);

module.exports = router;

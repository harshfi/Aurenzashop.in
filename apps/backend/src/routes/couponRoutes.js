const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const adminAuth = require('../middlewares/adminAuth');

router.get('/admin/all', adminAuth, couponController.listCoupons);
router.post('/admin', adminAuth, couponController.createCoupon);
router.put('/admin/:id', adminAuth, couponController.updateCoupon);
router.delete('/admin/:id', adminAuth, couponController.deleteCoupon);

module.exports = router;

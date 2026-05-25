const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const adminAuth = require('../middlewares/adminAuth');
const buyerAuth = require('../middlewares/buyerAuth');
const upload = require('../middlewares/upload');

// Public routes
router.get('/', productController.listProducts);
router.get('/:id', productController.getProduct);

// Buyer routes
router.post('/:id/reviews', buyerAuth, productController.addReview);

// Admin routes (protected)
router.post('/', adminAuth, upload.array('images', 5), productController.createProduct);
router.put('/:id', adminAuth, upload.array('images', 5), productController.updateProduct);
router.delete('/:id', adminAuth, productController.deleteProduct);

module.exports = router;

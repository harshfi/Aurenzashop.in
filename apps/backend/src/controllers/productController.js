const Product = require('../models/Product');
const cloudinaryService = require('../services/cloudinaryService');

/**
 * List Products — GET /api/products
 * Public. Pagination, category filter, text search.
 */
const listProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      search,
      sort = '-createdAt',
      minPrice,
      maxPrice,
    } = req.query;

    const filter = { isActive: true };

    if (category) {
      filter.category = category;
    }

    if (search) {
      filter.$text = { $search: search };
    }

    if (minPrice || maxPrice) {
      filter.basePrice = {};
      if (minPrice) filter.basePrice.$gte = Number(minPrice);
      if (maxPrice) filter.basePrice.$lte = Number(maxPrice);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(filter)
        .select('-reviews')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Single Product — GET /api/products/:id
 * Public. Full product with reviews populated.
 */
const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('reviews.user', 'name avatarUrl');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create Product — POST /api/products
 * Admin only. Handles image upload to Cloudinary.
 */
const createProduct = async (req, res, next) => {
  try {
    const { title, description, basePrice, category, variants } = req.body;

    // Upload images to Cloudinary
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      const uploaded = await cloudinaryService.uploadMultiple(req.files, 'aurenza/products');
      imageUrls = uploaded.map((img) => img.url);
    }

    // Parse variants if sent as JSON string
    let parsedVariants = variants;
    if (typeof variants === 'string') {
      try {
        parsedVariants = JSON.parse(variants);
      } catch {
        return res.status(400).json({
          success: false,
          message: 'Invalid variants format.',
        });
      }
    }

    const product = await Product.create({
      title,
      description,
      basePrice: Number(basePrice),
      category,
      images: imageUrls,
      variants: parsedVariants || [],
    });

    res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Product — PUT /api/products/:id
 * Admin only. Handles image additions/removals.
 */
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    const { title, description, basePrice, category, variants, removeImages } = req.body;

    // Update fields
    if (title) product.title = title;
    if (description) product.description = description;
    if (basePrice) product.basePrice = Number(basePrice);
    if (category) product.category = category;

    // Parse variants
    if (variants) {
      product.variants = typeof variants === 'string' ? JSON.parse(variants) : variants;
    }

    // Remove specified images from Cloudinary
    if (removeImages) {
      const toRemove = typeof removeImages === 'string' ? JSON.parse(removeImages) : removeImages;
      for (const url of toRemove) {
        const publicId = cloudinaryService.getPublicIdFromUrl(url);
        if (publicId) await cloudinaryService.deleteImage(publicId);
      }
      product.images = product.images.filter((img) => !toRemove.includes(img));
    }

    // Upload new images
    if (req.files && req.files.length > 0) {
      const uploaded = await cloudinaryService.uploadMultiple(req.files, 'aurenza/products');
      product.images.push(...uploaded.map((img) => img.url));
    }

    await product.save();

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Product — DELETE /api/products/:id
 * Admin only. Deletes images from Cloudinary too.
 */
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    // Delete all images from Cloudinary
    for (const url of product.images) {
      const publicId = cloudinaryService.getPublicIdFromUrl(url);
      if (publicId) await cloudinaryService.deleteImage(publicId);
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Product deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add Review — POST /api/products/:id/reviews
 * Buyer only.
 */
const addReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5.',
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    // Check if user already reviewed
    const existingReview = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product.',
      });
    }

    product.reviews.push({
      user: req.user._id,
      rating: Number(rating),
      comment: comment || '',
      date: new Date(),
    });

    // Recalculate ratings
    const totalRatings = product.reviews.length;
    const sumRatings = product.reviews.reduce((sum, r) => sum + r.rating, 0);
    product.ratings = {
      average: Math.round((sumRatings / totalRatings) * 10) / 10,
      count: totalRatings,
    };

    await product.save();

    // Return populated review
    await product.populate('reviews.user', 'name avatarUrl');

    res.status(201).json({
      success: true,
      reviews: product.reviews,
      ratings: product.ratings,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  addReview,
};

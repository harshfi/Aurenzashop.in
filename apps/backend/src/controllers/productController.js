const Product = require('../models/Product');
const cloudinaryService = require('../services/cloudinaryService');

const parseListParam = (value) => {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseBool = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const normalized = String(value).toLowerCase();
  if (normalized === 'true' || normalized === '1') return true;
  if (normalized === 'false' || normalized === '0') return false;
  return null;
};

const slugify = (value = '') => String(value)
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 120);

const normalizeProductMedia = (product = {}) => {
  const merged = [
    ...(Array.isArray(product.images) ? product.images : []),
    ...(Array.isArray(product.galleryImages) ? product.galleryImages : []),
    product.mainImage || '',
    product.hoverImage || '',
  ].filter(Boolean);

  const uniqueImages = [...new Set(merged)];

  return {
    ...product,
    images: uniqueImages,
    galleryImages: uniqueImages,
    mainImage: uniqueImages[0] || '',
    hoverImage: uniqueImages[1] || uniqueImages[0] || '',
  };
};

const normalizeVariants = (variants = []) => {
  if (!Array.isArray(variants) || variants.length === 0) {
    throw Object.assign(new Error('At least one variant is required.'), { statusCode: 400 });
  }

  return variants.map((variant, index) => {
    const sku = String(variant.sku || '').trim();
    const sizeOrDimension = String(variant.sizeOrDimension || '').trim();

    if (!sku || !sizeOrDimension) {
      throw Object.assign(new Error(`Variant #${index + 1} requires both SKU and size.`), { statusCode: 400 });
    }

    const stockCount = Number(variant.stockCount ?? 0);
    const additionalPrice = Number(variant.additionalPrice ?? 0);

    if (!Number.isFinite(stockCount) || stockCount < 0) {
      throw Object.assign(new Error(`Variant #${index + 1} has invalid stock.`), { statusCode: 400 });
    }

    if (!Number.isFinite(additionalPrice) || additionalPrice < 0) {
      throw Object.assign(new Error(`Variant #${index + 1} has invalid additional price.`), { statusCode: 400 });
    }

    return {
      sku,
      sizeOrDimension,
      color: variant.color ? String(variant.color).trim() : '',
      additionalPrice,
      stockCount,
    };
  });
};

const parseSort = (sort) => {
  switch (sort) {
    case 'newest': return '-createdAt';
    case 'price-asc': return { basePrice: 1, createdAt: -1 };
    case 'price-desc': return { basePrice: -1, createdAt: -1 };
    case 'popular': return { 'ratings.count': -1, 'ratings.average': -1, createdAt: -1 };
    case 'featured': return { featured: -1, bestseller: -1, newArrival: -1, createdAt: -1 };
    case 'bestseller': return { bestseller: -1, 'ratings.count': -1, createdAt: -1 };
    case 'discount': return { discountPercentage: -1, createdAt: -1 };
    default: return '-createdAt';
  }
};

const buildFilters = (query = {}, { adminMode = false } = {}) => {
  const {
    category,
    categories,
    search,
    minPrice,
    maxPrice,
    size,
    sizes,
    color,
    colors,
    inStock,
    minRating,
    featured,
    trending,
    bestseller,
    newArrival,
    subcategory,
    collection,
    material,
    tags,
    productStatus,
    ids,
  } = query;

  const filter = {
    brand: 'Aurenza',
  };

  if (!adminMode) {
    filter.isActive = true;
    filter.productStatus = 'active';
  } else if (productStatus) {
    filter.productStatus = String(productStatus).trim();
  }

  const categoryList = [...parseListParam(categories), ...parseListParam(category)];
  if (categoryList.length) {
    filter.category = { $in: [...new Set(categoryList)] };
  }

  const idList = parseListParam(ids);
  if (idList.length) {
    filter._id = { $in: idList };
  }

  if (search) {
    const safeSearch = String(search).trim();
    filter.$or = [
      { title: { $regex: safeSearch, $options: 'i' } },
      { shortDescription: { $regex: safeSearch, $options: 'i' } },
      { description: { $regex: safeSearch, $options: 'i' } },
      { tags: { $in: [new RegExp(safeSearch, 'i')] } },
      { collection: { $regex: safeSearch, $options: 'i' } },
    ];
  }

  if (minPrice || maxPrice) {
    filter.basePrice = {};
    if (minPrice && Number.isFinite(Number(minPrice))) filter.basePrice.$gte = Number(minPrice);
    if (maxPrice && Number.isFinite(Number(maxPrice))) filter.basePrice.$lte = Number(maxPrice);
    if (!Object.keys(filter.basePrice).length) delete filter.basePrice;
  }

  const sizeList = [...parseListParam(sizes), ...parseListParam(size)];
  const colorList = [...parseListParam(colors), ...parseListParam(color)];

  if (sizeList.length || colorList.length || inStock) {
    filter.variants = { $elemMatch: {} };
    if (sizeList.length) filter.variants.$elemMatch.sizeOrDimension = { $in: [...new Set(sizeList)] };
    if (colorList.length) filter.variants.$elemMatch.color = { $in: [...new Set(colorList)] };

    const hasStock = parseBool(inStock);
    if (hasStock === true) filter.variants.$elemMatch.stockCount = { $gt: 0 };

    if (!Object.keys(filter.variants.$elemMatch).length) {
      delete filter.variants;
    }
  }

  if (minRating && Number.isFinite(Number(minRating))) {
    filter['ratings.average'] = { $gte: Number(minRating) };
  }

  const featuredValue = parseBool(featured);
  if (featuredValue !== null) filter.featured = featuredValue;

  const trendingValue = parseBool(trending);
  if (trendingValue !== null) filter.trending = trendingValue;

  const bestsellerValue = parseBool(bestseller);
  if (bestsellerValue !== null) filter.bestseller = bestsellerValue;

  const newArrivalValue = parseBool(newArrival);
  if (newArrivalValue !== null) filter.newArrival = newArrivalValue;

  if (subcategory) filter.subcategory = String(subcategory).trim();
  if (collection) filter.collection = String(collection).trim();
  if (material) filter.material = String(material).trim();

  const tagList = parseListParam(tags);
  if (tagList.length) {
    filter.tags = { $in: tagList };
  }

  return filter;
};

const listProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      sort = 'featured',
    } = req.query;

    const filter = buildFilters(req.query);
    const parsedPage = Math.max(1, Number(page));
    const parsedLimit = Math.min(80, Math.max(1, Number(limit)));
    const skip = (parsedPage - 1) * parsedLimit;

    const [productsRaw, total] = await Promise.all([
      Product.find(filter)
        .select('-reviews')
        .sort(parseSort(sort))
        .skip(skip)
        .limit(parsedLimit)
        .lean(),
      Product.countDocuments(filter),
    ]);
    const products = productsRaw.map(normalizeProductMedia);

    res.json({
      success: true,
      products,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        pages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (error) {
    next(error);
  }
};

const adminListProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      sort = 'newest',
    } = req.query;

    const filter = buildFilters(req.query, { adminMode: true });
    const parsedPage = Math.max(1, Number(page));
    const parsedLimit = Math.min(120, Math.max(1, Number(limit)));
    const skip = (parsedPage - 1) * parsedLimit;

    const [productsRaw, total] = await Promise.all([
      Product.find(filter)
        .sort(parseSort(sort))
        .skip(skip)
        .limit(parsedLimit)
        .lean(),
      Product.countDocuments(filter),
    ]);
    const products = productsRaw.map(normalizeProductMedia);

    res.json({
      success: true,
      products,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        pages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getProductFacets = async (req, res, next) => {
  try {
    const filter = buildFilters(
      {
        ...req.query,
        minPrice: undefined,
        maxPrice: undefined,
        size: undefined,
        sizes: undefined,
        color: undefined,
        colors: undefined,
        category: undefined,
        categories: undefined,
        subcategory: undefined,
        collection: undefined,
        material: undefined,
        tags: undefined,
      },
      { adminMode: parseBool(req.query.admin) === true }
    );

    const [categoryValues, subcategoryValues, collectionValues, sizeValues, colorValues, materialValues, priceRange] = await Promise.all([
      Product.distinct('category', filter),
      Product.distinct('subcategory', filter),
      Product.distinct('collection', filter),
      Product.distinct('variants.sizeOrDimension', filter),
      Product.distinct('variants.color', filter),
      Product.distinct('material', filter),
      Product.aggregate([
        { $match: filter },
        { $group: { _id: null, min: { $min: '$basePrice' }, max: { $max: '$basePrice' } } },
      ]),
    ]);

    res.json({
      success: true,
      facets: {
        categories: categoryValues.filter(Boolean).sort(),
        subcategories: subcategoryValues.filter(Boolean).sort(),
        collections: collectionValues.filter(Boolean).sort(),
        sizes: sizeValues.filter(Boolean).sort(),
        colors: colorValues.filter(Boolean).sort(),
        materials: materialValues.filter(Boolean).sort(),
        price: {
          min: priceRange[0]?.min || 0,
          max: priceRange[0]?.max || 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const getProductSuggestions = async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) {
      return res.json({ success: true, suggestions: [] });
    }

    const suggestions = await Product.find({
      isActive: true,
      productStatus: 'active',
      brand: 'Aurenza',
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { collection: { $regex: q, $options: 'i' } },
        { subcategory: { $regex: q, $options: 'i' } },
      ],
    })
      .select('title category subcategory collection')
      .sort({ 'ratings.count': -1, createdAt: -1 })
      .limit(8)
      .lean();

    res.json({
      success: true,
      suggestions: suggestions.map((item) => ({
        id: item._id,
        title: item.title,
        category: item.category,
        subcategory: item.subcategory,
        collection: item.collection,
      })),
    });
  } catch (error) {
    next(error);
  }
};

const getProduct = async (req, res, next) => {
  try {
    const identifier = String(req.params.id || '').trim();
    const isObjectIdLike = /^[a-f\d]{24}$/i.test(identifier);
    const query = isObjectIdLike
      ? { $or: [{ _id: identifier }, { slug: identifier }] }
      : { slug: identifier };

    const productDoc = await Product.findOne(query)
      .populate('reviews.user', 'name avatarUrl');

    if (!productDoc) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    const product = normalizeProductMedia(productDoc.toObject());

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const {
      title,
      slug,
      shortDescription,
      description,
      basePrice,
      compareAtPrice,
      category,
      subcategory,
      collection,
      material,
      season,
      gender,
      featured,
      trending,
      bestseller,
      newArrival,
      festiveSpecial,
      editorPick,
      productStatus,
      imageFolder,
      hoverImage,
      taxIncluded,
      reorderThreshold,
      attributes,
      seo,
      tags,
      variants,
    } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ success: false, message: 'Title, description, and category are required.' });
    }

    if (!Number.isFinite(Number(basePrice)) || Number(basePrice) < 0) {
      return res.status(400).json({ success: false, message: 'A valid base price is required.' });
    }

    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      const uploaded = await cloudinaryService.uploadMultiple(req.files, 'aurenza/products');
      imageUrls = uploaded.map((img) => img.url);
    }

    let parsedVariants = variants;
    if (typeof variants === 'string') {
      try {
        parsedVariants = JSON.parse(variants);
      } catch {
        return res.status(400).json({ success: false, message: 'Invalid variants format.' });
      }
    }
    const normalizedVariants = normalizeVariants(parsedVariants || []);

    let parsedTags = tags;
    if (typeof tags === 'string') {
      parsedTags = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
    }

    let parsedAttributes = attributes;
    if (typeof attributes === 'string') {
      try {
        parsedAttributes = JSON.parse(attributes);
      } catch {
        return res.status(400).json({ success: false, message: 'Invalid attributes format.' });
      }
    }

    let parsedSeo = seo;
    if (typeof seo === 'string') {
      try {
        parsedSeo = JSON.parse(seo);
      } catch {
        return res.status(400).json({ success: false, message: 'Invalid seo format.' });
      }
    }

    const product = await Product.create({
      title,
      slug: slug ? slugify(slug) : slugify(title),
      shortDescription: shortDescription || '',
      description,
      brand: 'Aurenza',
      basePrice: Number(basePrice),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
      category,
      subcategory: subcategory || '',
      collection: collection || '',
      material: material || '',
      season: season || '',
      gender: gender || 'unisex',
      featured: parseBool(featured) ?? false,
      trending: parseBool(trending) ?? false,
      bestseller: parseBool(bestseller) ?? false,
      newArrival: parseBool(newArrival) ?? false,
      festiveSpecial: parseBool(festiveSpecial) ?? false,
      editorPick: parseBool(editorPick) ?? false,
      productStatus: productStatus || 'active',
      imageFolder: imageFolder || '',
      hoverImage: hoverImage || imageUrls[1] || imageUrls[0] || '',
      taxIncluded: parseBool(taxIncluded) ?? true,
      reorderThreshold: Number.isFinite(Number(reorderThreshold)) ? Number(reorderThreshold) : 10,
      attributes: parsedAttributes || {},
      seo: parsedSeo || {},
      tags: parsedTags || [],
      images: imageUrls,
      galleryImages: imageUrls,
      variants: normalizedVariants,
    });

    res.status(201).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const {
      title,
      slug,
      shortDescription,
      description,
      basePrice,
      compareAtPrice,
      category,
      subcategory,
      collection,
      material,
      season,
      gender,
      featured,
      trending,
      bestseller,
      newArrival,
      festiveSpecial,
      editorPick,
      productStatus,
      imageFolder,
      hoverImage,
      taxIncluded,
      reorderThreshold,
      attributes,
      seo,
      tags,
      variants,
      removeImages,
    } = req.body;

    if (title !== undefined) {
      product.title = title;
      if (!slug) {
        product.slug = slugify(title);
      }
    }
    if (slug !== undefined) product.slug = slugify(slug);
    if (shortDescription !== undefined) product.shortDescription = shortDescription;
    if (description !== undefined) product.description = description;
    product.brand = 'Aurenza';
    if (basePrice !== undefined) product.basePrice = Number(basePrice);
    if (compareAtPrice !== undefined) product.compareAtPrice = compareAtPrice ? Number(compareAtPrice) : null;
    if (category !== undefined) product.category = category;
    if (subcategory !== undefined) product.subcategory = subcategory;
    if (collection !== undefined) product.collection = collection;
    if (material !== undefined) product.material = material;
    if (season !== undefined) product.season = season;
    if (gender !== undefined) product.gender = gender;
    if (featured !== undefined) product.featured = parseBool(featured) ?? product.featured;
    if (trending !== undefined) product.trending = parseBool(trending) ?? product.trending;
    if (bestseller !== undefined) product.bestseller = parseBool(bestseller) ?? product.bestseller;
    if (newArrival !== undefined) product.newArrival = parseBool(newArrival) ?? product.newArrival;
    if (festiveSpecial !== undefined) product.festiveSpecial = parseBool(festiveSpecial) ?? product.festiveSpecial;
    if (editorPick !== undefined) product.editorPick = parseBool(editorPick) ?? product.editorPick;
    if (productStatus !== undefined) product.productStatus = productStatus;
    if (imageFolder !== undefined) product.imageFolder = imageFolder;
    if (hoverImage !== undefined) product.hoverImage = hoverImage;
    if (taxIncluded !== undefined) product.taxIncluded = parseBool(taxIncluded) ?? product.taxIncluded;
    if (reorderThreshold !== undefined) product.reorderThreshold = Number(reorderThreshold || 10);

    if (attributes !== undefined) {
      const parsedAttributes = typeof attributes === 'string' ? JSON.parse(attributes) : attributes;
      product.attributes = parsedAttributes || {};
    }

    if (seo !== undefined) {
      const parsedSeo = typeof seo === 'string' ? JSON.parse(seo) : seo;
      product.seo = parsedSeo || {};
    }

    if (tags !== undefined) {
      if (Array.isArray(tags)) {
        product.tags = tags;
      } else if (typeof tags === 'string') {
        product.tags = tags.split(',').map((tag) => tag.trim()).filter(Boolean);
      }
    }

    if (variants !== undefined) {
      const parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
      product.variants = normalizeVariants(parsedVariants || []);
    }

    if (removeImages) {
      const toRemove = typeof removeImages === 'string' ? JSON.parse(removeImages) : removeImages;
      for (const url of toRemove) {
        const publicId = cloudinaryService.getPublicIdFromUrl(url);
        if (publicId) await cloudinaryService.deleteImage(publicId);
      }
      product.images = product.images.filter((img) => !toRemove.includes(img));
    }

    if (req.files && req.files.length > 0) {
      const uploaded = await cloudinaryService.uploadMultiple(req.files, 'aurenza/products');
      product.images.push(...uploaded.map((img) => img.url));
      product.galleryImages = [...(product.galleryImages || []), ...uploaded.map((img) => img.url)];
    }

    await product.save();

    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    for (const url of product.images) {
      const publicId = cloudinaryService.getPublicIdFromUrl(url);
      if (publicId) await cloudinaryService.deleteImage(publicId);
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

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

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

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

    const totalRatings = product.reviews.length;
    const sumRatings = product.reviews.reduce((sum, r) => sum + r.rating, 0);
    product.ratings = {
      average: Math.round((sumRatings / totalRatings) * 10) / 10,
      count: totalRatings,
    };

    await product.save();
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
  adminListProducts,
  getProductFacets,
  getProductSuggestions,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  addReview,
};

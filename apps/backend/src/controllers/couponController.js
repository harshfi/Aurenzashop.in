const Coupon = require('../models/Coupon');

const normalizeCode = (code = '') => String(code).trim().toUpperCase();

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const listCoupons = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const skip = (page - 1) * limit;

    const search = String(req.query.search || '').trim();
    const status = req.query.status;

    const filter = {};
    if (search) {
      filter.code = { $regex: search, $options: 'i' };
    }
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;

    const [coupons, total] = await Promise.all([
      Coupon.find(filter).sort('-createdAt').skip(skip).limit(limit).lean(),
      Coupon.countDocuments(filter),
    ]);

    res.json({
      success: true,
      coupons,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

const createCoupon = async (req, res, next) => {
  try {
    const {
      code,
      type,
      value,
      minOrderAmount,
      maxDiscountAmount,
      startsAt,
      endsAt,
      usageLimit,
      usagePerUser,
      isActive,
      applicableCategories,
      applicableBrands,
      description,
    } = req.body;

    const normalizedCode = normalizeCode(code);
    if (!normalizedCode) {
      return res.status(400).json({ success: false, message: 'Coupon code is required.' });
    }

    const coupon = await Coupon.create({
      code: normalizedCode,
      type,
      value: Number(value),
      minOrderAmount: minOrderAmount ? Number(minOrderAmount) : 0,
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
      startsAt: parseDate(startsAt),
      endsAt: parseDate(endsAt),
      usageLimit: usageLimit ? Number(usageLimit) : null,
      usagePerUser: usagePerUser ? Number(usagePerUser) : null,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      applicableCategories: Array.isArray(applicableCategories) ? applicableCategories : [],
      applicableBrands: Array.isArray(applicableBrands) ? applicableBrands : [],
      description: description || '',
    });

    res.status(201).json({ success: true, coupon });
  } catch (error) {
    next(error);
  }
};

const updateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found.' });
    }

    const fields = [
      'type',
      'description',
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) coupon[field] = req.body[field];
    });

    if (req.body.code !== undefined) coupon.code = normalizeCode(req.body.code);
    if (req.body.value !== undefined) coupon.value = Number(req.body.value);
    if (req.body.minOrderAmount !== undefined) coupon.minOrderAmount = Number(req.body.minOrderAmount || 0);
    if (req.body.maxDiscountAmount !== undefined) coupon.maxDiscountAmount = req.body.maxDiscountAmount ? Number(req.body.maxDiscountAmount) : null;
    if (req.body.startsAt !== undefined) coupon.startsAt = parseDate(req.body.startsAt);
    if (req.body.endsAt !== undefined) coupon.endsAt = parseDate(req.body.endsAt);
    if (req.body.usageLimit !== undefined) coupon.usageLimit = req.body.usageLimit ? Number(req.body.usageLimit) : null;
    if (req.body.usagePerUser !== undefined) coupon.usagePerUser = req.body.usagePerUser ? Number(req.body.usagePerUser) : null;
    if (req.body.isActive !== undefined) coupon.isActive = Boolean(req.body.isActive);
    if (req.body.applicableCategories !== undefined) coupon.applicableCategories = Array.isArray(req.body.applicableCategories) ? req.body.applicableCategories : [];
    if (req.body.applicableBrands !== undefined) coupon.applicableBrands = Array.isArray(req.body.applicableBrands) ? req.body.applicableBrands : [];

    await coupon.save();

    res.json({ success: true, coupon });
  } catch (error) {
    next(error);
  }
};

const deleteCoupon = async (req, res, next) => {
  try {
    const deleted = await Coupon.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Coupon not found.' });
    }

    res.json({ success: true, message: 'Coupon deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
};

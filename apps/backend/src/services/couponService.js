const Coupon = require('../models/Coupon');
const Order = require('../models/Order');
const { PAYMENT_STATUSES } = require('@aurenza/shared');

const normalizeCouponCode = (couponCode = '') => String(couponCode).trim().toUpperCase();

const loadCouponByCode = async (couponCode) => {
  const code = normalizeCouponCode(couponCode);
  if (!code) return null;
  return Coupon.findOne({ code }).lean();
};

const fallbackCouponFromEnv = (couponCode) => {
  const code = normalizeCouponCode(couponCode);
  if (!code) return null;

  const rules = String(process.env.COUPON_RULES || '')
    .split(',')
    .map((rule) => rule.trim())
    .filter(Boolean)
    .map((rule) => {
      const [ruleCode, type, value] = rule.split(':');
      return {
        code: normalizeCouponCode(ruleCode),
        type: String(type || '').toLowerCase(),
        value: Number(value || 0),
      };
    })
    .filter((rule) => rule.code && Number.isFinite(rule.value));

  const matched = rules.find((rule) => rule.code === code);
  if (!matched) return null;

  return {
    code: matched.code,
    type: matched.type,
    value: matched.value,
    minOrderAmount: 0,
    maxDiscountAmount: null,
    startsAt: null,
    endsAt: null,
    usageLimit: null,
    usagePerUser: null,
    usedCount: 0,
    isActive: true,
    applicableCategories: [],
    applicableBrands: [],
  };
};

const validateCouponForOrder = async ({
  couponCode,
  subTotalAmount,
  userId,
  items = [],
}) => {
  const normalizedCode = normalizeCouponCode(couponCode);
  if (!normalizedCode) {
    return { valid: false, reason: 'Coupon code is required.' };
  }

  const coupon = await loadCouponByCode(normalizedCode) || fallbackCouponFromEnv(normalizedCode);
  if (!coupon) {
    return { valid: false, reason: 'Invalid or inactive coupon code.' };
  }

  const now = new Date();

  if (!coupon.isActive) {
    return { valid: false, reason: 'Coupon is inactive.' };
  }

  if (coupon.startsAt && new Date(coupon.startsAt) > now) {
    return { valid: false, reason: 'Coupon is not active yet.' };
  }

  if (coupon.endsAt && new Date(coupon.endsAt) < now) {
    return { valid: false, reason: 'Coupon has expired.' };
  }

  if (subTotalAmount < Number(coupon.minOrderAmount || 0)) {
    return {
      valid: false,
      reason: `Minimum order amount for this coupon is ₹${Number(coupon.minOrderAmount || 0).toLocaleString('en-IN')}.`,
    };
  }

  if (coupon.usageLimit && Number(coupon.usedCount || 0) >= Number(coupon.usageLimit)) {
    return { valid: false, reason: 'Coupon usage limit reached.' };
  }

  if (coupon.usagePerUser && userId) {
    const existingUserUsage = await Order.countDocuments({
      user: userId,
      couponCode: normalizedCode,
      paymentStatus: { $in: [PAYMENT_STATUSES.PAID, PAYMENT_STATUSES.PENDING] },
    });

    if (existingUserUsage >= Number(coupon.usagePerUser)) {
      return { valid: false, reason: 'Coupon usage limit reached for this account.' };
    }
  }

  const categories = coupon.applicableCategories || [];
  if (categories.length > 0) {
    const hasCategoryMatch = items.some((item) => categories.includes(item.category));
    if (!hasCategoryMatch) {
      return { valid: false, reason: 'Coupon is not applicable to selected categories.' };
    }
  }

  const brands = coupon.applicableBrands || [];
  if (brands.length > 0) {
    const hasBrandMatch = items.some((item) => brands.includes(item.brand));
    if (!hasBrandMatch) {
      return { valid: false, reason: 'Coupon is not applicable to selected brands.' };
    }
  }

  let discountAmount = 0;
  if (coupon.type === 'percent') {
    discountAmount = Math.floor((subTotalAmount * Number(coupon.value || 0)) / 100);
  } else if (coupon.type === 'flat') {
    discountAmount = Number(coupon.value || 0);
  }

  if (coupon.maxDiscountAmount) {
    discountAmount = Math.min(discountAmount, Number(coupon.maxDiscountAmount));
  }

  discountAmount = Math.max(0, Math.min(discountAmount, subTotalAmount));

  return {
    valid: true,
    code: normalizedCode,
    discountAmount,
    coupon,
  };
};

const increaseCouponUsage = async (couponCode) => {
  const code = normalizeCouponCode(couponCode);
  if (!code) return;
  await Coupon.updateOne({ code }, { $inc: { usedCount: 1 } }).catch(() => {});
};

const decreaseCouponUsage = async (couponCode) => {
  const code = normalizeCouponCode(couponCode);
  if (!code) return;
  await Coupon.updateOne({ code, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } }).catch(() => {});
};

module.exports = {
  normalizeCouponCode,
  loadCouponByCode,
  validateCouponForOrder,
  increaseCouponUsage,
  decreaseCouponUsage,
};

const mongoose = require('mongoose');
const User = require('../models/User');
const Order = require('../models/Order');
const { PAYMENT_STATUSES } = require('@aurenza/shared');

const deriveSegment = ({ orderCount = 0, lifetimeValue = 0, lastOrderAt = null }) => {
  if (!orderCount) return 'inactive';
  if (lifetimeValue >= 50000) return 'vip';
  if (orderCount >= 3) return 'repeat';

  const daysSinceLastOrder = lastOrderAt
    ? (Date.now() - new Date(lastOrderAt).getTime()) / (1000 * 60 * 60 * 24)
    : Infinity;

  if (daysSinceLastOrder > 120) return 'at-risk';
  return 'new';
};

const listCustomers = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const skip = (page - 1) * limit;

    const search = String(req.query.search || '').trim();
    const segmentFilter = String(req.query.segment || '').trim().toLowerCase();

    const userMatch = {};
    if (search) {
      userMatch.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(userMatch)
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .lean();

    const userIds = users.map((user) => user._id);

    const orderStats = await Order.aggregate([
      { $match: { user: { $in: userIds } } },
      {
        $group: {
          _id: '$user',
          orderCount: { $sum: 1 },
          paidOrderCount: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', PAYMENT_STATUSES.PAID] }, 1, 0],
            },
          },
          lifetimeValue: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', PAYMENT_STATUSES.PAID] }, '$totalAmount', 0],
            },
          },
          lastOrderAt: { $max: '$createdAt' },
        },
      },
    ]);

    const statsMap = new Map(orderStats.map((stat) => [String(stat._id), stat]));

    const customers = users
      .map((user) => {
        const stats = statsMap.get(String(user._id)) || {
          orderCount: 0,
          paidOrderCount: 0,
          lifetimeValue: 0,
          lastOrderAt: null,
        };

        const segment = deriveSegment(stats);

        return {
          ...user,
          orderCount: stats.orderCount,
          paidOrderCount: stats.paidOrderCount,
          lifetimeValue: stats.lifetimeValue,
          lastOrderAt: stats.lastOrderAt,
          averageOrderValue: stats.paidOrderCount > 0 ? Number((stats.lifetimeValue / stats.paidOrderCount).toFixed(2)) : 0,
          segment,
        };
      })
      .filter((customer) => !segmentFilter || customer.segment === segmentFilter);

    const total = await User.countDocuments(userMatch);

    res.json({
      success: true,
      customers,
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

const getCustomerProfile = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid customer ID.' });
    }

    const customer = await User.findById(req.params.id).lean();
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    const [orders, summary] = await Promise.all([
      Order.find({ user: customer._id }).sort('-createdAt').limit(20).lean(),
      Order.aggregate([
        { $match: { user: customer._id } },
        {
          $group: {
            _id: '$user',
            orderCount: { $sum: 1 },
            paidOrderCount: {
              $sum: {
                $cond: [{ $eq: ['$paymentStatus', PAYMENT_STATUSES.PAID] }, 1, 0],
              },
            },
            lifetimeValue: {
              $sum: {
                $cond: [{ $eq: ['$paymentStatus', PAYMENT_STATUSES.PAID] }, '$totalAmount', 0],
              },
            },
            lastOrderAt: { $max: '$createdAt' },
          },
        },
      ]),
    ]);

    const stats = summary[0] || {
      orderCount: 0,
      paidOrderCount: 0,
      lifetimeValue: 0,
      lastOrderAt: null,
    };

    res.json({
      success: true,
      customer: {
        ...customer,
        orderCount: stats.orderCount,
        paidOrderCount: stats.paidOrderCount,
        lifetimeValue: stats.lifetimeValue,
        lastOrderAt: stats.lastOrderAt,
        averageOrderValue: stats.paidOrderCount > 0 ? Number((stats.lifetimeValue / stats.paidOrderCount).toFixed(2)) : 0,
        segment: deriveSegment(stats),
      },
      recentOrders: orders,
    });
  } catch (error) {
    next(error);
  }
};

const getCustomerAnalytics = async (_req, res, next) => {
  try {
    const [totalCustomers, activeCustomers, repeatCustomers, vipCustomers] = await Promise.all([
      User.countDocuments(),
      Order.distinct('user').then((ids) => ids.length),
      Order.aggregate([
        { $group: { _id: '$user', orderCount: { $sum: 1 } } },
        { $match: { orderCount: { $gte: 3 } } },
        { $count: 'count' },
      ]),
      Order.aggregate([
        {
          $match: { paymentStatus: PAYMENT_STATUSES.PAID },
        },
        {
          $group: { _id: '$user', lifetimeValue: { $sum: '$totalAmount' } },
        },
        { $match: { lifetimeValue: { $gte: 50000 } } },
        { $count: 'count' },
      ]),
    ]);

    res.json({
      success: true,
      analytics: {
        totalCustomers,
        activeCustomers,
        repeatCustomers: repeatCustomers[0]?.count || 0,
        vipCustomers: vipCustomers[0]?.count || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listCustomers,
  getCustomerProfile,
  getCustomerAnalytics,
};

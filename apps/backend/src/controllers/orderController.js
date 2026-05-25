const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const razorpayService = require('../services/razorpayService');
const delhiveryService = require('../services/delhiveryService');
const emailService = require('../services/emailService');
const { ORDER_STATUSES, PAYMENT_STATUSES, PAYMENT_METHODS } = require('@aurenza/shared');

/**
 * Create Order — POST /api/orders
 * Buyer only. Validates stock, creates order, triggers Razorpay + email.
 */
const createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must have at least one item.' });
    }

    if (!shippingAddress) {
      return res.status(400).json({ success: false, message: 'Shipping address is required.' });
    }

    if (!paymentMethod || !Object.values(PAYMENT_METHODS).includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: 'Valid payment method is required.' });
    }

    // Validate stock and calculate total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product not found: ${item.productId}` });
      }

      const variant = product.variants.find((v) => v.sku === item.variantSku);
      if (!variant) {
        return res.status(400).json({ success: false, message: `Variant not found: ${item.variantSku}` });
      }

      if (variant.stockCount < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.title} (${variant.sizeOrDimension}). Available: ${variant.stockCount}`,
        });
      }

      const unitPrice = product.basePrice + (variant.additionalPrice || 0);
      totalAmount += unitPrice * item.quantity;

      orderItems.push({
        product: product._id,
        variantSku: variant.sku,
        quantity: item.quantity,
        priceAtPurchase: unitPrice,
        productTitle: product.title,
        productImage: product.images[0] || '',
        variantLabel: `${variant.sizeOrDimension}${variant.color ? ' / ' + variant.color : ''}`,
      });

      // Decrement stock
      variant.stockCount -= item.quantity;
      await product.save();
    }

    // Create order
    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      totalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === PAYMENT_METHODS.COD ? PAYMENT_STATUSES.PENDING : PAYMENT_STATUSES.PENDING,
      orderStatus: ORDER_STATUSES.PLACED,
      shippingAddress,
      trackingHistory: [
        { status: 'Order Placed', location: 'Online', timestamp: new Date() },
      ],
    });

    let razorpayOrder = null;

    // Create Razorpay order if prepaid
    if (paymentMethod === PAYMENT_METHODS.PREPAID) {
      razorpayOrder = await razorpayService.createOrder(
        totalAmount,
        `order_${order._id}`
      );
      order.razorpayOrderId = razorpayOrder.id;
      await order.save();
    }

    // Send confirmation email (async, don't block response)
    emailService.sendOrderConfirmation(order, req.user).catch((err) =>
      console.error('Order confirmation email failed:', err)
    );

    res.status(201).json({
      success: true,
      order,
      razorpay: razorpayOrder
        ? {
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify Payment — POST /api/orders/verify-payment
 * Called after Razorpay checkout completes on the client.
 */
const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const isValid = razorpayService.verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Payment verification failed.' });
    }

    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    order.paymentStatus = PAYMENT_STATUSES.PAID;
    order.razorpayPaymentId = razorpay_payment_id;
    order.orderStatus = ORDER_STATUSES.CONFIRMED;
    order.trackingHistory.push({
      status: 'Payment Confirmed',
      location: 'Online',
      timestamp: new Date(),
    });

    await order.save();

    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

/**
 * Get My Orders — GET /api/orders/my-orders
 * Buyer only. Paginated, sorted by date desc.
 */
const getMyOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find({ user: req.user._id })
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Order.countDocuments({ user: req.user._id }),
    ]);

    res.json({
      success: true,
      orders,
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
 * Get All Orders — GET /api/orders/admin/all
 * Admin only. Paginated with status filter.
 */
const getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, paymentStatus } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = {};
    if (status) filter.orderStatus = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name email phone')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Order.countDocuments(filter),
    ]);

    res.json({
      success: true,
      orders,
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
 * Get Single Order — GET /api/orders/:id
 * Buyer can access own order; admin can access any.
 */
const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // If buyer, ensure they own this order
    if (req.user && order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

/**
 * Pack Order — PUT /api/orders/admin/:id/pack
 * Admin only. Calls Delhivery for AWB generation. Updates status to Packed.
 */
const packOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.orderStatus === ORDER_STATUSES.PACKED || order.delhiveryAWB) {
      return res.status(400).json({ success: false, message: 'Order is already packed.' });
    }

    // Call Delhivery to create shipment and get AWB
    const shipmentResult = await delhiveryService.createShipment({
      orderId: order._id.toString(),
      consigneeName: order.user.name,
      consigneePhone: order.shippingAddress.phone,
      consigneeAddress: order.shippingAddress.street,
      consigneeCity: order.shippingAddress.city,
      consigneeState: order.shippingAddress.state,
      consigneePincode: order.shippingAddress.pinCode,
      itemDescription: order.items.map((i) => i.productTitle).join(', '),
      totalAmount: order.totalAmount,
      paymentMode: order.paymentMethod,
      weight: req.body.weight || 500,
    });

    // Request pickup
    delhiveryService.requestPickup({ packageCount: 1 }).catch((err) =>
      console.error('Pickup request failed:', err)
    );

    // Update order
    order.delhiveryAWB = shipmentResult.awb;
    order.orderStatus = ORDER_STATUSES.PACKED;
    order.trackingHistory.push({
      status: 'Order Packed',
      location: 'Aurenza Warehouse',
      timestamp: new Date(),
    });

    await order.save();

    // Send packed notification email
    emailService.sendPackedNotification(order, order.user, shipmentResult.awb).catch((err) =>
      console.error('Packed notification email failed:', err)
    );

    res.json({
      success: true,
      order,
      awb: shipmentResult.awb,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Order Status — PUT /api/orders/admin/:id/status
 * Admin only. Manual status update.
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    order.orderStatus = status;
    order.trackingHistory.push({
      status,
      location: req.body.location || '',
      timestamp: new Date(),
    });

    await order.save();

    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

/**
 * Razorpay Webhook — POST /api/orders/webhooks/razorpay
 * Verifies signature and updates payment status.
 */
const razorpayWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];

    if (!signature) {
      return res.status(400).json({ success: false, message: 'Missing signature.' });
    }

    const isValid = razorpayService.verifyWebhookSignature(req.body, signature);

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature.' });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (event === 'payment.captured') {
      const razorpayOrderId = payload.payment?.entity?.order_id;

      if (razorpayOrderId) {
        const order = await Order.findOne({ razorpayOrderId });
        if (order && order.paymentStatus !== PAYMENT_STATUSES.PAID) {
          order.paymentStatus = PAYMENT_STATUSES.PAID;
          order.razorpayPaymentId = payload.payment?.entity?.id;
          order.orderStatus = ORDER_STATUSES.CONFIRMED;
          order.trackingHistory.push({
            status: 'Payment Confirmed',
            location: 'Online',
            timestamp: new Date(),
          });
          await order.save();
        }
      }
    }

    if (event === 'payment.failed') {
      const razorpayOrderId = payload.payment?.entity?.order_id;
      if (razorpayOrderId) {
        const order = await Order.findOne({ razorpayOrderId });
        if (order) {
          order.paymentStatus = PAYMENT_STATUSES.FAILED;
          order.trackingHistory.push({
            status: 'Payment Failed',
            location: 'Online',
            timestamp: new Date(),
          });
          await order.save();
        }
      }
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    next(error);
  }
};

/**
 * Delhivery Webhook — POST /api/orders/webhooks/delhivery
 * Receives tracking scan updates and pushes to trackingHistory.
 */
const delhiveryWebhook = async (req, res, next) => {
  try {
    const { Awb, Status, StatusLocation, StatusDateTime } = req.body;

    if (!Awb) {
      return res.status(400).json({ success: false, message: 'Missing AWB.' });
    }

    const order = await Order.findOne({ delhiveryAWB: Awb }).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found for this AWB.' });
    }

    // Push tracking update
    order.trackingHistory.push({
      status: Status || 'Update',
      location: StatusLocation || '',
      timestamp: StatusDateTime ? new Date(StatusDateTime) : new Date(),
    });

    // Update order status based on Delhivery status
    const statusLower = (Status || '').toLowerCase();
    if (statusLower.includes('in transit') || statusLower.includes('dispatched')) {
      order.orderStatus = ORDER_STATUSES.SHIPPED;
    } else if (statusLower.includes('out for delivery')) {
      order.orderStatus = ORDER_STATUSES.OUT_FOR_DELIVERY;
    } else if (statusLower.includes('delivered')) {
      order.orderStatus = ORDER_STATUSES.DELIVERED;
    }

    await order.save();

    // Send email for key statuses
    if (statusLower.includes('out for delivery') || statusLower.includes('delivered')) {
      emailService.sendShippingUpdate(order, order.user, Status).catch((err) =>
        console.error('Shipping update email failed:', err)
      );
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    next(error);
  }
};

/**
 * Dashboard Stats — GET /api/orders/admin/stats
 * Admin only. Returns aggregate stats for dashboard.
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalOrders,
      pendingOrders,
      totalRevenue,
      totalProducts,
      recentOrders,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ orderStatus: { $in: [ORDER_STATUSES.PLACED, ORDER_STATUSES.CONFIRMED] } }),
      Order.aggregate([
        { $match: { paymentStatus: PAYMENT_STATUSES.PAID } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Product.countDocuments({ isActive: true }),
      Order.find()
        .populate('user', 'name email')
        .sort('-createdAt')
        .limit(5)
        .lean(),
    ]);

    res.json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalProducts,
      },
      recentOrders,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  getMyOrders,
  getAllOrders,
  getOrder,
  packOrder,
  updateOrderStatus,
  razorpayWebhook,
  delhiveryWebhook,
  getDashboardStats,
};

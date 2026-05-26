const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const razorpayService = require('../services/razorpayService');
const delhiveryService = require('../services/delhiveryService');
const emailService = require('../services/emailService');
const {
  validateCouponForOrder,
  increaseCouponUsage,
  decreaseCouponUsage,
  normalizeCouponCode,
} = require('../services/couponService');
const { assertInternalKey } = require('../utils/internalAuth');
const { ORDER_STATUSES, PAYMENT_STATUSES, PAYMENT_METHOD_LIST } = require('@aurenza/shared');

const ORDER_TRANSITIONS = {
  [ORDER_STATUSES.PLACED]: [ORDER_STATUSES.PROCESSING, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.PROCESSING]: [ORDER_STATUSES.SHIPPED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.SHIPPED]: [ORDER_STATUSES.DELIVERED],
  [ORDER_STATUSES.DELIVERED]: [],
  [ORDER_STATUSES.CANCELLED]: [],
};

const canTransitionOrder = (fromStatus, toStatus) => {
  if (fromStatus === toStatus) return true;
  return ORDER_TRANSITIONS[fromStatus]?.includes(toStatus) || false;
};

const pushLifecycleEvent = (order, {
  action,
  fromStatus = null,
  toStatus = null,
  actorType = 'system',
  actorId = null,
  note = '',
}) => {
  order.lifecycleEvents = order.lifecycleEvents || [];
  order.lifecycleEvents.push({
    action,
    fromStatus,
    toStatus,
    actorType,
    actorId: actorId ? String(actorId) : null,
    note,
    createdAt: new Date(),
  });
};

const restoreInventory = async (reservations = []) => {
  for (const reservation of reservations) {
    const quantity = Number(reservation.quantity || 0);
    if (!Number.isInteger(quantity) || quantity < 1) continue;

    const variantSku = String(reservation.variantSku || '');
    if (variantSku.startsWith('variant-')) {
      const variantId = variantSku.slice('variant-'.length);
      if (variantId) {
        await Product.updateOne(
          {
            _id: reservation.productId,
            variants: { $elemMatch: { _id: variantId } },
          },
          { $inc: { 'variants.$.stockCount': quantity } }
        ).catch(() => {});
      }
      continue;
    }

    if (!variantSku) continue;
    await Product.updateOne(
      {
        _id: reservation.productId,
        variants: { $elemMatch: { sku: variantSku } },
      },
      { $inc: { 'variants.$.stockCount': quantity } }
    ).catch(() => {});
  }
};

const resolveProductImage = (product = {}) =>
  product.images?.[0] ||
  product.galleryImages?.[0] ||
  product.mainImage ||
  product.hoverImage ||
  '';

const resolveVariant = (product, item) => {
  let variant = product.variants.find((v) => v.sku === item.variantSku);
  if (!variant && typeof item.variantSku === 'string' && item.variantSku.startsWith('variant-')) {
    const variantId = item.variantSku.slice('variant-'.length);
    variant = product.variants.find((v) => String(v._id) === variantId);
  }
  if (!variant && product.variants.length > 0) {
    variant = product.variants[0];
  }
  if (!variant) return null;

  return {
    variant,
    variantSku: variant.sku || `variant-${variant._id}`,
    variantLabel: `${variant.sizeOrDimension || 'Default'}${variant.color ? ` / ${variant.color}` : ''}`,
  };
};

const reserveVariantStock = async ({ productId, variant, quantity, productTitle }) => {
  const elementMatch = variant.sku
    ? { sku: variant.sku, stockCount: { $gte: quantity } }
    : { _id: variant._id, stockCount: { $gte: quantity } };

  const reserveResult = await Product.updateOne(
    { _id: productId, variants: { $elemMatch: elementMatch } },
    { $inc: { 'variants.$.stockCount': -quantity } }
  );

  if (reserveResult.modifiedCount !== 1) {
    throw Object.assign(
      new Error(`Insufficient stock for ${productTitle} (${variant.sizeOrDimension || 'Default'}).`),
      { statusCode: 400 }
    );
  }
};

const applyInventoryReservation = async (items = []) => {
  let subTotalAmount = 0;
  const orderItems = [];
  const stockReservations = [];

  for (const item of items) {
    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw Object.assign(new Error('Each cart item requires a valid quantity.'), { statusCode: 400 });
    }

    const product = await Product.findById(item.productId).lean();
    if (!product) {
      throw Object.assign(new Error(`Product not found: ${item.productId}`), { statusCode: 404 });
    }

    const resolved = resolveVariant(product, item);
    if (!resolved) {
      throw Object.assign(new Error(`Variant not found: ${item.variantSku}`), { statusCode: 400 });
    }
    const { variant, variantSku, variantLabel } = resolved;

    await reserveVariantStock({ productId: product._id, variant, quantity, productTitle: product.title });

    const unitPrice = product.basePrice + (variant.additionalPrice || 0);
    subTotalAmount += unitPrice * quantity;

    orderItems.push({
      product: product._id,
      variantSku,
      quantity,
      priceAtPurchase: unitPrice,
      productTitle: product.title,
      productImage: resolveProductImage(product),
      variantLabel,
    });

    stockReservations.push({
      productId: product._id,
      variantSku,
      quantity,
      category: product.category,
      brand: product.brand,
    });
  }

  return { orderItems, subTotalAmount, stockReservations };
};

const createOrder = async (req, res, next) => {
  let stockReservations = [];
  let createdOrderId = null;
  let couponUsageReserved = null;

  try {
    const { items, shippingAddress, paymentMethod, customer, couponCode } = req.body;
    const idempotencyKey = String(req.headers['x-idempotency-key'] || req.body?.idempotencyKey || '').trim() || null;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must have at least one item.' });
    }

    if (!shippingAddress) {
      return res.status(400).json({ success: false, message: 'Shipping address is required.' });
    }

    if (!paymentMethod || !PAYMENT_METHOD_LIST.includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: 'Valid payment method is required.' });
    }

    const buyerEmail = String(req.user?.email || customer?.email || '').trim().toLowerCase();
    if (!buyerEmail) {
      return res.status(400).json({ success: false, message: 'Buyer email is required.' });
    }

    let buyer = req.user;
    if (!buyer) {
      buyer = await User.findOne({ email: buyerEmail });
      if (!buyer) {
        buyer = await User.create({
          name: customer?.name || 'Aurenza Buyer',
          email: buyerEmail,
          phone: customer?.phone || shippingAddress?.phone || null,
          authProvider: 'google',
          providerId: customer?.providerId || null,
          avatarUrl: null,
        });
      } else if ((customer?.phone || shippingAddress?.phone) && !buyer.phone) {
        buyer.phone = customer?.phone || shippingAddress?.phone;
        await buyer.save();
      }
    }

    if (idempotencyKey) {
      const existingOrder = await Order.findOne({ user: buyer._id, idempotencyKey }).lean();
      if (existingOrder) {
        return res.status(200).json({
          success: true,
          order: existingOrder,
          razorpay: existingOrder.razorpayOrderId
            ? {
                orderId: existingOrder.razorpayOrderId,
                amount: Math.round(existingOrder.totalAmount * 100),
                currency: 'INR',
                keyId: process.env.RAZORPAY_KEY_ID,
              }
            : null,
          reused: true,
        });
      }
    }

    const inventoryResult = await applyInventoryReservation(items);
    stockReservations = inventoryResult.stockReservations;

    const couponResult = couponCode
      ? await validateCouponForOrder({
          couponCode,
          subTotalAmount: inventoryResult.subTotalAmount,
          userId: buyer._id,
          items: stockReservations,
        })
      : { valid: false, code: null, discountAmount: 0 };

    if (couponCode && !couponResult.valid) {
      throw Object.assign(new Error(couponResult.reason || 'Invalid coupon code.'), { statusCode: 400 });
    }

    const discountAmount = couponResult.discountAmount || 0;
    const subTotalAmount = inventoryResult.subTotalAmount;
    const totalAmount = Math.max(0, subTotalAmount - discountAmount);
    const normalizedCouponCode = couponResult.valid ? normalizeCouponCode(couponResult.code) : null;

    if (normalizedCouponCode) {
      await increaseCouponUsage(normalizedCouponCode);
      couponUsageReserved = normalizedCouponCode;
    }

    const order = await Order.create({
      user: buyer._id,
      items: inventoryResult.orderItems,
      subTotalAmount,
      discountAmount,
      totalAmount,
      couponCode: normalizedCouponCode,
      paymentMethod,
      paymentStatus: PAYMENT_STATUSES.PENDING,
      orderStatus: ORDER_STATUSES.PLACED,
      idempotencyKey,
      shippingAddress,
      trackingHistory: [
        { status: 'Order Placed', location: 'Online', timestamp: new Date() },
      ],
      lifecycleEvents: [],
    });
    createdOrderId = order._id;

    pushLifecycleEvent(order, {
      action: 'ORDER_CREATED',
      fromStatus: null,
      toStatus: ORDER_STATUSES.PLACED,
      actorType: buyer ? 'buyer' : 'system',
      actorId: buyer?._id,
      note: paymentMethod === 'razorpay' ? 'Awaiting payment confirmation.' : 'COD order created.',
    });

    let razorpayOrder = null;
    if (paymentMethod === 'razorpay') {
      razorpayOrder = await razorpayService.createOrder(totalAmount, `order_${order._id}`);
      order.razorpayOrderId = razorpayOrder.id;
    }

    await order.save();

    emailService.sendOrderConfirmation(order, buyer).catch(() => {});

    return res.status(201).json({
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
    if (createdOrderId) {
      await Order.findByIdAndDelete(createdOrderId).catch(() => {});
    }

    if (stockReservations.length > 0) {
      await restoreInventory(stockReservations).catch(() => {});
    }

    if (couponUsageReserved) {
      await decreaseCouponUsage(couponUsageReserved).catch(() => {});
    }

    return next(error);
  }
};

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

    if (order.paymentStatus !== PAYMENT_STATUSES.PAID) {
      const previousStatus = order.orderStatus;
      order.paymentStatus = PAYMENT_STATUSES.PAID;
      order.razorpayPaymentId = razorpay_payment_id;
      order.orderStatus = ORDER_STATUSES.PROCESSING;
      order.trackingHistory.push({
        status: 'Payment Confirmed',
        location: 'Online',
        timestamp: new Date(),
      });
      pushLifecycleEvent(order, {
        action: 'PAYMENT_CAPTURED',
        fromStatus: previousStatus,
        toStatus: ORDER_STATUSES.PROCESSING,
        actorType: 'system',
        note: 'Razorpay payment captured.',
      });
      await order.save();
    }

    return res.json({ success: true, order });
  } catch (error) {
    return next(error);
  }
};

const validateCoupon = async (req, res, next) => {
  try {
    const subTotalAmount = Number(req.body?.subTotalAmount || 0);
    const couponCode = req.body?.couponCode;

    if (!couponCode) {
      return res.status(400).json({ success: false, message: 'Coupon code is required.' });
    }

    if (!Number.isFinite(subTotalAmount) || subTotalAmount < 0) {
      return res.status(400).json({ success: false, message: 'Invalid subtotal amount.' });
    }

    const result = await validateCouponForOrder({
      couponCode,
      subTotalAmount,
      userId: req.user?._id,
      items: req.body?.items || [],
    });

    if (!result.valid) {
      return res.status(404).json({ success: false, message: result.reason || 'Invalid coupon code.' });
    }

    return res.json({
      success: true,
      couponCode: result.code,
      discountAmount: result.discountAmount,
      totalAmount: Math.max(0, subTotalAmount - result.discountAmount),
    });
  } catch (error) {
    return next(error);
  }
};

const getMyOrders = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 10)));
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ user: req.user._id })
        .sort('-createdAt')
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments({ user: req.user._id }),
    ]);

    return res.json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getOrdersByEmailInternal = async (req, res, next) => {
  try {
    if (!assertInternalKey(req, res)) return;

    const email = String(req.query.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const user = await User.findOne({ email }).select('_id');
    if (!user) {
      return res.json({ success: true, orders: [] });
    }

    const orders = await Order.find({ user: user._id }).sort('-createdAt').lean();
    return res.json({ success: true, orders });
  } catch (error) {
    return next(error);
  }
};

const getAllOrders = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const { status, paymentStatus, refundStatus } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) filter.orderStatus = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (refundStatus) filter.refundStatus = refundStatus;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name email phone')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (req.user && order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    return res.json({ success: true, order });
  } catch (error) {
    return next(error);
  }
};

const packOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if ([ORDER_STATUSES.SHIPPED, ORDER_STATUSES.DELIVERED, ORDER_STATUSES.CANCELLED].includes(order.orderStatus) || order.delhiveryAWB) {
      return res.status(400).json({ success: false, message: 'Order cannot be packed in current state.' });
    }

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

    delhiveryService.requestPickup({ packageCount: 1 }).catch(() => {});

    const previousStatus = order.orderStatus;
    order.delhiveryAWB = shipmentResult.awb;
    if (order.orderStatus === ORDER_STATUSES.PLACED) {
      order.orderStatus = ORDER_STATUSES.PROCESSING;
    }
    order.trackingHistory.push({
      status: 'Order Packed',
      location: 'Aurenza Warehouse',
      timestamp: new Date(),
    });
    pushLifecycleEvent(order, {
      action: 'ORDER_PACKED',
      fromStatus: previousStatus,
      toStatus: order.orderStatus,
      actorType: 'admin',
      actorId: req.admin?._id,
      note: `AWB generated: ${shipmentResult.awb}`,
    });

    await order.save();

    emailService.sendPackedNotification(order, order.user, shipmentResult.awb).catch(() => {});

    return res.json({ success: true, order, awb: shipmentResult.awb });
  } catch (error) {
    return next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, location, reason } = req.body;
    const allowedStatuses = Object.values(ORDER_STATUSES);

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid order status.' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.orderStatus === status) {
      return res.status(200).json({ success: true, order, message: 'Order already in requested status.' });
    }

    if (!canTransitionOrder(order.orderStatus, status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from ${order.orderStatus} to ${status}.`,
      });
    }

    const previousStatus = order.orderStatus;
    order.orderStatus = status;

    if (status === ORDER_STATUSES.CANCELLED && !order.cancelledAt) {
      order.cancellationReason = String(reason || 'Cancelled by admin').trim();
      order.cancelledAt = new Date();
      if (order.couponCode) {
        await decreaseCouponUsage(order.couponCode).catch(() => {});
      }
      await restoreInventory(
        order.items.map((item) => ({
          productId: item.product,
          variantSku: item.variantSku,
          quantity: item.quantity,
        }))
      ).catch(() => {});
    }

    order.trackingHistory.push({
      status,
      location: location || '',
      timestamp: new Date(),
    });

    pushLifecycleEvent(order, {
      action: 'ORDER_STATUS_UPDATED',
      fromStatus: previousStatus,
      toStatus: status,
      actorType: 'admin',
      actorId: req.admin?._id,
      note: reason || '',
    });

    await order.save();

    return res.json({ success: true, order });
  } catch (error) {
    return next(error);
  }
};

const refundOrder = async (req, res, next) => {
  try {
    const { amount, reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.paymentStatus !== PAYMENT_STATUSES.PAID) {
      return res.status(400).json({ success: false, message: 'Only paid orders can be refunded.' });
    }

    if (order.refundStatus === 'refunded') {
      return res.status(400).json({ success: false, message: 'Order is already refunded.' });
    }

    const refundAmount = amount ? Number(amount) : order.totalAmount;
    if (!Number.isFinite(refundAmount) || refundAmount <= 0 || refundAmount > order.totalAmount) {
      return res.status(400).json({ success: false, message: 'Invalid refund amount.' });
    }

    order.refundStatus = 'refunded';
    order.refundAmount = refundAmount;
    order.refundReason = String(reason || 'Refund processed by admin').trim();
    order.refundedAt = new Date();
    order.paymentStatus = PAYMENT_STATUSES.REFUNDED;

    const wasAlreadyCancelled = order.orderStatus === ORDER_STATUSES.CANCELLED;
    if (order.orderStatus !== ORDER_STATUSES.DELIVERED && !wasAlreadyCancelled) {
      const previousStatus = order.orderStatus;
      order.orderStatus = ORDER_STATUSES.CANCELLED;
      order.cancelledAt = new Date();
      order.cancellationReason = order.refundReason;
      pushLifecycleEvent(order, {
        action: 'ORDER_CANCELLED_BY_REFUND',
        fromStatus: previousStatus,
        toStatus: ORDER_STATUSES.CANCELLED,
        actorType: 'admin',
        actorId: req.admin?._id,
        note: order.refundReason,
      });

      await restoreInventory(
        order.items.map((item) => ({
          productId: item.product,
          variantSku: item.variantSku,
          quantity: item.quantity,
        }))
      ).catch(() => {});
    }

    if (order.couponCode && !wasAlreadyCancelled) {
      await decreaseCouponUsage(order.couponCode).catch(() => {});
    }

    pushLifecycleEvent(order, {
      action: 'ORDER_REFUNDED',
      fromStatus: order.orderStatus,
      toStatus: order.orderStatus,
      actorType: 'admin',
      actorId: req.admin?._id,
      note: `Refund amount: ₹${refundAmount}. ${order.refundReason}`,
    });

    await order.save();

    return res.json({ success: true, order });
  } catch (error) {
    return next(error);
  }
};

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
          const previousStatus = order.orderStatus;
          order.paymentStatus = PAYMENT_STATUSES.PAID;
          order.razorpayPaymentId = payload.payment?.entity?.id;
          order.orderStatus = ORDER_STATUSES.PROCESSING;
          order.trackingHistory.push({
            status: 'Payment Confirmed',
            location: 'Online',
            timestamp: new Date(),
          });
          pushLifecycleEvent(order, {
            action: 'PAYMENT_CAPTURED_WEBHOOK',
            fromStatus: previousStatus,
            toStatus: ORDER_STATUSES.PROCESSING,
            actorType: 'system',
            note: 'Razorpay webhook payment.captured',
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
          pushLifecycleEvent(order, {
            action: 'PAYMENT_FAILED_WEBHOOK',
            fromStatus: order.orderStatus,
            toStatus: order.orderStatus,
            actorType: 'system',
            note: 'Razorpay webhook payment.failed',
          });
          await order.save();
        }
      }
    }

    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    return next(error);
  }
};

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

    order.trackingHistory.push({
      status: Status || 'Update',
      location: StatusLocation || '',
      timestamp: StatusDateTime ? new Date(StatusDateTime) : new Date(),
    });

    const statusLower = (Status || '').toLowerCase();
    const previousStatus = order.orderStatus;
    if (statusLower.includes('in transit') || statusLower.includes('dispatched') || statusLower.includes('out for delivery')) {
      if (canTransitionOrder(order.orderStatus, ORDER_STATUSES.SHIPPED)) {
        order.orderStatus = ORDER_STATUSES.SHIPPED;
      }
    } else if (statusLower.includes('delivered')) {
      if (canTransitionOrder(order.orderStatus, ORDER_STATUSES.DELIVERED)) {
        order.orderStatus = ORDER_STATUSES.DELIVERED;
      }
    }

    if (order.orderStatus !== previousStatus) {
      pushLifecycleEvent(order, {
        action: 'TRACKING_STATUS_UPDATE',
        fromStatus: previousStatus,
        toStatus: order.orderStatus,
        actorType: 'system',
        note: Status || 'Tracking update',
      });
    }

    await order.save();

    if (statusLower.includes('out for delivery') || statusLower.includes('delivered')) {
      emailService.sendShippingUpdate(order, order.user, Status).catch(() => {});
    }

    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    return next(error);
  }
};

const getDashboardStats = async (req, res, next) => {
  try {
    const [totalOrders, pendingOrders, totalRevenue, totalProducts, refundedOrders, recentOrders] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ orderStatus: { $in: [ORDER_STATUSES.PLACED, ORDER_STATUSES.PROCESSING] } }),
      Order.aggregate([
        { $match: { paymentStatus: PAYMENT_STATUSES.PAID } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments({ paymentStatus: PAYMENT_STATUSES.REFUNDED }),
      Order.find().populate('user', 'name email').sort('-createdAt').limit(5).lean(),
    ]);

    return res.json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        refundedOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalProducts,
      },
      recentOrders,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  validateCoupon,
  getMyOrders,
  getOrdersByEmailInternal,
  getAllOrders,
  getOrder,
  packOrder,
  updateOrderStatus,
  refundOrder,
  razorpayWebhook,
  delhiveryWebhook,
  getDashboardStats,
};

const { Resend } = require('resend');

let resendInstance = null;

const getResend = () => {
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
};

const FROM_EMAIL = process.env.EMAIL_FROM || 'Aurenza <orders@aurenzashop.in>';

/**
 * Generate branded email wrapper
 */
const wrapInBrandTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: #0f0f1a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; background-color: #1a1a2e; }
    .header { background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 32px; text-align: center; border-bottom: 2px solid #e94560; }
    .header h1 { color: #e94560; font-size: 28px; margin: 0; letter-spacing: 4px; font-weight: 700; }
    .header p { color: #a0aec0; font-size: 12px; margin: 8px 0 0; letter-spacing: 2px; text-transform: uppercase; }
    .content { padding: 32px; color: #e2e8f0; }
    .content h2 { color: #ffffff; font-size: 22px; margin: 0 0 16px; }
    .content p { color: #a0aec0; line-height: 1.6; margin: 0 0 16px; }
    .highlight-box { background: linear-gradient(135deg, #16213e, #0f3460); border: 1px solid #e9456033; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .item-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #ffffff10; }
    .item-name { color: #ffffff; font-weight: 500; }
    .item-price { color: #e94560; font-weight: 600; }
    .total-row { display: flex; justify-content: space-between; padding: 16px 0 0; margin-top: 8px; border-top: 2px solid #e94560; }
    .total-label { color: #ffffff; font-size: 18px; font-weight: 700; }
    .total-amount { color: #e94560; font-size: 18px; font-weight: 700; }
    .status-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
    .status-confirmed { background: #48bb7820; color: #48bb78; border: 1px solid #48bb7840; }
    .status-packed { background: #ecc94b20; color: #ecc94b; border: 1px solid #ecc94b40; }
    .status-shipped { background: #805ad520; color: #805ad5; border: 1px solid #805ad540; }
    .status-delivered { background: #48bb7820; color: #48bb78; border: 1px solid #48bb7840; }
    .awb-box { background: #0f3460; border: 1px solid #e9456050; border-radius: 8px; padding: 16px; text-align: center; margin: 16px 0; }
    .awb-label { color: #a0aec0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
    .awb-number { color: #e94560; font-size: 20px; font-weight: 700; letter-spacing: 2px; margin-top: 4px; }
    .footer { background: #0f0f1a; padding: 24px; text-align: center; border-top: 1px solid #ffffff10; }
    .footer p { color: #4a5568; font-size: 12px; margin: 0 0 4px; }
    .footer a { color: #e94560; text-decoration: none; }
    .btn { display: inline-block; background: linear-gradient(135deg, #e94560, #c73a52); color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AURENZA</h1>
      <p>Premium Clothing & Wallpapers</p>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>Aurenza — Sole Proprietorship (Hemlata Dubey)</p>
      <p><a href="https://aurenzashop.in">aurenzashop.in</a></p>
      <p style="margin-top: 8px;">This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
`;

/**
 * Send Order Confirmation email
 */
const sendOrderConfirmation = async (order, user) => {
  const resend = getResend();

  const itemsHtml = order.items
    .map(
      (item) => `
      <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.06);">
        <div>
          <div style="color: #ffffff; font-weight: 500;">${item.productTitle || 'Product'}</div>
          <div style="color: #a0aec0; font-size: 13px;">${item.variantLabel || item.variantSku} × ${item.quantity}</div>
        </div>
        <div style="color: #e94560; font-weight: 600;">₹${(item.priceAtPurchase * item.quantity).toLocaleString('en-IN')}</div>
      </div>
    `
    )
    .join('');

  const content = `
    <h2>Order Confirmed! 🎉</h2>
    <p>Hi ${user.name}, thank you for your order! We're preparing it with care.</p>
    
    <div class="highlight-box">
      <div style="color: #a0aec0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Order ID</div>
      <div style="color: #ffffff; font-size: 16px; font-weight: 600;">${order._id}</div>
    </div>

    <div class="highlight-box">
      ${itemsHtml}
      <div style="display: flex; justify-content: space-between; padding: 16px 0 0; margin-top: 8px; border-top: 2px solid #e94560;">
        <div style="color: #ffffff; font-size: 18px; font-weight: 700;">Total</div>
        <div style="color: #e94560; font-size: 18px; font-weight: 700;">₹${order.totalAmount.toLocaleString('en-IN')}</div>
      </div>
    </div>

    <p><strong>Payment:</strong> ${order.paymentMethod} ${order.paymentStatus === 'Paid' ? '✅ Paid' : '⏳ Pending'}</p>
    
    <div class="highlight-box">
      <div style="color: #a0aec0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Shipping To</div>
      <div style="color: #ffffff;">${order.shippingAddress.street}</div>
      <div style="color: #a0aec0;">${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pinCode}</div>
    </div>

    <a href="https://aurenzashop.in/tracking/${order._id}" class="btn">Track Your Order</a>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [user.email],
      subject: `Aurenza — Order Confirmed #${order._id.toString().slice(-8).toUpperCase()}`,
      html: wrapInBrandTemplate(content),
    });

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send Packed Notification email with AWB
 */
const sendPackedNotification = async (order, user, awb) => {
  const resend = getResend();

  const content = `
    <h2>Your Order is Packed! 📦</h2>
    <p>Hi ${user.name}, great news! Your order has been carefully packed and is ready for pickup by our delivery partner.</p>
    
    <div class="awb-box">
      <div class="awb-label">Tracking Number (AWB)</div>
      <div class="awb-number">${awb}</div>
    </div>

    <div class="highlight-box">
      <div style="color: #a0aec0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Order ID</div>
      <div style="color: #ffffff; font-size: 16px; font-weight: 600;">${order._id}</div>
      <div style="color: #a0aec0; font-size: 13px; margin-top: 4px;">Total: ₹${order.totalAmount.toLocaleString('en-IN')}</div>
    </div>

    <p>You'll receive another update once your package is on its way!</p>

    <a href="https://aurenzashop.in/tracking/${order._id}" class="btn">Track Your Order</a>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [user.email],
      subject: `Aurenza — Your Order is Packed! AWB: ${awb}`,
      html: wrapInBrandTemplate(content),
    });

    if (error) console.error('Packed email error:', error);
    return { success: !error, data, error };
  } catch (error) {
    console.error('Packed email service error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send Shipping Update email (Out for Delivery / Delivered)
 */
const sendShippingUpdate = async (order, user, status) => {
  const resend = getResend();

  const isDelivered = status.toLowerCase().includes('delivered');
  const emoji = isDelivered ? '🎉' : '🚚';
  const title = isDelivered ? 'Your Order Has Been Delivered!' : 'Your Order is Out for Delivery!';
  const message = isDelivered
    ? `Hi ${user.name}, your Aurenza order has been successfully delivered. We hope you love your purchase!`
    : `Hi ${user.name}, exciting news! Your order is out for delivery and will reach you shortly.`;

  const statusClass = isDelivered ? 'status-delivered' : 'status-shipped';

  const content = `
    <h2>${title} ${emoji}</h2>
    <p>${message}</p>

    <div style="text-align: center; margin: 24px 0;">
      <span class="status-badge ${statusClass}">${status}</span>
    </div>
    
    <div class="highlight-box">
      <div style="color: #a0aec0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Order ID</div>
      <div style="color: #ffffff; font-size: 16px; font-weight: 600;">${order._id}</div>
      ${order.delhiveryAWB ? `<div style="color: #a0aec0; font-size: 13px; margin-top: 4px;">AWB: ${order.delhiveryAWB}</div>` : ''}
    </div>

    <a href="https://aurenzashop.in/tracking/${order._id}" class="btn">${isDelivered ? 'View Order Details' : 'Track Your Order'}</a>
    
    ${isDelivered ? '<p style="text-align: center; color: #a0aec0; font-size: 13px;">Loved your purchase? Leave a review on the product page!</p>' : ''}
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [user.email],
      subject: `Aurenza — ${title}`,
      html: wrapInBrandTemplate(content),
    });

    if (error) console.error('Shipping update email error:', error);
    return { success: !error, data, error };
  } catch (error) {
    console.error('Shipping update email service error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendOrderConfirmation,
  sendPackedNotification,
  sendShippingUpdate,
};

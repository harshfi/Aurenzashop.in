const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const sameOriginAllowed = new Set([
  process.env.ADMIN_URL || 'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'https://admin.aurenzashop.in',
]);

const isStateChangingMethod = (method = '') => !['GET', 'HEAD', 'OPTIONS'].includes(String(method).toUpperCase());

/**
 * Admin Authentication Middleware
 * Validates the admin JWT stored in an HTTP-only cookie.
 */
const adminAuth = async (req, res, next) => {
  try {
    if (isStateChangingMethod(req.method)) {
      const origin = req.get('origin');
      if (origin && !sameOriginAllowed.has(origin)) {
        return res.status(403).json({
          success: false,
          message: 'Invalid request origin.',
        });
      }
    }

    const token = req.cookies?.admin_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Admin authentication required.',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired admin session.',
      });
    }

    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin account not found.',
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed.',
    });
  }
};

module.exports = adminAuth;

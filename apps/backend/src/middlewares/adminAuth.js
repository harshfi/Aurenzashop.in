const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

/**
 * Admin Authentication Middleware
 * Validates the admin JWT stored in an HTTP-only cookie.
 */
const adminAuth = async (req, res, next) => {
  try {
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
    req.isAdmin = true;
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

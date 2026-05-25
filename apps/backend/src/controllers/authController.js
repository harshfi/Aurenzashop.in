const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

/**
 * Admin Login — POST /api/auth/admin/login
 * Local email/password auth. Returns JWT in HTTP-only cookie.
 */
const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    // Find admin and explicitly select password
    const admin = await Admin.findOne({ email }).select('+password');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: admin._id, email: admin.email },
      process.env.ADMIN_JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set HTTP-only cookie
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    res.json({
      success: true,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin Logout — POST /api/auth/admin/logout
 * Clears the JWT cookie.
 */
const adminLogout = async (req, res) => {
  res.cookie('admin_token', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });

  res.json({
    success: true,
    message: 'Logged out successfully.',
  });
};

/**
 * Get Admin Profile — GET /api/auth/admin/me
 * Returns the currently authenticated admin's profile.
 */
const getAdminProfile = async (req, res) => {
  res.json({
    success: true,
    admin: {
      id: req.admin._id,
      name: req.admin.name,
      email: req.admin.email,
    },
  });
};

/**
 * Get Buyer Profile — GET /api/auth/buyer/me
 * Returns the currently authenticated buyer's profile.
 */
const getBuyerProfile = async (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
};

/**
 * Update Buyer Profile — PUT /api/auth/buyer/profile
 * Updates buyer name, phone, and addresses.
 */
const updateBuyerProfile = async (req, res, next) => {
  try {
    const { name, phone, addresses } = req.body;
    const user = req.user;

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (addresses) user.addresses = addresses;

    await user.save();

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  adminLogin,
  adminLogout,
  getAdminProfile,
  getBuyerProfile,
  updateBuyerProfile,
};

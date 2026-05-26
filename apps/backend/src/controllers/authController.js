const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');
const { assertInternalKey } = require('../utils/internalAuth');

/**
 * Admin Login — POST /api/auth/admin/login
 * Local email/password auth. Returns JWT in HTTP-only cookie.
 */
const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    if (!process.env.ADMIN_JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'Admin authentication is not configured.',
      });
    }

    // Find admin and explicitly select password
    const admin = await Admin.findOne({ email: normalizedEmail }).select('+password');

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
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('admin_token', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
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
 * Verify Buyer Google Session — GET /api/auth/buyer/google
 * NextAuth handles OAuth in buyer app; backend uses buyerAuth middleware.
 */
const verifyBuyerGoogleSession = async (req, res) => {
  res.json({
    success: true,
    message: 'Buyer session verified.',
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
    if (phone) {
      const normalizedPhone = String(phone).replace(/\s+/g, '');
      if (!/^[0-9+()-]{8,18}$/.test(normalizedPhone)) {
        return res.status(400).json({ success: false, message: 'Invalid phone format.' });
      }
      user.phone = normalizedPhone;
    }
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

const getBuyerProfileByEmailInternal = async (req, res, next) => {
  try {
    if (!assertInternalKey(req, res)) return;

    const email = String(req.query.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    let user = await User.findOne({ email }).lean();
    if (!user) {
      user = await User.create({
        name: email.split('@')[0] || 'Aurenza Buyer',
        email,
        authProvider: 'google',
        providerId: null,
      });
      user = user.toObject();
    }

    return res.json({ success: true, user });
  } catch (error) {
    return next(error);
  }
};

const updateBuyerProfileByEmailInternal = async (req, res, next) => {
  try {
    if (!assertInternalKey(req, res)) return;

    const email = String(req.query.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const payload = req.body || {};
    const updates = {};

    if (payload.name !== undefined) {
      const name = String(payload.name || '').trim();
      if (!name) {
        return res.status(400).json({ success: false, message: 'Name cannot be empty.' });
      }
      updates.name = name;
    }

    if (payload.phone !== undefined) {
      const normalizedPhone = String(payload.phone || '').replace(/\\s+/g, '');
      if (normalizedPhone && !/^[0-9+()-]{8,18}$/.test(normalizedPhone)) {
        return res.status(400).json({ success: false, message: 'Invalid phone format.' });
      }
      updates.phone = normalizedPhone || null;
    }

    if (payload.addresses !== undefined) {
      if (!Array.isArray(payload.addresses)) {
        return res.status(400).json({ success: false, message: 'Addresses must be an array.' });
      }
      updates.addresses = payload.addresses.map((address) => ({
        street: String(address.street || '').trim(),
        city: String(address.city || '').trim(),
        state: String(address.state || '').trim(),
        pinCode: String(address.pinCode || '').trim(),
        phone: String(address.phone || '').trim(),
        isDefault: Boolean(address.isDefault),
      }));
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: updates.name || email.split('@')[0] || 'Aurenza Buyer',
        email,
        phone: updates.phone || null,
        addresses: updates.addresses || [],
        authProvider: 'google',
        providerId: null,
      });
    } else {
      Object.assign(user, updates);
      await user.save();
    }

    return res.json({ success: true, user });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  adminLogin,
  adminLogout,
  getAdminProfile,
  getBuyerProfile,
  verifyBuyerGoogleSession,
  updateBuyerProfile,
  getBuyerProfileByEmailInternal,
  updateBuyerProfileByEmailInternal,
};

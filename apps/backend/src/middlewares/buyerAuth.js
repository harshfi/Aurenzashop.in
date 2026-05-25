const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Buyer Authentication Middleware
 * Validates the NextAuth session token sent from the buyer frontend.
 * The token is expected in the Authorization header as: Bearer <token>
 * 
 * The token is a JWT signed with NEXTAUTH_SECRET.
 * We decode it and find/create the user in MongoDB.
 */
const buyerAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please sign in.',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token.',
      });
    }

    // Decode the NextAuth JWT (buyer-store signs with AUTH_SECRET or NEXTAUTH_SECRET)
    const sessionSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

    if (!sessionSecret) {
      console.error('Buyer auth error: AUTH_SECRET / NEXTAUTH_SECRET is not configured.');
      return res.status(500).json({
        success: false,
        message: 'Authentication is not configured on the server.',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, sessionSecret);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.',
      });
    }

    if (!decoded || !decoded.email) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload.',
      });
    }

    const authProvider = decoded.authProvider === 'google' ? 'google' : 'local';
    const providerId = authProvider === 'google' ? decoded.sub || null : null;

    // Find or create the user in our database
    let user = await User.findOne({ email: decoded.email });

    if (!user) {
      // Auto-create user from OAuth data
      user = await User.create({
        name: decoded.name || decoded.email?.split('@')[0] || 'User',
        email: decoded.email,
        authProvider,
        providerId,
        avatarUrl: decoded.picture || null,
      });
    } else {
      let didChange = false;

      if (decoded.name && decoded.name !== user.name) {
        user.name = decoded.name;
        didChange = true;
      }

      if (decoded.picture && decoded.picture !== user.avatarUrl) {
        user.avatarUrl = decoded.picture;
        didChange = true;
      }

      if (authProvider !== user.authProvider) {
        user.authProvider = authProvider;
        didChange = true;
      }

      if (providerId !== user.providerId) {
        user.providerId = providerId;
        didChange = true;
      }

      if (didChange) {
        await user.save();
      }
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Buyer auth error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed.',
    });
  }
};

module.exports = buyerAuth;

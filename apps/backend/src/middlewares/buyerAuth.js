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

    // Decode the NextAuth JWT
    // NextAuth v5 uses the AUTH_SECRET / NEXTAUTH_SECRET to sign tokens
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
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

    // Find or create the user in our database
    let user = await User.findOne({ email: decoded.email });

    if (!user) {
      // Auto-create user from OAuth data
      user = await User.create({
        name: decoded.name || 'User',
        email: decoded.email,
        authProvider: 'google',
        providerId: decoded.sub || null,
        avatarUrl: decoded.picture || null,
      });
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
